'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  listOrders,
  getOrderById,
  updateOrderAdminFields,
  type OrderRow,
  type OrderWithItems,
} from '@/app/actions/orders'
import { DOMAINS } from '@/lib/domain-utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { RefreshCw } from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: Date | string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCurrency(val: string | null | undefined, currency = 'EUR') {
  if (!val) return '—'
  const n = parseFloat(val)
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency }).format(n)
}

const ORDER_STATUSES = [
  'submitted',
  'confirmed',
  'processing',
  'shipped',
  'completed',
  'cancelled',
] as const

const PAYMENT_STATUSES = [
  'unpaid',
  'payment_request_sent',
  'paid',
  'refunded',
] as const

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'confirmed':
    case 'completed':
    case 'paid':
      return 'default'
    case 'submitted':
    case 'processing':
    case 'payment_request_sent':
      return 'secondary'
    case 'cancelled':
    case 'refunded':
      return 'destructive'
    default:
      return 'outline'
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OrdersManagerProps {
  initialOrders: OrderRow[]
  locale: string
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function OrdersManager({ initialOrders, locale: _locale }: OrdersManagerProps) {
  const t = useTranslations('admin.orders')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // List state
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders)
  const [filterMarket, setFilterMarket] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPayment, setFilterPayment] = useState<string>('all')
  const [loadError, setLoadError] = useState<string | null>(null)

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState<OrderWithItems | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Draft fields — initialized from DB on every open, discarded on close
  const [draftStatus, setDraftStatus] = useState<string>('submitted')
  const [draftPaymentStatus, setDraftPaymentStatus] = useState<string>('unpaid')
  const [draftAdminNote, setDraftAdminNote] = useState<string>('')

  // Save state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ---------------------------------------------------------------------------
  // Derived: has anything actually changed?
  // ---------------------------------------------------------------------------

  const det = detailOrder as Record<string, unknown> | null

  const hasChanges = det != null && (
    draftStatus !== String(det.status ?? 'submitted') ||
    draftPaymentStatus !== String(det.paymentStatus ?? 'unpaid') ||
    draftAdminNote !== (typeof det.adminNote === 'string' ? det.adminNote : '')
  )

  // ---------------------------------------------------------------------------
  // Refresh list
  // ---------------------------------------------------------------------------

  const refreshList = useCallback(() => {
    startTransition(async () => {
      try {
        setLoadError(null)
        const fresh = await listOrders(
          filterMarket !== 'all' || filterStatus !== 'all' || filterPayment !== 'all'
            ? {
                ...(filterMarket !== 'all' ? { market: filterMarket } : {}),
                ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
                ...(filterPayment !== 'all' ? { paymentStatus: filterPayment } : {}),
              }
            : undefined
        )
        setOrders(fresh)
      } catch {
        setLoadError(t('loadError'))
      }
    })
  }, [filterMarket, filterStatus, filterPayment, t])

  const applyFilters = useCallback(() => {
    refreshList()
  }, [refreshList])

  // ---------------------------------------------------------------------------
  // Open detail dialog — always initialize drafts from DB values
  // ---------------------------------------------------------------------------

  const openDetail = useCallback(async (row: OrderRow) => {
    setDetailLoading(true)
    setDetailOpen(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const detail = await getOrderById(row.id)
      setDetailOrder(detail)
      const d = detail as Record<string, unknown> | null
      setDraftStatus(typeof d?.status === 'string' ? d.status : 'submitted')
      setDraftPaymentStatus(typeof d?.paymentStatus === 'string' ? d.paymentStatus : 'unpaid')
      setDraftAdminNote(typeof d?.adminNote === 'string' ? d.adminNote : '')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Reset drafts to persisted values (discard unsaved changes)
  // ---------------------------------------------------------------------------

  const handleReset = useCallback(() => {
    if (!det) return
    setDraftStatus(typeof det.status === 'string' ? det.status : 'submitted')
    setDraftPaymentStatus(typeof det.paymentStatus === 'string' ? det.paymentStatus : 'unpaid')
    setDraftAdminNote(typeof det.adminNote === 'string' ? det.adminNote : '')
    setSaveError(null)
    setSaveSuccess(false)
  }, [det])

  // ---------------------------------------------------------------------------
  // Atomic save — one server call, all three fields together
  // ---------------------------------------------------------------------------

  const handleSaveChanges = useCallback(async () => {
    if (!det || isSaving || !hasChanges) return
    const orderId = det.id as number

    setSaveError(null)
    setSaveSuccess(false)
    setIsSaving(true)

    try {
      const result = await updateOrderAdminFields({
        orderId,
        status: draftStatus,
        paymentStatus: draftPaymentStatus,
        adminNote: draftAdminNote,
      })

      // Update detail from returned DB values (source of truth)
      setDetailOrder((prev) =>
        prev
          ? {
              ...prev,
              status: result.status,
              paymentStatus: result.paymentStatus,
              adminNote: result.adminNote ?? null,
              updatedAt: result.updatedAt,
            }
          : prev
      )

      // Sync draft states with returned DB values
      setDraftStatus(result.status)
      setDraftPaymentStatus(result.paymentStatus)
      setDraftAdminNote(result.adminNote ?? '')

      // Update the row in the orders table
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: result.status, paymentStatus: result.paymentStatus }
            : o
        )
      )

      setSaveSuccess(true)
      router.refresh()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('saveError'))
    } finally {
      setIsSaving(false)
    }
  }, [det, isSaving, hasChanges, draftStatus, draftPaymentStatus, draftAdminNote, router, t])

  // ---------------------------------------------------------------------------
  // Filtered list
  // ---------------------------------------------------------------------------

  const displayed = useMemo(() => orders, [orders])

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshList} disabled={isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? '...' : 'Refresh'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filterMarket}
          onValueChange={(v) => { setFilterMarket(v ?? 'all') }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('filterMarket')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filterAll')}</SelectItem>
            {DOMAINS.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterStatus}
          onValueChange={(v) => { setFilterStatus(v ?? 'all') }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filterAll')}</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{t(`status_${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterPayment}
          onValueChange={(v) => { setFilterPayment(v ?? 'all') }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('filterPayment')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filterAll')}</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{t(`payment_${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="secondary" size="sm" onClick={applyFilters} disabled={isPending}>
          {t('filterAll')}
        </Button>
      </div>

      {loadError && (
        <p className="text-sm text-destructive">{loadError}</p>
      )}

      {/* Orders table */}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('orderNumber')}</TableHead>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('customer')}</TableHead>
              <TableHead>{t('market')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('paymentStatus')}</TableHead>
              <TableHead className="text-right">{t('total')}</TableHead>
              <TableHead>{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  {t('empty')}
                </TableCell>
              </TableRow>
            ) : (
              displayed.map((row) => {
                const displayTotal = row.grandTotal ?? row.total
                return (
                  <TableRow key={row.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-sm font-medium">
                      {row.orderNumber}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium leading-tight">{row.userName ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{row.userCompanyName ?? row.userEmail ?? ''}</div>
                    </TableCell>
                    <TableCell>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {row.market ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)}>
                        {t(`status_${row.status}` as Parameters<typeof t>[0])}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.paymentStatus)}>
                        {t(`payment_${row.paymentStatus}` as Parameters<typeof t>[0])}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(displayTotal as string, row.currency ?? 'EUR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(row)}
                      >
                        {t('detail')}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          // Discard unsaved drafts on close — no prompt needed per spec
          setDetailOpen(open)
          if (!open) {
            setSaveError(null)
            setSaveSuccess(false)
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {det ? String(det.orderNumber) : ''} — {t('orderDetail')}
            </DialogTitle>
            <DialogDescription>
              {det ? formatDate(det.createdAt as Date) : ''}
            </DialogDescription>
          </DialogHeader>

          {detailLoading && (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          )}

          {!detailLoading && det && (
            <div className="flex flex-col gap-6 pt-2">

              {/* Draft status + payment selects — native <select> avoids Base UI portal/focus-trap conflict inside Radix Dialog */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('changeStatus')}
                  </label>
                  <select
                    value={draftStatus}
                    disabled={isSaving}
                    onChange={(e) => {
                      setDraftStatus(e.target.value)
                      setSaveSuccess(false)
                    }}
                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{t(`status_${s}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('changePayment')}
                  </label>
                  <select
                    value={draftPaymentStatus}
                    disabled={isSaving}
                    onChange={(e) => {
                      setDraftPaymentStatus(e.target.value)
                      setSaveSuccess(false)
                    }}
                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{t(`payment_${s}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Separator />

              {/* Customer info */}
              {(() => {
                const s = det as {
                  userName?: string | null
                  userEmail?: string | null
                  userCompanyName?: string | null
                  userVatNumber?: string | null
                  userCompanyId?: string | null
                  userAddress?: string | null
                  userPostalCode?: string | null
                  userCity?: string | null
                  userCountry?: string | null
                  customerNote?: string | null
                  customerPoNumber?: string | null
                }
                return (
                  <>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('customer')}</p>
                        <p className="mt-0.5 font-medium">{s.userName ?? '—'}</p>
                        <p className="text-muted-foreground">{s.userEmail ?? ''}</p>
                        {s.userCompanyName != null && <p className="text-muted-foreground">{s.userCompanyName}</p>}
                        {s.userVatNumber != null && <p className="text-xs text-muted-foreground">{'DIČ: '}{s.userVatNumber}</p>}
                        {s.userCompanyId != null && <p className="text-xs text-muted-foreground">{'IČO: '}{s.userCompanyId}</p>}
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('billingAddress')}</p>
                        <p className="mt-0.5">{s.userAddress ?? '—'}</p>
                        <p>{s.userPostalCode ?? ''}{' '}{s.userCity ?? ''}</p>
                        <p>{s.userCountry ?? ''}</p>
                      </div>
                    </div>

                    {(s.customerNote != null || s.customerPoNumber != null) && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {s.customerNote != null && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('customerNote')}</p>
                              <p className="mt-0.5 text-foreground">{s.customerNote}</p>
                            </div>
                          )}
                          {s.customerPoNumber != null && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('customerPo')}</p>
                              <p className="mt-0.5 font-mono text-foreground">{s.customerPoNumber}</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )
              })()}

              <Separator />

              {/* Line items */}
              {Array.isArray((det as { items?: unknown[] }).items) && (det as { items: unknown[] }).items.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('items')}</p>
                  <div className="rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('items')}</TableHead>
                          <TableHead>{t('sku')}</TableHead>
                          <TableHead className="text-right">{t('qty')}</TableHead>
                          <TableHead className="text-right">{t('unitPrice')}</TableHead>
                          <TableHead className="text-right">{t('discount')}</TableHead>
                          <TableHead className="text-right">{t('vat')}</TableHead>
                          <TableHead className="text-right">{t('lineTotal')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {((det as { items: Record<string, unknown>[] }).items).map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <p className="text-sm font-medium">{String(item.productName ?? '')}</p>
                              {item.variantName != null && (
                                <p className="text-xs text-muted-foreground">{String(item.variantName)}</p>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {String(item.sku ?? '—')}
                            </TableCell>
                            <TableCell className="text-right">{String(item.quantity ?? '')}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(item.finalUnitPrice as string)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {item.discountPercent ? `${item.discountPercent}%` : '—'}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {item.vatRate ? `${item.vatRate}%` : '—'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-medium">
                              {formatCurrency(item.lineTotal as string)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Totals summary */}
                  {(() => {
                    const t2 = det as {
                      discountTotal?: string | null
                      vatTotal?: string | null
                      grandTotal?: string | null
                      total?: string | null
                      currency?: string | null
                    }
                    return (
                      <div className="mt-3 flex flex-col items-end gap-1 text-sm">
                        {t2.discountTotal != null && parseFloat(t2.discountTotal) > 0 && (
                          <div className="flex gap-8 text-muted-foreground">
                            <span>{t('discount')}</span>
                            <span className="font-mono">{'-'}{formatCurrency(t2.discountTotal)}</span>
                          </div>
                        )}
                        {t2.vatTotal != null && (
                          <div className="flex gap-8 text-muted-foreground">
                            <span>{t('vat')}</span>
                            <span className="font-mono">{formatCurrency(t2.vatTotal)}</span>
                          </div>
                        )}
                        <div className="flex gap-8 border-t border-border pt-1 font-semibold">
                          <span>{t('total')}</span>
                          <span className="font-mono">
                            {formatCurrency(t2.grandTotal ?? t2.total, t2.currency ?? 'EUR')}
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              <Separator />

              {/* Admin note draft */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('adminNote')}
                </label>
                <Textarea
                  value={draftAdminNote}
                  disabled={isSaving}
                  onChange={(e) => {
                    setDraftAdminNote(e.target.value)
                    setSaveSuccess(false)
                  }}
                  placeholder={t('adminNotePlaceholder')}
                  rows={3}
                />
              </div>

              {/* Save / Reset row */}
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                >
                  {t('resetDraft')}
                </Button>

                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <p className="text-sm text-green-600 dark:text-green-400">{t('saveSuccess')}</p>
                  )}
                  {saveError && (
                    <p className="text-sm text-destructive">{saveError}</p>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || isSaving}
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        {'...'}
                      </span>
                    ) : (
                      t('saveChanges')
                    )}
                  </Button>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

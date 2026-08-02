'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DOMAINS } from '@/lib/domain-utils'
import { 
  Search, 
  MoreHorizontal, 
  Check, 
  X, 
  Shield, 
  ShieldOff, 
  Eye, 
  Pencil, 
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  UserPlus,
  RefreshCw,
  LogIn,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { updateUserStatus, updateUserRole, updateUser, updatePartnerDiscount, deleteUser, createPartner } from '@/app/actions/users'
import { normalizeDiscountPercent } from '@/lib/pricing'
import { getLocaleFromDomain, getLocalizedMarketName, getMarketBaseUrl, isValidMarket } from '@/lib/domain-utils'
import { authClient } from '@/lib/auth-client'
import { type Locale } from '@/i18n/config'

interface User {
  id: string
  name: string
  email: string
  role: string | null
  status: string | null
  market: string | null
  companyName: string | null
  companyId: string | null
  vatNumber: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  phone: string | null
  notes: string | null
  discountPercent: string | null
  discountNote: string | null
  partnerTier: string | null
  createdAt: Date
}

interface Props {
  initialUsers: User[]
  locale: Locale
  /** ID of the currently authenticated admin (used to hide "Login as partner" on self) */
  currentUserId: string
}

export function UserManagementClient({ initialUsers, locale, currentUserId }: Props) {
  const t = useTranslations('admin.userManagement')
  const tCommon = useTranslations('common')
  const [users, setUsers] = useState(initialUsers)
  // Keep the table in sync with fresh server data (e.g. new registrations after a
  // refresh). Optimistic edits above still give instant feedback; the server
  // remains the source of truth.
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])
  const [filter, setFilter] = useState('all')
  const [marketFilter, setMarketFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [viewMode, setViewMode] = useState<'view' | 'edit' | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Impersonation state
  const [impersonateTarget, setImpersonateTarget] = useState<User | null>(null)
  const [impersonatePending, setImpersonatePending] = useState(false)
  const [impersonateError, setImpersonateError] = useState<string | null>(null)
  // Separate URL for cross-market error link — keeps the error message clean
  const [crossMarketUrl, setCrossMarketUrl] = useState<string | null>(null)

  // Add partner dialog
  const [addPartnerOpen, setAddPartnerOpen] = useState(false)
  const [addPartnerError, setAddPartnerError] = useState<string | null>(null)
  const [addPartnerSuccess, setAddPartnerSuccess] = useState(false)
  const defaultAddForm = () => ({
    email: '',
    password: '',
    market: '',
    status: 'approved' as 'pending' | 'approved' | 'rejected',
    name: '',
    companyName: '',
    companyId: '',
    vatNumber: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: '',
    notes: '',
    discountPercent: '0',
    discountNote: '',
    partnerTier: '',
  })
  const [addForm, setAddForm] = useState(defaultAddForm)

  const openAddPartner = () => {
    setAddForm(defaultAddForm)
    setAddPartnerError(null)
    setAddPartnerSuccess(false)
    setAddPartnerOpen(true)
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%'
    let pwd = ''
    for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
    setAddForm(f => ({ ...f, password: pwd }))
  }

  const handleAddPartner = async () => {
    setAddPartnerError(null)
    const discountNum = addForm.discountPercent === '' ? 0 : Number(addForm.discountPercent)
    if (!Number.isFinite(discountNum) || discountNum < 0 || discountNum > 100) {
      setAddPartnerError(t('discountError'))
      return
    }
    startTransition(async () => {
      try {
        const result = await createPartner({
          email: addForm.email,
          password: addForm.password,
          market: addForm.market,
          status: addForm.status,
          name: addForm.name || undefined,
          companyName: addForm.companyName || undefined,
          companyId: addForm.companyId || undefined,
          vatNumber: addForm.vatNumber || undefined,
          phone: addForm.phone || undefined,
          address: addForm.address || undefined,
          postalCode: addForm.postalCode || undefined,
          city: addForm.city || undefined,
          country: addForm.country || undefined,
          notes: addForm.notes || undefined,
          discountPercent: discountNum,
          discountNote: addForm.discountNote || undefined,
          partnerTier: addForm.partnerTier || undefined,
        })
        if (result.user) {
          setUsers(prev => [result.user as User, ...prev])
        }
        setAddPartnerSuccess(true)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : ''
        if (msg === 'EMAIL_ALREADY_EXISTS') {
          setAddPartnerError(t('emailExists'))
        } else {
          setAddPartnerError(msg || t('createError'))
        }
      }
    })
  }

  // Form state for editing
  const [editForm, setEditForm] = useState<Partial<User>>({})

  const filteredUsers = users.filter(u => {
    const matchesFilter = filter === 'all' || u.status === filter
    const matchesMarket =
      marketFilter === 'all' ||
      (marketFilter === 'global' ? !u.market : u.market === marketFilter)
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.companyName?.toLowerCase().includes(search.toLowerCase()) ?? false)
    return matchesFilter && matchesMarket && matchesSearch
  })

  const handleStatusChange = async (userId: string, status: 'pending' | 'approved' | 'rejected') => {
    startTransition(async () => {
      await updateUserStatus(userId, status)
      setUsers(users.map(u => u.id === userId ? { ...u, status } : u))
    })
  }

  const handleRoleChange = async (userId: string, role: 'user' | 'admin') => {
    startTransition(async () => {
      await updateUserRole(userId, role)
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u))
    })
  }

  const handleEditSave = async () => {
    if (!selectedUser) return
    setSaveError(null)

    // Resolve market: 'global' sentinel -> null. Non-admins must have a market.
    const isAdmin = selectedUser.role === 'admin'
    const marketSel = editForm.market
    if (!isAdmin && (marketSel == null || marketSel === '' || marketSel === 'global')) {
      setSaveError(t('marketRequired'))
      return
    }
    const marketValue = marketSel === 'global' ? null : (marketSel ?? null)

    const payload = {
      name: editForm.name ?? undefined,
      email: editForm.email ?? undefined,
      companyName: editForm.companyName ?? undefined,
      companyId: editForm.companyId ?? undefined,
      vatNumber: editForm.vatNumber ?? undefined,
      address: editForm.address ?? undefined,
      city: editForm.city ?? undefined,
      postalCode: editForm.postalCode ?? undefined,
      country: editForm.country ?? undefined,
      phone: editForm.phone ?? undefined,
      notes: editForm.notes ?? undefined,
      market: marketValue,
    }

    // Validate the partner discount client-side for immediate feedback; the
    // server re-validates and is the source of truth.
    const rawDiscount = editForm.discountPercent
    const discountNum = rawDiscount === '' || rawDiscount == null ? 0 : Number(rawDiscount)
    if (!Number.isFinite(discountNum) || discountNum < 0 || discountNum > 100) {
      setSaveError(t('discountError'))
      return
    }

    startTransition(async () => {
      try {
        await updateUser(selectedUser.id, payload)
        const { discountPercent } = await updatePartnerDiscount(selectedUser.id, {
          discountPercent: discountNum,
          discountNote: editForm.discountNote ?? null,
          partnerTier: editForm.partnerTier ?? null,
        })
        setUsers(users.map(u => u.id === selectedUser.id
          ? { ...u, ...editForm, market: marketValue, discountPercent: discountPercent.toString() }
          : u))
        setViewMode(null)
        setSelectedUser(null)
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : t('discountError'))
      }
    })
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    startTransition(async () => {
      await deleteUser(deleteConfirm.id)
      setUsers(users.filter(u => u.id !== deleteConfirm.id))
      setDeleteConfirm(null)
    })
  }

  const handleImpersonate = async () => {
    if (!impersonateTarget || impersonatePending) return
    setImpersonateError(null)
    setCrossMarketUrl(null)

    const partnerMarket = impersonateTarget.market ?? ''

    // Step 3a — validate the market value before doing anything
    if (!isValidMarket(partnerMarket)) {
      setImpersonateError(t('impersonateError'))
      return
    }

    // Step 3b — normalize current hostname (lowercase, strip leading www.)
    const rawHostname =
      typeof window !== 'undefined' ? window.location.hostname : ''
    const normalizedHostname = rawHostname.toLowerCase().replace(/^www\./, '')
    const normalizedMarket = partnerMarket.toLowerCase().replace(/^www\./, '')

    // Step 3c / Step 4 — same-market guard with real clickable link
    if (normalizedHostname !== normalizedMarket) {
      const partnerLocale = getLocaleFromDomain(normalizedMarket)
      const adminUrl = `https://${normalizedMarket}/${partnerLocale}/admin/benutzer`
      setCrossMarketUrl(adminUrl)
      setImpersonateError(
        t('wrongMarketError', {
          market: getLocalizedMarketName(normalizedMarket, locale),
        })
      )
      return
    }

    setImpersonatePending(true)
    try {
      // Step 2 — check BA response object, do NOT rely solely on try/catch
      const result = await authClient.admin.impersonateUser({ userId: impersonateTarget.id })

      if (result.error) {
        setImpersonateError(result.error.message || t('impersonateError'))
        setImpersonatePending(false)
        return
      }

      if (!result.data) {
        setImpersonateError(t('impersonateError'))
        setImpersonatePending(false)
        return
      }

      const partnerLocale = getLocaleFromDomain(normalizedMarket)
      // Full document navigation — land directly on the partner portal
      window.location.assign(`/${partnerLocale}/konto`)
    } catch (err) {
      setImpersonateError(err instanceof Error ? err.message : t('impersonateError'))
      setImpersonatePending(false)
    }
  }

  const openImpersonateDialog = (user: User) => {
    setImpersonateTarget(user)
    setImpersonateError(null)
    setCrossMarketUrl(null)
  }

  const openView = (user: User) => {
    setSelectedUser(user)
    setViewMode('view')
  }

  const openEdit = (user: User) => {
    setSelectedUser(user)
    setSaveError(null)
    setEditForm({
      name: user.name,
      email: user.email,
      companyName: user.companyName || '',
      companyId: user.companyId || '',
      vatNumber: user.vatNumber || '',
      address: user.address || '',
      city: user.city || '',
      postalCode: user.postalCode || '',
      country: user.country || '',
      // Market: admins default to 'global' (null) when unset; non-admins start
      // empty so the admin is forced to pick a valid market before saving.
      market: user.market ?? (user.role === 'admin' ? 'global' : undefined),
      phone: user.phone || '',
      notes: user.notes || '',
      discountPercent: user.discountPercent != null ? String(normalizeDiscountPercent(user.discountPercent)) : '0',
      discountNote: user.discountNote || '',
      partnerTier: user.partnerTier || '',
    })
    setViewMode('edit')
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">{t('approved')}</Badge>
      case 'rejected':
        return <Badge variant="destructive">{t('rejected')}</Badge>
      default:
        return <Badge variant="secondary">{t('pending')}</Badge>
    }
  }

  const getRoleBadge = (role: string | null) => {
    return role === 'admin' 
      ? <Badge variant="outline" className="border-primary text-primary">Admin</Badge>
      : <Badge variant="outline">User</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filteredUsers.length} {t('usersCount')}</p>
        </div>
        <Button onClick={openAddPartner} className="shrink-0 mt-2">
          <UserPlus className="mr-2 h-4 w-4" />
          {t('addPartner')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">{t('allUsers')}</TabsTrigger>
                <TabsTrigger value="pending">{t('pending')}</TabsTrigger>
                <TabsTrigger value="approved">{t('approved')}</TabsTrigger>
                <TabsTrigger value="rejected">{t('rejected')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={marketFilter} onValueChange={(v) => setMarketFilter(v ?? 'all')}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={t('allMarkets')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allMarkets')}</SelectItem>
                  <SelectItem value="global">{t('globalMarket')}</SelectItem>
                  {DOMAINS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {getLocalizedMarketName(d.id, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('email')}</TableHead>
                <TableHead>{t('company')}</TableHead>
                <TableHead>{t('market')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                <TableHead>{t('discountPercent')}</TableHead>
                <TableHead>{t('registered')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {t('noUsers')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.companyName || '-'}</TableCell>
                    <TableCell>
                      {user.market ? (
                        <Badge variant="outline">{getLocalizedMarketName(user.market, locale)}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t('globalMarket')}</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">{normalizeDiscountPercent(user.discountPercent)}%</span>
                      {user.partnerTier && (
                        <span className="ml-2 text-xs text-muted-foreground">{user.partnerTier}</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          disabled={isPending}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openView(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('editUser')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status !== 'approved' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'approved')}>
                              <Check className="mr-2 h-4 w-4 text-green-500" />
                              {t('approve')}
                            </DropdownMenuItem>
                          )}
                          {user.status !== 'rejected' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'rejected')}>
                              <X className="mr-2 h-4 w-4 text-red-500" />
                              {t('reject')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {user.role !== 'admin' ? (
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                              <Shield className="mr-2 h-4 w-4" />
                              {t('makeAdmin')}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'user')}>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              {t('removeAdmin')}
                            </DropdownMenuItem>
                          )}
                          {/* Login as partner — only for non-admin, approved, market-assigned, non-self users */}
                          {user.role !== 'admin' &&
                            user.status === 'approved' &&
                            !!user.market &&
                            user.id !== currentUserId && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openImpersonateDialog(user)}>
                                  <LogIn className="mr-2 h-4 w-4" />
                                  {t('loginAsPartner')}
                                </DropdownMenuItem>
                              </>
                            )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteConfirm(user)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('deleteUser')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={viewMode === 'view'} onOpenChange={() => { setViewMode(null); setSelectedUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedUser?.name}</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(selectedUser.status)}
                {getRoleBadge(selectedUser.role)}
                <Badge variant="outline">
                  {t('market')}: {selectedUser.market ? getLocalizedMarketName(selectedUser.market, locale) : t('globalMarket')}
                </Badge>
              </div>
              
              {selectedUser.companyName && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedUser.companyName}</p>
                    {selectedUser.companyId && <p className="text-sm text-muted-foreground">ID: {selectedUser.companyId}</p>}
                    {selectedUser.vatNumber && <p className="text-sm text-muted-foreground">VAT: {selectedUser.vatNumber}</p>}
                  </div>
                </div>
              )}
              
              {selectedUser.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <p>{selectedUser.phone}</p>
                </div>
              )}
              
              {(selectedUser.address || selectedUser.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    {selectedUser.address && <p>{selectedUser.address}</p>}
                    <p>{[selectedUser.postalCode, selectedUser.city, selectedUser.country].filter(Boolean).join(', ')}</p>
                  </div>
                </div>
              )}

              {selectedUser.notes && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium mb-1">{t('notes')}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.notes}</p>
                </div>
              )}

              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t('discountPercent')}</p>
                  <span className="font-semibold text-primary">{normalizeDiscountPercent(selectedUser.discountPercent)}%</span>
                </div>
                {selectedUser.partnerTier && (
                  <p className="mt-1 text-sm text-muted-foreground">{t('partnerTier')}: {selectedUser.partnerTier}</p>
                )}
                {selectedUser.discountNote && (
                  <p className="mt-1 text-sm text-muted-foreground">{selectedUser.discountNote}</p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {t('registered')}: {new Date(selectedUser.createdAt).toLocaleString()}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewMode(null); setSelectedUser(null); }}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={() => selectedUser && openEdit(selectedUser)}>
              {tCommon('edit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={viewMode === 'edit'} onOpenChange={() => { setViewMode(null); setSelectedUser(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editUser')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('name')}</Label>
                <Input
                  id="edit-name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t('email')}</Label>
                <Input
                  id="edit-email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">{t('company')}</Label>
              <Input
                id="edit-company"
                value={editForm.companyName || ''}
                onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-companyId">{t('companyId')}</Label>
                <Input
                  id="edit-companyId"
                  value={editForm.companyId || ''}
                  onChange={(e) => setEditForm({ ...editForm, companyId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vatNumber">{t('vatNumber')}</Label>
                <Input
                  id="edit-vatNumber"
                  value={editForm.vatNumber || ''}
                  onChange={(e) => setEditForm({ ...editForm, vatNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">{t('phone')}</Label>
              <Input
                id="edit-phone"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">{t('address')}</Label>
              <Input
                id="edit-address"
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-postalCode">{t('postalCode')}</Label>
                <Input
                  id="edit-postalCode"
                  value={editForm.postalCode || ''}
                  onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">{t('city')}</Label>
                <Input
                  id="edit-city"
                  value={editForm.city || ''}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">{t('country')}</Label>
                <Input
                  id="edit-country"
                  value={editForm.country || ''}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                />
              </div>
            </div>
            {/* Market / Trh — deliberately separate from Country (billing/address).
                Drives partner-price enforcement. Required for non-admins;
                admins may be Global (null). */}
            <div className="space-y-2">
              <Label htmlFor="edit-market">{t('market')}</Label>
              {/* Native <select> on purpose: a Base UI Select popup portals to
                  <body>, which conflicts with the Radix Dialog focus trap and
                  makes the dropdown close instantly. A native select has no such
                  conflict and is styled to match the sibling Input fields. */}
              <select
                id="edit-market"
                value={editForm.market ?? ''}
                onChange={(e) => setEditForm({ ...editForm, market: e.target.value })}
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectedUser?.role === 'admin' ? (
                  <option value="global">{t('globalMarket')}</option>
                ) : (
                  <option value="" disabled>
                    {t('market')}
                  </option>
                )}
                {DOMAINS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {getLocalizedMarketName(d.id, locale)} ({d.id})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{t('marketHint')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">{t('notes')}</Label>
              <Input
                id="edit-notes"
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>

            {/* Partner B2B discount */}
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{t('partnerPricingTitle')}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('discountExplanation')}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-discount">{t('discountPercent')}</Label>
                  <Input
                    id="edit-discount"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    inputMode="decimal"
                    value={editForm.discountPercent ?? '0'}
                    onChange={(e) => setEditForm({ ...editForm, discountPercent: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">{t('discountRangeHint')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tier">{t('partnerTier')}</Label>
                  <Input
                    id="edit-tier"
                    value={editForm.partnerTier || ''}
                    onChange={(e) => setEditForm({ ...editForm, partnerTier: e.target.value })}
                    placeholder={t('partnerTierPlaceholder')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-discount-note">{t('discountNote')}</Label>
                <Input
                  id="edit-discount-note"
                  value={editForm.discountNote || ''}
                  onChange={(e) => setEditForm({ ...editForm, discountNote: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
            {saveError && (
              <p className="mr-auto text-sm font-medium text-destructive" role="alert">{saveError}</p>
            )}
            <Button variant="outline" onClick={() => { setViewMode(null); setSelectedUser(null); setSaveError(null); }}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleEditSave} disabled={isPending}>
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Partner Dialog */}
      <Dialog open={addPartnerOpen} onOpenChange={(open) => { if (!open) setAddPartnerOpen(false) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('addPartnerTitle')}</DialogTitle>
            <DialogDescription>{t('addPartnerDescription')}</DialogDescription>
          </DialogHeader>

          {addPartnerSuccess ? (
            <div className="space-y-4 py-2">
              <p className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">
                {t('createSuccess')}
              </p>
              <DialogFooter>
                <Button onClick={() => { setAddPartnerOpen(false) }}>{tCommon('close')}</Button>
                <Button variant="outline" onClick={() => { setAddForm(defaultAddForm); setAddPartnerSuccess(false); setAddPartnerError(null) }}>
                  {t('addPartner')}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Required: email, password, market */}
              <div className="space-y-2">
                <Label htmlFor="ap-email">{t('email')} *</Label>
                <Input
                  id="ap-email"
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="partner@firma.sk"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-password">{t('tempPassword')} *</Label>
                <div className="flex gap-2">
                  <Input
                    id="ap-password"
                    type="text"
                    value={addForm.password}
                    onChange={(e) => setAddForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="min. 8 znakov"
                    className="font-mono"
                    required
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generatePassword} className="shrink-0">
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    {t('generatePassword')}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('passwordHint')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-market">{t('market')} *</Label>
                <select
                  id="ap-market"
                  value={addForm.market}
                  onChange={(e) => setAddForm(f => ({ ...f, market: e.target.value }))}
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  required
                >
                  <option value="" disabled>{t('market')}</option>
                  {DOMAINS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {getLocalizedMarketName(d.id, locale)} ({d.id})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{t('marketHint')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-status">{t('statusLabel')}</Label>
                <select
                  id="ap-status"
                  value={addForm.status}
                  onChange={(e) => setAddForm(f => ({ ...f, status: e.target.value as 'pending' | 'approved' | 'rejected' }))}
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="approved">{t('statusApproved')}</option>
                  <option value="pending">{t('statusPending')}</option>
                  <option value="rejected">{t('statusRejected')}</option>
                </select>
              </div>

              {/* Optional profile */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ap-name">{t('name')}</Label>
                  <Input
                    id="ap-name"
                    value={addForm.name}
                    onChange={(e) => setAddForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ap-phone">{t('phone')}</Label>
                  <Input
                    id="ap-phone"
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-company">{t('company')}</Label>
                <Input
                  id="ap-company"
                  value={addForm.companyName}
                  onChange={(e) => setAddForm(f => ({ ...f, companyName: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ap-ico">{t('companyId')}</Label>
                  <Input
                    id="ap-ico"
                    value={addForm.companyId}
                    onChange={(e) => setAddForm(f => ({ ...f, companyId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ap-dic">{t('vatNumber')}</Label>
                  <Input
                    id="ap-dic"
                    value={addForm.vatNumber}
                    onChange={(e) => setAddForm(f => ({ ...f, vatNumber: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-address">{t('address')}</Label>
                <Input
                  id="ap-address"
                  value={addForm.address}
                  onChange={(e) => setAddForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="ap-zip">{t('postalCode')}</Label>
                  <Input
                    id="ap-zip"
                    value={addForm.postalCode}
                    onChange={(e) => setAddForm(f => ({ ...f, postalCode: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ap-city">{t('city')}</Label>
                  <Input
                    id="ap-city"
                    value={addForm.city}
                    onChange={(e) => setAddForm(f => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ap-country">{t('country')}</Label>
                  <Input
                    id="ap-country"
                    value={addForm.country}
                    onChange={(e) => setAddForm(f => ({ ...f, country: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-notes">{t('notes')}</Label>
                <Input
                  id="ap-notes"
                  value={addForm.notes}
                  onChange={(e) => setAddForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              {/* Partner pricing */}
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('partnerPricingTitle')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('discountExplanation')}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ap-discount">{t('discountPercent')}</Label>
                    <Input
                      id="ap-discount"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      inputMode="decimal"
                      value={addForm.discountPercent}
                      onChange={(e) => setAddForm(f => ({ ...f, discountPercent: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">{t('discountRangeHint')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ap-tier">{t('partnerTier')}</Label>
                    <Input
                      id="ap-tier"
                      value={addForm.partnerTier}
                      onChange={(e) => setAddForm(f => ({ ...f, partnerTier: e.target.value }))}
                      placeholder={t('partnerTierPlaceholder')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ap-discount-note">{t('discountNote')}</Label>
                  <Input
                    id="ap-discount-note"
                    value={addForm.discountNote}
                    onChange={(e) => setAddForm(f => ({ ...f, discountNote: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                {addPartnerError && (
                  <p className="mr-auto text-sm font-medium text-destructive" role="alert">{addPartnerError}</p>
                )}
                <Button variant="outline" onClick={() => setAddPartnerOpen(false)} disabled={isPending}>
                  {tCommon('cancel')}
                </Button>
                <Button onClick={handleAddPartner} disabled={isPending}>
                  {t('createPartner')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteUser')}</DialogTitle>
            <DialogDescription>{t('confirmDelete')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonation Confirmation Dialog */}
      <Dialog
        open={!!impersonateTarget}
        onOpenChange={(open) => {
          if (!open && !impersonatePending) {
            setImpersonateTarget(null)
            setImpersonateError(null)
            setCrossMarketUrl(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" aria-hidden="true" />
              {t('loginAsPartner')}
            </DialogTitle>
            <DialogDescription>{t('impersonateDescription')}</DialogDescription>
          </DialogHeader>

          {impersonateTarget && (
            <div className="space-y-3">
              {/* Partner summary */}
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{t('name')}</span>
                  <span className="text-sm font-medium">{impersonateTarget.name}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{t('email')}</span>
                  <span className="text-sm">{impersonateTarget.email}</span>
                </div>
                {impersonateTarget.companyName && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{t('company')}</span>
                    <span className="text-sm">{impersonateTarget.companyName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{t('market')}</span>
                  <span className="text-sm">
                    {impersonateTarget.market
                      ? getLocalizedMarketName(impersonateTarget.market, locale)
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{t('discountPercent')}</span>
                  <span className="text-sm font-semibold text-primary">
                    {normalizeDiscountPercent(impersonateTarget.discountPercent)}%
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t('impersonateWarning')}
                </p>
              </div>

              {/* Cross-market or other error */}
              {impersonateError && (
                <div role="alert" className="space-y-1.5">
                  <p className="text-sm font-medium text-destructive">
                    {impersonateError}
                  </p>
                  {/* Step 4 — real clickable link to the correct market admin */}
                  {crossMarketUrl && (
                    <a
                      href={crossMarketUrl}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
                    >
                      {t('wrongMarketLink')}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setImpersonateTarget(null); setImpersonateError(null); setCrossMarketUrl(null) }}
              disabled={impersonatePending}
            >
              {t('impersonateCancel')}
            </Button>
            <Button
              onClick={handleImpersonate}
              disabled={impersonatePending}
            >
              {impersonatePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('impersonateConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
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
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'
import { updateUserStatus, updateUserRole, updateUser, deleteUser } from '@/app/actions/users'
import { type Locale } from '@/i18n/config'

interface User {
  id: string
  name: string
  email: string
  role: string | null
  status: string | null
  companyName: string | null
  companyId: string | null
  vatNumber: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  phone: string | null
  notes: string | null
  createdAt: Date
}

interface Props {
  initialUsers: User[]
  locale: Locale
}

export function UserManagementClient({ initialUsers, locale }: Props) {
  const t = useTranslations('admin.userManagement')
  const tCommon = useTranslations('common')
  const [users, setUsers] = useState(initialUsers)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [viewMode, setViewMode] = useState<'view' | 'edit' | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)
  const router = useRouter()

  // Form state for editing
  const [editForm, setEditForm] = useState<Partial<User>>({})

  const filteredUsers = users.filter(u => {
    const matchesFilter = filter === 'all' || u.status === filter
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.companyName?.toLowerCase().includes(search.toLowerCase()) ?? false)
    return matchesFilter && matchesSearch
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
    startTransition(async () => {
      await updateUser(selectedUser.id, editForm)
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...editForm } : u))
      setViewMode(null)
      setSelectedUser(null)
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

  const openView = (user: User) => {
    setSelectedUser(user)
    setViewMode('view')
  }

  const openEdit = (user: User) => {
    setSelectedUser(user)
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
      phone: user.phone || '',
      notes: user.notes || '',
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
    <>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/${locale}/admin`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{filteredUsers.length} users</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[300px]"
              />
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
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                <TableHead>{t('registered')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t('noUsers')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.companyName || '-'}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button 
                            disabled={isPending}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
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
              <div className="flex gap-2">
                {getStatusBadge(selectedUser.status)}
                {getRoleBadge(selectedUser.role)}
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
            <div className="space-y-2">
              <Label htmlFor="edit-notes">{t('notes')}</Label>
              <Input
                id="edit-notes"
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewMode(null); setSelectedUser(null); }}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleEditSave} disabled={isPending}>
              {t('saveChanges')}
            </Button>
          </DialogFooter>
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
    </>
  )
}

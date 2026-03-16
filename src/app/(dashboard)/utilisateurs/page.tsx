'use client'

import { Mail, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { trpc } from '@/lib/trpc-client'
import { formatDateOHADA } from '@/lib/utils'

const ROLES = ['EXPERT', 'COMPTABLE', 'AUDITEUR', 'DIRIGEANT', 'COMMISSAIRE'] as const

export default function UtilisateursPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')

  const { data: users, refetch: refetchUsers } = trpc.users.list.useQuery()
  const { data: invitations, refetch: refetchInvitations } = trpc.users.listInvitations.useQuery()
  const utils = trpc.useUtils()

  const inviteMutation = trpc.users.invite.useMutation({
    onSuccess: () => {
      toast.success('Invitation envoyée')
      setInviteEmail('')
      setInviteRole('')
      setDialogOpen(false)
      refetchInvitations()
      utils.users.listInvitations.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const toggleActifMutation = trpc.users.toggleActif.useMutation({
    onSuccess: () => {
      toast.success('Statut mis à jour')
      refetchUsers()
    },
    onError: (err) => toast.error(err.message),
  })

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteRole) {
      toast.error('Veuillez sélectionner un rôle')
      return
    }
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole as 'EXPERT' | 'COMPTABLE' | 'AUDITEUR' | 'DIRIGEANT' | 'COMMISSAIRE' })
  }

  const pendingInvitations = invitations?.filter((inv) => !inv.accepte) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <UserPlus className="mr-2 size-4" />
                Inviter
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Inviter un utilisateur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborateur@exemple.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(val) => {
                    if (val) setInviteRole(val)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? 'Envoi...' : 'Envoyer l\'invitation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Aucun utilisateur
                </TableCell>
              </TableRow>
            )}
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.prenom} {user.nom}
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={user.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {user.actif ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={toggleActifMutation.isPending}
                    onClick={() => toggleActifMutation.mutate({ userId: user.id })}
                  >
                    {user.actif ? 'Désactiver' : 'Activer'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {pendingInvitations.length > 0 && (
        <>
          <h2 className="text-lg font-semibold">Invitations en attente</h2>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expire le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <Mail className="size-4 text-muted-foreground" />
                        {inv.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{inv.role}</Badge>
                    </TableCell>
                    <TableCell>{formatDateOHADA(new Date(inv.createdAt))}</TableCell>
                    <TableCell>{formatDateOHADA(new Date(inv.expiresAt))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}

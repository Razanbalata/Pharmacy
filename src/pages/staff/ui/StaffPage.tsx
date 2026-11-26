import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { staffQueries, type StaffMember } from '@/entities/staff-member'
import { StaffFormDrawer } from '@/features/staff/manage'
import { ResetStaffPasswordButton } from '@/features/staff/reset-password'
import { StaffStatusSwitch } from '@/features/staff/toggle-status'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { formatPhone } from '@/shared/lib/validation'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { DataTable, type Column } from '@/shared/ui/table'

const ROLE_TONE = { manager: 'neutral', pharmacist: 'brand', cashier: 'info' } as const

function useLastLogin() {
  const { t, i18n } = useTranslation()
  return (iso: string | null) => {
    if (!iso) return t('staff.never')
    const minutes = (Date.now() - Date.parse(iso)) / 60_000
    if (minutes < 5) return t('staff.now')
    return new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      numberingSystem: 'latn',
    }).format(new Date(iso))
  }
}

export function StaffPage() {
  const { t } = useTranslation()
  const lastLogin = useLastLogin()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const adding = params.get('new') === '1'
  const { data: staff = [], isPending } = useQuery(staffQueries.list())

  const columns: Column<StaffMember>[] = [
    {
      id: 'member',
      header: t('staff.columns.member'),
      cell: (member) => (
        <div className={cn('flex items-center gap-2.5', !member.active && 'opacity-60')}>
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-pill bg-brand-soft font-semibold text-brand-strong"
          >
            {member.name.slice(0, 1)}
          </span>
          <span>
            <span className="block font-semibold">{member.name}</span>
            <bdi dir="ltr" className="tabular text-caption text-ink-muted">
              {formatPhone(member.phone)}
            </bdi>
          </span>
        </div>
      ),
    },
    {
      id: 'role',
      header: t('staff.columns.role'),
      cell: (member) => <Badge tone={ROLE_TONE[member.role]}>{t(`role.${member.role}`)}</Badge>,
    },
    {
      id: 'discount',
      header: t('staff.columns.discount'),
      cell: (member) =>
        member.discountLimit === null ? t('staff.noLimit') : `${member.discountLimit}%`,
      numeric: true,
    },
    {
      id: 'lastLogin',
      header: t('staff.columns.lastLogin'),
      cell: (member) => lastLogin(member.lastLoginAt),
    },
    {
      id: 'status',
      header: t('staff.columns.status'),
      cell: (member) =>
        member.isOwner ? (
          <span className="text-small text-ink-muted">{t('staff.owner')}</span>
        ) : (
          <StaffStatusSwitch member={member} />
        ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">{t('staff.edit')}</span>,
      cell: (member) =>
        member.isOwner ? null : (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditing(member)}>
              {t('staff.edit')}
            </Button>
            <ResetStaffPasswordButton member={member} />
          </div>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display">{t('staff.title')}</h1>
          <p className="mt-1 text-body text-ink-muted">{t('staff.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={paths.activity}
            className="flex h-10 items-center rounded-md border border-border-strong px-4 text-body hover:bg-surface-200"
          >
            {t('staff.activityLog')}
          </Link>
          <Button onClick={() => setParams({ new: '1' })}>{t('staff.add')}</Button>
        </div>
      </div>

      <DataTable
        caption={t('staff.title')}
        columns={columns}
        rows={staff}
        getRowId={(member) => String(member.id)}
        loading={isPending}
      />

      <div className="grid gap-3 md:grid-cols-3">
        {(['manager', 'pharmacist', 'cashier'] as const).map((role) => (
          <div
            key={role}
            className="rounded-lg border border-border bg-surface-100 shadow-card p-4"
          >
            <p className="font-display text-body-strong">{t(`staff.roles.${role}.title`)}</p>
            <p className="mt-1 text-small text-ink-muted">{t(`staff.roles.${role}.body`)}</p>
          </div>
        ))}
      </div>
      <p className="text-small text-ink-muted">{t('staff.neverDeleted')}</p>

      <StaffFormDrawer
        open={adding || editing !== null}
        member={editing}
        onClose={() => {
          setEditing(null)
          if (adding) setParams({})
        }}
      />
    </div>
  )
}

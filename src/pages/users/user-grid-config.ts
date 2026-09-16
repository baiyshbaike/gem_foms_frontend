import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/vue-table'

import { h } from 'vue'

import type { ServerDataGridExportColumn } from '@/components/server-data-grid'
import type { AdminUserGridRow } from '@/services/types/dialysis'

import { ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/dialysis'

import UserRowActions from './user-row-actions.vue'

export const userColumnLabels: Record<string, string> = {
  username: 'Имя пользователя',
  firstName: 'Имя',
  lastName: 'Фамилия',
  isActive: 'Активен',
  role: 'Роль',
  tenants: 'Мед центры',
  managerRegionName: 'Регион',
  failedLoginCount: 'Неудачных входов',
  lockoutEndAt: 'Блокировка до',
  lastLoginAt: 'Последний вход',
  createdAt: 'Создан',
}

export const userDefaultSorting: SortingState = [
  { id: 'username', desc: false },
]

export const userDefaultColumnVisibility: VisibilityState = {
  lockoutEndAt: false,
  updatedAt: false,
  failedLoginCount: false,
}

export function createUserColumns(opts: {
  canUpdate: boolean
  canDeactivate: boolean
  onEdit: (row: AdminUserGridRow) => void
  onDeactivate: (row: AdminUserGridRow) => void
  onView: (row: AdminUserGridRow) => void
}): ColumnDef<AdminUserGridRow>[] {
  return [
    {
      accessorKey: 'username',
      id: 'username',
      header: ({ column }) => h(ServerDataGridColumnHeader<AdminUserGridRow>, { column, title: 'Имя пользователя' }),
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.username),
      size: 150,
    },
    {
      accessorKey: 'firstName',
      id: 'firstName',
      header: ({ column }) => h(ServerDataGridColumnHeader<AdminUserGridRow>, { column, title: 'Имя' }),
      cell: ({ row }) => row.original.firstName,
      size: 130,
    },
    {
      accessorKey: 'lastName',
      id: 'lastName',
      header: ({ column }) => h(ServerDataGridColumnHeader<AdminUserGridRow>, { column, title: 'Фамилия' }),
      cell: ({ row }) => row.original.lastName,
      size: 130,
    },
    {
      accessorKey: 'isActive',
      id: 'isActive',
      header: ({ column }) => h(ServerDataGridColumnHeader<AdminUserGridRow>, { column, title: 'Активен' }),
      cell: ({ row }) => h(Badge, { variant: row.original.isActive ? 'default' : 'secondary' }, () => row.original.isActive ? 'Активен' : 'Неактивен'),
      size: 90,
    },
    {
      accessorKey: 'role',
      id: 'role',
      header: ({ column }) => h(ServerDataGridColumnHeader<AdminUserGridRow>, { column, title: 'Роль' }),
      cell: ({ row }) => row.original.role || '-',
      size: 160,
    },
    {
      accessorKey: 'tenants',
      id: 'tenants',
      header: ({ column }) => h(ServerDataGridColumnHeader<AdminUserGridRow>, { column, title: 'Мед центры' }),
      cell: ({ row }) => row.original.tenants || '-',
      enableSorting: false,
      size: 180,
    },
    {
      accessorKey: 'managerRegionName',
      id: 'managerRegionName',
      header: ({ column }) => h(ServerDataGridColumnHeader<AdminUserGridRow>, { column, title: 'Регион' }),
      cell: ({ row }) => row.original.managerRegionName ?? '-',
      size: 140,
    },
    {
      accessorKey: 'failedLoginCount',
      id: 'failedLoginCount',
      header: ({ column }) => h(ServerDataGridColumnHeader<AdminUserGridRow>, { column, title: 'Неудачных входов' }),
      cell: ({ row }) => String(row.original.failedLoginCount),
      size: 110,
    },
    {
      accessorKey: 'lockoutEndAt',
      id: 'lockoutEndAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<AdminUserGridRow>, { column, title: 'Блокировка до' }),
      cell: ({ row }) => formatDateTime(row.original.lockoutEndAt),
      size: 150,
    },
    {
      accessorKey: 'lastLoginAt',
      id: 'lastLoginAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<AdminUserGridRow>, { column, title: 'Последний вход' }),
      cell: ({ row }) => formatDateTime(row.original.lastLoginAt),
      size: 150,
    },
    {
      accessorKey: 'createdAt',
      id: 'createdAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<AdminUserGridRow>, { column, title: 'Создан' }),
      cell: ({ row }) => formatDateTime(row.original.createdAt),
      size: 150,
    },
    {
      id: 'actions',
      header: () => h('span', { class: 'block text-right' }, 'Действия'),
      cell: ({ row }) => h(UserRowActions, {
        user: row.original,
        canUpdate: opts.canUpdate,
        canDeactivate: opts.canDeactivate,
        onView: () => opts.onView(row.original),
        onEdit: () => opts.onEdit(row.original),
        onDeactivate: () => opts.onDeactivate(row.original),
      }),
      enableSorting: false,
      enableHiding: false,
      size: 80,
      minSize: 72,
      maxSize: 88,
    },
  ]
}

export const userFilterFields = [
  {
    field: 'username',
    label: 'Имя пользователя',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'firstName',
    label: 'Имя',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'lastName',
    label: 'Фамилия',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'isActive',
    label: 'Активен',
    type: 'select' as const,
    operators: ['equals'] as const,
    options: [{ value: 'true', label: 'Активен' }, { value: 'false', label: 'Неактивен' }],
  },
  {
    field: 'role',
    label: 'Роль',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'tenants',
    label: 'Мед центры',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'createdAt',
    label: 'Создан',
    type: 'date' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'] as const,
  },
  {
    field: 'lastLoginAt',
    label: 'Последний вход',
    type: 'date' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'isEmpty', 'isNotEmpty'] as const,
  },
  {
    field: 'failedLoginCount',
    label: 'Неудачных входов',
    type: 'number' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'] as const,
  },
]

export const userGroupOptions = [
  { field: 'isActive', label: 'Активен' },
]

export const userExportColumns: ServerDataGridExportColumn<AdminUserGridRow>[] = [
  { id: 'username', label: 'Имя пользователя', width: 20, value: row => row.username },
  { id: 'firstName', label: 'Имя', width: 15, value: row => row.firstName },
  { id: 'lastName', label: 'Фамилия', width: 15, value: row => row.lastName },
  { id: 'isActive', label: 'Активен', width: 10, value: row => row.isActive ? 'Активен' : 'Неактивен' },
  { id: 'role', label: 'Роль', width: 25, value: row => row.role },
  { id: 'tenants', label: 'Мед центры', width: 25, value: row => row.tenants },
  { id: 'managerRegionName', label: 'Регион', width: 18, value: row => row.managerRegionName ?? '' },
  { id: 'failedLoginCount', label: 'Неудачных входов', width: 14, value: row => row.failedLoginCount },
  { id: 'lockoutEndAt', label: 'Блокировка до', width: 16, value: row => row.lockoutEndAt ?? '' },
  { id: 'lastLoginAt', label: 'Последний вход', width: 18, value: row => row.lastLoginAt ?? '' },
  { id: 'createdAt', label: 'Создан', width: 18, value: row => row.createdAt },
]

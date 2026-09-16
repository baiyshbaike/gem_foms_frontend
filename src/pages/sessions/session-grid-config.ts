import type { ColumnDef, ColumnPinningState, SortingState, VisibilityState } from '@tanstack/vue-table'

import { h } from 'vue'

import type { ServerDataGridExportColumn } from '@/components/server-data-grid'
import type { SessionGridRow } from '@/services/types/dialysis'

import { ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/dialysis'

import SessionRowActions from './session-row-actions.vue'

export const sessionStatusOptions = [
  { value: 'Identified', label: 'Идентифицирован' },
  { value: 'Started', label: 'Начат' },
  { value: 'Paused', label: 'Приостановлен' },
  { value: 'Finished', label: 'Завершён' },
  { value: 'EndIdentified', label: 'Идентиф. завершена' },
  { value: 'SentToPay', label: 'Отправлен в оплату' },
  { value: 'Paid', label: 'Оплачен' },
  { value: 'Archived', label: 'Архивирован' },
  { value: 'IdentificationExpired', label: 'Идентификация просрочена' },
  { value: 'EndIdentificationOverdue', label: 'Завершение идент. просрочено' },
  { value: 'SendToPayOverdue', label: 'Отправка в оплату просрочена' },
]

export const sessionStatusLabels: Record<string, string> = Object.fromEntries(
  sessionStatusOptions.map(option => [option.value, option.label]),
)

export function getStatusBadgeVariant(status: string): string {
  const map: Record<string, string> = {
    Identified: 'secondary',
    Started: 'default',
    Paused: 'secondary',
    Finished: 'default',
    EndIdentified: 'secondary',
    SentToPay: 'secondary',
    Paid: 'default',
    Archived: 'outline',
    IdentificationExpired: 'destructive',
    EndIdentificationOverdue: 'destructive',
    SendToPayOverdue: 'destructive',
  }
  return map[status] ?? 'secondary'
}

export const sessionColumnLabels: Record<string, string> = {
  id: 'ID',
  patientName: 'Пациент',
  machineName: 'Аппарат',
  status: 'Статус',
  identifiedAt: 'Идентифицирован',
  startedAt: 'Начат',
  finishedAt: 'Завершён',
  endIdentifiedAt: 'Идент. завершена',
  sentToPayAt: 'Отправлен в оплату',
  paidAt: 'Оплачен',
  activeMinutes: 'Активно',
  pauseMinutes: 'Пауза',
}

export const sessionDefaultSorting: SortingState = [
  { id: 'identifiedAt', desc: true },
]

export const sessionDefaultColumnVisibility: VisibilityState = {
  tenantId: false,
  endIdentifiedAt: false,
  sentToPayAt: false,
  paidAt: false,
}

export const sessionDefaultColumnPinning: ColumnPinningState = {
  left: ['select', 'id'],
  right: ['actions'],
}

export function createSessionColumns(opts: {
  onDetails: (row: SessionGridRow) => void
  onMarkPaid: (row: SessionGridRow) => void
  canMarkPaid: boolean
}): ColumnDef<SessionGridRow>[] {
  return [
    {
      accessorKey: 'id',
      id: 'id',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'ID', multiSort: true }),
      cell: ({ row }) => h('div', { class: 'font-medium tabular-nums' }, `#${row.original.id}`),
      size: 80,
      minSize: 72,
      maxSize: 110,
    },
    {
      accessorKey: 'patientName',
      id: 'patientName',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Пациент', multiSort: true }),
      cell: ({ row }) => h('div', { class: 'truncate font-medium' }, row.original.patientName),
      size: 220,
      minSize: 170,
    },
    {
      accessorKey: 'machineName',
      id: 'machineName',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Аппарат', multiSort: true }),
      cell: ({ row }) => row.original.machineName ?? '-',
      size: 170,
      minSize: 140,
    },
    {
      accessorKey: 'status',
      id: 'status',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Статус', multiSort: true }),
      cell: ({ row }) => {
        const status = row.original.status
        return h(Badge, { variant: getStatusBadgeVariant(status) as any }, () => sessionStatusLabels[status] ?? status)
      },
      size: 145,
      minSize: 125,
    },
    {
      accessorKey: 'identifiedAt',
      id: 'identifiedAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Идентифицирован', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDateTime(row.original.identifiedAt)),
      size: 190,
      minSize: 170,
    },
    {
      accessorKey: 'startedAt',
      id: 'startedAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Начат', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDateTime(row.original.startedAt)),
      size: 180,
      minSize: 160,
    },
    {
      accessorKey: 'finishedAt',
      id: 'finishedAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Завершён', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDateTime(row.original.finishedAt)),
      size: 180,
      minSize: 160,
    },
    {
      accessorKey: 'endIdentifiedAt',
      id: 'endIdentifiedAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Идент. завершена', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDateTime(row.original.endIdentifiedAt)),
      size: 190,
      minSize: 170,
    },
    {
      accessorKey: 'sentToPayAt',
      id: 'sentToPayAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Отправлен в оплату', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDateTime(row.original.sentToPayAt)),
      size: 210,
      minSize: 185,
    },
    {
      accessorKey: 'paidAt',
      id: 'paidAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Оплачен', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDateTime(row.original.paidAt)),
      size: 180,
      minSize: 160,
    },
    {
      accessorKey: 'activeMinutes',
      id: 'activeMinutes',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Активно', multiSort: true }),
      cell: ({ row }) => {
        const value = row.original.activeMinutes
        return value != null ? `${value}м` : '-'
      },
      size: 115,
      minSize: 105,
    },
    {
      accessorKey: 'pauseMinutes',
      id: 'pauseMinutes',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Пауза', multiSort: true }),
      cell: ({ row }) => {
        const value = row.original.pauseMinutes
        return value != null ? `${value}м` : '-'
      },
      size: 105,
      minSize: 95,
    },
    {
      id: 'actions',
      header: () => h('span', { class: 'block text-right' }, 'Действия'),
      cell: ({ row }) => h(SessionRowActions, {
        session: row.original,
        canMarkPaid: opts.canMarkPaid,
        onDetails: () => opts.onDetails(row.original),
        onMarkPaid: () => opts.onMarkPaid(row.original),
      }),
      enableSorting: false,
      enableHiding: false,
      enablePinning: true,
      enableResizing: false,
      size: 80,
      minSize: 72,
      maxSize: 88,
    },
  ]
}

export const sessionFilterFields = [
  {
    field: 'status',
    label: 'Статус',
    type: 'select' as const,
    operators: ['equals', 'notEquals'] as const,
    options: sessionStatusOptions.map(item => ({ value: String(item.value), label: item.label })),
  },
  {
    field: 'patientName',
    label: 'Пациент',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'machineName',
    label: 'Аппарат',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith', 'isEmpty', 'isNotEmpty'] as const,
  },
  {
    field: 'identifiedAt',
    label: 'Идентифицирован',
    type: 'date' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'] as const,
  },
  {
    field: 'startedAt',
    label: 'Начат',
    type: 'date' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'isEmpty', 'isNotEmpty'] as const,
  },
  {
    field: 'finishedAt',
    label: 'Завершён',
    type: 'date' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'isEmpty', 'isNotEmpty'] as const,
  },
  {
    field: 'activeMinutes',
    label: 'Активно (мин)',
    type: 'number' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'isEmpty', 'isNotEmpty'] as const,
  },
  {
    field: 'pauseMinutes',
    label: 'Пауза (мин)',
    type: 'number' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'isEmpty', 'isNotEmpty'] as const,
  },
]

export const sessionGroupOptions = [
  { field: 'status', label: 'Статус' },
]

export const sessionExportColumns: ServerDataGridExportColumn<SessionGridRow>[] = [
  { id: 'id', label: 'ID', width: 10, value: row => row.id },
  { id: 'patientName', label: 'Пациент', width: 25, value: row => row.patientName },
  { id: 'machineName', label: 'Аппарат', width: 20, value: row => row.machineName ?? '' },
  { id: 'status', label: 'Статус', width: 15, value: row => row.status },
  { id: 'identifiedAt', label: 'Идентифицирован', width: 18, value: row => row.identifiedAt },
  { id: 'startedAt', label: 'Начат', width: 18, value: row => row.startedAt ?? '' },
  { id: 'finishedAt', label: 'Завершён', width: 18, value: row => row.finishedAt ?? '' },
  { id: 'endIdentifiedAt', label: 'Идент. завершена', width: 18, value: row => row.endIdentifiedAt ?? '' },
  { id: 'sentToPayAt', label: 'Отправлен в оплату', width: 18, value: row => row.sentToPayAt ?? '' },
  { id: 'paidAt', label: 'Оплачен', width: 18, value: row => row.paidAt ?? '' },
  { id: 'activeMinutes', label: 'Активно (мин)', width: 15, value: row => row.activeMinutes ?? '' },
  { id: 'pauseMinutes', label: 'Пауза (мин)', width: 15, value: row => row.pauseMinutes ?? '' },
]

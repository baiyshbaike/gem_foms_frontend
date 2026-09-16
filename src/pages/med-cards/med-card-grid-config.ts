import type { ColumnDef, ColumnPinningState, SortingState, VisibilityState } from '@tanstack/vue-table'

import { h } from 'vue'

import type { ServerDataGridExportColumn } from '@/components/server-data-grid'
import type { MedCardGridRow } from '@/services/types/dialysis'

import { ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, medCardStatusOptions } from '@/lib/dialysis'

import MedCardRowActions from './components/med-card-row-actions.vue'

export const medCardColumnLabels: Record<string, string> = {
  id: '№',
  inn: 'ИНН',
  patientName: 'Пациент',
  tenantName: 'Мед центр',
  status: 'Статус',
  openedAt: 'Открыта',
  closedAt: 'Закрыта',
  notes: 'Примечания',
  actions: 'Действия',
}

export const medCardDefaultSorting: SortingState = [
  { id: 'openedAt', desc: true },
]

export const medCardDefaultColumnVisibility: VisibilityState = {
  notes: false,
}

export const medCardDefaultColumnPinning: ColumnPinningState = {
  left: ['select', 'id', 'inn'],
  right: ['actions'],
}

export function createMedCardColumns(opts: {
  canDelete: boolean
  canUpdate: boolean
  onDelete: (row: MedCardGridRow) => void
  onEdit: (row: MedCardGridRow) => void
  onView: (row: MedCardGridRow) => void
}): ColumnDef<MedCardGridRow>[] {
  const columns: ColumnDef<MedCardGridRow>[] = [
    {
      accessorKey: 'id',
      id: 'id',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCardGridRow>, { column, title: '№' }),
      cell: ({ row }) => h('div', { class: 'font-medium tabular-nums' }, row.original.id),
      size: 80,
      minSize: 72,
      maxSize: 110,
    },
    {
      accessorKey: 'inn',
      id: 'inn',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCardGridRow>, { column, title: 'ИНН' }),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs tabular-nums' }, row.original.inn),
      size: 150,
      minSize: 135,
    },
    {
      accessorKey: 'patientName',
      id: 'patientName',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCardGridRow>, { column, title: 'Пациент' }),
      cell: ({ row }) => h('div', { class: 'truncate font-medium' }, row.original.patientName),
      size: 240,
      minSize: 190,
      maxSize: 360,
    },
    {
      accessorKey: 'tenantName',
      id: 'tenantName',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCardGridRow>, { column, title: 'Мед центр' }),
      cell: ({ row }) => row.original.tenantName ?? '-',
      size: 190,
      minSize: 150,
    },
    {
      accessorKey: 'status',
      id: 'status',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCardGridRow>, { column, title: 'Статус' }),
      cell: ({ row }) => {
        const status = row.original.status
        const option = medCardStatusOptions.find(item => item.value === status)
        return h(Badge, { variant: 'secondary' }, () => option?.label ?? String(status))
      },
      size: 125,
      minSize: 110,
    },
    {
      accessorKey: 'openedAt',
      id: 'openedAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCardGridRow>, { column, title: 'Открыта' }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDateTime(row.original.openedAt)),
      size: 175,
      minSize: 150,
    },
    {
      accessorKey: 'closedAt',
      id: 'closedAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCardGridRow>, { column, title: 'Закрыта' }),
      cell: ({ row }) => row.original.closedAt
        ? h('span', { class: 'tabular-nums' }, formatDateTime(row.original.closedAt))
        : '-',
      size: 175,
      minSize: 150,
    },
    {
      accessorKey: 'notes',
      id: 'notes',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCardGridRow>, { column, title: 'Примечания' }),
      cell: ({ row }) => h('span', { class: 'block truncate' }, row.original.notes ?? '-'),
      enableSorting: false,
      size: 220,
      minSize: 160,
    },
    {
      id: 'actions',
      header: () => h('span', { class: 'block text-right' }, 'Действия'),
      cell: ({ row }) => h(MedCardRowActions, {
        medCard: row.original,
        canUpdate: opts.canUpdate,
        canDelete: opts.canDelete,
        onView: opts.onView,
        onEdit: opts.onEdit,
        onDelete: opts.onDelete,
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

  return columns
}

export const medCardFilterFields = [
  {
    field: 'inn',
    label: 'ИНН',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'tenantName',
    label: 'Мед центр',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'patientName',
    label: 'ФИО пациента',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'status',
    label: 'Статус',
    type: 'select' as const,
    operators: ['equals', 'notEquals'] as const,
    options: medCardStatusOptions.map(item => ({ value: String(item.value), label: item.label })),
  },
  {
    field: 'openedAt',
    label: 'Открыта',
    type: 'date' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'] as const,
  },
  {
    field: 'closedAt',
    label: 'Закрыта',
    type: 'date' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'isEmpty', 'isNotEmpty'] as const,
  },
]

export const medCardGroupOptions = [
  { field: 'status', label: 'Статус' },
  { field: 'inn', label: 'ИНН' },
  { field: 'tenantName', label: 'Мед центр' },
]

export const medCardExportColumns: ServerDataGridExportColumn<MedCardGridRow>[] = [
  { id: 'inn', label: 'ИНН', width: 18, value: row => row.inn },
  { id: 'patientName', label: 'Пациент', width: 25, value: row => row.patientName },
  { id: 'tenantName', label: 'Мед центр', width: 20, value: row => row.tenantName ?? '' },
  { id: 'status', label: 'Статус', width: 15, value: row => medCardStatusOptions.find(s => s.value === row.status)?.label ?? String(row.status) },
  { id: 'openedAt', label: 'Открыта', width: 22, value: row => row.openedAt },
  { id: 'closedAt', label: 'Закрыта', width: 22, value: row => row.closedAt ?? '' },
  { id: 'notes', label: 'Примечания', width: 25, value: row => row.notes ?? '' },
]

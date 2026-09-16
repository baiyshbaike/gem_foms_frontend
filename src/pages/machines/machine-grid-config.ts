import type { ColumnDef, ColumnPinningState, SortingState, VisibilityState } from '@tanstack/vue-table'

import { h } from 'vue'

import type { ServerDataGridExportColumn } from '@/components/server-data-grid'
import type { MachineAcquisitionTypeDto, MedCenterMachineGridRow } from '@/services/types/dialysis'

import { ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { acquisitionTypeOptions, formatDate } from '@/lib/dialysis'

import MachineRowActions from './components/machine-row-actions.vue'

export const machineColumnLabels: Record<string, string> = {
  tenantId: 'Мед. центр',
  name: 'Наименование',
  model: 'Модель',
  serialNumber: 'Серийный номер',
  inventoryNumber: 'Инвентарный номер',
  manufacturer: 'Производитель',
  manufacturingCountry: 'Страна',
  manufactureYear: 'Год',
  acquisitionType: 'Приобретение',
  dailySessionLimit: 'Дневной лимит',
  betweenSessionCooldownMinutes: 'Пауза (мин)',
  dailyLimitCooldownMinutes: 'После лимита (мин)',
  certificateIssuedAt: 'Сертификат выдан',
  permitExpiresAt: 'Разрешение истекает',
  isApproved: 'Одобрен',
  isActive: 'Активен',
  permitName: 'Разрешение',
  permitNumber: 'Номер разрешения',
  permitSeries: 'Серия разрешения',
  actions: 'Действия',
}

export const machineDefaultSorting: SortingState = [
  { id: 'name', desc: false },
]

export const machineDefaultColumnVisibility: VisibilityState = {
  tenantId: false,
  manufacturingCountry: false,
  permitName: false,
  permitNumber: false,
  permitSeries: false,
  dailyLimitCooldownMinutes: false,
}

export const machineDefaultColumnPinning: ColumnPinningState = {
  left: ['select', 'name'],
  right: ['actions'],
}

export function createMachineColumns(opts: {
  canDelete: boolean
  canUpdate: boolean
  onDelete: (row: MedCenterMachineGridRow) => void
  onEdit: (row: MedCenterMachineGridRow) => void
}): ColumnDef<MedCenterMachineGridRow>[] {
  return [
    {
      accessorKey: 'tenantId',
      id: 'tenantId',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Мед. центр', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'truncate font-medium' }, row.original.tenantName ?? row.original.tenantId),
      size: 260,
      minSize: 200,
    },
    {
      accessorKey: 'name',
      id: 'name',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Наименование', multiSort: true }),
      cell: ({ row }) => h('div', { class: 'truncate font-medium' }, row.original.name),
      size: 220,
      minSize: 180,
      maxSize: 360,
    },
    {
      accessorKey: 'model',
      id: 'model',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Модель', multiSort: true }),
      cell: ({ row }) => row.original.model,
      size: 150,
      minSize: 125,
    },
    {
      accessorKey: 'manufacturer',
      id: 'manufacturer',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Производитель', multiSort: true }),
      cell: ({ row }) => row.original.manufacturer,
      size: 170,
      minSize: 140,
    },
    {
      accessorKey: 'manufacturingCountry',
      id: 'manufacturingCountry',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Страна', multiSort: true }),
      cell: ({ row }) => row.original.manufacturingCountry ?? '-',
      size: 130,
      minSize: 110,
    },
    {
      accessorKey: 'serialNumber',
      id: 'serialNumber',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Серийный', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs tabular-nums' }, row.original.serialNumber),
      size: 150,
      minSize: 130,
    },
    {
      accessorKey: 'inventoryNumber',
      id: 'inventoryNumber',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Инвентарный', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs tabular-nums' }, row.original.inventoryNumber),
      size: 155,
      minSize: 150,
    },
    {
      accessorKey: 'acquisitionType',
      id: 'acquisitionType',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Приобретение', multiSort: true }),
      cell: ({ row }) => {
        const value = row.original.acquisitionType as MachineAcquisitionTypeDto
        const option = acquisitionTypeOptions.find(item => item.value === value)
        return option?.label ?? String(value)
      },
      size: 165,
      minSize: 160,
    },
    {
      accessorKey: 'manufactureYear',
      id: 'manufactureYear',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Год', multiSort: true }),
      cell: ({ row }) => String(row.original.manufactureYear),
      size: 95,
      minSize: 90,
    },
    {
      accessorKey: 'dailySessionLimit',
      id: 'dailySessionLimit',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Дневной лимит', multiSort: true }),
      cell: ({ row }) => String(row.original.dailySessionLimit),
      size: 170,
      minSize: 165,
    },
    {
      accessorKey: 'betweenSessionCooldownMinutes',
      id: 'betweenSessionCooldownMinutes',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Пауза', multiSort: true }),
      cell: ({ row }) => `${row.original.betweenSessionCooldownMinutes}м`,
      size: 105,
      minSize: 100,
    },
    {
      accessorKey: 'dailyLimitCooldownMinutes',
      id: 'dailyLimitCooldownMinutes',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'После лимита', multiSort: true }),
      cell: ({ row }) => `${row.original.dailyLimitCooldownMinutes}м`,
      size: 125,
      minSize: 110,
    },
    {
      accessorKey: 'certificateIssuedAt',
      id: 'certificateIssuedAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Сертификат', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDate(row.original.certificateIssuedAt)),
      size: 140,
      minSize: 135,
    },
    {
      accessorKey: 'permitExpiresAt',
      id: 'permitExpiresAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Разрешение до', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDate(row.original.permitExpiresAt)),
      size: 145,
      minSize: 125,
    },
    {
      accessorKey: 'permitName',
      id: 'permitName',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Разрешение', multiSort: true }),
      cell: ({ row }) => row.original.permitName ?? '-',
      size: 180,
      minSize: 140,
    },
    {
      accessorKey: 'permitNumber',
      id: 'permitNumber',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Номер разрешения', multiSort: true }),
      cell: ({ row }) => row.original.permitNumber ?? '-',
      size: 160,
      minSize: 135,
    },
    {
      accessorKey: 'permitSeries',
      id: 'permitSeries',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Серия разрешения', multiSort: true }),
      cell: ({ row }) => row.original.permitSeries ?? '-',
      size: 150,
      minSize: 125,
    },
    {
      accessorKey: 'isApproved',
      id: 'isApproved',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Одобрен', multiSort: true }),
      cell: ({ row }) => h(Badge, { variant: row.original.isApproved ? 'default' : 'secondary' }, () => row.original.isApproved ? 'Да' : 'Нет'),
      size: 105,
      minSize: 95,
    },
    {
      accessorKey: 'isActive',
      id: 'isActive',
      header: ({ column }) => h(ServerDataGridColumnHeader<MedCenterMachineGridRow>, { column, title: 'Активен', multiSort: true }),
      cell: ({ row }) => h(Badge, { variant: row.original.isActive ? 'default' : 'secondary' }, () => row.original.isActive ? 'Активен' : 'Неактивен'),
      size: 100,
      minSize: 90,
    },
    {
      id: 'actions',
      header: () => h('span', { class: 'block text-right' }, 'Действия'),
      cell: ({ row }) => h(MachineRowActions, {
        machine: row.original,
        canUpdate: opts.canUpdate,
        canDelete: opts.canDelete,
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
}

export const machineFilterFields = [
  {
    field: 'name',
    label: 'Наименование',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'model',
    label: 'Модель',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'serialNumber',
    label: 'Серийный номер',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'inventoryNumber',
    label: 'Инвентарный номер',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'manufacturer',
    label: 'Производитель',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'manufacturingCountry',
    label: 'Страна',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith', 'isEmpty', 'isNotEmpty'] as const,
  },
  {
    field: 'acquisitionType',
    label: 'Приобретение',
    type: 'select' as const,
    operators: ['equals', 'notEquals'] as const,
    options: acquisitionTypeOptions.map(item => ({ value: String(item.value), label: item.label })),
  },
  {
    field: 'manufactureYear',
    label: 'Год',
    type: 'number' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'] as const,
  },
  {
    field: 'dailySessionLimit',
    label: 'Дневной лимит',
    type: 'number' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'] as const,
  },
  {
    field: 'betweenSessionCooldownMinutes',
    label: 'Пауза (мин)',
    type: 'number' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'] as const,
  },
  {
    field: 'dailyLimitCooldownMinutes',
    label: 'После лимита (мин)',
    type: 'number' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'] as const,
  },
  {
    field: 'certificateIssuedAt',
    label: 'Сертификат выдан',
    type: 'date' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'] as const,
  },
  {
    field: 'permitExpiresAt',
    label: 'Разрешение истекает',
    type: 'date' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'] as const,
  },
  {
    field: 'isApproved',
    label: 'Одобрен',
    type: 'select' as const,
    operators: ['equals'] as const,
    options: [{ value: 'true', label: 'Да' }, { value: 'false', label: 'Нет' }],
  },
  {
    field: 'isActive',
    label: 'Активен',
    type: 'select' as const,
    operators: ['equals'] as const,
    options: [{ value: 'true', label: 'Активен' }, { value: 'false', label: 'Неактивен' }],
  },
  {
    field: 'permitName',
    label: 'Разрешение',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith', 'isEmpty', 'isNotEmpty'] as const,
  },
  {
    field: 'permitNumber',
    label: 'Номер разрешения',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith', 'isEmpty', 'isNotEmpty'] as const,
  },
  {
    field: 'permitSeries',
    label: 'Серия разрешения',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith', 'isEmpty', 'isNotEmpty'] as const,
  },
]

export const machineGroupOptions = [
  { field: 'isApproved', label: 'Одобрен' },
  { field: 'isActive', label: 'Активен' },
  { field: 'acquisitionType', label: 'Приобретение' },
]

export const machineExportColumns: ServerDataGridExportColumn<MedCenterMachineGridRow>[] = [
  { id: 'tenantId', label: 'Мед. центр', width: 25, value: row => row.tenantName ?? row.tenantId },
  { id: 'name', label: 'Наименование', width: 25, value: row => row.name },
  { id: 'model', label: 'Модель', width: 18, value: row => row.model },
  { id: 'serialNumber', label: 'Серийный номер', width: 18, value: row => row.serialNumber },
  { id: 'inventoryNumber', label: 'Инвентарный номер', width: 15, value: row => row.inventoryNumber },
  { id: 'manufacturer', label: 'Производитель', width: 20, value: row => row.manufacturer },
  { id: 'manufacturingCountry', label: 'Страна', width: 15, value: row => row.manufacturingCountry ?? '' },
  { id: 'manufactureYear', label: 'Год', width: 10, value: row => row.manufactureYear },
  { id: 'acquisitionType', label: 'Приобретение', width: 15, value: row => acquisitionTypeOptions.find(o => o.value === row.acquisitionType)?.label ?? String(row.acquisitionType) },
  { id: 'dailySessionLimit', label: 'Дневной лимит', width: 12, value: row => row.dailySessionLimit },
  { id: 'betweenSessionCooldownMinutes', label: 'Пауза (мин)', width: 15, value: row => row.betweenSessionCooldownMinutes },
  { id: 'dailyLimitCooldownMinutes', label: 'После лимита (мин)', width: 15, value: row => row.dailyLimitCooldownMinutes },
  { id: 'certificateIssuedAt', label: 'Сертификат выдан', width: 18, value: row => row.certificateIssuedAt },
  { id: 'permitExpiresAt', label: 'Разрешение истекает', width: 18, value: row => row.permitExpiresAt },
  { id: 'isApproved', label: 'Одобрен', width: 12, value: row => row.isApproved ? 'Да' : 'Нет' },
  { id: 'isActive', label: 'Активен', width: 10, value: row => row.isActive ? 'Активен' : 'Неактивен' },
]

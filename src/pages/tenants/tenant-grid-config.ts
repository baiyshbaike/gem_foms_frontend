import type {
  ColumnDef,
  ColumnPinningState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'

import { h } from 'vue'

import type {
  ServerDataGridExportColumn,
  ServerDataGridFilterField,
  ServerDataGridGroupOption,
} from '@/components/server-data-grid'
import type {
  Region,
  TenantGridRow,
} from '@/services/types/dialysis'

import { ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/dialysis'

import TenantRowActions from './components/tenant-row-actions.vue'

interface CreateTenantColumnsOptions {
  disableActions: boolean
  onDeactivate: (tenant: TenantGridRow) => void
  onEdit: (tenant: TenantGridRow) => void
}

export const tenantColumnLabels: Record<string, string> = {
  id: 'ID',
  code: 'Код',
  name: 'Наименование',
  regionId: 'Регион ID',
  regionName: 'Регион',
  districtId: 'Район ID',
  districtName: 'Район',
  address: 'Адрес',
  phone: 'Телефон',
  isActive: 'Активен',
  createdAt: 'Зарегистрирован',
  disabledAt: 'Отключён',
  actions: 'Действия',
}

export const tenantDefaultColumnVisibility: VisibilityState = {
  address: false,
  disabledAt: false,
  regionId: false,
  id: false,
  phone: false,
}

export const tenantDefaultColumnPinning: ColumnPinningState = {
  left: ['select', 'code'],
  right: ['actions'],
}

export const tenantDefaultSorting: SortingState = [
  { id: 'name', desc: false },
]

export const tenantGroupOptions: ServerDataGridGroupOption[] = [
  { field: 'regionName', label: 'Регион' },
  { field: 'districtName', label: 'Район' },
  { field: 'isActive', label: 'Активность' },
]

export const tenantExportColumns: ServerDataGridExportColumn<TenantGridRow>[] = [
  { id: 'id', label: 'ID', width: 34, value: tenant => tenant.id },
  { id: 'code', label: 'Код', width: 16, value: tenant => tenant.code },
  { id: 'name', label: 'Наименование', width: 34, value: tenant => tenant.name },
  { id: 'regionName', label: 'Регион', width: 28, value: tenant => tenant.regionName },
  { id: 'districtName', label: 'Район', width: 28, value: tenant => tenant.districtName },
  { id: 'address', label: 'Адрес', width: 42, value: tenant => tenant.address },
  { id: 'phone', label: 'Телефон', width: 20, value: tenant => tenant.phone },
  { id: 'isActive', label: 'Активен', width: 12, value: tenant => tenant.isActive ? 'Да' : 'Нет' },
  { id: 'createdAt', label: 'Зарегистрирован', width: 22, value: tenant => tenant.createdAt },
  { id: 'disabledAt', label: 'Отключён', width: 22, value: tenant => tenant.disabledAt },
]

export function createTenantColumns(options: CreateTenantColumnsOptions): ColumnDef<TenantGridRow>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => h(ServerDataGridColumnHeader<TenantGridRow>, { column, title: 'ID', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs' }, row.original.id),
      size: 280,
      minSize: 220,
    },
    {
      accessorKey: 'code',
      header: ({ column }) => h(ServerDataGridColumnHeader<TenantGridRow>, { column, title: 'Код', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs font-semibold tracking-normal' }, row.original.code),
      size: 125,
      minSize: 110,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => h(ServerDataGridColumnHeader<TenantGridRow>, { column, title: 'Наименование', multiSort: true }),
      cell: ({ row }) => h('div', { class: 'grid min-w-0 py-0.5' }, [
        h('span', { class: 'truncate font-medium text-foreground' }, row.original.name),
        h('span', { class: 'truncate text-xs text-muted-foreground' }, row.original.address || 'Нет адреса'),
      ]),
      size: 280,
      minSize: 220,
      maxSize: 440,
    },
    {
      accessorKey: 'regionName',
      header: ({ column }) => h(ServerDataGridColumnHeader<TenantGridRow>, { column, title: 'Регион', multiSort: true }),
      size: 190,
      minSize: 160,
    },
    {
      accessorKey: 'districtName',
      header: ({ column }) => h(ServerDataGridColumnHeader<TenantGridRow>, { column, title: 'Район', multiSort: true }),
      size: 185,
      minSize: 150,
    },
    {
      accessorKey: 'address',
      header: ({ column }) => h(ServerDataGridColumnHeader<TenantGridRow>, { column, title: 'Адрес', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'block truncate' }, row.original.address || '-'),
      size: 300,
      minSize: 200,
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => h(ServerDataGridColumnHeader<TenantGridRow>, { column, title: 'Телефон', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, row.original.phone || '-'),
      size: 155,
      minSize: 135,
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => h(ServerDataGridColumnHeader<TenantGridRow>, { column, title: 'Активен', multiSort: true }),
      cell: ({ row }) => h(Badge, {
        variant: row.original.isActive ? 'outline' : 'secondary',
        class: row.original.isActive ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400' : '',
      }, () => row.original.isActive ? 'Активен' : 'Неактивен'),
      size: 105,
      minSize: 96,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<TenantGridRow>, { column, title: 'Зарегистрирован', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDateTime(row.original.createdAt)),
      size: 175,
      minSize: 155,
    },
    {
      accessorKey: 'disabledAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<TenantGridRow>, { column, title: 'Отключён', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDateTime(row.original.disabledAt)),
      size: 175,
      minSize: 155,
    },
    {
      id: 'actions',
      header: () => h('span', { class: 'block text-right' }, 'Действия'),
      cell: ({ row }) => h(TenantRowActions, {
        tenant: row.original,
        disabled: options.disableActions,
        onEdit: options.onEdit,
        onDeactivate: options.onDeactivate,
      }),
      enableHiding: false,
      enablePinning: true,
      enableResizing: false,
      enableSorting: false,
      size: 80,
      minSize: 72,
      maxSize: 88,
    },
  ]
}

export function createTenantFilterFields(
  regions: Region[],
): ServerDataGridFilterField[] {
  const districts = regions.flatMap(region => region.districts.map(district => ({
    label: `${district.name} (${region.name})`,
    value: String(district.id),
  })))

  return [
    { field: 'code', label: 'Код', type: 'text' },
    { field: 'name', label: 'Наименование', type: 'text' },
    { field: 'address', label: 'Адрес', type: 'text' },
    { field: 'phone', label: 'Телефон', type: 'text' },
    {
      field: 'regionId',
      label: 'Регион',
      type: 'select',
      options: regions.map(region => ({ label: region.name, value: String(region.id) })),
    },
    { field: 'districtId', label: 'Район', type: 'select', options: districts },
    {
      field: 'isActive',
      label: 'Активность',
      type: 'select',
      options: [
        { label: 'Активен', value: 'true' },
        { label: 'Неактивен', value: 'false' },
      ],
    },
    { field: 'createdAt', label: 'Дата регистрации', type: 'date' },
    { field: 'disabledAt', label: 'Дата отключения', type: 'date' },
  ]
}

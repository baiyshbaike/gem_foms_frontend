import type { ColumnDef, ColumnPinningState, SortingState, VisibilityState } from '@tanstack/vue-table'

import { h } from 'vue'

import type { ServerDataGridQueryRequest } from '@/components/server-data-grid'
import type {
  AccRegGridExportRequest,
  AccRegGridQueryRequest,
  AccRegGridRow,
  AccRegStatusFilter,
  AccRegSummary,
} from '@/services/types/dialysis'

import { ServerDataGridColumnHeader } from '@/components/server-data-grid'

export const ALL_TENANTS = '__all__'

export const accRegStatusOptions: { value: AccRegStatusFilter, label: string }[] = [
  { value: 'All', label: 'Все' },
  { value: 'SentToPay', label: 'К оплате' },
  { value: 'Paid', label: 'Оплачено' },
]

export const accRegColumnLabels: Record<string, string> = {
  tenantName: 'Мед. центр',
  orderNo: '№',
  fullName: 'ФИО',
  inn: 'ИНН',
  sessionCount: 'Сеансы',
  totalPrice: 'Счет',
}

export const accRegDefaultSorting: SortingState = [
  { id: 'fullName', desc: false },
]

export const accRegDefaultColumnVisibility: VisibilityState = {}

export const accRegDefaultColumnPinning: ColumnPinningState = {
  left: ['select', 'orderNo', 'fullName'],
  right: [],
}

export function emptyAccRegSummary(): AccRegSummary {
  return {
    patientCount: 0,
    sessionCount: 0,
    totalPrice: 0,
  }
}

export interface AccRegGridFilters {
  canFilterTenants: boolean
  tenantId: string
  fromDate: string
  toDate: string
  status: AccRegStatusFilter
}

export function createAccRegColumns(): ColumnDef<AccRegGridRow>[] {
  return [
    {
      accessorKey: 'tenantName',
      id: 'tenantName',
      header: ({ column }) => h(ServerDataGridColumnHeader<AccRegGridRow>, { column, title: 'Мед. центр', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'truncate font-medium' }, row.original.tenantName),
      size: 240,
      minSize: 180,
    },
    {
      accessorKey: 'orderNo',
      id: 'orderNo',
      header: ({ column }) => h(ServerDataGridColumnHeader<AccRegGridRow>, { column, title: '№', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'block text-center tabular-nums' }, String(row.original.orderNo)),
      size: 72,
      minSize: 64,
      maxSize: 80,
    },
    {
      accessorKey: 'fullName',
      id: 'fullName',
      header: ({ column }) => h(ServerDataGridColumnHeader<AccRegGridRow>, { column, title: 'ФИО', multiSort: true }),
      cell: ({ row }) => h('div', { class: 'truncate font-medium' }, row.original.fullName),
      size: 300,
      minSize: 220,
    },
    {
      accessorKey: 'inn',
      id: 'inn',
      header: ({ column }) => h(ServerDataGridColumnHeader<AccRegGridRow>, { column, title: 'ИНН', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs tabular-nums' }, row.original.inn),
      size: 170,
      minSize: 150,
    },
    {
      accessorKey: 'sessionCount',
      id: 'sessionCount',
      header: ({ column }) => h(ServerDataGridColumnHeader<AccRegGridRow>, { column, title: 'Сеансы', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'block text-right tabular-nums' }, formatInteger(row.original.sessionCount)),
      size: 120,
      minSize: 110,
    },
    {
      accessorKey: 'totalPrice',
      id: 'totalPrice',
      header: ({ column }) => h(ServerDataGridColumnHeader<AccRegGridRow>, { column, title: 'Счет', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'block text-right font-medium tabular-nums' }, formatMoney(row.original.totalPrice)),
      size: 160,
      minSize: 145,
    },
  ]
}

export function buildAccRegGridRequest(
  request: ServerDataGridQueryRequest,
  filters: AccRegGridFilters,
): AccRegGridQueryRequest {
  return {
    ...request,
    tenantIds: filters.canFilterTenants && filters.tenantId !== ALL_TENANTS ? [filters.tenantId] : [],
    fromDate: filters.fromDate || null,
    toDate: filters.toDate || null,
    status: filters.status,
  }
}

export function createAccRegExportRequest(
  filters: AccRegGridFilters,
  selectedIds: string[],
  search: string | null,
): AccRegGridExportRequest {
  return {
    page: 1,
    pageSize: 100,
    search,
    sorting: accRegDefaultSorting.map(item => ({
      field: item.id,
      descending: item.desc,
    })),
    filters: [],
    groupBy: null,
    tenantIds: filters.canFilterTenants && filters.tenantId !== ALL_TENANTS ? [filters.tenantId] : [],
    fromDate: filters.fromDate || null,
    toDate: filters.toDate || null,
    status: filters.status,
    selectedIds,
  }
}

export function summarizeAccRegRows(rows: AccRegGridRow[]): AccRegSummary {
  return {
    patientCount: rows.length,
    sessionCount: rows.reduce((sum, row) => sum + row.sessionCount, 0),
    totalPrice: rows.reduce((sum, row) => sum + row.totalPrice, 0),
  }
}

export function currentMonthDateRange(now = new Date()) {
  const year = now.getFullYear()
  const month = now.getMonth()
  return {
    fromDate: toDateInputValue(new Date(year, month, 1)),
    toDate: toDateInputValue(now),
  }
}

export function accRegExportFileName(extension: 'xlsx' | 'docx', fromDate: string, toDate: string) {
  const suffix = fromDate && toDate ? `${fromDate}_${toDate}` : new Date().toISOString().slice(0, 10)
  return `accreg-${suffix}.${extension}`
}

export function formatInteger(value: number) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)
}

export function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} сом`
}

export function formatAccRegDate(value: string | null) {
  if (!value) {
    return 'Не указан'
  }

  const [year, month, day] = value.split('-')
  return `${day}.${month}.${year}`
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

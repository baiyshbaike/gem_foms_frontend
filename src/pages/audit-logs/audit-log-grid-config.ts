import type { ColumnDef, ColumnPinningState, SortingState, VisibilityState } from '@tanstack/vue-table'

import { h } from 'vue'

import type { ServerDataGridExportColumn } from '@/components/server-data-grid'
import type { AuditLogGridRow } from '@/services/types/dialysis'

import { ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/dialysis'

export const auditLogColumnLabels: Record<string, string> = {
  id: 'ID',
  createdAt: 'Время',
  usernameSnapshot: 'Пользователь',
  action: 'Действие',
  module: 'Модуль',
  succeeded: 'Результат',
  statusCode: 'Статус',
  entityName: 'Сущность',
  entityId: 'ID сущности',
  httpMethod: 'Метод',
  path: 'Путь',
  ipAddress: 'IP',
  failureReason: 'Причина ошибки',
  correlationId: 'Correlation ID',
}

export const auditLogDefaultSorting: SortingState = [
  { id: 'id', desc: true },
]

export const auditLogDefaultColumnVisibility: VisibilityState = {
  entityId: false,
  correlationId: false,
  path: false,
  httpMethod: false,
  statusCode: false,
}

export const auditLogDefaultColumnPinning: ColumnPinningState = {
  left: ['select', 'id'],
  right: [],
}

export function createAuditLogColumns(): ColumnDef<AuditLogGridRow>[] {
  return [
    {
      accessorKey: 'id',
      id: 'id',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'ID', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs' }, row.original.id),
      size: 80,
      minSize: 70,
    },
    {
      accessorKey: 'createdAt',
      id: 'createdAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'Время', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDateTime(row.original.createdAt)),
      size: 190,
      minSize: 170,
    },
    {
      accessorKey: 'usernameSnapshot',
      id: 'usernameSnapshot',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'Пользователь', multiSort: true }),
      cell: ({ row }) => row.original.usernameSnapshot ?? '-',
      size: 165,
      minSize: 135,
    },
    {
      accessorKey: 'action',
      id: 'action',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'Действие', multiSort: true }),
      cell: ({ row }) => row.original.action,
      size: 145,
      minSize: 120,
    },
    {
      accessorKey: 'module',
      id: 'module',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'Модуль', multiSort: true }),
      cell: ({ row }) => row.original.module,
      size: 125,
      minSize: 110,
    },
    {
      accessorKey: 'succeeded',
      id: 'succeeded',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'Результат', multiSort: true }),
      cell: ({ row }) => h(Badge, { variant: row.original.succeeded ? 'default' : 'destructive' }, () => row.original.succeeded ? 'Успех' : 'Ошибка'),
      size: 110,
      minSize: 95,
    },
    {
      accessorKey: 'statusCode',
      id: 'statusCode',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'Статус', multiSort: true }),
      cell: ({ row }) => row.original.statusCode ?? '-',
      size: 90,
      minSize: 80,
    },
    {
      accessorKey: 'entityName',
      id: 'entityName',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'Сущность', multiSort: true }),
      cell: ({ row }) => row.original.entityName ?? '-',
      size: 145,
      minSize: 120,
    },
    {
      accessorKey: 'entityId',
      id: 'entityId',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'ID сущности', multiSort: true }),
      cell: ({ row }) => row.original.entityId ?? '-',
      size: 115,
      minSize: 100,
    },
    {
      accessorKey: 'httpMethod',
      id: 'httpMethod',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'Метод', multiSort: true }),
      cell: ({ row }) => row.original.httpMethod ?? '-',
      size: 90,
      minSize: 80,
    },
    {
      accessorKey: 'path',
      id: 'path',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'Путь', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'block truncate' }, row.original.path ?? '-'),
      size: 240,
      minSize: 180,
    },
    {
      accessorKey: 'ipAddress',
      id: 'ipAddress',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'IP', multiSort: true }),
      cell: ({ row }) => row.original.ipAddress ?? '-',
      size: 145,
      minSize: 120,
    },
    {
      accessorKey: 'failureReason',
      id: 'failureReason',
      header: ({ column }) => h(ServerDataGridColumnHeader<AuditLogGridRow>, { column, title: 'Причина ошибки', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'block truncate' }, row.original.failureReason ?? '-'),
      size: 240,
      minSize: 180,
    },
  ]
}

export const auditLogFilterFields = [
  {
    field: 'action',
    label: 'Действие',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'module',
    label: 'Модуль',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'usernameSnapshot',
    label: 'Пользователь',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith', 'isEmpty', 'isNotEmpty'] as const,
  },
  {
    field: 'succeeded',
    label: 'Результат',
    type: 'select' as const,
    operators: ['equals'] as const,
    options: [
      { value: 'true', label: 'Успех' },
      { value: 'false', label: 'Ошибка' },
    ],
  },
  {
    field: 'statusCode',
    label: 'HTTP статус',
    type: 'number' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'isEmpty', 'isNotEmpty'] as const,
  },
  {
    field: 'createdAt',
    label: 'Время',
    type: 'date' as const,
    operators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'] as const,
  },
  {
    field: 'entityName',
    label: 'Сущность',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith', 'isEmpty', 'isNotEmpty'] as const,
  },
  {
    field: 'httpMethod',
    label: 'Метод',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith', 'isEmpty', 'isNotEmpty'] as const,
  },
  {
    field: 'ipAddress',
    label: 'IP адрес',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith', 'isEmpty', 'isNotEmpty'] as const,
  },
]

export const auditLogGroupOptions = [
  { field: 'module', label: 'Модуль' },
  { field: 'succeeded', label: 'Результат' },
  { field: 'action', label: 'Действие' },
]

export const auditLogExportColumns: ServerDataGridExportColumn<AuditLogGridRow>[] = [
  { id: 'id', label: 'ID', width: 10, value: row => row.id },
  { id: 'createdAt', label: 'Время', width: 20, value: row => row.createdAt },
  { id: 'usernameSnapshot', label: 'Пользователь', width: 20, value: row => row.usernameSnapshot ?? '' },
  { id: 'action', label: 'Действие', width: 18, value: row => row.action },
  { id: 'module', label: 'Модуль', width: 15, value: row => row.module },
  { id: 'succeeded', label: 'Результат', width: 12, value: row => row.succeeded ? 'Успех' : 'Ошибка' },
  { id: 'statusCode', label: 'Статус', width: 10, value: row => row.statusCode ?? '' },
  { id: 'entityName', label: 'Сущность', width: 18, value: row => row.entityName ?? '' },
  { id: 'entityId', label: 'ID сущности', width: 15, value: row => row.entityId ?? '' },
  { id: 'httpMethod', label: 'Метод', width: 10, value: row => row.httpMethod ?? '' },
  { id: 'path', label: 'Путь', width: 30, value: row => row.path ?? '' },
  { id: 'ipAddress', label: 'IP', width: 18, value: row => row.ipAddress ?? '' },
  { id: 'failureReason', label: 'Причина ошибки', width: 30, value: row => row.failureReason ?? '' },
]

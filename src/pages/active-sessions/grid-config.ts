import type { ColumnDef, ColumnPinningState, SortingState } from '@tanstack/vue-table'

import { h } from 'vue'

import type { ServerDataGridExportColumn } from '@/components/server-data-grid'
import type { MeasurementPoint, MeasurementPointTarget } from '@/components/session-measurement/types'
import type { SessionGridRow } from '@/services/types/dialysis'

import { ServerDataGridColumnHeader } from '@/components/server-data-grid'
import MeasurementPointCell from '@/components/session-measurement/measurement-point-cell.vue'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/dialysis'

import {
  getStatusBadgeVariant,
  sessionStatusLabels,
} from '../sessions/session-grid-config'
import ActiveSessionRowActions from './row-actions.vue'

export const activeSessionStatuses = ['Identified', 'Started', 'Paused', 'IdentificationExpired']

export const activeSessionPoints: MeasurementPoint[] = ['Start', 'Hour1', 'Hour2', 'Hour3', 'Hour4', 'End']

export function canFinishRow(row: SessionGridRow): boolean {
  const filled = row.filledMeasurementPoints
  if (!filled) {
    return row.status === 'Started'
  }

  return filled.includes('Start') && filled.includes('Hour1')
}

export const activeSessionColumnLabels: Record<string, string> = {
  id: 'ID',
  patientName: 'Пациент',
  machineName: 'Мед. Центр / Аппарат',
  status: 'Статус',
  measurements: 'Показатели',
  identifiedAt: 'Идентифицирован',
  startedAt: 'Начат',
}

export const activeSessionDefaultSorting: SortingState = [
  { id: 'identifiedAt', desc: true },
]

export const activeSessionDefaultColumnPinning: ColumnPinningState = {
  left: ['select', 'id'],
  right: ['actions'],
}

export function createActiveSessionColumns(opts: {
  tenantNameMap: Record<string, string>
  onStart: (row: SessionGridRow) => void
  onPause: (row: SessionGridRow) => void
  onResume: (row: SessionGridRow) => void
  onFinish: (row: SessionGridRow) => void
  onAdjustStartTime: (row: SessionGridRow) => void
  onArchive: (row: SessionGridRow) => void
  onSelectMeasurement: (target: MeasurementPointTarget) => void
  canStart: boolean
  canPause: boolean
  canResume: boolean
  canFinish: boolean
  canAdjustTime: boolean
  canArchive: boolean
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
      cell: ({ row }) => {
        const patientName = row.original.patientName
        const patientInn = row.original.patientInn
        return h('div', { class: 'flex flex-col text-xs leading-tight' }, [
          h('span', { class: 'text-foreground font-medium truncate' }, patientName),
          h('span', { class: 'text-muted-foreground truncate' }, patientInn),
        ])
      },
      size: 220,
      minSize: 170,
    },
    {
      accessorKey: 'machineName',
      id: 'machineName',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Мед. Центр / Аппарат', multiSort: true }),
      cell: ({ row }) => {
        const tenantName = opts.tenantNameMap[row.original.tenantId] ?? row.original.tenantId
        const machineName = row.original.machineName
        return h('div', { class: 'flex flex-col text-xs leading-tight' }, [
          h('span', { class: 'text-foreground font-medium truncate' }, tenantName),
          h('span', { class: 'text-muted-foreground truncate' }, machineName ?? '—'),
        ])
      },
      size: 180,
      minSize: 150,
    },
    {
      accessorKey: 'status',
      id: 'status',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Статус', multiSort: true }),
      cell: ({ row }) => {
        const status = row.original.status
        return h(Badge, { variant: getStatusBadgeVariant(status) as any }, () => sessionStatusLabels[status] ?? status)
      },
      size: 100,
      minSize: 70,
    },
    {
      accessorKey: 'measurements',
      id: 'measurements',
      header: ({ column }) => h(ServerDataGridColumnHeader<SessionGridRow>, { column, title: 'Показатели', multiSort: false }),
      cell: ({ row }) => h(MeasurementPointCell, {
        sessionId: row.original.id,
        status: row.original.status,
        startedAt: row.original.startedAt,
        finishedAt: row.original.finishedAt,
        pauseMinutes: row.original.pauseMinutes,
        filledPoints: row.original.filledMeasurementPoints,
        points: activeSessionPoints,
        onSelect: (target: MeasurementPointTarget) => opts.onSelectMeasurement({ ...target, patientName: row.original.patientName, tenantId: row.original.tenantId }),
      }),
      enableSorting: false,
      enableHiding: true,
      enablePinning: true,
      enableResizing: false,
      size: 180,
      minSize: 160,
      maxSize: 200,
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
      id: 'actions',
      header: () => h('span', { class: '' }, 'Действия'),
      cell: ({ row }) => h(ActiveSessionRowActions, {
        session: row.original,
        canStart: opts.canStart,
        canPause: opts.canPause,
        canResume: opts.canResume,
        canFinish: opts.canFinish && canFinishRow(row.original),
        canAdjustTime: opts.canAdjustTime,
        canArchive: opts.canArchive,
        onStart: () => opts.onStart(row.original),
        onPause: () => opts.onPause(row.original),
        onResume: () => opts.onResume(row.original),
        onFinish: () => opts.onFinish(row.original),
        onAdjustStartTime: () => opts.onAdjustStartTime(row.original),
        onArchive: () => opts.onArchive(row.original),
      }),
      enableSorting: false,
      enableHiding: false,
      enablePinning: true,
      enableResizing: false,
      size: 60,
      minSize: 52,
      maxSize: 80,
    },
  ]
}

export const activeSessionFilterFields = [
  {
    field: 'status',
    label: 'Статус',
    type: 'select' as const,
    operators: ['equals', 'notEquals'] as const,
    options: [
      { value: 'Identified', label: 'Идентифицирован' },
      { value: 'Started', label: 'Начат' },
      { value: 'Paused', label: 'Приостановлен' },
      { value: 'IdentificationExpired', label: 'Идентификация просрочена' },
    ],
  },
  {
    field: 'patientName',
    label: 'Пациент',
    type: 'text' as const,
    operators: ['contains', 'equals', 'startsWith'] as const,
  },
  {
    field: 'machineName',
    label: 'Мед. Центр / Аппарат',
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
]

export const activeSessionExportColumns: ServerDataGridExportColumn<SessionGridRow>[] = [
  { id: 'id', label: 'ID', width: 10, value: row => row.id },
  { id: 'patientName', label: 'Пациент', width: 25, value: row => row.patientName },
  { id: 'patientInn', label: 'ИНН', width: 18, value: row => row.patientInn },
  { id: 'machineName', label: 'Аппарат', width: 20, value: row => row.machineName ?? '' },
  { id: 'status', label: 'Статус', width: 15, value: row => sessionStatusLabels[row.status] ?? row.status },
  { id: 'identifiedAt', label: 'Идентифицирован', width: 18, value: row => row.identifiedAt },
  { id: 'startedAt', label: 'Начат', width: 18, value: row => row.startedAt ?? '' },
]

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
  PatientGridRow,
  PatientGroup,
  Region,
} from '@/services/types/dialysis'

import { ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/dialysis'

import PatientRowActions from './patient-row-actions.vue'

interface CreatePatientColumnsOptions {
  canDelete: boolean
  canUpdate: boolean
  disableActions: boolean
  onDelete: (patient: PatientGridRow) => void
  onEdit: (patient: PatientGridRow) => void
}

export const patientColumnLabels: Record<string, string> = {
  id: 'ID',
  inn: 'ИНН',
  firstName: 'Имя',
  lastName: 'Фамилия',
  middleName: 'Отчество',
  fullName: 'ФИО',
  gender: 'Пол',
  birthDate: 'Дата рождения',
  phone: 'Телефон',
  regionId: 'Регион',
  regionName: 'Регион',
  districtId: 'Район',
  districtName: 'Район',
  groupId: 'Группа',
  groupName: 'Группа',
  specialStatus: 'Особый статус',
  specialStatusReasonId: 'Причина особого статуса',
  specialStatusReasonName: 'Причина особого статуса',
  isActive: 'Активен',
  createdAt: 'Зарегистрирован',
  updatedAt: 'Обновлён',
  address: 'Адрес регистрации',
  address2: 'Фактический адрес',
  actions: 'Действия',
}

export const patientDefaultColumnVisibility: VisibilityState = {
  address: false,
  address2: false,
  regionName: false,
  districtName: false,
  firstName: false,
  lastName: false,
  middleName: false,
  specialStatusReasonName: false,
  updatedAt: false,
}

export const patientDefaultColumnPinning: ColumnPinningState = {
  left: ['select', 'id', 'inn'],
  right: ['actions'],
}

export const patientDefaultSorting: SortingState = [
  { id: 'createdAt', desc: true },
]

export const patientGroupOptions: ServerDataGridGroupOption[] = [
  { field: 'regionName', label: 'Регион' },
  { field: 'districtName', label: 'Район' },
  { field: 'groupName', label: 'Группа пациента' },
  { field: 'gender', label: 'Пол' },
  { field: 'specialStatus', label: 'Особый статус' },
  { field: 'specialStatusReasonName', label: 'Причина особого статуса' },
  { field: 'isActive', label: 'Активность' },
]

export const patientExportColumns: ServerDataGridExportColumn<PatientGridRow>[] = [
  { id: 'id', label: 'ID', width: 10, value: patient => patient.id },
  { id: 'inn', label: 'ИНН', width: 18, value: patient => patient.inn },
  { id: 'fullName', label: 'ФИО', width: 34, value: patient => patient.fullName },
  { id: 'lastName', label: 'Фамилия', width: 22, value: patient => patient.lastName },
  { id: 'firstName', label: 'Имя', width: 22, value: patient => patient.firstName },
  { id: 'middleName', label: 'Отчество', width: 22, value: patient => patient.middleName },
  { id: 'gender', label: 'Пол', width: 12, value: patient => patient.gender === 1 ? 'Мужской' : 'Женский' },
  { id: 'birthDate', label: 'Дата рождения', width: 14, value: patient => patient.birthDate },
  { id: 'phone', label: 'Телефон', width: 20, value: patient => patient.phone },
  { id: 'regionName', label: 'Регион', width: 24, value: patient => patient.regionName },
  { id: 'districtName', label: 'Район', width: 24, value: patient => patient.districtName },
  { id: 'groupName', label: 'Группа', width: 16, value: patient => patient.groupName },
  { id: 'specialStatus', label: 'Особый статус', width: 12, value: patient => patient.specialStatus ? 'Да' : 'Нет' },
  { id: 'specialStatusReasonName', label: 'Причина особого статуса', width: 28, value: patient => patient.specialStatusReasonName ?? '' },
  { id: 'isActive', label: 'Активен', width: 12, value: patient => patient.isActive ? 'Да' : 'Нет' },
  { id: 'createdAt', label: 'Зарегистрирован', width: 22, value: patient => patient.createdAt },
  { id: 'updatedAt', label: 'Обновлён', width: 22, value: patient => patient.updatedAt },
  { id: 'address', label: 'Адрес регистрации', width: 40, value: patient => patient.address },
  { id: 'address2', label: 'Фактический адрес', width: 40, value: patient => patient.address2 },
]

export function createPatientColumns(options: CreatePatientColumnsOptions): ColumnDef<PatientGridRow>[] {
  const columns: ColumnDef<PatientGridRow>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'ID', multiSort: true }),
      size: 82,
      minSize: 72,
      maxSize: 120,
    },
    {
      accessorKey: 'inn',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'ИНН', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs tabular-nums' }, row.original.inn),
      size: 150,
      minSize: 140,
    },
    {
      accessorKey: 'fullName',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'ФИО', multiSort: true }),
      cell: ({ row }) => h('div', { class: 'grid min-w-0 py-0.5' }, [
        h('span', { class: 'truncate font-medium text-foreground' }, row.original.fullName),
        h('span', { class: 'truncate text-xs text-muted-foreground' }, row.original.address),
      ]),
      size: 260,
      minSize: 210,
      maxSize: 420,
    },
    {
      accessorKey: 'lastName',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Фамилия', multiSort: true }),
      size: 150,
    },
    {
      accessorKey: 'firstName',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Имя', multiSort: true }),
      size: 150,
    },
    {
      accessorKey: 'middleName',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Отчество', multiSort: true }),
      size: 150,
    },
    {
      accessorKey: 'birthDate',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Дата рождения', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDate(row.original.birthDate)),
      size: 128,
      minSize: 118,
    },
    {
      accessorKey: 'gender',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Пол', multiSort: true }),
      cell: ({ row }) => h(Badge, { variant: 'outline' }, () => row.original.gender === 1 ? 'Мужской' : 'Женский'),
      size: 105,
      minSize: 96,
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Телефон', multiSort: true }),
      size: 155,
      minSize: 135,
    },
    {
      accessorKey: 'regionName',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Регион', multiSort: true }),
      size: 170,
      minSize: 130,
    },
    {
      accessorKey: 'districtName',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Район', multiSort: true }),
      size: 170,
      minSize: 130,
    },
    {
      accessorKey: 'groupName',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Группа', multiSort: true }),
      cell: ({ row }) => h(Badge, { variant: 'secondary' }, () => row.original.groupName),
      size: 125,
      minSize: 110,
    },
    {
      accessorKey: 'specialStatus',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Особый статус', multiSort: true }),
      cell: ({ row }) => row.original.specialStatus
        ? h('div', { class: 'grid gap-1' }, [
            h(Badge, { variant: 'default', class: 'w-fit' }, () => 'Особый'),
            row.original.specialStatusReasonName
              ? h('span', { class: 'text-xs text-muted-foreground' }, row.original.specialStatusReasonName)
              : null,
          ])
        : h('span', { class: 'text-muted-foreground' }, 'Обычный'),
      size: 185,
      minSize: 150,
    },
    {
      accessorKey: 'specialStatusReasonName',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Причина особого статуса', multiSort: true }),
      cell: ({ row }) => row.original.specialStatusReasonName ?? '-',
      size: 210,
      minSize: 160,
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Активен', multiSort: true }),
      cell: ({ row }) => h(Badge, {
        variant: row.original.isActive ? 'outline' : 'secondary',
        class: row.original.isActive ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400' : '',
      }, () => row.original.isActive ? 'Активен' : 'Неактивен'),
      size: 150,
      minSize: 100,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Зарегистрирован', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDateTime(row.original.createdAt)),
      size: 175,
      minSize: 155,
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Обновлён', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatDateTime(row.original.updatedAt)),
      size: 175,
      minSize: 155,
    },
    {
      accessorKey: 'address',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Адрес регистрации', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'block truncate' }, row.original.address),
      size: 280,
      minSize: 180,
    },
    {
      accessorKey: 'address2',
      header: ({ column }) => h(ServerDataGridColumnHeader<PatientGridRow>, { column, title: 'Фактический адрес', multiSort: true }),
      cell: ({ row }) => h('span', { class: 'block truncate' }, row.original.address2),
      size: 280,
      minSize: 180,
    },
  ]

  if (options.canUpdate || options.canDelete) {
    columns.push({
      id: 'actions',
      header: () => h('span', { class: 'block text-right' }, 'Действия'),
      cell: ({ row }) => h(PatientRowActions, {
        patient: row.original,
        canUpdate: options.canUpdate,
        canDelete: options.canDelete,
        disabled: options.disableActions,
        onEdit: options.onEdit,
        onDelete: options.onDelete,
      }),
      enableHiding: false,
      enablePinning: true,
      enableResizing: false,
      enableSorting: false,
      size: 80,
      minSize: 72,
      maxSize: 88,
    })
  }

  return columns
}

export function createPatientFilterFields(
  regions: Region[],
  groups: PatientGroup[],
): ServerDataGridFilterField[] {
  const districts = regions.flatMap(region => region.districts
    .filter(district => district.isActive)
    .map(district => ({
      label: `${district.name} (${region.name})`,
      value: String(district.id),
    })))

  return [
    { field: 'fullName', label: 'ФИО', type: 'text' },
    { field: 'inn', label: 'ИНН', type: 'text' },
    { field: 'phone', label: 'Телефон', type: 'text' },
    { field: 'birthDate', label: 'Дата рождения', type: 'date' },
    { field: 'createdAt', label: 'Дата регистрации', type: 'date' },
    {
      field: 'regionId',
      label: 'Регион',
      type: 'select',
      options: regions.map(region => ({ label: region.name, value: String(region.id) })),
    },
    {
      field: 'districtId',
      label: 'Район',
      type: 'select',
      options: districts,
    },
    {
      field: 'groupId',
      label: 'Группа',
      type: 'select',
      options: groups.map(group => ({ label: group.name, value: String(group.id) })),
    },
    {
      field: 'gender',
      label: 'Пол',
      type: 'select',
      options: [
        { label: 'Мужской', value: '1' },
        { label: 'Женский', value: '2' },
      ],
    },
    {
      field: 'specialStatus',
      label: 'Особый статус',
      type: 'select',
      options: [
        { label: 'Особый', value: 'true' },
        { label: 'Обычный', value: 'false' },
      ],
    },
    { field: 'specialStatusReasonName', label: 'Причина особого статуса', type: 'text' },
    {
      field: 'isActive',
      label: 'Активность',
      type: 'select',
      options: [
        { label: 'Активен', value: 'true' },
        { label: 'Неактивен', value: 'false' },
      ],
    },
  ]
}

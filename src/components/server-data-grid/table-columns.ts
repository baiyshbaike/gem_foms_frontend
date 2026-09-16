import type { ColumnDef } from '@tanstack/vue-table'

import { h } from 'vue'

import { Checkbox } from '@/components/ui/checkbox'

const FIXED_WIDTH_COLUMN = {
  size: 32,
  minSize: 32,
  maxSize: 32,
  enableResizing: false,
} as const

export const SelectColumn: ColumnDef<any> = {
  id: 'select',
  ...FIXED_WIDTH_COLUMN,
  header: ({ table }) => h(Checkbox, {
    'modelValue': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
    'onUpdate:modelValue': value => table.toggleAllPageRowsSelected(!!value),
    'ariaLabel': 'Выбрать все строки',
  }),
  cell: ({ row }) => h(Checkbox, {
    'modelValue': row.getIsSelected(),
    'onUpdate:modelValue': value => row.toggleSelected(!!value),
    'ariaLabel': 'Выбрать строку',
  }),
  enableSorting: false,
  enableHiding: false,
}

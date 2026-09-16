<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'

import { PlusIcon } from '@lucide/vue'
import { h } from 'vue'
import { toast } from 'vue-sonner'

import type { Protocol } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import { ServerDataGrid, ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { formatApiError } from '@/lib/api-error'
import { protocolApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

import ProtocolRowActions from './protocol-row-actions.vue'

const authStore = useAuthStore()
const items = ref<Protocol[]>([])
const loading = ref(false)

const canCreate = computed(() => authStore.hasPermission('protocol.create'))

function formatDate(value: string): string {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPatientName(patient: Protocol['patientHistories'][number]['patient']): string {
  return [patient.lastName, patient.firstName, patient.middleName].filter(Boolean).join(' ')
}

const columns: ColumnDef<Protocol>[] = [
  {
    accessorKey: 'createdAt',
    header: ({ column }) => h(ServerDataGridColumnHeader<Protocol>, { column, title: 'Дата создания' }),
    cell: ({ row }) => h('div', { class: 'whitespace-nowrap text-muted-foreground' }, formatDate(row.original.createdAt)),
    size: 160,
    minSize: 140,
  },
  {
    accessorKey: 'patientHistories',
    header: ({ column }) => h(ServerDataGridColumnHeader<Protocol>, { column, title: 'Пациенты' }),
    cell: ({ row }) => h('div', { class: 'truncate font-medium' }, row.original.patientHistories
      .map(history => formatPatientName(history.patient))
      .join(', ')),
    size: 320,
    minSize: 220,
  },
  {
    accessorKey: 'employees',
    header: ({ column }) => h(ServerDataGridColumnHeader<Protocol>, { column, title: 'Сотрудники комиссии' }),
    cell: ({ row }) => h('div', { class: 'truncate text-muted-foreground' }, row.original.employees.map(employee => employee.fio).join(', ')),
    size: 260,
    minSize: 180,
  },
  {
    accessorKey: 'notes',
    header: ({ column }) => h(ServerDataGridColumnHeader<Protocol>, { column, title: 'Примечания' }),
    cell: ({ row }) => h('div', { class: 'truncate text-muted-foreground' }, row.original.notes ?? '—'),
    size: 220,
    minSize: 140,
  },
  {
    accessorKey: 'isActive',
    header: () => h('span', { class: 'block text-right' }, 'Статус'),
    cell: ({ row }) => h('div', { class: 'flex justify-end' }, h(Badge, { variant: row.original.isActive ? 'default' : 'secondary' }, () => row.original.isActive ? 'Активен' : 'Неактивен')),
    enableSorting: false,
    enableHiding: false,
    size: 110,
    minSize: 100,
  },
  {
    id: 'actions',
    header: () => h('span', { class: 'block text-right' }, 'Действия'),
    cell: ({ row }) => h(ProtocolRowActions, {
      protocol: row.original,
    }),
    enableSorting: false,
    enableHiding: false,
    size: 80,
    minSize: 72,
    maxSize: 88,
  },
]

onMounted(() => {
  loadItems()
})

async function loadItems() {
  loading.value = true
  try {
    items.value = await protocolApi.list(true)
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось загрузить протоколы'))
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <BasicPage title="Протокол комиссии" description="Протоколы освидетельствования комиссии" sticky>
    <template #actions>
      <UiButton v-if="canCreate" as-child size="sm" class="h-9">
        <RouterLink to="/protocol-add">
          <PlusIcon class="size-4" />
          Новый протокол
        </RouterLink>
      </UiButton>
    </template>

    <ServerDataGrid
      :columns="columns"
      :data="items"
      :get-row-id="row => row.id"
      :loading="loading"
      storage-key="dialysis:protocols-grid"
      @refresh="loadItems"
    />
  </BasicPage>
</template>

<route lang="yaml">
meta:
  requiredPermission: protocol.read
</route>

<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'

import { LoaderCircleIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { h } from 'vue'
import { toast } from 'vue-sonner'

import type {
  ServerDataGridExposed,
  ServerDataGridQueryRequest,
  ServerDataGridQueryResult,
} from '@/components/server-data-grid'
import type { BasisProtocol, UpsertBasisProtocolRequest } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import ReferenceBookRowActions from '@/components/reference-books/row-actions.vue'
import { ServerDataGrid, ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { formatApiError } from '@/lib/api-error'
import { basisProtocolApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const gridRef = ref<ServerDataGridExposed | null>(null)
const saving = ref(false)
const dialogOpen = ref(false)
const editingItem = ref<BasisProtocol | null>(null)
const deactivateTarget = ref<BasisProtocol | null>(null)

const form = reactive({
  name: '',
  isActive: true,
})

const canManage = computed(() => authStore.hasPermission('reference_book.basis_protocol.manage'))
const dialogTitle = computed(() => editingItem.value ? 'Редактирование основания' : 'Новое основание')

const columns: ColumnDef<BasisProtocol>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => h(ServerDataGridColumnHeader<BasisProtocol>, { column, title: 'Наименование' }),
    cell: ({ row }) => h('div', { class: 'truncate font-medium' }, row.original.name),
    size: 300,
    minSize: 200,
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => h(ServerDataGridColumnHeader<BasisProtocol>, { column, title: 'Статус' }),
    cell: ({ row }) => h(Badge, { variant: row.original.isActive ? 'default' : 'secondary' }, () => row.original.isActive ? 'Активно' : 'Неактивно'),
    size: 110,
    minSize: 100,
  },
  {
    id: 'actions',
    header: () => h('span', { class: 'block text-right' }, 'Действия'),
    cell: ({ row }) => h(ReferenceBookRowActions, {
      canManage: canManage.value,
      canDeactivate: row.original.isActive,
      saving: saving.value,
      onEdit: () => openEdit(row.original),
      onDelete: () => { deactivateTarget.value = row.original },
    }),
    enableSorting: false,
    enableHiding: false,
    size: 80,
    minSize: 72,
    maxSize: 88,
  },
]

function loadBasisProtocols(request: ServerDataGridQueryRequest): Promise<ServerDataGridQueryResult<BasisProtocol>> {
  return basisProtocolApi.gridQuery(request)
}

function openCreate() {
  editingItem.value = null
  Object.assign(form, {
    name: '',
    isActive: true,
  })
  dialogOpen.value = true
}

function openEdit(item: BasisProtocol) {
  editingItem.value = item
  Object.assign(form, {
    name: item.name,
    isActive: item.isActive,
  })
  dialogOpen.value = true
}

async function saveItem() {
  const payload = toPayload()
  if (!payload) {
    return
  }

  saving.value = true
  try {
    if (editingItem.value) {
      await basisProtocolApi.update(editingItem.value.id, payload)
      toast.success('Основание обновлено')
    }
    else {
      await basisProtocolApi.create(payload)
      toast.success('Основание создано')
    }

    dialogOpen.value = false
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось сохранить основание'))
  }
  finally {
    saving.value = false
  }
}

async function deactivateItem() {
  if (!deactivateTarget.value) {
    return
  }

  const target = deactivateTarget.value
  saving.value = true
  try {
    await basisProtocolApi.deactivate(target.id)
    toast.success('Основание деактивировано')
    deactivateTarget.value = null
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось деактивировать основание'))
  }
  finally {
    saving.value = false
  }
}

function toPayload(): UpsertBasisProtocolRequest | null {
  const name = form.name.trim()

  if (!name) {
    toast.error('Наименование обязательно')
    return null
  }

  return {
    name,
    isActive: form.isActive,
  }
}
</script>

<template>
  <BasicPage title="Основания протокола" description="Справочник оснований для протокола комиссии" sticky>
    <template #actions>
      <UiButton v-if="canManage" size="sm" class="h-9" @click="openCreate">
        <PlusIcon class="size-4" />
        Новое основание
      </UiButton>
    </template>

    <ServerDataGrid
      ref="gridRef"
      :columns="columns"
      :format-error="formatApiError"
      :get-row-id="row => row.id"
      :load="loadBasisProtocols"
      :state-version="2"
      load-error-message="Не удалось загрузить основания протокола"
      storage-key="dialysis:basis-protocol-grid"
    />

    <UiDialog :open="dialogOpen" @update:open="open => !saving && (dialogOpen = open)">
      <UiDialogContent class="sm:max-w-[520px]">
        <UiDialogHeader>
          <UiDialogTitle>{{ dialogTitle }}</UiDialogTitle>
          <UiDialogDescription>
            Основания используются при оформлении протокола комиссии.
          </UiDialogDescription>
        </UiDialogHeader>

        <form class="space-y-4" @submit.prevent="saveItem">
          <div class="grid gap-2">
            <UiLabel for="basis-protocol-name" required>
              Наименование
            </UiLabel>
            <UiInput id="basis-protocol-name" v-model="form.name" maxlength="200" :disabled="saving" />
          </div>

          <div class="flex items-center justify-between rounded-md border p-3">
            <UiLabel for="basis-protocol-active">
              Активно
            </UiLabel>
            <UiSwitch
              id="basis-protocol-active"
              :model-value="form.isActive"
              :disabled="saving"
              @update:model-value="value => form.isActive = Boolean(value)"
            />
          </div>

          <UiDialogFooter>
            <UiButton type="button" variant="outline" :disabled="saving" @click="dialogOpen = false">
              Отмена
            </UiButton>
            <UiButton type="submit" :disabled="saving">
              <LoaderCircleIcon v-if="saving" class="size-4 animate-spin" />
              Сохранить
            </UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialog>

    <UiAlertDialog :open="!!deactivateTarget" @update:open="open => !open && !saving && (deactivateTarget = null)">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Деактивировать основание?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Основание <strong>{{ deactivateTarget?.name }}</strong> больше не будет доступно для новых протоколов.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="saving">
            Отмена
          </UiAlertDialogCancel>
          <UiAlertDialogAction
            :disabled="saving"
            class="bg-destructive text-white hover:bg-destructive/90"
            @click.prevent="deactivateItem"
          >
            <Trash2Icon class="size-4" />
            Деактивировать
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </BasicPage>
</template>

<route lang="yaml">
meta:
  requiredPermission: reference_book.basis_protocol.read
</route>

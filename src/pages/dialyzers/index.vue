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
import type { DialyzerType, UpsertDialyzerTypeRequest } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import ReferenceBookRowActions from '@/components/reference-books/row-actions.vue'
import { ServerDataGrid, ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { formatApiError } from '@/lib/api-error'
import { dialyzerTypeApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const gridRef = ref<ServerDataGridExposed | null>(null)
const saving = ref(false)
const dialogOpen = ref(false)
const editingItem = ref<DialyzerType | null>(null)
const deactivateTarget = ref<DialyzerType | null>(null)

const form = reactive({
  name: '',
  isActive: true,
})

const canManage = computed(() => authStore.hasPermission('reference_book.dialyzer_type.manage'))
const dialogTitle = computed(() => editingItem.value ? 'Редактирование типа диализатора' : 'Новый тип диализатора')

const columns: ColumnDef<DialyzerType>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => h(ServerDataGridColumnHeader<DialyzerType>, { column, title: 'Наименование' }),
    cell: ({ row }) => h('div', { class: 'truncate font-medium' }, row.original.name),
    size: 300,
    minSize: 200,
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => h(ServerDataGridColumnHeader<DialyzerType>, { column, title: 'Статус' }),
    cell: ({ row }) => h(Badge, { variant: row.original.isActive ? 'default' : 'secondary' }, () => row.original.isActive ? 'Активен' : 'Неактивен'),
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

function loadDialyzerTypes(request: ServerDataGridQueryRequest): Promise<ServerDataGridQueryResult<DialyzerType>> {
  return dialyzerTypeApi.gridQuery(request)
}

function openCreate() {
  editingItem.value = null
  Object.assign(form, {
    name: '',
    isActive: true,
  })
  dialogOpen.value = true
}

function openEdit(item: DialyzerType) {
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
      await dialyzerTypeApi.update(editingItem.value.id, payload)
      toast.success('Тип диализатора обновлён')
    }
    else {
      await dialyzerTypeApi.create(payload)
      toast.success('Тип диализатора создан')
    }

    dialogOpen.value = false
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось сохранить тип диализатора'))
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
    await dialyzerTypeApi.deactivate(target.id)
    toast.success('Тип диализатора деактивирован')
    deactivateTarget.value = null
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось деактивировать тип диализатора'))
  }
  finally {
    saving.value = false
  }
}

function toPayload(): UpsertDialyzerTypeRequest | null {
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
  <BasicPage title="Типы диализаторов" description="Справочник типов диализаторов" sticky>
    <template #actions>
      <UiButton v-if="canManage" size="sm" class="h-9" @click="openCreate">
        <PlusIcon class="size-4" />
        Новый тип
      </UiButton>
    </template>

    <ServerDataGrid
      ref="gridRef"
      :columns="columns"
      :format-error="formatApiError"
      :get-row-id="row => row.id"
      :load="loadDialyzerTypes"
      :state-version="2"
      load-error-message="Не удалось загрузить типы диализаторов"
      storage-key="dialysis:dialyzers-grid"
    />

    <UiDialog :open="dialogOpen" @update:open="open => !saving && (dialogOpen = open)">
      <UiDialogContent class="sm:max-w-[520px]">
        <UiDialogHeader>
          <UiDialogTitle>{{ dialogTitle }}</UiDialogTitle>
          <UiDialogDescription>
            Типы диализаторов используются при создании сеансов.
          </UiDialogDescription>
        </UiDialogHeader>

        <form class="space-y-4" @submit.prevent="saveItem">
          <div class="grid gap-2">
            <UiLabel for="dialyzer-name" required>
              Наименование
            </UiLabel>
            <UiInput id="dialyzer-name" v-model="form.name" maxlength="200" :disabled="saving" />
          </div>

          <div class="flex items-center justify-between rounded-md border p-3">
            <UiLabel for="dialyzer-active">
              Активен
            </UiLabel>
            <UiSwitch
              id="dialyzer-active"
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
          <UiAlertDialogTitle>Деактивировать тип диализатора?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Тип <strong>{{ deactivateTarget?.name }}</strong> больше не будет доступен для новых назначений.
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
  requiredPermission: reference_book.dialyzer_type.read
</route>

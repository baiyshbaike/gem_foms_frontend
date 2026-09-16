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
import type { CodeMkb, UpsertCodeMkbRequest } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import ReferenceBookRowActions from '@/components/reference-books/row-actions.vue'
import { ServerDataGrid, ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { formatApiError } from '@/lib/api-error'
import { codeMkbApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const gridRef = ref<ServerDataGridExposed | null>(null)
const saving = ref(false)
const dialogOpen = ref(false)
const editingItem = ref<CodeMkb | null>(null)
const deactivateTarget = ref<CodeMkb | null>(null)

const form = reactive({
  code: '',
  name: '',
  ageProperty: '',
  pol: '',
  isActive: true,
})

const canManage = computed(() => authStore.hasPermission('reference_book.code_mkb.manage'))
const dialogTitle = computed(() => editingItem.value ? 'Редактирование кода МКБ' : 'Новый код МКБ')

const columns: ColumnDef<CodeMkb>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => h(ServerDataGridColumnHeader<CodeMkb>, { column, title: 'Код' }),
    cell: ({ row }) => h('span', { class: 'font-mono text-xs' }, row.original.code),
    enableSorting: false,
    size: 120,
    minSize: 100,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => h(ServerDataGridColumnHeader<CodeMkb>, { column, title: 'Наименование' }),
    cell: ({ row }) => h('div', { class: 'truncate font-medium' }, row.original.name),
    size: 300,
    minSize: 200,
  },
  {
    accessorKey: 'ageProperty',
    header: ({ column }) => h(ServerDataGridColumnHeader<CodeMkb>, { column, title: 'Возрастной признак' }),
    cell: ({ row }) => row.original.ageProperty ?? '-',
    enableSorting: false,
    size: 160,
    minSize: 130,
  },
  {
    accessorKey: 'pol',
    header: ({ column }) => h(ServerDataGridColumnHeader<CodeMkb>, { column, title: 'Пол' }),
    cell: ({ row }) => row.original.pol ?? '-',
    enableSorting: false,
    size: 160,
    minSize: 130,
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => h(ServerDataGridColumnHeader<CodeMkb>, { column, title: 'Статус' }),
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

function loadCodeMkbs(request: ServerDataGridQueryRequest): Promise<ServerDataGridQueryResult<CodeMkb>> {
  return codeMkbApi.gridQuery(request)
}

function openCreate() {
  editingItem.value = null
  Object.assign(form, {
    code: '',
    name: '',
    ageProperty: '',
    pol: '',
    isActive: true,
  })
  dialogOpen.value = true
}

function openEdit(item: CodeMkb) {
  editingItem.value = item
  Object.assign(form, {
    code: item.code,
    name: item.name,
    ageProperty: item.ageProperty ?? '',
    pol: item.pol ?? '',
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
      await codeMkbApi.update(editingItem.value.id, payload)
      toast.success('Код МКБ обновлён')
    }
    else {
      await codeMkbApi.create(payload)
      toast.success('Код МКБ создан')
    }

    dialogOpen.value = false
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось сохранить код МКБ'))
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
    await codeMkbApi.deactivate(target.id)
    toast.success('Код МКБ деактивирован')
    deactivateTarget.value = null
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось деактивировать код МКБ'))
  }
  finally {
    saving.value = false
  }
}

function toPayload(): UpsertCodeMkbRequest | null {
  const code = form.code.trim().toUpperCase()
  const name = form.name.trim()
  const ageProperty = form.ageProperty.trim()
  const pol = form.pol.trim()

  if (!code) {
    toast.error('Код обязателен')
    return null
  }

  if (!name) {
    toast.error('Наименование обязательно')
    return null
  }

  return {
    code,
    name,
    ageProperty: ageProperty || null,
    pol: pol || null,
    isActive: form.isActive,
  }
}
</script>

<template>
  <BasicPage title="Коды МКБ" description="Справочник кодов Международной классификации болезней" sticky>
    <template #actions>
      <UiButton v-if="canManage" size="sm" class="h-9" @click="openCreate">
        <PlusIcon class="size-4" />
        Новый код
      </UiButton>
    </template>

    <ServerDataGrid
      ref="gridRef"
      :columns="columns"
      :format-error="formatApiError"
      :get-row-id="row => row.id"
      :load="loadCodeMkbs"
      :state-version="2"
      load-error-message="Не удалось загрузить коды МКБ"
      storage-key="dialysis:code-mkb-grid"
    />

    <UiDialog :open="dialogOpen" @update:open="open => !saving && (dialogOpen = open)">
      <UiDialogContent class="sm:max-w-[520px]">
        <UiDialogHeader>
          <UiDialogTitle>{{ dialogTitle }}</UiDialogTitle>
          <UiDialogDescription>
            Коды МКБ используются при оформлении медицинских карт.
          </UiDialogDescription>
        </UiDialogHeader>

        <form class="space-y-4" @submit.prevent="saveItem">
          <div class="grid gap-2">
            <UiLabel for="mkb-code" required>
              Код
            </UiLabel>
            <UiInput id="mkb-code" v-model="form.code" maxlength="50" :disabled="saving" />
          </div>

          <div class="grid gap-2">
            <UiLabel for="mkb-name" required>
              Наименование
            </UiLabel>
            <UiInput id="mkb-name" v-model="form.name" maxlength="200" :disabled="saving" />
          </div>

          <div class="grid gap-2">
            <UiLabel for="mkb-age-property">
              Возрастной признак
            </UiLabel>
            <UiInput id="mkb-age-property" v-model="form.ageProperty" maxlength="100" :disabled="saving" placeholder="Например: взрослые, дети" />
          </div>

          <div class="grid gap-2">
            <UiLabel for="mkb-pol">
              Пол
            </UiLabel>
            <UiInput id="mkb-pol" v-model="form.pol" maxlength="100" :disabled="saving" placeholder="Например: мужской, женский, любой" />
          </div>

          <div class="flex items-center justify-between rounded-md border p-3">
            <UiLabel for="mkb-active">
              Активен
            </UiLabel>
            <UiSwitch
              id="mkb-active"
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
          <UiAlertDialogTitle>Деактивировать код МКБ?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Код <strong>{{ deactivateTarget?.code }}</strong> больше не будет доступен для новых назначений.
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
  requiredPermission: reference_book.code_mkb.read
</route>

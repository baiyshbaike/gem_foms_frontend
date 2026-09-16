<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'

import { LoaderCircleIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { h } from 'vue'
import { toast } from 'vue-sonner'

import type {
  PatientSpecialStatusReason,
  UpsertPatientSpecialStatusReasonRequest,
} from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import ReferenceBookRowActions from '@/components/reference-books/row-actions.vue'
import { ServerDataGrid, ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { formatApiError } from '@/lib/api-error'
import { patientSpecialStatusReasonApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const reasons = ref<PatientSpecialStatusReason[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const editingReason = ref<PatientSpecialStatusReason | null>(null)
const deactivateTarget = ref<PatientSpecialStatusReason | null>(null)

const form = reactive({
  code: '',
  name: '',
  description: '',
  isActive: true,
})

const canManage = computed(() => authStore.hasPermission('reference_book.special_status_reason.manage'))
const dialogTitle = computed(() => editingReason.value ? 'Редактирование причины' : 'Новая причина')

const columns: ColumnDef<PatientSpecialStatusReason>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => h(ServerDataGridColumnHeader<PatientSpecialStatusReason>, { column, title: 'ID' }),
    cell: ({ row }) => h('span', { class: 'tabular-nums' }, String(row.original.id)),
    size: 70,
    minSize: 64,
  },
  {
    accessorKey: 'code',
    header: ({ column }) => h(ServerDataGridColumnHeader<PatientSpecialStatusReason>, { column, title: 'Код' }),
    cell: ({ row }) => h('span', { class: 'font-mono text-xs' }, row.original.code),
    size: 130,
    minSize: 100,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => h(ServerDataGridColumnHeader<PatientSpecialStatusReason>, { column, title: 'Наименование' }),
    cell: ({ row }) => h('div', { class: 'truncate font-medium' }, row.original.name),
    size: 300,
    minSize: 200,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => h(ServerDataGridColumnHeader<PatientSpecialStatusReason>, { column, title: 'Описание' }),
    cell: ({ row }) => h('div', { class: 'truncate text-muted-foreground' }, row.original.description ?? '-'),
    size: 320,
    minSize: 220,
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => h(ServerDataGridColumnHeader<PatientSpecialStatusReason>, { column, title: 'Статус' }),
    cell: ({ row }) => h(Badge, { variant: row.original.isActive ? 'default' : 'secondary' }, () => row.original.isActive ? 'Активна' : 'Неактивна'),
    size: 120,
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

onMounted(loadReasons)

async function loadReasons() {
  loading.value = true
  try {
    reasons.value = await patientSpecialStatusReasonApi.list(true)
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось загрузить причины'))
  }
  finally {
    loading.value = false
  }
}

function openCreate() {
  editingReason.value = null
  Object.assign(form, {
    code: '',
    name: '',
    description: '',
    isActive: true,
  })
  dialogOpen.value = true
}

function openEdit(reason: PatientSpecialStatusReason) {
  editingReason.value = reason
  Object.assign(form, {
    code: reason.code,
    name: reason.name,
    description: reason.description ?? '',
    isActive: reason.isActive,
  })
  dialogOpen.value = true
}

async function saveReason() {
  const payload = toReasonPayload()
  if (!payload) {
    return
  }

  saving.value = true
  try {
    if (editingReason.value) {
      await patientSpecialStatusReasonApi.update(editingReason.value.id, payload)
      toast.success('Причина обновлена')
    }
    else {
      await patientSpecialStatusReasonApi.create(payload)
      toast.success('Причина создана')
    }

    dialogOpen.value = false
    await loadReasons()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось сохранить причину'))
  }
  finally {
    saving.value = false
  }
}

async function deactivateReason() {
  if (!deactivateTarget.value)
    return

  const reason = deactivateTarget.value
  saving.value = true
  try {
    await patientSpecialStatusReasonApi.deactivate(reason.id)
    toast.success('Причина деактивирована')
    deactivateTarget.value = null
    await loadReasons()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось деактивировать причину'))
  }
  finally {
    saving.value = false
  }
}

function toReasonPayload(): UpsertPatientSpecialStatusReasonRequest | null {
  const code = form.code.trim().toUpperCase()
  const name = form.name.trim()
  const description = form.description.trim()

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
    description: description || null,
    isActive: form.isActive,
  }
}
</script>

<template>
  <BasicPage
    title="Причины особого статуса"
    description="Справочник причин, по которым пациент получает особый статус"
    sticky
  >
    <template #actions>
      <UiButton v-if="canManage" size="sm" class="h-9" @click="openCreate">
        <PlusIcon class="size-4" />
        Новая причина
      </UiButton>
    </template>

    <ServerDataGrid
      :columns="columns"
      :data="reasons"
      :get-row-id="row => row.id"
      :loading="loading"
      storage-key="dialysis:reasons-grid"
      @refresh="loadReasons"
    />

    <UiDialog :open="dialogOpen" @update:open="open => !saving && (dialogOpen = open)">
      <UiDialogContent class="sm:max-w-[520px]">
        <UiDialogHeader>
          <UiDialogTitle>{{ dialogTitle }}</UiDialogTitle>
          <UiDialogDescription>
            Значения из этого справочника выбираются в карточке пациента.
          </UiDialogDescription>
        </UiDialogHeader>

        <form class="space-y-4" @submit.prevent="saveReason">
          <div class="grid gap-2">
            <UiLabel for="reason-code" required>
              Код
            </UiLabel>
            <UiInput id="reason-code" v-model="form.code" maxlength="50" :disabled="saving" />
          </div>

          <div class="grid gap-2">
            <UiLabel for="reason-name" required>
              Наименование
            </UiLabel>
            <UiInput id="reason-name" v-model="form.name" maxlength="200" :disabled="saving" />
          </div>

          <div class="grid gap-2">
            <UiLabel for="reason-description">
              Описание
            </UiLabel>
            <UiTextarea id="reason-description" v-model="form.description" maxlength="500" rows="3" :disabled="saving" />
          </div>

          <div class="flex items-center justify-between rounded-md border p-3">
            <UiLabel for="reason-active">
              Активна
            </UiLabel>
            <UiSwitch
              id="reason-active"
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
          <UiAlertDialogTitle>Деактивировать причину?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Причина <strong>{{ deactivateTarget?.name }}</strong> больше не будет доступна для новых назначений.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="saving">
            Отмена
          </UiAlertDialogCancel>
          <UiAlertDialogAction
            :disabled="saving"
            class="bg-destructive text-white hover:bg-destructive/90"
            @click.prevent="deactivateReason"
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
  requiredPermission: reference_book.special_status_reason.read
</route>

<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'

import { LoaderCircleIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { h } from 'vue'
import { toast } from 'vue-sonner'

import type { EmployeeTenant, UpsertEmployeeTenantRequest } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import ReferenceBookRowActions from '@/components/reference-books/row-actions.vue'
import { ServerDataGrid, ServerDataGridColumnHeader } from '@/components/server-data-grid'
import { Badge } from '@/components/ui/badge'
import { FieldError } from '@/components/ui/field'
import { formatApiError } from '@/lib/api-error'
import { employeeTenantApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const ALL_TENANTS = '__all__'
const items = ref<EmployeeTenant[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const editingItem = ref<EmployeeTenant | null>(null)
const deactivateTarget = ref<EmployeeTenant | null>(null)
const submitted = ref(false)
const selectedTenantId = ref(ALL_TENANTS)

const form = reactive({
  tenantId: '',
  firstName: '',
  lastName: '',
  middleName: '',
  position: '',
  phoneNumber: '',
  isActive: true,
})

const canManage = computed(() => authStore.hasPermission('reference_book.employee_tenant.manage'))
const dialogTitle = computed(() => editingItem.value ? 'Редактирование сотрудника' : 'Новый сотрудник')
const requiresTenantSelection = computed(() => !authStore.isTenantSwitchMode)
const effectiveTenantId = computed(() => requiresTenantSelection.value ? form.tenantId : authStore.activeTenant?.id ?? '')

type EmployeeField = 'tenantId' | 'lastName' | 'firstName' | 'position'

const requiredFields = computed<ReadonlyArray<{ field: EmployeeField, label: string, message: string }>>(() => [
  ...(requiresTenantSelection.value ? [{ field: 'tenantId' as const, label: 'Мед. центр', message: 'Выберите мед. центр' }] : []),
  { field: 'lastName', label: 'Фамилия', message: 'Фамилия обязательна' },
  { field: 'firstName', label: 'Имя', message: 'Имя обязательно' },
  { field: 'position', label: 'Должность', message: 'Должность обязательна' },
])

const fieldErrors = computed(() => submitted.value ? validateFields() : {})

const columns: ColumnDef<EmployeeTenant>[] = [
  {
    accessorKey: 'tenantId',
    header: ({ column }) => h(ServerDataGridColumnHeader<EmployeeTenant>, { column, title: 'Мед. центр' }),
    cell: ({ row }) => h('div', { class: 'truncate text-muted-foreground' }, tenantName(row.original.tenantId)),
    size: 220,
    minSize: 160,
  },
  {
    accessorKey: 'fullName',
    header: ({ column }) => h(ServerDataGridColumnHeader<EmployeeTenant>, { column, title: 'ФИО' }),
    cell: ({ row }) => h('div', { class: 'truncate font-medium' }, row.original.fullName),
    size: 280,
    minSize: 220,
  },
  {
    accessorKey: 'position',
    header: ({ column }) => h(ServerDataGridColumnHeader<EmployeeTenant>, { column, title: 'Должность' }),
    cell: ({ row }) => h('div', { class: 'truncate text-muted-foreground' }, row.original.position),
    size: 240,
    minSize: 180,
  },
  {
    accessorKey: 'phoneNumber',
    header: ({ column }) => h(ServerDataGridColumnHeader<EmployeeTenant>, { column, title: 'Телефон' }),
    cell: ({ row }) => h('span', row.original.phoneNumber || '-'),
    size: 150,
    minSize: 120,
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => h(ServerDataGridColumnHeader<EmployeeTenant>, { column, title: 'Статус' }),
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

onMounted(() => {
  if (authStore.canFilterTenants) {
    ensureTenants()
  }

  loadItems()
})

async function loadItems() {
  loading.value = true
  try {
    items.value = await employeeTenantApi.list(true, tenantFilter())
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось загрузить сотрудников'))
  }
  finally {
    loading.value = false
  }
}

function tenantFilter() {
  return authStore.canFilterTenants && selectedTenantId.value !== ALL_TENANTS ? [selectedTenantId.value] : undefined
}

async function ensureTenants() {
  if (authStore.tenants.length > 0) {
    return
  }

  try {
    await authStore.loadTenants()
  }
  catch {
    toast.error('Не удалось загрузить список мед. центров')
  }
}

function tenantName(tenantId: string) {
  return authStore.tenants.find(tenant => tenant.id === tenantId)?.name ?? tenantId
}

async function openCreate() {
  editingItem.value = null
  submitted.value = false
  await ensureTenants()
  Object.assign(form, {
    tenantId: requiresTenantSelection.value ? '' : authStore.activeTenant?.id ?? '',
    firstName: '',
    lastName: '',
    middleName: '',
    position: '',
    phoneNumber: '',
    isActive: true,
  })
  dialogOpen.value = true
}

async function openEdit(item: EmployeeTenant) {
  editingItem.value = item
  submitted.value = false
  await ensureTenants()
  Object.assign(form, {
    tenantId: item.tenantId,
    firstName: item.firstName,
    lastName: item.lastName,
    middleName: item.middleName || '',
    position: item.position,
    phoneNumber: item.phoneNumber || '',
    isActive: item.isActive,
  })
  dialogOpen.value = true
}

async function saveItem() {
  submitted.value = true
  const errors = validateFields()
  if (Object.keys(errors).length > 0) {
    toast.error(`Заполните обязательные поля: ${requiredFields.value.filter(item => errors[item.field]).map(item => item.label).join(', ')}`)
    return
  }

  if (!effectiveTenantId.value) {
    toast.error('Не выбран активный мед. центр')
    return
  }

  const payload = toPayload()

  saving.value = true
  try {
    if (editingItem.value) {
      await employeeTenantApi.update(editingItem.value.id, payload)
      toast.success('Сотрудник обновлён')
    }
    else {
      await employeeTenantApi.create(payload)
      toast.success('Сотрудник создан')
    }

    dialogOpen.value = false
    submitted.value = false
    await loadItems()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось сохранить сотрудника'))
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
    await employeeTenantApi.deactivate(target.id)
    toast.success('Сотрудник деактивирован')
    deactivateTarget.value = null
    await loadItems()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось деактивировать сотрудника'))
  }
  finally {
    saving.value = false
  }
}

function validateFields(): Partial<Record<EmployeeField, string[]>> {
  const errors: Partial<Record<EmployeeField, string[]>> = {}

  for (const item of requiredFields.value) {
    if (!form[item.field].trim()) {
      errors[item.field] = [item.message]
    }
  }

  return errors
}

function invalid(field: EmployeeField) {
  return !!fieldErrors.value[field]?.length
}

function toPayload(): UpsertEmployeeTenantRequest {
  const firstName = form.firstName.trim()
  const lastName = form.lastName.trim()
  const middleName = form.middleName.trim()
  const position = form.position.trim()
  const phoneNumber = form.phoneNumber.trim()

  return {
    tenantId: requiresTenantSelection.value ? effectiveTenantId.value : null,
    firstName,
    lastName,
    middleName: middleName || null,
    position,
    phoneNumber: phoneNumber || null,
    isActive: form.isActive,
  }
}

watch(selectedTenantId, loadItems)

watch(
  () => authStore.activeTenant?.id,
  () => {
    if (authStore.isTenantSwitchMode) {
      loadItems()
    }
  },
)
</script>

<template>
  <BasicPage title="Сотрудники" description="Справочник сотрудников для сеансов и медицинских документов" sticky>
    <template #actions>
      <UiButton v-if="canManage" size="sm" class="h-9" @click="openCreate">
        <PlusIcon class="size-4" />
        Новый сотрудник
      </UiButton>
    </template>

    <ServerDataGrid
      :columns="columns"
      :data="items"
      :get-row-id="row => row.id"
      :loading="loading"
      storage-key="dialysis:employee-tenant-grid"
      @refresh="loadItems"
    >
      <template #toolbar-actions>
        <div class="flex justify-end">
          <UiSelect
            v-if="authStore.canFilterTenants"
            v-model:model-value="selectedTenantId"
          >
            <UiSelectTrigger class="h-9 w-[220px]">
              <UiSelectValue placeholder="Все мед. центры" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem :value="ALL_TENANTS">
                Все мед. центры
              </UiSelectItem>
              <UiSelectItem v-for="tenant in authStore.tenants" :key="tenant.id" :value="tenant.id">
                {{ tenant.name }}
              </UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>
      </template>
    </ServerDataGrid>

    <UiDialog :open="dialogOpen" @update:open="open => !saving && (dialogOpen = open)">
      <UiDialogContent class="sm:max-w-[720px]">
        <UiDialogHeader>
          <UiDialogTitle>{{ dialogTitle }}</UiDialogTitle>
          <UiDialogDescription>
            Сотрудник будет доступен для выбора в формах сеанса.
          </UiDialogDescription>
        </UiDialogHeader>

        <form class="space-y-4" @submit.prevent="saveItem">
          <div v-if="requiresTenantSelection" class="grid gap-2">
            <UiLabel for="employee-tenant" required :data-error="invalid('tenantId')" class="data-[error=true]:text-destructive">
              Мед. центр
            </UiLabel>
            <UiSelect
              v-model:model-value="form.tenantId"
              :disabled="saving || !!editingItem"
            >
              <UiSelectTrigger id="employee-tenant" class="w-full" :aria-invalid="invalid('tenantId')">
                <UiSelectValue placeholder="Выберите мед. центр" />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="tenant in authStore.tenants" :key="tenant.id" :value="tenant.id">
                  {{ tenant.name }}
                </UiSelectItem>
              </UiSelectContent>
            </UiSelect>
            <FieldError :errors="fieldErrors.tenantId" />
            <p v-if="!authStore.tenants.length" class="text-sm text-destructive">
              Нет доступных мед. центров для создания сотрудника.
            </p>
          </div>

          <div v-else class="rounded-md border bg-muted/20 px-4 py-3 text-sm">
            <p class="font-medium">
              {{ authStore.activeTenant?.name ?? 'Не выбран активный мед. центр' }}
            </p>
            <p class="text-xs text-muted-foreground">
              Сотрудник будет создан в текущем активном мед. центре.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <UiLabel for="employee-last-name" required :data-error="invalid('lastName')" class="data-[error=true]:text-destructive">
                Фамилия
              </UiLabel>
              <UiInput id="employee-last-name" v-model="form.lastName" maxlength="100" :disabled="saving" :aria-invalid="invalid('lastName')" />
              <FieldError :errors="fieldErrors.lastName" />
            </div>

            <div class="grid gap-2">
              <UiLabel for="employee-first-name" required :data-error="invalid('firstName')" class="data-[error=true]:text-destructive">
                Имя
              </UiLabel>
              <UiInput id="employee-first-name" v-model="form.firstName" maxlength="100" :disabled="saving" :aria-invalid="invalid('firstName')" />
              <FieldError :errors="fieldErrors.firstName" />
            </div>

            <div class="grid gap-2">
              <UiLabel for="employee-middle-name">
                Отчество
              </UiLabel>
              <UiInput id="employee-middle-name" v-model="form.middleName" maxlength="100" :disabled="saving" />
            </div>

            <div class="grid gap-2">
              <UiLabel for="employee-phone">
                Телефон
              </UiLabel>
              <UiInput id="employee-phone" v-model="form.phoneNumber" maxlength="50" :disabled="saving" />
            </div>
          </div>

          <div class="grid gap-2">
            <UiLabel for="employee-position" required :data-error="invalid('position')" class="data-[error=true]:text-destructive">
              Должность
            </UiLabel>
            <UiInput id="employee-position" v-model="form.position" maxlength="200" :disabled="saving" :aria-invalid="invalid('position')" />
            <FieldError :errors="fieldErrors.position" />
          </div>

          <div class="flex items-center justify-between rounded-md border p-3">
            <UiLabel for="employee-active">
              Активен
            </UiLabel>
            <UiSwitch
              id="employee-active"
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
          <UiAlertDialogTitle>Деактивировать сотрудника?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Сотрудник <strong>{{ deactivateTarget?.fullName }}</strong> больше не будет доступен для новых назначений.
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
  requiredPermission: reference_book.employee_tenant.read
</route>

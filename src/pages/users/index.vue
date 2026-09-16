<script setup lang="ts">
import { PlusIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

import type {
  ServerDataGridExportConfig,
  ServerDataGridExposed,
  ServerDataGridQueryRequest,
  ServerDataGridQueryResult,
} from '@/components/server-data-grid'
import type { AdminRole, AdminUserGridRow, Region, Tenant } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import { ServerDataGrid } from '@/components/server-data-grid'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { parseApiError } from '@/lib/api-error'
import { adminUserApi, regionApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

import {
  getManagerRegionIdForPayload,
  getManagerRoleId,
  isManagerRole,
} from './manager-region'
import {
  createUserColumns,
  userColumnLabels,
  userDefaultColumnVisibility,
  userDefaultSorting,
  userExportColumns,
  userFilterFields,
  userGroupOptions,
} from './user-grid-config'

const strongPasswordMessage = 'Пароль должен содержать минимум 8 символов, заглавную и строчную букву, цифру и символ.'

const authStore = useAuthStore()
const router = useRouter()
const gridRef = ref<ServerDataGridExposed | null>(null)
const dialogOpen = ref(false)
const saving = ref(false)
const editingUser = ref<AdminUserGridRow | null>(null)

const roles = ref<AdminRole[]>([])
const regions = ref<Region[]>([])
const tenants = ref<Tenant[]>([])
const selectedRoleId = ref<number | null>(null)
const selectedTenantIds = ref<string[]>([])

const form = reactive({
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  isActive: true,
  managerRegionId: null as number | null,
})

const managerRoleId = computed(() => getManagerRoleId(roles.value))
const hasManagerRole = computed(() => isManagerRole(roles.value, selectedRoleId.value))
const activeRegions = computed(() => regions.value.filter(r => r.isActive))
const isEditMode = computed(() => !!editingUser.value)
const formTitle = computed(() => (isEditMode.value ? 'Редактирование пользователя' : 'Создание пользователя'))

const canCreate = computed(() => authStore.hasPermission('admin.users'))
const canUpdate = computed(() => authStore.hasPermission('admin.users'))
const canDeactivate = computed(() => authStore.hasPermission('admin.users'))
const canExport = computed(() => authStore.hasPermission('admin.users.export'))
const gridStorageKey = computed(() => `dialysis:user-grid:${authStore.user?.id ?? 'anonymous'}`)

const columns = computed(() => createUserColumns({
  canUpdate: canUpdate.value,
  canDeactivate: canDeactivate.value,
  onEdit: openEditUser,
  onDeactivate: requestDeactivateUser,
  onView: openUserDetail,
}))

const exportConfig = computed<ServerDataGridExportConfig<AdminUserGridRow> | undefined>(() => canExport.value
  ? {
      columns: userExportColumns,
      fileName: () => `users-${new Date().toISOString().slice(0, 10)}.xlsx`,
      load: loadUserExport,
      sheetName: 'Пользователи',
    }
  : undefined)

function loadUsers(
  request: ServerDataGridQueryRequest,
): Promise<ServerDataGridQueryResult<AdminUserGridRow>> {
  return adminUserApi.gridQuery(request)
}

function loadUserExport(
  request: ServerDataGridQueryRequest,
  selectedRowIds: string[],
): Promise<ServerDataGridQueryResult<AdminUserGridRow>> {
  return adminUserApi.gridExport({
    ...request,
    selectedIds: selectedRowIds.map(Number),
  })
}

async function loadFormRoles() {
  const [loadedRoles, loadedRegions, loadedTenants] = await Promise.all([
    adminUserApi.roles(),
    regionApi.list(false),
    adminUserApi.tenants(),
  ])
  roles.value = loadedRoles
  regions.value = loadedRegions
  tenants.value = loadedTenants
}

function openUserDetail(user: AdminUserGridRow) {
  router.push(`/users/${user.id}`)
}

function resetForm() {
  editingUser.value = null
  selectedRoleId.value = null
  selectedTenantIds.value = []
  Object.assign(form, {
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    isActive: true,
    managerRegionId: null,
  })
}

function openCreateUser() {
  resetForm()
  loadFormRoles()
  dialogOpen.value = true
}

async function openEditUser(row: AdminUserGridRow) {
  const [allUsers, loadedRoles, loadedRegions, loadedTenants] = await Promise.all([
    adminUserApi.list(),
    adminUserApi.roles(),
    regionApi.list(false),
    adminUserApi.tenants(),
  ])
  roles.value = loadedRoles
  regions.value = loadedRegions
  tenants.value = loadedTenants

  const fullUser = allUsers.find(u => u.id === row.id)
  if (!fullUser) {
    toast.error('Не удалось загрузить данные пользователя')
    return
  }

  editingUser.value = row
  selectedRoleId.value = fullUser.role.id
  selectedTenantIds.value = fullUser.tenants.map(t => t.id)
  Object.assign(form, {
    username: fullUser.username,
    password: '',
    firstName: fullUser.firstName,
    lastName: fullUser.lastName,
    isActive: fullUser.isActive,
    managerRegionId: fullUser.managerRegion?.id ?? null,
  })
  dialogOpen.value = true
}

function selectRole(roleId: number) {
  selectedRoleId.value = roleId

  if (roleId !== managerRoleId.value) {
    form.managerRegionId = null
  }
}

function toggleTenant(tenantId: string, checked: boolean) {
  selectedTenantIds.value = checked
    ? [...new Set([...selectedTenantIds.value, tenantId])]
    : selectedTenantIds.value.filter(id => id !== tenantId)
}

function createPayload() {
  return {
    username: form.username.trim(),
    password: form.password,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    isActive: form.isActive,
    roleId: selectedRoleId.value ?? 0,
    managerRegionId: getManagerRegionIdForPayload(roles.value, selectedRoleId.value, form.managerRegionId),
    tenantIds: selectedTenantIds.value,
  }
}

function updatePayload() {
  return {
    username: form.username.trim(),
    password: form.password.trim() || null,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    isActive: form.isActive,
    roleId: selectedRoleId.value ?? 0,
    managerRegionId: getManagerRegionIdForPayload(roles.value, selectedRoleId.value, form.managerRegionId),
    tenantIds: selectedTenantIds.value,
  }
}

function hasUppercase(value: string) {
  return [...value].some(char => char.toLocaleUpperCase() === char && char.toLocaleLowerCase() !== char)
}

function hasLowercase(value: string) {
  return [...value].some(char => char.toLocaleLowerCase() === char && char.toLocaleUpperCase() !== char)
}

function hasSymbol(value: string) {
  return [...value].some(char => !/[\p{L}\p{N}]/u.test(char))
}

function validatePassword(value: string, required: boolean) {
  if (!value.trim()) {
    return required ? 'Введите пароль' : null
  }

  if (value.length > 200) {
    return 'Пароль не должен быть длиннее 200 символов'
  }

  if (/\s/u.test(value)) {
    return 'Пароль не должен содержать пробелы'
  }

  if (
    value.length < 8
    || !hasUppercase(value)
    || !hasLowercase(value)
    || !/\d/u.test(value)
    || !hasSymbol(value)
  ) {
    return strongPasswordMessage
  }

  return null
}

function validateUserForm() {
  if (!form.username.trim()) {
    return 'Введите имя пользователя'
  }

  if (!form.firstName.trim()) {
    return 'Введите имя'
  }

  if (!form.lastName.trim()) {
    return 'Введите фамилию'
  }

  if (selectedRoleId.value === null) {
    return 'Выберите роль'
  }

  const passwordError = validatePassword(form.password, !isEditMode.value)
  if (passwordError) {
    return passwordError
  }

  if (hasManagerRole.value && !form.managerRegionId) {
    return 'Выберите регион для менеджера'
  }

  return null
}

function mapServerValidationMessage(message: string) {
  if (message.includes('Password must contain at least 8 characters')) {
    return strongPasswordMessage
  }

  if (message.includes('Password is required')) {
    return 'Введите пароль'
  }

  return message
}

function getSaveUserErrorMessage(error: unknown) {
  const problem = parseApiError(error)
  if (!problem) {
    return 'Не удалось сохранить пользователя'
  }

  const firstValidationError = problem?.errors
    ? Object.values(problem.errors).flat()[0]
    : null

  if (firstValidationError) {
    return mapServerValidationMessage(firstValidationError)
  }

  return problem?.detail || problem?.title || 'Не удалось сохранить пользователя'
}

async function saveUser() {
  const validationError = validateUserForm()
  if (validationError) {
    toast.error(validationError)
    return
  }

  saving.value = true
  try {
    if (isEditMode.value) {
      await adminUserApi.update(editingUser.value!.id, updatePayload())
      toast.success('Пользователь обновлён')
    }
    else {
      await adminUserApi.create(createPayload())
      toast.success('Пользователь создан')
    }

    dialogOpen.value = false
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(getSaveUserErrorMessage(error))
  }
  finally {
    saving.value = false
  }
}

const deactivating = ref(false)
const deactivateTarget = ref<AdminUserGridRow | null>(null)

function requestDeactivateUser(user: AdminUserGridRow) {
  deactivateTarget.value = user
}

async function deactivateUser() {
  if (!deactivateTarget.value) {
    return
  }

  const user = deactivateTarget.value
  deactivating.value = true
  try {
    await adminUserApi.deactivate(user.id)
    gridRef.value?.removeSelection(user.id)
    deactivateTarget.value = null
    toast.success('Пользователь деактивирован')
    gridRef.value?.refresh()
  }
  catch {
    toast.error('Не удалось деактивировать пользователя')
  }
  finally {
    deactivating.value = false
  }
}
</script>

<template>
  <BasicPage title="Пользователи" description="Управление пользователями" sticky>
    <ServerDataGrid
      ref="gridRef"
      :columns="columns"
      :column-labels="userColumnLabels"
      :default-column-visibility="userDefaultColumnVisibility"
      :default-sorting="userDefaultSorting"
      :export-config="exportConfig"
      :filter-fields="userFilterFields"
      :get-row-id="user => user.id"
      :group-options="userGroupOptions"
      :load="loadUsers"
      :storage-key="gridStorageKey"
      empty-title="Пользователи не найдены"
      filter-description="Комбинируйте фильтры для поиска пользователей на сервере."
      filter-title="Фильтры пользователей"
      item-label="пользователи"
      load-error-message="Не удалось загрузить пользователей"
      loading-label="Загрузка пользователей"
      search-placeholder="Поиск пользователей..."
    >
      <template #toolbar-actions>
        <Button
          v-if="canCreate"
          size="sm"
          class="h-9"
          @click="openCreateUser"
        >
          <PlusIcon class="size-4" />
          Создать пользователя
        </Button>
      </template>
    </ServerDataGrid>

    <Dialog :open="dialogOpen" @update:open="dialogOpen = $event">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ formTitle }}</DialogTitle>
          <DialogDescription>
            Пароль обязателен только для новых пользователей.
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="saveUser">
          <div class="grid gap-2">
            <Label for="username" required>Имя пользователя</Label>
            <Input id="username" v-model="form.username" required />
          </div>

          <div class="grid gap-2">
            <Label for="password" :required="!isEditMode">Пароль</Label>
            <Input
              id="password"
              v-model="form.password"
              type="password"
              maxlength="200"
              :required="!isEditMode"
              autocomplete="new-password"
            />
            <p class="text-xs text-muted-foreground">
              Минимум 8 символов: заглавная и строчная буква, цифра и символ.
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label for="firstName" required>Имя</Label>
              <Input id="firstName" v-model="form.firstName" required />
            </div>
            <div class="grid gap-2">
              <Label for="lastName" required>Фамилия</Label>
              <Input id="lastName" v-model="form.lastName" required />
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="roleId" required>Роль</Label>
            <Select
              :model-value="selectedRoleId"
              @update:model-value="value => selectRole(Number(value))"
            >
              <SelectTrigger id="roleId" class="w-full">
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="role in roles"
                  :key="role.id"
                  :value="role.id"
                >
                  {{ role.name }} - {{ role.code }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Мед центры</Label>
            <div class="max-h-48 overflow-y-auto rounded-md border p-3">
              <label
                v-for="tenant in tenants"
                :key="tenant.id"
                class="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  :checked="selectedTenantIds.includes(tenant.id)"
                  @update:checked="(checked: boolean) => toggleTenant(tenant.id, checked)"
                />
                <span>{{ tenant.name }}</span>
                <span class="text-xs text-muted-foreground">{{ tenant.code }}</span>
              </label>
              <p v-if="!tenants.length" class="text-xs text-muted-foreground">
                Мед центры не загружены.
              </p>
            </div>
          </div>

          <div v-if="hasManagerRole" class="grid gap-2">
            <Label required>Регион менеджера</Label>
            <Select v-model="form.managerRegionId">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Выберите регион" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="region in activeRegions"
                  :key="region.id"
                  :value="region.id"
                >
                  {{ region.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label class="flex items-center gap-2 rounded-md border p-3 text-sm">
            <Checkbox v-model:checked="form.isActive" />
            Активен
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" @click="dialogOpen = false">
              Отмена
            </Button>
            <Button type="submit" :disabled="saving">
              {{ isEditMode ? 'Сохранить' : 'Создать' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <UiAlertDialog :open="!!deactivateTarget" @update:open="open => !open && !deactivating && (deactivateTarget = null)">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Деактивировать пользователя?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Пользователь <strong>{{ deactivateTarget?.username }}</strong> будет деактивирован и больше не сможет войти.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="deactivating">
            Отмена
          </UiAlertDialogCancel>
          <UiAlertDialogAction
            :disabled="deactivating"
            class="bg-destructive text-white hover:bg-destructive/90"
            @click.prevent="deactivateUser"
          >
            Деактивировать
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </BasicPage>
</template>

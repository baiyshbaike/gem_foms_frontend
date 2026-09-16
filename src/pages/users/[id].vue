<script setup lang="ts">
import { ArrowLeftIcon, Building2Icon, KeyRoundIcon, RotateCcwIcon, SaveIcon, ShieldIcon, UserIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

import type { AdminPermission, AdminUser } from '@/services/types/dialysis'

import { Checkbox } from '@/components/ui/checkbox'
import { formatDateTime } from '@/lib/dialysis'
import { adminUserApi } from '@/services/api/dialysis.api'

const route = useRoute('/users/[id]')
const router = useRouter()

const loading = ref(true)
const user = ref<AdminUser | null>(null)
const allPermissions = ref<AdminPermission[]>([])
const selectedPermissionIds = ref<number[]>([])
const permissionSaveReason = ref('')
const permissionLoading = ref(false)
const permissionSaving = ref(false)
const permissionApiReady = ref(true)

const permissionGroups = computed(() => {
  const groups = new Map<string, AdminPermission[]>()
  for (const permission of allPermissions.value) {
    const list = groups.get(permission.module) ?? []
    list.push(permission)
    groups.set(permission.module, list)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
})

const selectedPermissionIdSet = computed(() => new Set(selectedPermissionIds.value))

const hasPermissionChanges = computed(() => {
  const currentIds = [...(user.value?.permissions ?? []).map(permission => permission.id)].sort((a, b) => a - b)
  const selectedIds = [...selectedPermissionIds.value].sort((a, b) => a - b)

  if (currentIds.length !== selectedIds.length) {
    return true
  }

  return currentIds.some((id, index) => id !== selectedIds[index])
})

const canSavePermissions = computed(() =>
  permissionApiReady.value
  && hasPermissionChanges.value
  && permissionSaveReason.value.trim().length >= 3,
)

async function loadUser() {
  loading.value = true
  try {
    user.value = await adminUserApi.get(Number(route.params.id))
    selectedPermissionIds.value = user.value.permissions.map(permission => permission.id)
    await Promise.all([
      loadPermissions(),
      loadUserPermissions(),
    ])
  }
  catch {
    toast.error('Не удалось загрузить пользователя')
    router.push('/users')
  }
  finally {
    loading.value = false
  }
}

async function loadPermissions() {
  try {
    allPermissions.value = await adminUserApi.permissions()
  }
  catch {
    allPermissions.value = []
  }
}

async function loadUserPermissions() {
  if (!user.value) {
    return
  }

  permissionLoading.value = true
  try {
    const directPermissions = await adminUserApi.userPermissions(user.value.id)
    const permissions = directPermissions.map(userPermission => userPermission.permission)
    user.value = {
      ...user.value,
      permissions,
    }
    selectedPermissionIds.value = permissions.map(permission => permission.id)
    permissionApiReady.value = true
  }
  catch {
    permissionApiReady.value = false
    selectedPermissionIds.value = user.value.permissions.map(permission => permission.id)
  }
  finally {
    permissionLoading.value = false
  }
}

function togglePermission(permissionId: number, checked: boolean | 'indeterminate') {
  if (checked === true) {
    if (!selectedPermissionIds.value.includes(permissionId)) {
      selectedPermissionIds.value = [...selectedPermissionIds.value, permissionId]
    }
    return
  }

  selectedPermissionIds.value = selectedPermissionIds.value.filter(id => id !== permissionId)
}

async function saveUserPermissions() {
  if (!user.value || permissionSaving.value) {
    return
  }

  const reason = permissionSaveReason.value.trim()
  if (reason.length < 3) {
    toast.error('Укажите причину')
    return
  }

  permissionSaving.value = true
  try {
    const updatedPermissions = await adminUserApi.updateUserPermissions(user.value.id, {
      permissionIds: [...selectedPermissionIds.value].sort((a, b) => a - b),
      reason,
    })
    const permissions = updatedPermissions.map(userPermission => userPermission.permission)
    user.value = {
      ...user.value,
      permissions,
    }
    selectedPermissionIds.value = permissions.map(permission => permission.id)
    permissionSaveReason.value = ''
    permissionApiReady.value = true
    toast.success('Разрешения пользователя сохранены')
  }
  catch {
    toast.error('Не удалось сохранить разрешения пользователя')
  }
  finally {
    permissionSaving.value = false
  }
}

async function resetPermissionsFromRole() {
  if (!user.value || permissionSaving.value) {
    return
  }

  permissionSaving.value = true
  try {
    const updatedPermissions = await adminUserApi.resetUserPermissionsFromRole(user.value.id)
    const permissions = updatedPermissions.map(userPermission => userPermission.permission)
    user.value = {
      ...user.value,
      permissions,
    }
    selectedPermissionIds.value = permissions.map(permission => permission.id)
    permissionSaveReason.value = ''
    permissionApiReady.value = true
    toast.success('Разрешения сброшены из роли')
  }
  catch {
    toast.error('Не удалось сбросить разрешения из роли')
  }
  finally {
    permissionSaving.value = false
  }
}

onMounted(loadUser)
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="flex items-center gap-4">
      <UiButton variant="ghost" size="icon" @click="router.push('/users')">
        <ArrowLeftIcon class="size-5" />
      </UiButton>
      <div>
        <h1 v-if="user" class="text-xl font-semibold">
          {{ user.username }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ user ? `${user.lastName} ${user.firstName}` : 'Загрузка...' }}
        </p>
      </div>
      <UiBadge v-if="user" :variant="user.isActive ? 'default' : 'secondary'">
        {{ user.isActive ? 'Активен' : 'Неактивен' }}
      </UiBadge>
    </div>

    <UiCard v-if="loading">
      <UiCardContent class="py-8 text-center text-muted-foreground">
        Загрузка пользователя...
      </UiCardContent>
    </UiCard>

    <template v-else-if="user">
      <UiCard>
        <UiCardHeader>
          <div class="flex items-center gap-2">
            <UserIcon class="size-4 text-muted-foreground" />
            <UiCardTitle>Основная информация</UiCardTitle>
          </div>
        </UiCardHeader>
        <UiCardContent class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div class="text-xs text-muted-foreground">
              Имя пользователя
            </div>
            <div class="font-medium">
              {{ user.username }}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground">
              ФИО
            </div>
            <div class="font-medium">
              {{ user.lastName }} {{ user.firstName }}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground">
              Регион менеджера
            </div>
            <div class="font-medium">
              {{ user.managerRegion?.name ?? '-' }}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground">
              Создан
            </div>
            <div>
              {{ formatDateTime(user.createdAt) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground">
              Обновлён
            </div>
            <div>
              {{ formatDateTime(user.updatedAt) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground">
              Последний вход
            </div>
            <div>
              {{ formatDateTime(user.lastLoginAt) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground">
              Неудачных входов
            </div>
            <div>
              {{ user.failedLoginCount }}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground">
              Блокировка до
            </div>
            <div>
              {{ formatDateTime(user.lockoutEndAt) }}
            </div>
          </div>
        </UiCardContent>
      </UiCard>

      <div class="grid gap-6 lg:grid-cols-2">
        <UiCard>
          <UiCardHeader>
            <div class="flex items-center gap-2">
              <ShieldIcon class="size-4 text-muted-foreground" />
              <UiCardTitle>Роли</UiCardTitle>
            </div>
          </UiCardHeader>
          <UiCardContent>
            <div class="flex flex-wrap gap-2">
              <UiBadge variant="secondary">
                {{ user.role.name }}
              </UiBadge>
              <span class="text-sm text-muted-foreground">
                {{ user.role.code }}
              </span>
            </div>
          </UiCardContent>
        </UiCard>

        <UiCard>
          <UiCardHeader>
            <div class="flex items-center gap-2">
              <Building2Icon class="size-4 text-muted-foreground" />
              <UiCardTitle>Мед центры</UiCardTitle>
            </div>
          </UiCardHeader>
          <UiCardContent>
            <div class="flex flex-wrap gap-2">
              <UiBadge v-for="tenant in user.tenants" :key="tenant.id" variant="outline">
                {{ tenant.name }}
              </UiBadge>
              <span v-if="!user.tenants.length" class="text-sm text-muted-foreground">
                Мед центры не назначены
              </span>
            </div>
          </UiCardContent>
        </UiCard>
      </div>

      <UiCard>
        <UiCardHeader>
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div class="flex items-center gap-2">
                <KeyRoundIcon class="size-4 text-muted-foreground" />
                <UiCardTitle>Разрешения пользователя</UiCardTitle>
              </div>
              <UiCardDescription>
                {{ selectedPermissionIds.length }} из {{ allPermissions.length }} разрешений выбрано.
              </UiCardDescription>
            </div>
            <div class="flex flex-wrap gap-2">
              <UiButton
                type="button"
                size="sm"
                variant="outline"
                :disabled="permissionSaving || !permissionApiReady"
                @click="resetPermissionsFromRole"
              >
                <RotateCcwIcon class="size-4" />
                Сбросить из роли
              </UiButton>
              <UiButton
                type="button"
                size="sm"
                :disabled="permissionSaving || !canSavePermissions"
                @click="saveUserPermissions"
              >
                <SaveIcon class="size-4" />
                Сохранить
              </UiButton>
            </div>
          </div>
        </UiCardHeader>
        <UiCardContent class="space-y-5">
          <div
            v-if="!permissionApiReady"
            class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
          >
            Новый backend endpoint разрешений ещё недоступен. Ниже показан текущий список из карточки пользователя.
          </div>

          <div class="grid gap-2">
            <UiLabel for="permission-reason">
              Причина изменения
            </UiLabel>
            <UiTextarea
              id="permission-reason"
              v-model="permissionSaveReason"
              rows="2"
              maxlength="500"
              placeholder="Например: настройка индивидуального доступа пользователя"
              :disabled="permissionSaving || !permissionApiReady"
            />
            <p class="text-xs text-muted-foreground">
              Причина обязательна только при сохранении ручных изменений.
            </p>
          </div>

          <div v-if="permissionLoading" class="py-8 text-center text-sm text-muted-foreground">
            Загрузка разрешений...
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="[module, permissions] in permissionGroups"
              :key="module"
              class="rounded-md border p-4"
            >
              <div class="mb-3 text-sm font-medium">
                {{ module }}
              </div>
              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <label
                  v-for="permission in permissions"
                  :key="permission.id"
                  class="flex min-h-[72px] cursor-pointer items-start gap-3 rounded-md border bg-background px-3 py-2 transition-colors hover:bg-muted/40"
                  :class="{ 'border-primary/40 bg-primary/5': selectedPermissionIdSet.has(permission.id) }"
                >
                  <Checkbox
                    class="mt-0.5"
                    :checked="selectedPermissionIdSet.has(permission.id)"
                    :disabled="permissionSaving || !permissionApiReady"
                    @update:checked="togglePermission(permission.id, $event)"
                  />
                  <span>
                    <span class="block text-sm font-medium">
                      {{ permission.name }}
                    </span>
                    <span class="block text-xs text-muted-foreground">
                      {{ permission.code }}
                    </span>
                    <span v-if="permission.description" class="mt-1 block text-xs text-muted-foreground">
                      {{ permission.description }}
                    </span>
                  </span>
                </label>
              </div>
            </div>
            <p v-if="!allPermissions.length" class="text-sm text-muted-foreground">
              Разрешения не найдены.
            </p>
          </div>
        </UiCardContent>
      </UiCard>
    </template>
  </div>
</template>

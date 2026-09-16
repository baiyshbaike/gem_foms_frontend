<script setup lang="ts">
import { SearchIcon } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'

import type { MedCardPatientLookup } from '@/services/types/dialysis'

import { formatApiError } from '@/lib/api-error'
import { medCardApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits<{ saved: [] }>()
const router = useRouter()
const authStore = useAuthStore()
const { activeTenant, tenants } = storeToRefs(authStore)
const open = ref(false)
const saving = ref(false)
const lookingUpPatient = ref(false)
const patientLookup = ref<MedCardPatientLookup | null>(null)
const inn = ref('')
const selectedTenantId = ref('')

const requiresTenantSelection = computed(() => authStore.hasPermission('tenant.access_all'))
const effectiveTenantId = computed(() => requiresTenantSelection.value
  ? selectedTenantId.value
  : activeTenant.value?.id ?? '')
const hasTenantContext = computed(() => Boolean(effectiveTenantId.value))

const lookupName = computed(() => patientLookup.value
  ? `${patientLookup.value.lastName} ${patientLookup.value.firstName} ${patientLookup.value.middleName}`
  : '')

const canLookup = computed(() => !lookingUpPatient.value && hasTenantContext.value)
const canSave = computed(() => !saving.value && Boolean(patientLookup.value) && hasTenantContext.value)

watch(selectedTenantId, () => {
  patientLookup.value = null
})

async function openCreate() {
  patientLookup.value = null
  inn.value = ''
  selectedTenantId.value = requiresTenantSelection.value ? '' : activeTenant.value?.id ?? ''
  open.value = true

  if (!tenants.value.length) {
    try {
      await authStore.loadTenants()
    }
    catch {
      toast.error('Не удалось загрузить список мед центров')
    }
  }
}

function ensureTenantContext() {
  const tenantId = effectiveTenantId.value
  if (!tenantId) {
    toast.error(requiresTenantSelection.value ? 'Выберите мед центр' : 'Не выбран активный мед центр')
    return false
  }

  return true
}

async function lookupPatient() {
  const trimmedInn = inn.value.trim()
  patientLookup.value = null

  if (!ensureTenantContext()) {
    return
  }

  if (!/^\d{14}$/.test(trimmedInn)) {
    toast.error('ИНН должен содержать ровно 14 цифр')
    return
  }

  lookingUpPatient.value = true
  try {
    const patient = await medCardApi.lookupPatient(
      trimmedInn,
      requiresTenantSelection.value ? effectiveTenantId.value : null,
    )
    patientLookup.value = patient
    toast.success('Пациент найден')
  }
  catch {
    toast.error('Пациент не найден')
  }
  finally {
    lookingUpPatient.value = false
  }
}

async function createAndGoToDetail() {
  if (!patientLookup.value)
    return

  saving.value = true
  try {
    if (!ensureTenantContext()) {
      return
    }

    const medCard = await medCardApi.create({
      tenantId: requiresTenantSelection.value ? effectiveTenantId.value : null,
      patientId: patientLookup.value.patientId,
    })
    open.value = false
    toast.success('Медицинская карта создана')
    emit('saved')
    router.push(`/med-cards/${medCard.id}`)
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось создать медицинскую карту'))
  }
  finally {
    saving.value = false
  }
}

defineExpose({ openCreate })
</script>

<template>
  <UiDialog :open="open" @update:open="open = $event">
    <UiDialogContent class="sm:max-w-[460px]">
      <UiDialogHeader>
        <UiDialogTitle>Новая мед. карта</UiDialogTitle>
        <UiDialogDescription>
          Найдите пациента по ИНН для создания новой карты лечения.
        </UiDialogDescription>
      </UiDialogHeader>

      <form class="space-y-4" @submit.prevent="createAndGoToDetail">
        <div v-if="requiresTenantSelection" class="grid gap-2">
          <UiLabel required>
            Мед центр
          </UiLabel>
          <UiSelect v-model:model-value="selectedTenantId" :disabled="saving || lookingUpPatient">
            <UiSelectTrigger>
              <UiSelectValue placeholder="Выберите мед центр" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
                {{ tenant.name }}
              </UiSelectItem>
            </UiSelectContent>
          </UiSelect>
          <p v-if="!tenants.length" class="text-xs text-muted-foreground">
            Нет доступных мед центров для данного аккаунта.
          </p>
        </div>

        <div v-else class="rounded-md border bg-muted/20 px-4 py-3 text-sm">
          <p class="font-medium">
            {{ activeTenant?.name ?? 'Не выбран активный мед центр' }}
          </p>
          <p class="text-xs text-muted-foreground">
            Медицинская карта создаётся в текущем активном мед центре.
          </p>
        </div>

        <div class="grid gap-2">
          <UiLabel required>
            ИНН пациента
          </UiLabel>
          <div class="flex gap-2">
            <UiInput
              v-model="inn"
              inputmode="numeric"
              maxlength="14"
              placeholder="14-значный ИНН"
            />
            <UiButton
              type="button"
              variant="outline"
              :disabled="!canLookup"
              @click="lookupPatient"
            >
              <SearchIcon class="mr-2 size-4" />
              Найти
            </UiButton>
          </div>
        </div>

        <div v-if="patientLookup" class="rounded-md border bg-muted/30 px-4 py-3">
          <p class="font-medium">
            {{ lookupName }}
          </p>
          <p class="text-xs text-muted-foreground">
            Пациент #{{ patientLookup.patientId }}
          </p>
        </div>

        <div v-else class="rounded-md border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
          {{ hasTenantContext ? 'Введите 14-значный ИНН и нажмите "Найти".' : 'Выберите активный мед центр перед поиском пациента.' }}
        </div>

        <div class="flex justify-end gap-2">
          <UiButton type="button" variant="outline" @click="open = false">
            Отмена
          </UiButton>
          <UiButton type="submit" :disabled="!canSave">
            Создать и перейти
          </UiButton>
        </div>
      </form>
    </UiDialogContent>
  </UiDialog>
</template>

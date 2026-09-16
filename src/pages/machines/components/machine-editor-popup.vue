<script setup lang="ts">
import { LoaderCircleIcon, SaveIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

import type { MachineAcquisitionType, MedCenterMachine, Tenant } from '@/services/types/dialysis'

import { FieldError } from '@/components/ui/field'
import { acquisitionTypeOptions, emptyToNull } from '@/lib/dialysis'
import { machineApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits<{ saved: [] }>()

type MachineField
  = | 'tenantId'
    | 'name'
    | 'model'
    | 'serialNumber'
    | 'inventoryNumber'
    | 'manufacturer'
    | 'manufactureYear'
    | 'certificateIssuedAt'
    | 'permitExpiresAt'
    | 'dailySessionLimit'
    | 'betweenSessionCooldownMinutes'
    | 'dailyLimitCooldownMinutes'

const authStore = useAuthStore()
const open = ref(false)
const saving = ref(false)
const loadingEdit = ref(false)
const loadingTenants = ref(false)
const editingId = ref<number | null>(null)
const submitted = ref(false)

const today = new Date()
const nextYear = new Date(today)
nextYear.setFullYear(today.getFullYear() + 1)

const form = reactive({
  tenantId: '',
  acquisitionType: '1',
  inventoryNumber: '',
  name: '',
  model: '',
  serialNumber: '',
  manufacturer: '',
  manufacturingCountry: '',
  manufactureYear: String(today.getFullYear()),
  certificateHolder: '',
  certificateHolderCountry: '',
  certificateNumber: '',
  certificateCountry: '',
  certificateIssuedAt: today.toISOString().slice(0, 10),
  permitName: '',
  permitNumber: '',
  permitSeries: '',
  permitExpiresAt: nextYear.toISOString().slice(0, 10),
  dailySessionLimit: '4',
  betweenSessionCooldownMinutes: '30',
  dailyLimitCooldownMinutes: '240',
  isApproved: true,
  isActive: true,
})

const isEditMode = computed(() => editingId.value !== null)
const tenantOptions = computed<Tenant[]>(() => authStore.tenants)
const formTitle = computed(() => isEditMode.value ? `Редактирование аппарата #${editingId.value}` : 'Новый аппарат')
const canSubmit = computed(() => !saving.value && !loadingEdit.value && !loadingTenants.value)
const formErrors = computed(() => submitted.value ? validateForm() : {})

async function openCreate() {
  editingId.value = null
  submitted.value = false
  resetForm()
  open.value = true
  await ensureTenants()
  form.tenantId = tenantOptions.value[0]?.id ?? ''
}

async function openEdit(machineId: number) {
  editingId.value = machineId
  submitted.value = false
  loadingEdit.value = true
  open.value = true

  try {
    await ensureTenants()

    const machine = await machineApi.get(machineId)
    applyMachine(machine)
  }
  catch {
    toast.error('Не удалось загрузить аппарат')
    editingId.value = null
    open.value = false
  }
  finally {
    loadingEdit.value = false
  }
}

async function ensureTenants() {
  if (authStore.tenants.length > 0) {
    return
  }

  loadingTenants.value = true
  try {
    await authStore.loadTenants()
  }
  catch {
    toast.error('Не удалось загрузить список мед. центров')
  }
  finally {
    loadingTenants.value = false
  }
}

function applyMachine(machine: MedCenterMachine) {
  Object.assign(form, {
    tenantId: machine.tenantId,
    acquisitionType: String(machine.acquisitionType),
    inventoryNumber: machine.inventoryNumber,
    name: machine.name,
    model: machine.model,
    serialNumber: machine.serialNumber,
    manufacturer: machine.manufacturer,
    manufacturingCountry: machine.manufacturingCountry ?? '',
    manufactureYear: String(machine.manufactureYear),
    certificateHolder: machine.certificateHolder ?? '',
    certificateHolderCountry: machine.certificateHolderCountry ?? '',
    certificateNumber: machine.certificateNumber ?? '',
    certificateCountry: machine.certificateCountry ?? '',
    certificateIssuedAt: machine.certificateIssuedAt.slice(0, 10),
    permitName: machine.permitName ?? '',
    permitNumber: machine.permitNumber ?? '',
    permitSeries: machine.permitSeries ?? '',
    permitExpiresAt: machine.permitExpiresAt.slice(0, 10),
    dailySessionLimit: String(machine.dailySessionLimit),
    betweenSessionCooldownMinutes: String(machine.betweenSessionCooldownMinutes),
    dailyLimitCooldownMinutes: String(machine.dailyLimitCooldownMinutes),
    isApproved: machine.isApproved,
    isActive: machine.isActive,
  })
}

function resetForm() {
  Object.assign(form, {
    tenantId: tenantOptions.value[0]?.id ?? '',
    acquisitionType: '1',
    inventoryNumber: '',
    name: '',
    model: '',
    serialNumber: '',
    manufacturer: '',
    manufacturingCountry: '',
    manufactureYear: String(today.getFullYear()),
    certificateHolder: '',
    certificateHolderCountry: '',
    certificateNumber: '',
    certificateCountry: '',
    certificateIssuedAt: today.toISOString().slice(0, 10),
    permitName: '',
    permitNumber: '',
    permitSeries: '',
    permitExpiresAt: nextYear.toISOString().slice(0, 10),
    dailySessionLimit: '4',
    betweenSessionCooldownMinutes: '30',
    dailyLimitCooldownMinutes: '240',
    isApproved: true,
    isActive: true,
  })
}

function payload() {
  return {
    acquisitionType: Number(form.acquisitionType) as MachineAcquisitionType,
    inventoryNumber: form.inventoryNumber.trim(),
    name: form.name.trim(),
    model: form.model.trim(),
    serialNumber: form.serialNumber.trim(),
    manufacturer: form.manufacturer.trim(),
    manufacturingCountry: emptyToNull(form.manufacturingCountry),
    manufactureYear: Number(form.manufactureYear),
    certificateHolder: emptyToNull(form.certificateHolder),
    certificateHolderCountry: emptyToNull(form.certificateHolderCountry),
    certificateNumber: emptyToNull(form.certificateNumber),
    certificateCountry: emptyToNull(form.certificateCountry),
    certificateIssuedAt: form.certificateIssuedAt,
    permitName: emptyToNull(form.permitName),
    permitNumber: emptyToNull(form.permitNumber),
    permitSeries: emptyToNull(form.permitSeries),
    permitExpiresAt: form.permitExpiresAt,
    dailySessionLimit: Number(form.dailySessionLimit),
    betweenSessionCooldownMinutes: Number(form.betweenSessionCooldownMinutes),
    dailyLimitCooldownMinutes: Number(form.dailyLimitCooldownMinutes),
    isApproved: form.isApproved,
    isActive: form.isActive,
  }
}

async function saveMachine() {
  submitted.value = true
  if (Object.keys(validateForm()).length > 0) {
    return
  }

  saving.value = true
  try {
    if (editingId.value) {
      await machineApi.update(editingId.value, payload())
    }
    else {
      await machineApi.create({
        ...payload(),
        tenantId: form.tenantId,
      })
    }

    open.value = false
    emit('saved')
  }
  catch {
    toast.error('Не удалось сохранить аппарат')
  }
  finally {
    saving.value = false
  }
}

function numberInRange(value: string, min: number, max: number) {
  const numberValue = Number(value)
  return Number.isInteger(numberValue) && numberValue >= min && numberValue <= max
}

function validateForm(): Partial<Record<MachineField, string[]>> {
  const errors: Partial<Record<MachineField, string[]>> = {}

  requireText(errors, 'tenantId', form.tenantId, 'Выберите мед. центр')
  requireText(errors, 'name', form.name, 'Наименование обязательно')
  requireText(errors, 'model', form.model, 'Модель обязательна')
  requireText(errors, 'serialNumber', form.serialNumber, 'Серийный номер обязателен')
  requireText(errors, 'inventoryNumber', form.inventoryNumber, 'Инвентарный номер обязателен')
  requireText(errors, 'manufacturer', form.manufacturer, 'Производитель обязателен')
  requireDate(errors, 'certificateIssuedAt', form.certificateIssuedAt, 'Дата выдачи сертификата обязательна')
  requireDate(errors, 'permitExpiresAt', form.permitExpiresAt, 'Срок действия разрешения обязателен')
  requireNumber(errors, 'manufactureYear', form.manufactureYear, 1980, 2100, 'Год выпуска должен быть от 1980 до 2100')
  requireNumber(errors, 'dailySessionLimit', form.dailySessionLimit, 1, 30, 'Нагрузка в сутки должна быть от 1 до 30')
  requireNumber(errors, 'betweenSessionCooldownMinutes', form.betweenSessionCooldownMinutes, 1, 1440, 'Пауза между сеансами должна быть от 1 до 1440 минут')
  requireNumber(errors, 'dailyLimitCooldownMinutes', form.dailyLimitCooldownMinutes, 1, 1440, 'Пауза после лимита должна быть от 1 до 1440 минут')

  return errors
}

function requireText(errors: Partial<Record<MachineField, string[]>>, field: MachineField, value: string, message: string) {
  if (!value.trim()) {
    errors[field] = [message]
  }
}

function requireDate(errors: Partial<Record<MachineField, string[]>>, field: MachineField, value: string, message: string) {
  if (!value) {
    errors[field] = [message]
  }
}

function requireNumber(errors: Partial<Record<MachineField, string[]>>, field: MachineField, value: string, min: number, max: number, message: string) {
  if (!numberInRange(value, min, max)) {
    errors[field] = [message]
  }
}

function invalid(field: MachineField) {
  return !!formErrors.value[field]?.length
}

defineExpose({ openCreate, openEdit })
</script>

<template>
  <UiDialog :open="open" @update:open="open = $event">
    <UiDialogScrollContent class="max-w-[920px] gap-0 p-0">
      <UiDialogHeader class="border-b px-6 py-5 text-left">
        <UiDialogTitle>{{ formTitle }}</UiDialogTitle>
        <UiDialogDescription>
          Заполните параметры аппарата и выберите мед. центр, которому он принадлежит.
        </UiDialogDescription>
      </UiDialogHeader>

      <form class="flex min-h-0 flex-col" novalidate @submit.prevent="saveMachine">
        <div class="grid max-h-[calc(100dvh-220px)] gap-6 overflow-y-auto px-6 py-5">
          <section class="grid gap-4">
            <div class="grid gap-2 md:max-w-md">
              <UiLabel for="machine-tenant" required :data-error="invalid('tenantId')" class="data-[error=true]:text-destructive">
                Мед. центр
              </UiLabel>
              <UiSelect
                v-model:model-value="form.tenantId"
                :disabled="saving || loadingTenants || isEditMode"
              >
                <UiSelectTrigger id="machine-tenant" class="w-full" :aria-invalid="invalid('tenantId')">
                  <UiSelectValue placeholder="Выберите мед. центр" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem v-for="tenant in tenantOptions" :key="tenant.id" :value="tenant.id">
                    {{ tenant.name }}
                  </UiSelectItem>
                </UiSelectContent>
              </UiSelect>
              <FieldError :errors="formErrors.tenantId" />
              <p v-if="!tenantOptions.length && !loadingTenants" class="text-sm text-destructive">
                Нет доступных мед. центров для создания аппарата.
              </p>
            </div>
          </section>

          <UiSeparator />

          <section class="grid gap-4">
            <div>
              <h3 class="text-sm font-semibold">
                Основная информация
              </h3>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="grid gap-2">
                <UiLabel for="machine-name" required :data-error="invalid('name')" class="data-[error=true]:text-destructive">
                  Наименование
                </UiLabel>
                <UiInput id="machine-name" v-model="form.name" required maxlength="200" :disabled="saving || loadingEdit" :aria-invalid="invalid('name')" />
                <FieldError :errors="formErrors.name" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-model" required :data-error="invalid('model')" class="data-[error=true]:text-destructive">
                  Модель
                </UiLabel>
                <UiInput id="machine-model" v-model="form.model" required maxlength="100" :disabled="saving || loadingEdit" :aria-invalid="invalid('model')" />
                <FieldError :errors="formErrors.model" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-manufacturer" required :data-error="invalid('manufacturer')" class="data-[error=true]:text-destructive">
                  Производитель
                </UiLabel>
                <UiInput id="machine-manufacturer" v-model="form.manufacturer" required maxlength="200" :disabled="saving || loadingEdit" :aria-invalid="invalid('manufacturer')" />
                <FieldError :errors="formErrors.manufacturer" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-country">
                  Страна производства
                </UiLabel>
                <UiInput id="machine-country" v-model="form.manufacturingCountry" maxlength="100" :disabled="saving || loadingEdit" />
              </div>
              <div class="grid gap-2">
                <UiLabel required>
                  Тип приобретения
                </UiLabel>
                <UiSelect v-model:model-value="form.acquisitionType" :disabled="saving || loadingEdit">
                  <UiSelectTrigger class="w-full">
                    <UiSelectValue placeholder="Выберите тип" />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem v-for="option in acquisitionTypeOptions" :key="option.value" :value="String(option.value)">
                      {{ option.label }}
                    </UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-year" required :data-error="invalid('manufactureYear')" class="data-[error=true]:text-destructive">
                  Год выпуска
                </UiLabel>
                <UiInput id="machine-year" v-model="form.manufactureYear" type="number" min="1980" max="2100" required :disabled="saving || loadingEdit" :aria-invalid="invalid('manufactureYear')" />
                <FieldError :errors="formErrors.manufactureYear" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-serial" required :data-error="invalid('serialNumber')" class="data-[error=true]:text-destructive">
                  Серийный номер
                </UiLabel>
                <UiInput id="machine-serial" v-model="form.serialNumber" required maxlength="100" :disabled="saving || loadingEdit" :aria-invalid="invalid('serialNumber')" />
                <FieldError :errors="formErrors.serialNumber" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-inventory" required :data-error="invalid('inventoryNumber')" class="data-[error=true]:text-destructive">
                  Инвентарный номер
                </UiLabel>
                <UiInput id="machine-inventory" v-model="form.inventoryNumber" required maxlength="50" :disabled="saving || loadingEdit" :aria-invalid="invalid('inventoryNumber')" />
                <FieldError :errors="formErrors.inventoryNumber" />
              </div>
            </div>
          </section>

          <UiSeparator />

          <section class="grid gap-4">
            <div>
              <h3 class="text-sm font-semibold">
                Сертификат и разрешение
              </h3>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="grid gap-2">
                <UiLabel for="machine-certificate-date" required :data-error="invalid('certificateIssuedAt')" class="data-[error=true]:text-destructive">
                  Дата выдачи сертификата
                </UiLabel>
                <UiInput id="machine-certificate-date" v-model="form.certificateIssuedAt" type="date" required :disabled="saving || loadingEdit" :aria-invalid="invalid('certificateIssuedAt')" />
                <FieldError :errors="formErrors.certificateIssuedAt" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-permit-expires" required :data-error="invalid('permitExpiresAt')" class="data-[error=true]:text-destructive">
                  Срок действия разрешения
                </UiLabel>
                <UiInput id="machine-permit-expires" v-model="form.permitExpiresAt" type="date" required :disabled="saving || loadingEdit" :aria-invalid="invalid('permitExpiresAt')" />
                <FieldError :errors="formErrors.permitExpiresAt" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-certificate-holder">
                  Держатель сертификата
                </UiLabel>
                <UiInput id="machine-certificate-holder" v-model="form.certificateHolder" maxlength="200" :disabled="saving || loadingEdit" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-certificate-holder-country">
                  Страна держателя
                </UiLabel>
                <UiInput id="machine-certificate-holder-country" v-model="form.certificateHolderCountry" maxlength="100" :disabled="saving || loadingEdit" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-certificate-number">
                  Номер сертификата
                </UiLabel>
                <UiInput id="machine-certificate-number" v-model="form.certificateNumber" maxlength="100" :disabled="saving || loadingEdit" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-certificate-country">
                  Страна сертификата
                </UiLabel>
                <UiInput id="machine-certificate-country" v-model="form.certificateCountry" maxlength="100" :disabled="saving || loadingEdit" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-permit-name">
                  Разрешение
                </UiLabel>
                <UiInput id="machine-permit-name" v-model="form.permitName" maxlength="200" :disabled="saving || loadingEdit" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-permit-number">
                  Номер разрешения
                </UiLabel>
                <UiInput id="machine-permit-number" v-model="form.permitNumber" maxlength="100" :disabled="saving || loadingEdit" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-permit-series">
                  Серия разрешения
                </UiLabel>
                <UiInput id="machine-permit-series" v-model="form.permitSeries" maxlength="100" :disabled="saving || loadingEdit" />
              </div>
            </div>
          </section>

          <UiSeparator />

          <section class="grid gap-4">
            <div>
              <h3 class="text-sm font-semibold">
                Рабочие лимиты
              </h3>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div class="grid gap-2">
                <UiLabel for="machine-daily-limit" required :data-error="invalid('dailySessionLimit')" class="data-[error=true]:text-destructive">
                  Нагрузка в сутки
                </UiLabel>
                <UiInput id="machine-daily-limit" v-model="form.dailySessionLimit" type="number" min="1" max="30" required :disabled="saving || loadingEdit" :aria-invalid="invalid('dailySessionLimit')" />
                <FieldError :errors="formErrors.dailySessionLimit" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-between-cooldown" required :data-error="invalid('betweenSessionCooldownMinutes')" class="data-[error=true]:text-destructive">
                  Пауза между сеансами (мин)
                </UiLabel>
                <UiInput id="machine-between-cooldown" v-model="form.betweenSessionCooldownMinutes" type="number" min="1" max="1440" required :disabled="saving || loadingEdit" :aria-invalid="invalid('betweenSessionCooldownMinutes')" />
                <FieldError :errors="formErrors.betweenSessionCooldownMinutes" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="machine-daily-cooldown" required :data-error="invalid('dailyLimitCooldownMinutes')" class="data-[error=true]:text-destructive">
                  Пауза после лимита (мин)
                </UiLabel>
                <UiInput id="machine-daily-cooldown" v-model="form.dailyLimitCooldownMinutes" type="number" min="1" max="1440" required :disabled="saving || loadingEdit" :aria-invalid="invalid('dailyLimitCooldownMinutes')" />
                <FieldError :errors="formErrors.dailyLimitCooldownMinutes" />
              </div>
            </div>

            <div class="flex flex-wrap gap-4 rounded-md border p-3">
              <label class="flex items-center gap-2 text-sm">
                <input v-model="form.isApproved" type="checkbox" class="size-4" :disabled="saving || loadingEdit">
                Одобрен
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input v-model="form.isActive" type="checkbox" class="size-4" :disabled="saving || loadingEdit">
                Активен
              </label>
            </div>
          </section>
        </div>

        <UiDialogFooter class="border-t px-6 py-4">
          <UiButton type="button" variant="outline" :disabled="saving" @click="open = false">
            Отмена
          </UiButton>
          <UiButton type="submit" :disabled="!canSubmit">
            <LoaderCircleIcon v-if="saving || loadingEdit || loadingTenants" class="size-4 animate-spin" />
            <SaveIcon v-else class="size-4" />
            {{ isEditMode ? 'Сохранить' : 'Создать аппарат' }}
          </UiButton>
        </UiDialogFooter>
      </form>
    </UiDialogScrollContent>
  </UiDialog>
</template>

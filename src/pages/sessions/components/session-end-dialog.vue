<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import type { EmployeeTenant } from '@/services/types/dialysis'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { formatApiError } from '@/lib/api-error'
import { employeeTenantApi, sessionApi } from '@/services/api/dialysis.api'

const props = defineProps<{
  open: boolean
  sessionId: number | null
  patientName: string | null
  tenantId: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const form = reactive({
  patientWeight: '',
  hypotension: false,
  hypertension: false,
  muscleCrampsLimbs: false,
  heartRhythmDisturbances: false,
  headaches: false,
  attacksAnginaPectoris: false,
  otherComplications: '',
  complicationCorrection: '',
  plannedAppointments: '',
  recommendations: '',
  effectiveTime: '',
  description: '',
  dutyNurseEmployeeTenantId: '',
  sys: '',
  dia: '',
  ritm: '',
  temp: '',
})

const actionLoading = ref(false)
const dutyNurses = ref<EmployeeTenant[]>([])
const dutyNursesLoading = ref(false)
const submitted = ref(false)

type EndField = 'patientWeight' | 'sys' | 'dia' | 'ritm' | 'temp' | 'dutyNurseEmployeeTenantId'

const requiredFields: ReadonlyArray<{
  field: EndField
  label: string
}> = [
  { field: 'patientWeight', label: 'Вес пациента' },
  { field: 'sys', label: 'Систолическое давление' },
  { field: 'dia', label: 'Диастолическое давление' },
  { field: 'ritm', label: 'Частота' },
  { field: 'temp', label: 'Температура' },
  { field: 'dutyNurseEmployeeTenantId', label: 'Дежурная медсестра' },
]

const measurementRanges: ReadonlyArray<{
  field: Extract<EndField, 'sys' | 'dia' | 'ritm' | 'temp'>
  label: string
  min: number
  max: number
}> = [
  { field: 'sys', label: 'Систолическое давление', min: 40, max: 300 },
  { field: 'dia', label: 'Диастолическое давление', min: 20, max: 200 },
  { field: 'temp', label: 'Температура', min: 30, max: 45 },
  { field: 'ritm', label: 'Пульс', min: 20, max: 250 },
]

const formErrors = computed(() => submitted.value ? validateFields() : {})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})
const isBusy = computed(() => actionLoading.value || dutyNursesLoading.value)

function resetForm() {
  form.patientWeight = ''
  form.hypotension = false
  form.hypertension = false
  form.muscleCrampsLimbs = false
  form.heartRhythmDisturbances = false
  form.headaches = false
  form.attacksAnginaPectoris = false
  form.otherComplications = ''
  form.complicationCorrection = ''
  form.plannedAppointments = ''
  form.recommendations = ''
  form.effectiveTime = ''
  form.description = ''
  form.dutyNurseEmployeeTenantId = ''
  form.sys = ''
  form.dia = ''
  form.ritm = ''
  form.temp = ''
  submitted.value = false
}

function toNullableNumber(value: string | number | null | undefined): number | null {
  const normalized = String(value ?? '').replace(',', '.').trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function toNullableString(value: string): string | null {
  return value.trim() || null
}

function validateForm(): string[] {
  return missingRequiredFields().map(item => item.label)
}

function validateFields(): Partial<Record<EndField, string[]>> {
  const errors: Partial<Record<EndField, string[]>> = {}

  for (const item of missingRequiredFields()) {
    errors[item.field] = ['Поле обязательно']
  }

  for (const item of measurementRanges) {
    if (errors[item.field]) {
      continue
    }

    const error = rangeError(form[item.field], item.label, item.min, item.max)
    if (error) {
      errors[item.field] = [error]
    }
  }

  const dutyNurseId = Number(form.dutyNurseEmployeeTenantId)
  if (!errors.dutyNurseEmployeeTenantId && (!Number.isFinite(dutyNurseId) || dutyNurseId < 1)) {
    errors.dutyNurseEmployeeTenantId = ['Выберите дежурную медсестру']
  }

  return errors
}

function missingRequiredFields() {
  return requiredFields.filter(item => !String(form[item.field] ?? '').trim())
}

function rangeError(value: string, label: string, min: number, max: number): string | null {
  const parsed = toNullableNumber(value)
  if (parsed === null) {
    return `Значение поля "${label}" должно быть числом.`
  }

  return parsed < min || parsed > max
    ? `Значение поля "${label}" должно быть в диапазоне от ${min} до ${max}.`
    : null
}

function invalid(field: EndField) {
  return !!formErrors.value[field]?.length
}

async function loadDutyNurses() {
  if (!props.tenantId) {
    dutyNurses.value = []
    return
  }

  dutyNursesLoading.value = true
  try {
    dutyNurses.value = await employeeTenantApi.list(false, [props.tenantId])
  }
  catch (error) {
    dutyNurses.value = []
    toast.error(formatApiError(error, 'Не удалось загрузить сотрудников медцентра'))
  }
  finally {
    dutyNursesLoading.value = false
  }
}

async function saveEnd() {
  if (!props.sessionId) {
    return
  }

  submitted.value = true
  const errors = validateFields()
  if (Object.keys(errors).length > 0) {
    const requiredErrors = validateForm()
    toast.error(requiredErrors.length > 0
      ? `Заполните обязательные поля: ${requiredErrors.join(', ')}`
      : 'Исправьте ошибки в форме')
    return
  }

  actionLoading.value = true
  try {
    await sessionApi.saveEnd(props.sessionId, {
      endSession: {
        patientWeight: form.patientWeight.trim(),
        hypotension: form.hypotension,
        hypertension: form.hypertension,
        muscleCrampsLimbs: form.muscleCrampsLimbs,
        heartRhythmDisturbances: form.heartRhythmDisturbances,
        headaches: form.headaches,
        attacksAnginaPectoris: form.attacksAnginaPectoris,
        otherComplications: toNullableString(form.otherComplications),
        complicationCorrection: toNullableString(form.complicationCorrection),
        plannedAppointments: toNullableString(form.plannedAppointments),
        recommendations: toNullableString(form.recommendations),
        effectiveTime: toNullableString(form.effectiveTime),
        description: toNullableString(form.description),
        dutyNurseEmployeeTenantId: Number(form.dutyNurseEmployeeTenantId),
      },
      sessionMeasurement: {
        sys: toNullableNumber(form.sys),
        dia: toNullableNumber(form.dia),
        ritm: toNullableNumber(form.ritm),
        temp: toNullableNumber(form.temp),
        measuredAt: null,
        note: null,
      },
    })
    resetForm()
    emit('saved')
    isOpen.value = false
    toast.success('Конец сеанса сохранен')
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось сохранить конец сеанса'))
  }
  finally {
    actionLoading.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm()
      void loadDutyNurses()
      return
    }

    dutyNurses.value = []
    dutyNursesLoading.value = false
    actionLoading.value = false
  },
)

watch(
  () => props.tenantId,
  () => {
    if (!props.open) {
      return
    }

    form.dutyNurseEmployeeTenantId = ''
    void loadDutyNurses()
  },
)
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>Конец сеанса</DialogTitle>
        <DialogDescription>
          Данные завершения сеанса{{ patientName ? ` для ${patientName}` : '' }}. Статус сеанса не меняется.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-5 py-4">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="grid gap-2">
            <Label for="endWeight" required :data-error="invalid('patientWeight')" class="data-[error=true]:text-destructive">Вес пациента</Label>
            <UiInput
              id="endWeight"
              v-model="form.patientWeight"
              :disabled="isBusy"
              :aria-invalid="invalid('patientWeight')"
            />
            <FieldError :errors="formErrors.patientWeight" />
          </div>

          <div class="grid gap-2">
            <Label for="endSys" required :data-error="invalid('sys')" class="data-[error=true]:text-destructive">Систолическое давление</Label>
            <UiInput
              id="endSys"
              v-model="form.sys"
              type="number"
              min="40"
              max="300"
              :disabled="isBusy"
              :aria-invalid="invalid('sys')"
            />
            <FieldError :errors="formErrors.sys" />
          </div>

          <div class="grid gap-2">
            <Label for="endDia" required :data-error="invalid('dia')" class="data-[error=true]:text-destructive">Диастолическое давление</Label>
            <UiInput
              id="endDia"
              v-model="form.dia"
              type="number"
              min="20"
              max="200"
              :disabled="isBusy"
              :aria-invalid="invalid('dia')"
            />
            <FieldError :errors="formErrors.dia" />
          </div>

          <div class="grid gap-2">
            <Label for="endRitm" required :data-error="invalid('ritm')" class="data-[error=true]:text-destructive">Частота</Label>
            <UiInput
              id="endRitm"
              v-model="form.ritm"
              type="number"
              min="20"
              max="250"
              :disabled="isBusy"
              :aria-invalid="invalid('ritm')"
            />
            <FieldError :errors="formErrors.ritm" />
          </div>

          <div class="grid gap-2">
            <Label for="endTemp" required :data-error="invalid('temp')" class="data-[error=true]:text-destructive">Температура</Label>
            <UiInput
              id="endTemp"
              v-model="form.temp"
              type="number"
              min="30"
              max="45"
              step="0.1"
              :disabled="isBusy"
              :aria-invalid="invalid('temp')"
            />
            <FieldError :errors="formErrors.temp" />
          </div>

          <div class="grid gap-2">
            <Label for="endDutyNurse" required :data-error="invalid('dutyNurseEmployeeTenantId')" class="data-[error=true]:text-destructive">Дежурная медсестра</Label>
            <UiSelect
              v-model="form.dutyNurseEmployeeTenantId"
              :disabled="isBusy || dutyNurses.length === 0"
            >
              <UiSelectTrigger id="endDutyNurse" class="w-full" :aria-invalid="invalid('dutyNurseEmployeeTenantId')">
                <UiSelectValue :placeholder="dutyNursesLoading ? 'Загрузка сотрудников...' : 'Выберите дежурную медсестру'" />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="employee in dutyNurses" :key="employee.id" :value="String(employee.id)">
                  {{ employee.fullName }} — {{ employee.position }}
                </UiSelectItem>
              </UiSelectContent>
            </UiSelect>
            <FieldError :errors="formErrors.dutyNurseEmployeeTenantId" />
            <p v-if="!dutyNursesLoading && dutyNurses.length === 0" class="text-sm text-destructive">
              В медцентре нет активных сотрудников для выбора.
            </p>
          </div>
        </div>

        <div class="grid gap-2 rounded-md border p-4">
          <Label>Осложнения</Label>
          <div class="flex flex-wrap gap-x-6 gap-y-2">
            <label class="flex items-center gap-2 text-sm">
              <UiCheckbox v-model:checked="form.hypotension" :disabled="actionLoading" />
              Гипотония
            </label>
            <label class="flex items-center gap-2 text-sm">
              <UiCheckbox v-model:checked="form.hypertension" :disabled="actionLoading" />
              Гипертония
            </label>
            <label class="flex items-center gap-2 text-sm">
              <UiCheckbox v-model:checked="form.muscleCrampsLimbs" :disabled="actionLoading" />
              Судороги мышц конечностей
            </label>
            <label class="flex items-center gap-2 text-sm">
              <UiCheckbox v-model:checked="form.heartRhythmDisturbances" :disabled="actionLoading" />
              Нарушения ритма сердца
            </label>
            <label class="flex items-center gap-2 text-sm">
              <UiCheckbox v-model:checked="form.headaches" :disabled="actionLoading" />
              Головные боли
            </label>
            <label class="flex items-center gap-2 text-sm">
              <UiCheckbox v-model:checked="form.attacksAnginaPectoris" :disabled="actionLoading" />
              Приступы стенокардии
            </label>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="grid gap-2">
            <Label for="endOtherComplications">Другие осложнения</Label>
            <UiInput
              id="endOtherComplications"
              v-model="form.otherComplications"
              :disabled="isBusy"
            />
          </div>

          <div class="grid gap-2">
            <Label for="endComplicationCorrection">Коррекция осложнений</Label>
            <UiInput
              id="endComplicationCorrection"
              v-model="form.complicationCorrection"
              :disabled="isBusy"
            />
          </div>

          <div class="grid gap-2">
            <Label for="endPlannedAppointments">Плановые назначения</Label>
            <UiInput
              id="endPlannedAppointments"
              v-model="form.plannedAppointments"
              :disabled="isBusy"
            />
          </div>

          <div class="grid gap-2">
            <Label for="endRecommendations">Рекомендации</Label>
            <UiInput
              id="endRecommendations"
              v-model="form.recommendations"
              :disabled="isBusy"
            />
          </div>

          <div class="grid gap-2">
            <Label for="endEffectiveTime">Эффективное время</Label>
            <UiInput
              id="endEffectiveTime"
              v-model="form.effectiveTime"
              :disabled="isBusy"
            />
          </div>

          <div class="grid gap-2">
            <Label for="endDescription">Описание</Label>
            <UiInput
              id="endDescription"
              v-model="form.description"
              :disabled="isBusy"
            />
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <UiButton variant="outline" :disabled="actionLoading" @click="isOpen = false">
          Отмена
        </UiButton>
        <UiButton :disabled="isBusy" @click="saveEnd">
          {{ dutyNursesLoading ? 'Загрузка...' : 'Сохранить' }}
        </UiButton>
      </div>
    </DialogContent>
  </Dialog>
</template>

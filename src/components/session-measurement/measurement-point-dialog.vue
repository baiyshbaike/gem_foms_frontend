<script setup lang="ts">
import axios from 'axios'
import { computed, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import { FieldError } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { formatApiError } from '@/lib/api-error'
import { sessionApi } from '@/services/api/dialysis.api'

import type { MeasurementPoint } from './types'

import { measurementPointLabels } from './types'

const props = defineProps<{
  open: boolean
  sessionId: number | null
  point: MeasurementPoint | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const measurements = reactive({
  systolic: '',
  diastolic: '',
  pulse: '',
  temperature: '',
})

const reason = ref('')
const loading = ref(false)
const saving = ref(false)
const submitted = ref(false)

type MeasurementField = keyof typeof measurements

const measurementFields: ReadonlyArray<{
  field: MeasurementField
  label: string
  min: number
  max: number
}> = [
  { field: 'systolic', label: 'Систолическое давление', min: 40, max: 300 },
  { field: 'diastolic', label: 'Диастолическое давление', min: 20, max: 200 },
  { field: 'pulse', label: 'Пульс', min: 20, max: 250 },
  { field: 'temperature', label: 'Температура', min: 30, max: 45 },
]

const fieldErrors = computed(() => submitted.value ? validateMeasurements() : {})

function validateMeasurements(): Partial<Record<MeasurementField, string[]>> {
  const errors: Partial<Record<MeasurementField, string[]>> = {}

  for (const item of measurementFields) {
    const value = String(measurements[item.field] ?? '').trim()
    if (!value) {
      errors[item.field] = ['Поле обязательно']
      continue
    }

    const parsed = toNullableNumber(value)
    if (parsed === null) {
      errors[item.field] = [`Значение поля "${item.label}" должно быть числом.`]
      continue
    }

    if (parsed < item.min || parsed > item.max) {
      errors[item.field] = [`Значение поля "${item.label}" должно быть в диапазоне от ${item.min} до ${item.max}.`]
    }
  }

  return errors
}

function invalid(field: MeasurementField) {
  return !!fieldErrors.value[field]?.length
}

function toNullableNumber(value: string | number | null | undefined): number | null {
  const normalized = String(value ?? '').replace(',', '.').trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function resetForm() {
  measurements.systolic = ''
  measurements.diastolic = ''
  measurements.pulse = ''
  measurements.temperature = ''
  reason.value = ''
  submitted.value = false
}

function fillForm(measurement: {
  dia: number | null
  note: string | null
  ritm: number | null
  sys: number | null
  temp: number | null
}) {
  measurements.systolic = measurement.sys?.toString() ?? ''
  measurements.diastolic = measurement.dia?.toString() ?? ''
  measurements.pulse = measurement.ritm?.toString() ?? ''
  measurements.temperature = measurement.temp?.toString() ?? ''
  reason.value = measurement.note ?? ''
}

async function loadExistingMeasurement() {
  if (!props.sessionId || !props.point) {
    resetForm()
    return
  }

  loading.value = true
  try {
    const measurement = await sessionApi.getMeasurement(props.sessionId, props.point)
    fillForm(measurement)
  }
  catch (error) {
    resetForm()
    if (!axios.isAxiosError(error) || error.response?.status !== 404) {
      toast.error(formatApiError(error, 'Не удалось загрузить показатели'))
    }
  }
  finally {
    loading.value = false
  }
}

async function saveMeasurement() {
  if (!props.sessionId || !props.point) {
    return
  }

  submitted.value = true
  if (Object.keys(validateMeasurements()).length > 0) {
    toast.error('Исправьте ошибки в показателях')
    return
  }

  saving.value = true
  try {
    await sessionApi.measurement(props.sessionId, props.point, {
      sys: toNullableNumber(measurements.systolic),
      dia: toNullableNumber(measurements.diastolic),
      ritm: toNullableNumber(measurements.pulse),
      temp: toNullableNumber(measurements.temperature),
      measuredAt: null,
      note: reason.value.trim() || null,
    })
    resetForm()
    emit('saved')
    emit('update:open', false)
    toast.success('Показатели сохранены')
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось сохранить показатели'))
  }
  finally {
    saving.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      void loadExistingMeasurement()
      return
    }

    loading.value = false
    saving.value = false
    submitted.value = false
  },
)
</script>

<template>
  <UiDialog :open="props.open" @update:open="emit('update:open', $event)">
    <UiDialogContent class="sm:max-w-md">
      <UiDialogHeader>
        <UiDialogTitle>
          Показатели — {{ measurementPointLabels[props.point ?? 'Start'] }}
        </UiDialogTitle>
        <UiDialogDescription>
          Сеанс #{{ props.sessionId ?? '—' }}. Заполните значения для точки измерения.
        </UiDialogDescription>
      </UiDialogHeader>

      <form class="space-y-4" @submit.prevent>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="grid gap-1">
            <Label for="measurement-systolic" required :data-error="invalid('systolic')" class="text-xs text-muted-foreground data-[error=true]:text-destructive">Систолическое (мм рт.ст.)</Label>
            <UiInput id="measurement-systolic" v-model="measurements.systolic" type="number" min="40" max="300" :disabled="saving || loading" :aria-invalid="invalid('systolic')" />
            <FieldError :errors="fieldErrors.systolic" />
          </div>
          <div class="grid gap-1">
            <Label for="measurement-diastolic" required :data-error="invalid('diastolic')" class="text-xs text-muted-foreground data-[error=true]:text-destructive">Диастолическое (мм рт.ст.)</Label>
            <UiInput id="measurement-diastolic" v-model="measurements.diastolic" type="number" min="20" max="200" :disabled="saving || loading" :aria-invalid="invalid('diastolic')" />
            <FieldError :errors="fieldErrors.diastolic" />
          </div>
          <div class="grid gap-1">
            <Label for="measurement-pulse" required :data-error="invalid('pulse')" class="text-xs text-muted-foreground data-[error=true]:text-destructive">Пульс (уд/мин)</Label>
            <UiInput id="measurement-pulse" v-model="measurements.pulse" type="number" min="20" max="250" :disabled="saving || loading" :aria-invalid="invalid('pulse')" />
            <FieldError :errors="fieldErrors.pulse" />
          </div>
          <div class="grid gap-1">
            <Label for="measurement-temperature" required :data-error="invalid('temperature')" class="text-xs text-muted-foreground data-[error=true]:text-destructive">Температура (°C)</Label>
            <UiInput id="measurement-temperature" v-model="measurements.temperature" type="number" min="30" max="45" step="0.1" :disabled="saving || loading" :aria-invalid="invalid('temperature')" />
            <FieldError :errors="fieldErrors.temperature" />
          </div>
        </div>

        <label class="grid gap-1">
          <span class="text-xs text-muted-foreground">Примечание</span>
          <UiTextarea v-model="reason" :rows="2" maxlength="500" placeholder="При необходимости" :disabled="saving || loading" />
        </label>
      </form>

      <UiDialogFooter>
        <UiButton type="button" variant="outline" :disabled="saving" @click="emit('update:open', false)">
          Отмена
        </UiButton>
        <UiButton type="button" :disabled="saving || loading || !sessionId || !point" @click="saveMeasurement">
          {{ loading ? 'Загрузка...' : 'Сохранить' }}
        </UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>

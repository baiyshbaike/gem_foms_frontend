<script setup lang="ts">
import axios from 'axios'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import type { DialyzerType, SaveSessionBeginningRequest } from '@/services/types/dialysis'

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
import { dialyzerTypeApi, sessionApi } from '@/services/api/dialysis.api'
import { sessionProgramOptions } from '@/services/types/dialysis'

import type { SessionBeginningField } from './session-beginning-form'

import {
  buildSessionBeginningRequest,
  createDefaultSessionBeginningForm,
  validateSessionBeginningFields,
  validateSessionBeginningForm,
} from './session-beginning-form'

const props = defineProps<{
  open: boolean
  sessionId: number | null
  patientName: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const dialyzerTypes = ref<DialyzerType[]>([])
const dialyzerTypesLoading = ref(false)
const existingLoading = ref(false)
const actionLoading = ref(false)
const form = ref(createDefaultSessionBeginningForm())
const submitted = ref(false)

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

const isBusy = computed(() => actionLoading.value || existingLoading.value)
const formErrors = computed(() => submitted.value ? validateSessionBeginningFields(form.value) : {})

async function loadDialyzerTypes() {
  dialyzerTypesLoading.value = true
  try {
    dialyzerTypes.value = await dialyzerTypeApi.list(false)
  }
  catch (error) {
    dialyzerTypes.value = []
    toast.error(formatApiError(error, 'Не удалось загрузить типы диализатора'))
  }
  finally {
    dialyzerTypesLoading.value = false
  }
}

function resetForm() {
  form.value = createDefaultSessionBeginningForm()
  submitted.value = false
}

function invalid(field: SessionBeginningField) {
  return !!formErrors.value[field]?.length
}

function fillForm(data: SaveSessionBeginningRequest) {
  form.value = {
    condition: data.sessionStart.condition,
    complaints: data.sessionStart.complaints,
    program: data.sessionStart.program,
    dialyzerPrimedWithSolution: data.sessionStart.dialyzerPrimedWithSolution,
    sodiumCorrection: data.sessionStart.sodiumCorrection,
    sodiumReinfusion: data.sessionStart.sodiumReinfusion,
    vascularAccess: data.sessionStart.vascularAccess,
    anticoagulation: data.sessionStart.anticoagulation,
    ultrafiltrationVolume: data.sessionStart.ultrafiltrationVolume,
    bloodFlowRate: data.sessionStart.bloodFlowRate,
    durationHours: data.sessionStart.durationHours,
    dialyzerTypeId: data.sessionStart.dialyzerTypeId.toString(),
    patientWeight: data.sessionStart.patientWeight,
    sys: data.sessionMeasurement.sys?.toString() ?? '',
    dia: data.sessionMeasurement.dia?.toString() ?? '',
    ritm: data.sessionMeasurement.ritm?.toString() ?? '',
    temp: data.sessionMeasurement.temp?.toString() ?? '',
  }
}

async function loadExistingBeginning() {
  if (!props.sessionId) {
    resetForm()
    return
  }

  existingLoading.value = true
  try {
    const data = await sessionApi.getBeginning(props.sessionId)
    fillForm(data)
  }
  catch (error) {
    resetForm()
    if (!axios.isAxiosError(error) || error.response?.status !== 404) {
      toast.error(formatApiError(error, 'Не удалось загрузить начало сеанса'))
    }
  }
  finally {
    existingLoading.value = false
  }
}

async function saveBeginning() {
  if (!props.sessionId) {
    return
  }

  submitted.value = true
  const fieldErrors = validateSessionBeginningFields(form.value)
  if (Object.keys(fieldErrors).length > 0) {
    const requiredErrors = validateSessionBeginningForm(form.value)
    toast.error(requiredErrors.length > 0
      ? `Заполните обязательные поля: ${requiredErrors.join(', ')}`
      : 'Исправьте ошибки в форме')
    return
  }

  actionLoading.value = true
  try {
    await sessionApi.saveBeginning(
      props.sessionId,
      buildSessionBeginningRequest(form.value, dialyzerTypes.value),
    )
    resetForm()
    emit('saved')
    isOpen.value = false
    toast.success('Начало сеанса сохранено')
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось сохранить начало сеанса'))
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
      void loadDialyzerTypes()
      void loadExistingBeginning()
      return
    }

    dialyzerTypes.value = []
    dialyzerTypesLoading.value = false
    existingLoading.value = false
    actionLoading.value = false
  },
)
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>Начало сеанса</DialogTitle>
        <DialogDescription>
          Клинические данные начала сеанса{{ patientName ? ` для ${patientName}` : '' }}.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-5 py-4">
        <div class="grid gap-2">
          <Label for="startCondition" required :data-error="invalid('condition')" class="data-[error=true]:text-destructive">Состояние пациента на момент под. к АИП</Label>
          <UiTextarea
            id="startCondition"
            v-model="form.condition"
            class="min-h-24"
            :disabled="isBusy"
            :aria-invalid="invalid('condition')"
          />
          <FieldError :errors="formErrors.condition" />
        </div>

        <div class="grid gap-2">
          <Label for="startComplaints" required :data-error="invalid('complaints')" class="data-[error=true]:text-destructive">Жалобы на момент осмотра</Label>
          <UiInput
            id="startComplaints"
            v-model="form.complaints"
            :disabled="isBusy"
            :aria-invalid="invalid('complaints')"
          />
          <FieldError :errors="formErrors.complaints" />
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div class="grid gap-2">
            <Label required>Программа сеанса</Label>
            <div class="flex h-9 items-center gap-2">
              <button
                v-for="option in sessionProgramOptions"
                :key="option.value"
                type="button"
                class="h-8 rounded-md border px-3 text-sm transition-colors"
                :class="form.program === option.value ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background hover:bg-accent'"
                :disabled="isBusy"
                @click="form.program = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="startDialyzerPrimed" required :data-error="invalid('dialyzerPrimedWithSolution')" class="data-[error=true]:text-destructive">Д-тор промыт и зап. раствором</Label>
            <UiInput
              id="startDialyzerPrimed"
              v-model="form.dialyzerPrimedWithSolution"
              :disabled="isBusy"
              :aria-invalid="invalid('dialyzerPrimedWithSolution')"
            />
            <FieldError :errors="formErrors.dialyzerPrimedWithSolution" />
          </div>

          <div class="grid gap-2">
            <Label for="startSodiumCorrection" required :data-error="invalid('sodiumCorrection')" class="data-[error=true]:text-destructive">Коррекция электролитов по Na</Label>
            <UiInput
              id="startSodiumCorrection"
              v-model="form.sodiumCorrection"
              :disabled="isBusy"
              :aria-invalid="invalid('sodiumCorrection')"
            />
            <FieldError :errors="formErrors.sodiumCorrection" />
          </div>

          <div class="grid gap-2">
            <Label for="startReinfusion" required :data-error="invalid('sodiumReinfusion')" class="data-[error=true]:text-destructive">Реинфузия NaCI</Label>
            <UiInput
              id="startReinfusion"
              v-model="form.sodiumReinfusion"
              :disabled="isBusy"
              :aria-invalid="invalid('sodiumReinfusion')"
            />
            <FieldError :errors="formErrors.sodiumReinfusion" />
          </div>

          <div class="grid gap-2">
            <Label for="startAccess" required :data-error="invalid('vascularAccess')" class="data-[error=true]:text-destructive">Доступ</Label>
            <UiInput
              id="startAccess"
              v-model="form.vascularAccess"
              :disabled="isBusy"
              :aria-invalid="invalid('vascularAccess')"
            />
            <FieldError :errors="formErrors.vascularAccess" />
          </div>

          <div class="grid gap-2">
            <Label for="startAnticoagulation" required :data-error="invalid('anticoagulation')" class="data-[error=true]:text-destructive">Антикоагуляция</Label>
            <UiInput
              id="startAnticoagulation"
              v-model="form.anticoagulation"
              :disabled="isBusy"
              :aria-invalid="invalid('anticoagulation')"
            />
            <FieldError :errors="formErrors.anticoagulation" />
          </div>

          <div class="grid gap-2">
            <Label for="startUf" required :data-error="invalid('ultrafiltrationVolume')" class="data-[error=true]:text-destructive">Обьем УФ</Label>
            <UiInput
              id="startUf"
              v-model="form.ultrafiltrationVolume"
              :disabled="isBusy"
              :aria-invalid="invalid('ultrafiltrationVolume')"
            />
            <FieldError :errors="formErrors.ultrafiltrationVolume" />
          </div>

          <div class="grid gap-2">
            <Label for="startBloodFlow" required :data-error="invalid('bloodFlowRate')" class="data-[error=true]:text-destructive">Скорость потока крови</Label>
            <UiInput
              id="startBloodFlow"
              v-model="form.bloodFlowRate"
              :disabled="isBusy"
              :aria-invalid="invalid('bloodFlowRate')"
            />
            <FieldError :errors="formErrors.bloodFlowRate" />
          </div>

          <div class="grid gap-2">
            <Label for="startDuration" required :data-error="invalid('durationHours')" class="data-[error=true]:text-destructive">Длительность</Label>
            <UiInput
              id="startDuration"
              v-model="form.durationHours"
              :disabled="isBusy"
              :aria-invalid="invalid('durationHours')"
            />
            <FieldError :errors="formErrors.durationHours" />
          </div>

          <div class="grid gap-2 md:col-span-2">
            <Label for="startDialyzerType" required :data-error="invalid('dialyzerTypeId')" class="data-[error=true]:text-destructive">Тип диализатора</Label>
            <UiNativeSelect
              id="startDialyzerType"
              v-model="form.dialyzerTypeId"
              :disabled="dialyzerTypesLoading || isBusy"
              :aria-invalid="invalid('dialyzerTypeId')"
            >
              <option value="" disabled>
                {{ dialyzerTypesLoading ? 'Загрузка типов...' : 'Выберите тип диализатора' }}
              </option>
              <option
                v-for="dialyzerType in dialyzerTypes"
                :key="dialyzerType.id"
                :value="String(dialyzerType.id)"
              >
                {{ dialyzerType.name }}
              </option>
            </UiNativeSelect>
            <FieldError :errors="formErrors.dialyzerTypeId" />
          </div>

          <div class="grid gap-2">
            <Label for="startWeight" required :data-error="invalid('patientWeight')" class="data-[error=true]:text-destructive">Вес пациента</Label>
            <UiInput
              id="startWeight"
              v-model="form.patientWeight"
              :disabled="isBusy"
              :aria-invalid="invalid('patientWeight')"
            />
            <FieldError :errors="formErrors.patientWeight" />
          </div>

          <div class="grid gap-2">
            <Label for="startSys" required :data-error="invalid('sys')" class="data-[error=true]:text-destructive">Систолическое давление</Label>
            <UiInput
              id="startSys"
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
            <Label for="startDia" required :data-error="invalid('dia')" class="data-[error=true]:text-destructive">Диастолическое давление</Label>
            <UiInput
              id="startDia"
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
            <Label for="startRitm" required :data-error="invalid('ritm')" class="data-[error=true]:text-destructive">Частота</Label>
            <UiInput
              id="startRitm"
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
            <Label for="startTemp" required :data-error="invalid('temp')" class="data-[error=true]:text-destructive">Температура</Label>
            <UiInput
              id="startTemp"
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
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <UiButton variant="outline" :disabled="actionLoading" @click="isOpen = false">
          Отмена
        </UiButton>
        <UiButton :disabled="isBusy" @click="saveBeginning">
          {{ existingLoading ? 'Загрузка...' : 'Сохранить' }}
        </UiButton>
      </div>
    </DialogContent>
  </Dialog>
</template>

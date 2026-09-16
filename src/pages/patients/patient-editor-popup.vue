<script setup lang="ts">
import type { z } from 'zod'

import { LoaderCircleIcon, SaveIcon, SearchIcon } from '@lucide/vue'
import { useForm } from '@tanstack/vue-form'
import { toast } from 'vue-sonner'

import type {
  PatientGridRow,
  PatientSpecialStatusReason,
  Region,
} from '@/services/types/dialysis'

import { FieldError } from '@/components/ui/field'
import { FormItem } from '@/components/ui/form'
import { formatApiError } from '@/lib/api-error'
import { patientApi } from '@/services/api/dialysis.api'

import {
  toCreatePatientRequest,
  toUpdatePatientRequest,
} from './patient-grid'
import { derivePatientIdentityFromInn } from './patient-identity'
import { patientEditorSchema } from './patient-schema'

type LookupState = 'idle' | 'searching' | 'found' | 'manual'
type PatientEditorValues = z.input<typeof patientEditorSchema>

const props = defineProps<{
  regions: Region[]
  specialStatusReasons: PatientSpecialStatusReason[]
}>()

const emit = defineEmits<{
  saved: [action: 'created' | 'updated']
}>()

const visible = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const lookupState = ref<LookupState>('idle')
const searchedInn = ref('')
const lookupError = ref('')
const selectedRegionId = ref(0)
const specialStatusEnabled = ref(false)

const isEditMode = computed(() => editingId.value !== null)
const lookupCompleted = computed(() => lookupState.value === 'found' || lookupState.value === 'manual')
const identityFieldsLocked = computed(() => !isEditMode.value && lookupState.value === 'found')
const detailsLocked = computed(() => saving.value || (!isEditMode.value && !lookupCompleted.value))
const saveDisabled = computed(() => saving.value || (!isEditMode.value && !lookupCompleted.value))
const popupTitle = computed(() => isEditMode.value ? 'Редактирование пациента' : 'Новый пациент')
const districts = computed(() => props.regions
  .find(region => region.id === selectedRegionId.value)
  ?.districts
  .filter(district => district.isActive) ?? [])

const form = useForm({
  defaultValues: createEmptyPatient(),
  validators: {
    onSubmit: patientEditorSchema,
  },
  onSubmit: async ({ value }) => {
    saving.value = true
    try {
      if (editingId.value === null) {
        await patientApi.create(toCreatePatientRequest(value))
        emit('saved', 'created')
      }
      else {
        await patientApi.update(editingId.value, toUpdatePatientRequest(value))
        emit('saved', 'updated')
      }

      visible.value = false
    }
    catch (error) {
      toast.error(toPatientEditorError(error, 'Не удалось сохранить пациента').message)
    }
    finally {
      saving.value = false
    }
  },
})

function createEmptyPatient(): PatientEditorValues {
  return {
    address: '',
    address2: '',
    birthDate: '',
    districtId: 0,
    firstName: '',
    gender: 1,
    inn: '',
    isActive: true,
    lastName: '',
    middleName: '',
    phone: '',
    regionId: 0,
    specialStatus: false,
    specialStatusReasonId: null,
  }
}

function openCreate() {
  editingId.value = null
  lookupState.value = 'idle'
  searchedInn.value = ''
  lookupError.value = ''
  selectedRegionId.value = 0
  specialStatusEnabled.value = false
  form.reset(createEmptyPatient())
  visible.value = true
}

function openEdit(patient: PatientGridRow) {
  editingId.value = patient.id
  lookupState.value = 'idle'
  searchedInn.value = ''
  lookupError.value = ''
  selectedRegionId.value = patient.regionId
  specialStatusEnabled.value = patient.specialStatus
  form.reset({
    address: patient.address,
    address2: patient.address2,
    birthDate: patient.birthDate.slice(0, 10),
    districtId: patient.districtId,
    firstName: patient.firstName,
    gender: patient.gender,
    inn: patient.inn,
    isActive: patient.isActive,
    lastName: patient.lastName,
    middleName: patient.middleName,
    phone: patient.phone,
    regionId: patient.regionId,
    specialStatus: patient.specialStatus,
    specialStatusReasonId: patient.specialStatusReasonId,
  })
  visible.value = true
}

function onOpenChange(open: boolean) {
  if (!saving.value) {
    visible.value = open
  }
}

function onInnInput(change: (value: string) => void, event: Event) {
  const normalizedInn = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 14)

  change(normalizedInn)
  lookupError.value = ''

  if (!isEditMode.value && searchedInn.value && normalizedInn !== searchedInn.value) {
    lookupState.value = 'idle'
    searchedInn.value = ''
    clearIdentityFields()
  }
}

function onRegionChanged(change: (value: number) => void, value: unknown) {
  const regionId = Number(value)
  const normalizedRegionId = Number.isInteger(regionId) && regionId > 0 ? regionId : 0

  selectedRegionId.value = normalizedRegionId
  change(normalizedRegionId)
  form.setFieldValue('districtId', 0)
}

function onSpecialStatusChanged(change: (value: boolean) => void, value: boolean) {
  specialStatusEnabled.value = value
  change(value)

  if (!value) {
    form.setFieldValue('specialStatusReasonId', null)
  }
}

function visibleSpecialStatusReasons(currentId: number | null) {
  return props.specialStatusReasons.filter(reason => reason.isActive || reason.id === currentId)
}

async function lookupIdentity() {
  const inn = form.getFieldValue('inn')
  const derivedIdentity = derivePatientIdentityFromInn(inn)
  if (!derivedIdentity) {
    lookupError.value = 'ИНН должен содержать 14-значный идентификационный номер'
    return
  }

  lookupState.value = 'searching'
  searchedInn.value = inn
  lookupError.value = ''

  let externalIdentity = null
  try {
    externalIdentity = await patientApi.lookupIdentity(inn)
  }
  catch {
  }

  if (form.getFieldValue('inn') !== inn) {
    return
  }

  setIdentityFields({
    birthDate: derivedIdentity.birthDate,
    gender: derivedIdentity.gender,
    firstName: externalIdentity?.found ? externalIdentity.firstName ?? '' : '',
    lastName: externalIdentity?.found ? externalIdentity.lastName ?? '' : '',
    middleName: externalIdentity?.found ? externalIdentity.middleName ?? '' : '',
  })
  lookupState.value = externalIdentity?.found ? 'found' : 'manual'
}

function setIdentityFields(values: Pick<PatientEditorValues, 'birthDate' | 'gender' | 'firstName' | 'lastName' | 'middleName'>) {
  const options = { dontUpdateMeta: true, dontValidate: true }
  form.setFieldValue('birthDate', values.birthDate, options)
  form.setFieldValue('gender', values.gender, options)
  form.setFieldValue('firstName', values.firstName, options)
  form.setFieldValue('lastName', values.lastName, options)
  form.setFieldValue('middleName', values.middleName, options)
}

function clearIdentityFields() {
  setIdentityFields({
    birthDate: '',
    firstName: '',
    gender: 1,
    lastName: '',
    middleName: '',
  })
}

function toPatientEditorError(error: unknown, fallback: string): Error {
  return new Error(formatApiError(error, fallback))
}

defineExpose({ openCreate, openEdit })
</script>

<template>
  <UiDialog :open="visible" @update:open="onOpenChange">
    <UiDialogScrollContent class="max-w-[760px] gap-0 p-0">
      <UiDialogHeader class="border-b px-6 py-5 text-left">
        <UiDialogTitle>{{ popupTitle }}</UiDialogTitle>
        <UiDialogDescription>
          {{ isEditMode ? 'Обновите персональные, контактные и регистрационные данные.' : 'Сначала найдите личность, затем заполните контактные и адресные данные.' }}
        </UiDialogDescription>
      </UiDialogHeader>

      <form class="flex min-h-0 flex-col" @submit.prevent="form.handleSubmit">
        <div class="grid max-h-[calc(100dvh-220px)] gap-5 overflow-y-auto px-6 py-5 md:grid-cols-2">
          <form.Field name="inn">
            <template #default="{ field, state }">
              <FormItem class="md:col-span-2">
                <UiLabel
                  for="patient-inn"
                  required
                  :data-error="!!state.meta.errors?.length || !!lookupError"
                  class="data-[error=true]:text-destructive"
                >
                  ИНН
                </UiLabel>
                <div class="flex items-center gap-2">
                  <UiInput
                    id="patient-inn"
                    :model-value="field.state.value"
                    inputmode="numeric"
                    autocomplete="off"
                    maxlength="14"
                    :disabled="saving || isEditMode || lookupState === 'searching'"
                    :aria-invalid="!!state.meta.errors?.length || !!lookupError"
                    class="min-w-0 flex-1"
                    placeholder="14-значный идентификационный номер"
                    @input="onInnInput(field.handleChange, $event)"
                    @blur="field.handleBlur"
                  />
                  <UiButton
                    v-if="!isEditMode"
                    type="button"
                    variant="default"
                    class="shrink-0"
                    :disabled="saving || lookupState === 'searching'"
                    @click="lookupIdentity"
                  >
                    <LoaderCircleIcon v-if="lookupState === 'searching'" class="size-4 animate-spin" />
                    <SearchIcon v-else class="size-4" />
                    {{ lookupState === 'searching' ? 'Поиск...' : 'Найти' }}
                  </UiButton>
                </div>
                <FieldError :errors="lookupError ? [...state.meta.errors, lookupError] : state.meta.errors" />
              </FormItem>
            </template>
          </form.Field>

          <form.Field name="lastName">
            <template #default="{ field, state }">
              <FormItem>
                <UiLabel for="patient-last-name" required :data-error="!!state.meta.errors?.length" class="data-[error=true]:text-destructive">
                  Фамилия
                </UiLabel>
                <UiInput
                  id="patient-last-name"
                  :model-value="field.state.value"
                  maxlength="100"
                  :disabled="detailsLocked || identityFieldsLocked"
                  :aria-invalid="!!state.meta.errors?.length"
                  @input="field.handleChange($event.target.value)"
                  @blur="field.handleBlur"
                />
                <FieldError :errors="state.meta.errors" />
              </FormItem>
            </template>
          </form.Field>

          <form.Field name="firstName">
            <template #default="{ field, state }">
              <FormItem>
                <UiLabel for="patient-first-name" required :data-error="!!state.meta.errors?.length" class="data-[error=true]:text-destructive">
                  Имя
                </UiLabel>
                <UiInput
                  id="patient-first-name"
                  :model-value="field.state.value"
                  maxlength="100"
                  :disabled="detailsLocked || identityFieldsLocked"
                  :aria-invalid="!!state.meta.errors?.length"
                  @input="field.handleChange($event.target.value)"
                  @blur="field.handleBlur"
                />
                <FieldError :errors="state.meta.errors" />
              </FormItem>
            </template>
          </form.Field>

          <form.Field name="middleName">
            <template #default="{ field, state }">
              <FormItem>
                <UiLabel for="patient-middle-name" required :data-error="!!state.meta.errors?.length" class="data-[error=true]:text-destructive">
                  Отчество
                </UiLabel>
                <UiInput
                  id="patient-middle-name"
                  :model-value="field.state.value"
                  maxlength="100"
                  :disabled="detailsLocked || identityFieldsLocked"
                  :aria-invalid="!!state.meta.errors?.length"
                  @input="field.handleChange($event.target.value)"
                  @blur="field.handleBlur"
                />
                <FieldError :errors="state.meta.errors" />
              </FormItem>
            </template>
          </form.Field>

          <form.Field name="phone">
            <template #default="{ field, state }">
              <FormItem>
                <UiLabel for="patient-phone" required :data-error="!!state.meta.errors?.length" class="data-[error=true]:text-destructive">
                  Телефон
                </UiLabel>
                <UiInput
                  id="patient-phone"
                  :model-value="field.state.value"
                  type="tel"
                  maxlength="50"
                  :disabled="detailsLocked"
                  :aria-invalid="!!state.meta.errors?.length"
                  @input="field.handleChange($event.target.value)"
                  @blur="field.handleBlur"
                />
                <FieldError :errors="state.meta.errors" />
              </FormItem>
            </template>
          </form.Field>

          <form.Field name="birthDate">
            <template #default="{ field, state }">
              <FormItem>
                <UiLabel for="patient-birth-date" required :data-error="!!state.meta.errors?.length" class="data-[error=true]:text-destructive">
                  Дата рождения
                </UiLabel>
                <UiInput
                  id="patient-birth-date"
                  :model-value="field.state.value"
                  type="date"
                  disabled
                  :aria-invalid="!!state.meta.errors?.length"
                  @input="field.handleChange($event.target.value)"
                  @blur="field.handleBlur"
                />
                <FieldError :errors="state.meta.errors" />
              </FormItem>
            </template>
          </form.Field>

          <form.Field name="gender">
            <template #default="{ field, state }">
              <FormItem>
                <UiLabel required :data-error="!!state.meta.errors?.length" class="data-[error=true]:text-destructive">
                  Пол
                </UiLabel>
                <UiSelect
                  :model-value="field.state.value"
                  disabled
                  @update:model-value="value => field.handleChange(Number(value) as 1 | 2)"
                >
                  <UiSelectTrigger class="w-full" :aria-invalid="!!state.meta.errors?.length">
                    <UiSelectValue placeholder="Выберите пол" />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem :value="1">
                      Мужской
                    </UiSelectItem>
                    <UiSelectItem :value="2">
                      Женский
                    </UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
                <FieldError :errors="state.meta.errors" />
              </FormItem>
            </template>
          </form.Field>

          <form.Field name="regionId">
            <template #default="{ field, state }">
              <FormItem>
                <UiLabel required :data-error="!!state.meta.errors?.length" class="data-[error=true]:text-destructive">
                  Регион
                </UiLabel>
                <UiSelect
                  :model-value="field.state.value || undefined"
                  :disabled="detailsLocked"
                  @update:model-value="value => onRegionChanged(field.handleChange, value)"
                >
                  <UiSelectTrigger class="w-full" :aria-invalid="!!state.meta.errors?.length">
                    <UiSelectValue placeholder="Выберите регион" />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem v-for="region in regions" :key="region.id" :value="region.id">
                      {{ region.name }}
                    </UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
                <FieldError :errors="state.meta.errors" />
              </FormItem>
            </template>
          </form.Field>

          <form.Field name="districtId">
            <template #default="{ field, state }">
              <FormItem>
                <UiLabel required :data-error="!!state.meta.errors?.length" class="data-[error=true]:text-destructive">
                  Район
                </UiLabel>
                <UiSelect
                  :model-value="field.state.value || undefined"
                  :disabled="detailsLocked || !selectedRegionId"
                  @update:model-value="value => field.handleChange(Number(value))"
                >
                  <UiSelectTrigger class="w-full" :aria-invalid="!!state.meta.errors?.length">
                    <UiSelectValue placeholder="Выберите район" />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem v-for="district in districts" :key="district.id" :value="district.id">
                      {{ district.name }}
                    </UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
                <FieldError :errors="state.meta.errors" />
              </FormItem>
            </template>
          </form.Field>

          <form.Field name="address">
            <template #default="{ field, state }">
              <FormItem class="md:col-span-2">
                <UiLabel for="patient-address" required :data-error="!!state.meta.errors?.length" class="data-[error=true]:text-destructive">
                  Адрес регистрации
                </UiLabel>
                <UiTextarea
                  id="patient-address"
                  :model-value="field.state.value"
                  maxlength="500"
                  :disabled="detailsLocked"
                  :aria-invalid="!!state.meta.errors?.length"
                  class="min-h-20 resize-y"
                  @input="field.handleChange($event.target.value)"
                  @blur="field.handleBlur"
                />
                <FieldError :errors="state.meta.errors" />
              </FormItem>
            </template>
          </form.Field>

          <form.Field name="address2">
            <template #default="{ field, state }">
              <FormItem class="md:col-span-2">
                <UiLabel for="patient-address-2" required :data-error="!!state.meta.errors?.length" class="data-[error=true]:text-destructive">
                  Фактический адрес
                </UiLabel>
                <UiTextarea
                  id="patient-address-2"
                  :model-value="field.state.value"
                  maxlength="500"
                  :disabled="detailsLocked"
                  :aria-invalid="!!state.meta.errors?.length"
                  class="min-h-20 resize-y"
                  @input="field.handleChange($event.target.value)"
                  @blur="field.handleBlur"
                />
                <FieldError :errors="state.meta.errors" />
              </FormItem>
            </template>
          </form.Field>

          <template v-if="isEditMode">
            <div class="grid gap-4 rounded-md border p-4 md:col-span-2 md:grid-cols-2">
              <form.Field name="specialStatus">
                <template #default="{ field }">
                  <div class="flex items-center justify-between gap-4">
                    <UiLabel for="patient-special-status">
                      Особый статус
                    </UiLabel>
                    <UiSwitch
                      id="patient-special-status"
                      :model-value="field.state.value"
                      :disabled="saving"
                      @update:model-value="value => onSpecialStatusChanged(field.handleChange, Boolean(value))"
                    />
                  </div>
                </template>
              </form.Field>

              <form.Field name="specialStatusReasonId">
                <template #default="{ field, state }">
                  <FormItem>
                    <UiLabel :required="specialStatusEnabled" :data-error="!!state.meta.errors?.length" class="data-[error=true]:text-destructive">
                      Причина особого статуса
                    </UiLabel>
                    <UiSelect
                      :model-value="field.state.value ?? undefined"
                      :disabled="saving || !specialStatusEnabled"
                      @update:model-value="value => field.handleChange(Number(value))"
                    >
                      <UiSelectTrigger class="w-full" :aria-invalid="!!state.meta.errors?.length">
                        <UiSelectValue placeholder="Выберите причину" />
                      </UiSelectTrigger>
                      <UiSelectContent>
                        <UiSelectItem
                          v-for="reason in visibleSpecialStatusReasons(field.state.value)"
                          :key="reason.id"
                          :value="reason.id"
                        >
                          {{ reason.name }}
                        </UiSelectItem>
                      </UiSelectContent>
                    </UiSelect>
                    <FieldError :errors="state.meta.errors" />
                  </FormItem>
                </template>
              </form.Field>

              <form.Field name="isActive">
                <template #default="{ field }">
                  <div class="flex items-center justify-between gap-4">
                    <UiLabel for="patient-active">
                      Активен
                    </UiLabel>
                    <UiSwitch
                      id="patient-active"
                      :model-value="field.state.value"
                      :disabled="saving"
                      @update:model-value="value => field.handleChange(Boolean(value))"
                    />
                  </div>
                </template>
              </form.Field>
            </div>
          </template>
        </div>

        <UiDialogFooter class="border-t bg-background px-6 py-4">
          <UiButton type="button" variant="outline" :disabled="saving" @click="onOpenChange(false)">
            Отмена
          </UiButton>
          <UiButton type="submit" :disabled="saveDisabled">
            <LoaderCircleIcon v-if="saving" class="size-4 animate-spin" />
            <SaveIcon v-else class="size-4" />
            Сохранить
          </UiButton>
        </UiDialogFooter>
      </form>
    </UiDialogScrollContent>
  </UiDialog>
</template>

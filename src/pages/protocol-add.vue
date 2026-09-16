<script setup lang="ts">
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LoaderCircleIcon,
  PaperclipIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'

import type {
  BasisProtocol,
  EmployeePosition,
  LpuOption,
  PatientGroup,
  ProtocolPatientLookup,
} from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import { FieldError } from '@/components/ui/field'
import { formatApiError } from '@/lib/api-error'
import { basisProtocolApi, employeePositionApi, patientApi, protocolApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

import type {
  EmployeeRowErrors,
  PatientRowErrors,
  ProtocolEmployeeFormRow,
  ProtocolPatientFormRow,
} from './protocols/protocol-form'

import {
  buildCreateProtocolPayload,
  createDefaultEmployeeRow,
  createDefaultPatientRow,
  validateProtocolForm,
} from './protocols/protocol-form'

const router = useRouter()
const authStore = useAuthStore()

const saving = ref(false)
const loadingOptions = ref(false)
const submitted = ref(false)
const notes = ref('')
const patientRows = ref<ProtocolPatientFormRow[]>([])
const employeeRows = ref<ProtocolEmployeeFormRow[]>([])

const patientErrors = ref<Record<string, PatientRowErrors>>({})
const employeeErrors = ref<Record<string, EmployeeRowErrors>>({})

const groups = ref<PatientGroup[]>([])
const lpus = ref<LpuOption[]>([])
const employeePositions = ref<EmployeePosition[]>([])
const basisProtocols = ref<BasisProtocol[]>([])

const searchTimers = new Map<string, ReturnType<typeof setTimeout>>()
const fileInputRefs = new Map<string, HTMLInputElement>()

const selectedPatientIds = computed(() =>
  patientRows.value
    .map(row => row.patient?.id)
    .filter((id): id is number => id != null),
)

// Save button is active once at least one patient is selected in any row
const hasSelectedPatient = computed(() =>
  patientRows.value.some(row => row.patient !== null),
)

const canSave = computed(() =>
  authStore.hasPermission('protocol.create')
  && !saving.value
  && !loadingOptions.value
  && hasSelectedPatient.value,
)

onMounted(async () => {
  addPatientRow()
  addEmployeeRow()
  await loadOptions()
})

onBeforeUnmount(() => {
  for (const timer of searchTimers.values()) {
    clearTimeout(timer)
  }
  searchTimers.clear()
  fileInputRefs.clear()
})

function setFileInputRef(rowId: string, el: HTMLInputElement | null) {
  if (el) {
    fileInputRefs.set(rowId, el)
  }
  else {
    fileInputRefs.delete(rowId)
  }
}

function triggerFileInput(rowId: string) {
  const input = fileInputRefs.get(rowId)
  if (input) {
    input.click()
  }
}

async function loadOptions() {
  loadingOptions.value = true
  const results = await Promise.allSettled([
    patientApi.groups(),
    protocolApi.lpus(),
    employeePositionApi.list(true),
    basisProtocolApi.list(true),
  ])

  if (results[0].status === 'fulfilled') {
    groups.value = results[0].value
  }
  else {
    toast.error(formatApiError(results[0].reason, 'Не удалось загрузить статусы пациентов'))
  }

  if (results[1].status === 'fulfilled') {
    lpus.value = results[1].value
  }
  else {
    toast.error(formatApiError(results[1].reason, 'Не удалось загрузить ЛПУ'))
  }

  if (results[2].status === 'fulfilled') {
    employeePositions.value = results[2].value
  }
  else {
    toast.error(formatApiError(results[2].reason, 'Не удалось загрузить должности'))
  }

  if (results[3].status === 'fulfilled') {
    basisProtocols.value = results[3].value
  }
  else {
    toast.error(formatApiError(results[3].reason, 'Не удалось загрузить основания протокола'))
  }

  loadingOptions.value = false
}

function addPatientRow() {
  patientRows.value.push(createDefaultPatientRow())
}

function removePatientRow(row: ProtocolPatientFormRow) {
  const timer = searchTimers.get(row.id)
  if (timer) {
    clearTimeout(timer)
    searchTimers.delete(row.id)
  }

  fileInputRefs.delete(row.id)
  delete patientErrors.value[row.id]
  patientRows.value = patientRows.value.filter(x => x.id !== row.id)
}

function toggleRow(row: ProtocolPatientFormRow) {
  row.expanded = !row.expanded
}

function addEmployeeRow() {
  employeeRows.value.push(createDefaultEmployeeRow())
}

function removeEmployeeRow(row: ProtocolEmployeeFormRow) {
  delete employeeErrors.value[row.id]
  employeeRows.value = employeeRows.value.filter(x => x.id !== row.id)
}

function onGroupChange(row: ProtocolPatientFormRow) {
  row.patient = null
  row.innSearch = ''
  row.options = []
  row.newStatusId = null
  row.basisProtocolId = null
  row.lpuId = null
  row.cause = ''
  row.files = []
  delete patientErrors.value[row.id]
}

function availableGroupsForRow(row: ProtocolPatientFormRow) {
  return groups.value.filter(group => group.id !== row.patient?.groupId)
}

function onInnInput(row: ProtocolPatientFormRow, value: string | number) {
  row.innSearch = String(value).replace(/\D/g, '').slice(0, 14)

  const timer = searchTimers.get(row.id)
  if (timer) {
    clearTimeout(timer)
    searchTimers.delete(row.id)
  }

  row.patient = null
  row.newStatusId = null
  row.basisProtocolId = null
  row.options = []

  if (patientErrors.value[row.id]?.patient) {
    delete patientErrors.value[row.id].patient
  }

  if (row.innSearch.length < 2) {
    row.searching = false
    return
  }

  if (!row.sourceGroupId) {
    row.searching = false
    return
  }

  row.searching = true
  const searchGroupId = row.sourceGroupId
  const searchInn = row.innSearch
  const excludedIds = selectedPatientIds.value
  searchTimers.set(row.id, setTimeout(async () => {
    try {
      const options = await protocolApi.searchPatients(searchGroupId!, searchInn, 20, excludedIds)
      if (row.patient || row.sourceGroupId !== searchGroupId || row.innSearch !== searchInn) {
        return
      }
      row.options = options.filter(option => !excludedIds.includes(option.id))
    }
    catch (error) {
      toast.error(formatApiError(error, 'Не удалось найти пациента'))
      row.options = []
    }
    finally {
      row.searching = false
    }
  }, 300))
}

function selectPatient(row: ProtocolPatientFormRow, patient: ProtocolPatientLookup) {
  const alreadySelected = patientRows.value.some(
    other => other.id !== row.id && other.patient?.id === patient.id,
  )
  if (alreadySelected) {
    toast.warning('Этот пациент уже добавлен в протокол')
    return
  }

  const timer = searchTimers.get(row.id)
  if (timer) {
    clearTimeout(timer)
    searchTimers.delete(row.id)
  }

  row.patient = patient
  row.innSearch = patient.inn
  row.options = []
  row.searching = false
  row.expanded = true

  clearPatientError(row.id, 'patient')
}

function clearPatient(row: ProtocolPatientFormRow) {
  row.patient = null
  row.newStatusId = null
  row.basisProtocolId = null
  row.innSearch = ''
  row.options = []
  row.files = []
  row.cause = ''
  row.expanded = true
  delete patientErrors.value[row.id]
}

function clearPatientError(rowId: string, field: keyof PatientRowErrors) {
  if (patientErrors.value[rowId]?.[field]) {
    delete patientErrors.value[rowId][field]
    if (Object.keys(patientErrors.value[rowId]).length === 0) {
      delete patientErrors.value[rowId]
    }
  }
}

function clearEmployeeError(rowId: string, field: keyof EmployeeRowErrors) {
  if (employeeErrors.value[rowId]?.[field]) {
    delete employeeErrors.value[rowId][field]
    if (Object.keys(employeeErrors.value[rowId]).length === 0) {
      delete employeeErrors.value[rowId]
    }
  }
}

function onFilesChange(row: ProtocolPatientFormRow, event: Event) {
  const input = event.target as HTMLInputElement
  row.files = [
    ...row.files,
    ...Array.from(input.files ?? []),
  ]
  input.value = ''
}

function removeFile(row: ProtocolPatientFormRow, index: number) {
  row.files = row.files.filter((_, fileIndex) => fileIndex !== index)
}

function runValidation(): boolean {
  const result = validateProtocolForm(patientRows.value, employeeRows.value, notes.value)
  patientErrors.value = result.patientErrors
  employeeErrors.value = result.employeeErrors

  if (!result.isValid) {
    for (const row of patientRows.value) {
      if (patientErrors.value[row.id]) {
        row.expanded = true
      }
    }

    if (result.generalErrors.length > 0) {
      toast.error(result.generalErrors[0])
    }
    else {
      toast.error('Пожалуйста, заполните все обязательные поля')
    }
  }

  return result.isValid
}

async function saveProtocol() {
  submitted.value = true

  if (!runValidation()) {
    return
  }

  const payload = buildCreateProtocolPayload(notes.value, patientRows.value, employeeRows.value)

  const filesByHistoryIndex = new Map<number, File[]>()
  patientRows.value.forEach((row, index) => {
    if (row.files.length > 0) {
      filesByHistoryIndex.set(index, row.files)
    }
  })

  saving.value = true
  try {
    await protocolApi.create(payload, filesByHistoryIndex)
    toast.success('Протокол создан')
    await router.push('/protocols')
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось создать протокол'))
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <BasicPage title="Новый протокол" description="Создание протокола комиссии" sticky>
    <template #actions>
      <UiButton as-child size="sm" variant="outline" class="h-9" :disabled="saving">
        <RouterLink to="/protocols">
          <ArrowLeftIcon class="size-4" />
          К списку
        </RouterLink>
      </UiButton>
    </template>

    <form class="flex w-full flex-col gap-4" @submit.prevent="saveProtocol">
      <section class="space-y-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold">
            Пациенты
          </h2>
          <UiButton type="button" size="sm" variant="outline" :disabled="saving" @click="addPatientRow">
            <PlusIcon class="size-4" />
            Добавить пациента
          </UiButton>
        </div>

        <div
          v-for="(row, index) in patientRows"
          :key="row.id"
          class="rounded-md border bg-card transition-shadow"
        >
          <!-- Patient row header with filled space and paperclip before trash -->
          <div class="flex w-full flex-wrap items-start gap-2 p-3 lg:flex-nowrap lg:items-start lg:px-3 lg:py-2.5">
            <span class="w-4 shrink-0 pt-2 text-center text-xs font-medium text-muted-foreground">
              {{ index + 1 }}.
            </span>

            <!-- Группа -->
            <div class="flex flex-1 min-w-[140px] sm:min-w-[160px] flex-col">
              <UiSelect
                :model-value="row.sourceGroupId || undefined"
                :disabled="saving"
                @update:model-value="value => { row.sourceGroupId = Number(value); onGroupChange(row); clearPatientError(row.id, 'sourceGroupId'); }"
              >
                <UiSelectTrigger
                  class="h-8 w-full text-xs"
                  :aria-invalid="!!patientErrors[row.id]?.sourceGroupId?.length"
                >
                  <UiSelectValue placeholder="Группа *" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem v-for="group in groups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </UiSelectItem>
                </UiSelectContent>
              </UiSelect>
              <FieldError
                v-if="patientErrors[row.id]?.sourceGroupId"
                :errors="patientErrors[row.id]?.sourceGroupId"
                class="mt-0.5 text-[11px] leading-tight"
              />
            </div>

            <!-- Поиск / Выбранный пациент -->
            <div class="flex flex-[2] min-w-[240px] sm:min-w-[280px] flex-col">
              <div class="relative w-full">
                <UiInput
                  v-if="!row.patient"
                  :model-value="row.innSearch"
                  inputmode="numeric"
                  maxlength="14"
                  placeholder="ИНН (мин. 2 цифры) *"
                  class="h-8 w-full text-xs"
                  :aria-invalid="!!patientErrors[row.id]?.patient?.length"
                  :disabled="saving || !row.sourceGroupId"
                  @update:model-value="value => onInnInput(row, value)"
                />
                <div
                  v-else
                  class="flex h-8 w-full items-center gap-2 rounded-md border px-2 text-xs transition-colors"
                  :class="{ 'border-destructive': !!patientErrors[row.id]?.patient?.length }"
                >
                  <span class="truncate font-medium">{{ row.patient.fullName }}</span>
                  <span class="shrink-0 text-muted-foreground">ИНН {{ row.patient.inn }}</span>
                  <span class="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    Текущий этап: {{ row.patient.groupName }}
                  </span>
                  <button
                    type="button"
                    class="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
                    :disabled="saving"
                    title="Очистить"
                    @click="clearPatient(row)"
                  >
                    &times;
                  </button>
                </div>

                <div
                  v-if="row.searching"
                  class="absolute left-0 top-full z-20 mt-1 w-full rounded border bg-background p-1.5 text-xs text-muted-foreground shadow-md"
                >
                  Поиск...
                </div>

                <div
                  v-else-if="row.options.length > 0"
                  class="absolute left-0 top-full z-20 mt-1 max-h-52 w-full overflow-hidden overflow-y-auto rounded-md border bg-background shadow-md"
                >
                  <button
                    v-for="option in row.options"
                    :key="option.id"
                    type="button"
                    class="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
                    :disabled="saving"
                    @click="selectPatient(row, option)"
                  >
                    <span class="truncate font-medium">{{ option.fullName }}</span>
                    <span class="shrink-0 text-muted-foreground">ИНН {{ option.inn }}</span>
                  </button>
                </div>

                <div
                  v-else-if="!row.patient && row.innSearch.length >= 2 && row.sourceGroupId && !row.searching"
                  class="absolute left-0 top-full z-20 mt-1 w-full rounded border bg-background p-1.5 text-xs text-muted-foreground shadow-md"
                >
                  Пациенты не найдены
                </div>
              </div>
              <FieldError
                v-if="patientErrors[row.id]?.patient"
                :errors="patientErrors[row.id]?.patient"
                class="mt-0.5 text-[11px] leading-tight"
              />
            </div>

            <!-- Новый этап -->
            <div class="flex flex-1 min-w-[130px] sm:min-w-[150px] flex-col">
              <UiSelect
                :model-value="row.newStatusId || undefined"
                :disabled="saving || !row.patient"
                @update:model-value="value => { row.newStatusId = Number(value); clearPatientError(row.id, 'newStatusId'); }"
              >
                <UiSelectTrigger
                  class="h-8 w-full text-xs"
                  :aria-invalid="!!patientErrors[row.id]?.newStatusId?.length"
                >
                  <UiSelectValue placeholder="Этап *" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem v-for="group in availableGroupsForRow(row)" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </UiSelectItem>
                </UiSelectContent>
              </UiSelect>
              <FieldError
                v-if="patientErrors[row.id]?.newStatusId"
                :errors="patientErrors[row.id]?.newStatusId"
                class="mt-0.5 text-[11px] leading-tight"
              />
            </div>

            <!-- Основание -->
            <div class="flex flex-1 min-w-[140px] sm:min-w-[160px] flex-col">
              <UiSelect
                :model-value="row.basisProtocolId || undefined"
                :disabled="saving || !row.patient"
                @update:model-value="value => { row.basisProtocolId = Number(value); clearPatientError(row.id, 'basisProtocolId'); }"
              >
                <UiSelectTrigger
                  class="h-8 w-full text-xs"
                  :aria-invalid="!!patientErrors[row.id]?.basisProtocolId?.length"
                >
                  <UiSelectValue placeholder="Основание *" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem v-for="bp in basisProtocols" :key="bp.id" :value="bp.id">
                    {{ bp.name }}
                  </UiSelectItem>
                </UiSelectContent>
              </UiSelect>
              <FieldError
                v-if="patientErrors[row.id]?.basisProtocolId"
                :errors="patientErrors[row.id]?.basisProtocolId"
                class="mt-0.5 text-[11px] leading-tight"
              />
            </div>

            <!-- ЛПУ -->
            <div class="flex flex-1 min-w-[130px] sm:min-w-[150px] flex-col">
              <UiSelect
                :model-value="row.lpuId || undefined"
                :disabled="saving || !row.patient"
                @update:model-value="value => { row.lpuId = Number(value); clearPatientError(row.id, 'lpuId'); }"
              >
                <UiSelectTrigger
                  class="h-8 w-full text-xs"
                  :aria-invalid="!!patientErrors[row.id]?.lpuId?.length"
                >
                  <UiSelectValue placeholder="ЛПУ" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem v-for="lpu in lpus" :key="lpu.id" :value="lpu.id">
                    {{ lpu.name }}
                  </UiSelectItem>
                </UiSelectContent>
              </UiSelect>
              <FieldError
                v-if="patientErrors[row.id]?.lpuId"
                :errors="patientErrors[row.id]?.lpuId"
                class="mt-0.5 text-[11px] leading-tight"
              />
            </div>

            <!-- Actions: File Upload, Delete, Expand/Collapse -->
            <div class="flex shrink-0 items-center gap-1 self-start pt-0">
              <!-- Hidden file input for this patient row -->
              <input
                :ref="el => setFileInputRef(row.id, el as HTMLInputElement | null)"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                class="hidden"
                :disabled="saving || !row.patient"
                @change="(event: Event) => onFilesChange(row, event)"
              >

              <!-- File upload icon to the left of row delete icon -->
              <UiButton
                type="button"
                size="icon"
                variant="ghost"
                class="relative size-8 text-muted-foreground hover:text-foreground"
                :disabled="saving || !row.patient"
                :title="row.files.length > 0 ? `Прикреплено файлов: ${row.files.length}` : 'Прикрепить файлы'"
                @click="triggerFileInput(row.id)"
              >
                <PaperclipIcon class="size-4" />
                <span
                  v-if="row.files.length > 0"
                  class="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
                >
                  {{ row.files.length }}
                </span>
              </UiButton>

              <!-- Row delete icon -->
              <UiButton
                type="button"
                size="icon"
                variant="ghost"
                class="size-8 text-muted-foreground hover:text-destructive"
                :disabled="saving || patientRows.length === 1"
                title="Убрать пациента"
                @click="removePatientRow(row)"
              >
                <Trash2Icon class="size-4" />
              </UiButton>

              <!-- Chevron collapse / expand toggle -->
              <UiButton
                type="button"
                size="icon"
                variant="outline"
                class="size-8 border"
                :disabled="saving"
                :title="row.expanded ? 'Свернуть' : 'Развернуть'"
                @click="toggleRow(row)"
              >
                <ChevronDownIcon v-if="!row.expanded" class="size-4" />
                <ChevronUpIcon v-else class="size-4" />
              </UiButton>
            </div>
          </div>

          <!-- Expanded row details (Cause & Attached files list if any) -->
          <div v-if="row.expanded" class="space-y-3 border-t px-3 py-3">
            <div class="grid gap-1.5">
              <UiLabel
                :for="`cause-${row.id}`"
                class="text-xs"
                :data-error="!!patientErrors[row.id]?.cause?.length"
                :class="{ 'text-destructive': !!patientErrors[row.id]?.cause?.length }"
              >
                Причина
              </UiLabel>
              <UiTextarea
                :id="`cause-${row.id}`"
                v-model="row.cause"
                maxlength="1000"
                rows="2"
                placeholder="Причина изменения статуса (необязательно)"
                :disabled="saving || !row.patient"
                :aria-invalid="!!patientErrors[row.id]?.cause?.length"
                class="w-full text-xs"
                @input="clearPatientError(row.id, 'cause')"
              />
              <FieldError
                v-if="patientErrors[row.id]?.cause"
                :errors="patientErrors[row.id]?.cause"
                class="text-xs"
              />
            </div>

            <!-- Attached files list (only shown when files are uploaded via paperclip icon) -->
            <div v-if="row.files.length > 0" class="space-y-1.5 pt-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-muted-foreground">
                  Прикрепленные файлы ({{ row.files.length }}):
                </span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="(file, fileIndex) in row.files"
                  :key="`${file.name}-${fileIndex}`"
                  class="inline-flex max-w-full items-center gap-1.5 rounded-md border bg-muted/60 px-2.5 py-1 text-xs"
                >
                  <PaperclipIcon class="size-3 shrink-0 text-muted-foreground" />
                  <span class="max-w-[240px] truncate font-medium">{{ file.name }}</span>
                  <button
                    type="button"
                    class="text-muted-foreground transition-colors hover:text-destructive"
                    :disabled="saving"
                    title="Удалить файл"
                    @click="removeFile(row, fileIndex)"
                  >
                    <XIcon class="size-3.5" />
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-2">
        <div class="grid gap-1.5">
          <UiLabel for="protocol-notes" class="text-xs">
            Примечания
          </UiLabel>
          <UiTextarea
            id="protocol-notes"
            v-model="notes"
            maxlength="1000"
            rows="2"
            placeholder="Примечания (необязательно)"
            :disabled="saving"
            class="text-xs"
          />
        </div>
      </section>

      <section class="space-y-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold">
            Сотрудники комиссии
          </h2>
          <UiButton type="button" size="sm" variant="outline" :disabled="saving" @click="addEmployeeRow">
            <PlusIcon class="size-4" />
            Добавить сотрудника
          </UiButton>
        </div>

        <div
          v-for="(row, index) in employeeRows"
          :key="row.id"
          class="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-[1fr_1fr_auto]"
        >
          <div class="grid gap-1.5">
            <UiLabel
              :for="`fio-${row.id}`"
              class="text-xs"
              :data-error="!!employeeErrors[row.id]?.fio?.length"
              :class="{ 'text-destructive': !!employeeErrors[row.id]?.fio?.length }"
              required
            >
              ФИО {{ index + 1 }}
            </UiLabel>
            <UiInput
              :id="`fio-${row.id}`"
              v-model="row.fio"
              maxlength="200"
              placeholder="ФИО сотрудника *"
              :disabled="saving"
              :aria-invalid="!!employeeErrors[row.id]?.fio?.length"
              class="h-8 text-xs"
              @input="clearEmployeeError(row.id, 'fio')"
            />
            <FieldError
              v-if="employeeErrors[row.id]?.fio"
              :errors="employeeErrors[row.id]?.fio"
              class="text-xs"
            />
          </div>

          <div class="grid gap-1.5">
            <UiLabel
              class="text-xs"
              :data-error="!!employeeErrors[row.id]?.employeePositionId?.length"
              :class="{ 'text-destructive': !!employeeErrors[row.id]?.employeePositionId?.length }"
              required
            >
              Должность
            </UiLabel>
            <UiSelect
              :model-value="row.employeePositionId || undefined"
              :disabled="saving"
              @update:model-value="value => { row.employeePositionId = Number(value); clearEmployeeError(row.id, 'employeePositionId'); }"
            >
              <UiSelectTrigger
                class="h-8 text-xs"
                :aria-invalid="!!employeeErrors[row.id]?.employeePositionId?.length"
              >
                <UiSelectValue placeholder="Выберите должность *" />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="position in employeePositions" :key="position.id" :value="position.id">
                  {{ position.name }}
                </UiSelectItem>
              </UiSelectContent>
            </UiSelect>
            <FieldError
              v-if="employeeErrors[row.id]?.employeePositionId"
              :errors="employeeErrors[row.id]?.employeePositionId"
              class="text-xs"
            />
          </div>

          <div class="flex items-center pb-0.5 md:items-end">
            <UiButton
              type="button"
              size="icon"
              variant="ghost"
              class="size-8 text-muted-foreground hover:text-destructive"
              :disabled="saving || employeeRows.length === 1"
              title="Убрать сотрудника"
              @click="removeEmployeeRow(row)"
            >
              <Trash2Icon class="size-4" />
            </UiButton>
          </div>
        </div>
      </section>

      <div class="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-md sm:border">
        <UiButton as-child type="button" variant="outline" :disabled="saving">
          <RouterLink to="/protocols">
            Отмена
          </RouterLink>
        </UiButton>
        <UiButton type="submit" :disabled="!canSave">
          <LoaderCircleIcon v-if="saving" class="size-4 animate-spin" />
          Сохранить протокол
        </UiButton>
      </div>
    </form>
  </BasicPage>
</template>

<route lang="yaml">
meta:
  requiredPermission: protocol.create
</route>

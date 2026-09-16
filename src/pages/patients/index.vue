<script setup lang="ts">
import { PlusIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

import type {
  ServerDataGridExportConfig,
  ServerDataGridExposed,
  ServerDataGridQueryRequest,
  ServerDataGridQueryResult,
} from '@/components/server-data-grid'
import type {
  PatientGridExportRequest,
  PatientGridRow,
  PatientGroup,
  PatientSpecialStatusReason,
  Region,
} from '@/services/types/dialysis'

import ConfirmDialog from '@/components/confirm-dialog.vue'
import { BasicPage } from '@/components/global-layout'
import { ServerDataGrid } from '@/components/server-data-grid'
import { formatApiError } from '@/lib/api-error'
import { patientApi, patientSpecialStatusReasonApi, regionApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

import PatientEditorPopup from './patient-editor-popup.vue'
import {
  createPatientColumns,
  createPatientFilterFields,
  patientColumnLabels,
  patientDefaultColumnPinning,
  patientDefaultColumnVisibility,
  patientDefaultSorting,
  patientExportColumns,
  patientGroupOptions,
} from './patient-grid-config'

interface PatientEditorComponent {
  openCreate: () => void
  openEdit: (patient: PatientGridRow) => void
}

const authStore = useAuthStore()
const gridRef = ref<ServerDataGridExposed | null>(null)
const patientEditorRef = ref<PatientEditorComponent | null>(null)
const regions = ref<Region[]>([])
const groups = ref<PatientGroup[]>([])
const specialStatusReasons = ref<PatientSpecialStatusReason[]>([])
const loadingLookups = ref(false)
const deleting = ref(false)
const deleteTarget = ref<PatientGridRow | null>(null)

const canCreate = computed(() => authStore.hasPermission('patient.create'))
const canUpdate = computed(() => authStore.hasPermission('patient.update'))
const canDelete = computed(() => authStore.hasPermission('patient.delete'))
const canExport = computed(() => authStore.hasPermission('patient.export'))
const lookupsReady = computed(() => regions.value.length > 0 && groups.value.length > 0)
const gridStorageKey = computed(() => `dialysis:patient-grid:${authStore.user?.id ?? 'anonymous'}`)
const deleteDialogOpen = computed({
  get: () => deleteTarget.value !== null,
  set: (open: boolean) => {
    if (!open && !deleting.value) {
      deleteTarget.value = null
    }
  },
})

const columns = computed(() => createPatientColumns({
  canDelete: canDelete.value,
  canUpdate: canUpdate.value,
  disableActions: !lookupsReady.value || loadingLookups.value,
  onDelete: requestDeletePatient,
  onEdit: openEditPatient,
}))

const filterFields = computed(() => createPatientFilterFields(regions.value, groups.value))

const exportConfig = computed<ServerDataGridExportConfig<PatientGridRow> | undefined>(() => canExport.value
  ? {
      columns: patientExportColumns,
      fileName: () => `patients-${new Date().toISOString().slice(0, 10)}.xlsx`,
      load: loadPatientExport,
      sheetName: 'Пациенты',
    }
  : undefined)

onMounted(loadLookups)

function loadPatients(
  request: ServerDataGridQueryRequest,
): Promise<ServerDataGridQueryResult<PatientGridRow>> {
  return patientApi.gridQuery(request)
}

function loadPatientExport(
  request: ServerDataGridQueryRequest,
  selectedRowIds: string[],
): Promise<ServerDataGridQueryResult<PatientGridRow>> {
  const payload: PatientGridExportRequest = {
    ...request,
    selectedIds: selectedRowIds.map(Number),
  }
  return patientApi.gridExport(payload)
}

async function loadLookups() {
  loadingLookups.value = true
  try {
    const [regionResult, groupResult, reasonResult] = await Promise.all([
      regionApi.list(),
      patientApi.groups(),
      patientSpecialStatusReasonApi.list(true),
    ])
    regions.value = regionResult.filter(region => region.isActive)
    groups.value = groupResult
    specialStatusReasons.value = reasonResult
  }
  catch (error) {
    toast.error(formatPatientError(error, 'Не удалось загрузить справочники'))
  }
  finally {
    loadingLookups.value = false
  }
}

function openCreatePatient() {
  patientEditorRef.value?.openCreate()
}

function openEditPatient(patient: PatientGridRow) {
  patientEditorRef.value?.openEdit(patient)
}

function requestDeletePatient(patient: PatientGridRow) {
  deleteTarget.value = patient
}

async function deletePatient() {
  if (!deleteTarget.value) {
    return
  }

  const patient = deleteTarget.value
  deleting.value = true
  try {
    await patientApi.delete(patient.id)
    gridRef.value?.removeSelection(patient.id)
    deleteTarget.value = null
    toast.success('Пациент удалён')
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatPatientError(error, 'Не удалось удалить пациента'))
  }
  finally {
    deleting.value = false
  }
}

function onPatientSaved(action: 'created' | 'updated') {
  toast.success(action === 'created' ? 'Пациент сохранён' : 'Пациент обновлён')
  gridRef.value?.refresh()
}

function formatPatientError(error: unknown, fallback: string): string {
  return formatApiError(error, fallback)
}
</script>

<template>
  <BasicPage title="Пациенты" description="Глобальный реестр пациентов" sticky>
    <ServerDataGrid
      ref="gridRef"
      :columns="columns"
      :column-labels="patientColumnLabels"
      :default-column-pinning="patientDefaultColumnPinning"
      :default-column-visibility="patientDefaultColumnVisibility"
      :default-sorting="patientDefaultSorting"
      :export-config="exportConfig"
      :filter-fields="filterFields"
      :format-error="formatPatientError"
      :get-row-id="patient => patient.id"
      :group-options="patientGroupOptions"
      :load="loadPatients"
      :storage-key="gridStorageKey"
      :state-version="3"
      empty-title="Пациенты не найдены"
      filter-description="Комбинируйте фильтры для поиска в реестре пациентов на сервере."
      filter-title="Фильтры пациентов"
      item-label="пациентов"
      load-error-message="Не удалось загрузить пациентов"
      loading-label="Загрузка пациентов"
      search-placeholder="Поиск пациентов..."
    >
      <template #toolbar-actions>
        <UiButton
          v-if="canCreate"
          size="sm"
          class="h-9"
          :disabled="!lookupsReady || loadingLookups"
          @click="openCreatePatient"
        >
          <PlusIcon class="size-4" />
          Новый пациент
        </UiButton>
      </template>
    </ServerDataGrid>

    <PatientEditorPopup
      ref="patientEditorRef"
      :regions="regions"
      :special-status-reasons="specialStatusReasons"
      @saved="onPatientSaved"
    />

    <ConfirmDialog
      v-model:open="deleteDialogOpen"
      :is-loading="deleting"
      cancel-button-text="Отмена"
      confirm-button-text="Удалить"
      destructive
      @confirm="deletePatient"
    >
      <template #title>
        Удалить пациента?
      </template>
      <template #description>
        <span>
          {{ deleteTarget?.fullName }} будет удалён из активного списка. Операция использует мягкое удаление.
        </span>
      </template>
    </ConfirmDialog>
  </BasicPage>
</template>

<route lang="yaml">
meta:
  requiredPermission: patient.read
</route>

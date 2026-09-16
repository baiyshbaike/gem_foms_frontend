<script setup lang="ts">
import { PlusIcon } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import type {
  ServerDataGridExportConfig,
  ServerDataGridExposed,
  ServerDataGridQueryRequest,
  ServerDataGridQueryResult,
} from '@/components/server-data-grid'
import type { MeasurementPointTarget } from '@/components/session-measurement/types'
import type { SessionGridRow } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import { ServerDataGrid } from '@/components/server-data-grid'
import MeasurementPointDialog from '@/components/session-measurement/measurement-point-dialog.vue'
import { formatApiError } from '@/lib/api-error'
import { sessionApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

import SessionBeginningDialog from '../sessions/components/session-beginning-dialog.vue'
import SessionEndDialog from '../sessions/components/session-end-dialog.vue'
import SessionIdentificationDialog from '../sessions/components/session-identification-dialog.vue'
import SessionTimeDialog from '../sessions/components/session-time-dialog.vue'
import StartSessionDialog from '../sessions/components/start-session-dialog.vue'
import {
  activeSessionColumnLabels,
  activeSessionDefaultColumnPinning,
  activeSessionDefaultSorting,
  activeSessionExportColumns,
  activeSessionFilterFields,
  activeSessionStatuses,
  createActiveSessionColumns,
} from './grid-config'

const authStore = useAuthStore()
const ALL_TENANTS = '__all__'
const gridRef = ref<ServerDataGridExposed | null>(null)
const selectedTenantId = ref(ALL_TENANTS)
const actionLoading = ref(false)

const createDialogOpen = ref(false)
const startDialogOpen = ref(false)
const startTargetRow = ref<SessionGridRow | null>(null)

const measurementDialogOpen = ref(false)
const measurementTarget = ref<MeasurementPointTarget | null>(null)

const beginningDialogOpen = ref(false)
const beginningTarget = ref<{ sessionId: number, patientName: string } | null>(null)

const endDialogOpen = ref(false)
const endTarget = ref<{ sessionId: number, patientName: string, tenantId: string } | null>(null)

const finishDialogOpen = ref(false)
const finishTargetRow = ref<SessionGridRow | null>(null)
const startTimeDialogOpen = ref(false)
const startTimeTargetRow = ref<SessionGridRow | null>(null)

const canCreate = computed(() =>
  authStore.hasPermission('session.create')
  && (
    authStore.isTenantSwitchMode
    || authStore.hasPermission('tenant.access_all')
  ),
)
const canExport = computed(() => authStore.hasPermission('session.export'))
const canAdjustTime = computed(() => authStore.hasPermission('session.time.adjust'))
const gridStorageKey = computed(() => `dialysis:active-sessions-grid:${authStore.user?.id ?? 'anonymous'}`)
const tenantNameMap = computed(() => Object.fromEntries(authStore.tenants.map(t => [t.id, t.name])))

const columns = computed(() => createActiveSessionColumns({
  tenantNameMap: tenantNameMap.value,
  canStart: authStore.hasPermission('session.start'),
  canPause: authStore.hasPermission('session.pause'),
  canResume: authStore.hasPermission('session.resume'),
  canFinish: authStore.hasPermission('session.finish'),
  canAdjustTime: canAdjustTime.value,
  canArchive: authStore.hasPermission('session.archive'),
  onStart: openStartDialog,
  onPause: handlePause,
  onResume: handleResume,
  onFinish: confirmFinish,
  onAdjustStartTime: openStartTimeDialog,
  onArchive: handleArchive,
  onSelectMeasurement: openMeasurementDialog,
}))

const exportConfig = computed<ServerDataGridExportConfig<SessionGridRow> | undefined>(() => canExport.value
  ? {
      columns: activeSessionExportColumns,
      fileName: () => `active-sessions-${new Date().toISOString().slice(0, 10)}.xlsx`,
      load: loadActiveSessionExport,
      sheetName: 'Активные сеансы',
    }
  : undefined)

function loadActiveSessions(request: ServerDataGridQueryRequest): Promise<ServerDataGridQueryResult<SessionGridRow>> {
  return sessionApi.gridQuery({
    ...withTenantFilter(request),
    statuses: activeSessionStatuses,
  })
}

function loadActiveSessionExport(request: ServerDataGridQueryRequest, selectedRowIds: string[]): Promise<ServerDataGridQueryResult<SessionGridRow>> {
  return sessionApi.gridExport({
    ...withTenantFilter(request),
    statuses: activeSessionStatuses,
    selectedIds: selectedRowIds.map(Number),
  })
}

function withTenantFilter(request: ServerDataGridQueryRequest) {
  return {
    ...request,
    tenantIds: authStore.canFilterTenants && selectedTenantId.value !== ALL_TENANTS ? [selectedTenantId.value] : [],
  }
}

function openStartDialog(row: SessionGridRow) {
  startTargetRow.value = row
  startDialogOpen.value = true
}

function openMeasurementDialog(target: MeasurementPointTarget) {
  if (target.point === 'Start') {
    beginningTarget.value = { sessionId: target.sessionId, patientName: target.patientName ?? '' }
    beginningDialogOpen.value = true
    return
  }

  if (target.point === 'End') {
    endTarget.value = { sessionId: target.sessionId, patientName: target.patientName ?? '', tenantId: target.tenantId ?? '' }
    endDialogOpen.value = true
    return
  }

  measurementTarget.value = target
  measurementDialogOpen.value = true
}

function confirmFinish(row: SessionGridRow) {
  finishTargetRow.value = row
  finishDialogOpen.value = true
}

function openStartTimeDialog(row: SessionGridRow) {
  startTimeTargetRow.value = row
  startTimeDialogOpen.value = true
}

async function handleFinish(finishedAt: string | null) {
  const row = finishTargetRow.value
  if (!row) {
    return
  }

  actionLoading.value = true
  try {
    await sessionApi.finish(row.id, { finishedAt })
    toast.success('Сеанс завершён')
    finishDialogOpen.value = false
    finishTargetRow.value = null
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось завершить сеанс'))
  }
  finally {
    actionLoading.value = false
  }
}

async function handleStartTimeAdjustment(startedAt: string | null) {
  const row = startTimeTargetRow.value
  if (!row || !startedAt) {
    return
  }

  actionLoading.value = true
  try {
    await sessionApi.adjustStartTime(row.id, { startedAt })
    toast.success('Время начала изменено')
    startTimeDialogOpen.value = false
    startTimeTargetRow.value = null
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось изменить время начала'))
  }
  finally {
    actionLoading.value = false
  }
}

async function handlePause(row: SessionGridRow) {
  actionLoading.value = true
  try {
    await sessionApi.pause(row.id, { reason: null })
    toast.success('Сеанс приостановлен')
    gridRef.value?.refresh()
  }
  catch {
    toast.error('Не удалось приостановить сеанс')
  }
  finally {
    actionLoading.value = false
  }
}

async function handleResume(row: SessionGridRow) {
  actionLoading.value = true
  try {
    await sessionApi.resume(row.id)
    toast.success('Сеанс возобновлён')
    gridRef.value?.refresh()
  }
  catch {
    toast.error('Не удалось возобновить сеанс')
  }
  finally {
    actionLoading.value = false
  }
}

async function handleArchive(row: SessionGridRow) {
  actionLoading.value = true
  try {
    await sessionApi.archive(row.id)
    toast.success('Сеанс архивирован')
    gridRef.value?.refresh()
  }
  catch {
    toast.error('Не удалось архивировать сеанс')
  }
  finally {
    actionLoading.value = false
  }
}

watch(selectedTenantId, () => {
  gridRef.value?.refresh()
})

watch(
  () => authStore.activeTenant?.id,
  () => {
    if (authStore.isTenantSwitchMode) {
      gridRef.value?.refresh()
    }
  },
)

onMounted(() => {
  if (authStore.canFilterTenants && authStore.tenants.length === 0) {
    authStore.loadTenants().catch(() => undefined)
  }
})
</script>

<template>
  <BasicPage title="Активные сеансы" description="Сеансы в работе: идентифицированные, начатые, приостановленные и просроченные" sticky>
    <ServerDataGrid
      ref="gridRef"
      :columns="columns"
      :column-labels="activeSessionColumnLabels"
      :default-column-pinning="activeSessionDefaultColumnPinning"
      :default-sorting="activeSessionDefaultSorting"
      :export-config="exportConfig"
      :filter-fields="activeSessionFilterFields"
      :get-row-id="row => row.id"
      :load="loadActiveSessions"
      :storage-key="gridStorageKey"
      empty-title="Активные сеансы не найдены"
      filter-description="Комбинируйте фильтры для поиска сеансов на сервере."
      filter-title="Фильтры активных сеансов"
      item-label="сеансы"
      load-error-message="Не удалось загрузить сеансы"
      loading-label="Загрузка сеансов"
      search-placeholder="Поиск сеансов..."
    >
      <template #toolbar-actions>
        <UiSelect
          v-if="authStore.canFilterTenants"
          v-model:model-value="selectedTenantId"
        >
          <UiSelectTrigger class="h-9 w-[220px]">
            <UiSelectValue placeholder="Все мед. центры" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem :value="ALL_TENANTS">
              Все мед. центры
            </UiSelectItem>
            <UiSelectItem v-for="tenant in authStore.tenants" :key="tenant.id" :value="tenant.id">
              {{ tenant.name }}
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
        <UiButton
          v-if="canCreate"
          size="sm"
          class="h-9"
          @click="createDialogOpen = true"
        >
          <PlusIcon class="size-4" />
          Создать сеанс
        </UiButton>
      </template>
    </ServerDataGrid>

    <SessionIdentificationDialog
      v-model:open="createDialogOpen"
      @created="gridRef?.refresh()"
    />

    <StartSessionDialog
      v-model:open="startDialogOpen"
      :session="startTargetRow"
      @session-started="gridRef?.refresh()"
    />

    <SessionBeginningDialog
      v-model:open="beginningDialogOpen"
      :session-id="beginningTarget?.sessionId ?? null"
      :patient-name="beginningTarget?.patientName ?? null"
      @saved="gridRef?.refresh()"
    />

    <SessionEndDialog
      v-model:open="endDialogOpen"
      :session-id="endTarget?.sessionId ?? null"
      :patient-name="endTarget?.patientName ?? null"
      :tenant-id="endTarget?.tenantId ?? null"
      @saved="gridRef?.refresh()"
    />

    <MeasurementPointDialog
      v-model:open="measurementDialogOpen"
      :session-id="measurementTarget?.sessionId ?? null"
      :point="measurementTarget?.point ?? null"
      @saved="gridRef?.refresh()"
    />

    <SessionTimeDialog
      v-model:open="startTimeDialogOpen"
      :session="startTimeTargetRow"
      mode="start"
      :show-time-input="true"
      :loading="actionLoading"
      @submit="handleStartTimeAdjustment"
    />

    <SessionTimeDialog
      v-model:open="finishDialogOpen"
      :session="finishTargetRow"
      mode="finish"
      :show-time-input="canAdjustTime"
      :loading="actionLoading"
      @submit="handleFinish"
    />
  </BasicPage>
</template>

<route lang="yaml">
meta:
  requiredPermission: session.read
</route>

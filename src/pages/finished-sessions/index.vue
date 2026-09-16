<script setup lang="ts">
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
import {
  createFinishedSessionColumns,
  finishedSessionColumnLabels,
  finishedSessionDefaultColumnPinning,
  finishedSessionDefaultSorting,
  finishedSessionExportColumns,
  finishedSessionFilterFields,
  finishedSessionStatuses,
} from './grid-config'

const authStore = useAuthStore()
const ALL_TENANTS = '__all__'
const gridRef = ref<ServerDataGridExposed | null>(null)
const selectedTenantId = ref(ALL_TENANTS)
const actionLoading = ref(false)

const measurementDialogOpen = ref(false)
const measurementTarget = ref<MeasurementPointTarget | null>(null)

const beginningDialogOpen = ref(false)
const beginningTarget = ref<{ sessionId: number, patientName: string } | null>(null)

const endDialogOpen = ref(false)
const endTarget = ref<{ sessionId: number, patientName: string, tenantId: string } | null>(null)

const endIdentifyConfirmOpen = ref(false)
const endIdentifyTargetRow = ref<SessionGridRow | null>(null)

const sendToPayConfirmOpen = ref(false)
const sendToPayTargetRow = ref<SessionGridRow | null>(null)

const canExport = computed(() => authStore.hasPermission('session.export'))
const gridStorageKey = computed(() => `dialysis:finished-sessions-grid:${authStore.user?.id ?? 'anonymous'}`)
const tenantNameMap = computed(() => Object.fromEntries(authStore.tenants.map(t => [t.id, t.name])))

const columns = computed(() => createFinishedSessionColumns({
  tenantNameMap: tenantNameMap.value,
  canEndIdentify: authStore.hasPermission('session.end_identify'),
  canSendToPay: authStore.hasPermission('session.send_to_pay'),
  canOverrideTimeLimits: authStore.hasPermission('session.override_time_limits'),
  canArchive: authStore.hasPermission('session.archive'),
  onEndIdentify: confirmEndIdentify,
  onSendToPay: confirmSendToPay,
  onArchive: handleArchive,
  onSelectMeasurement: openMeasurementDialog,
}))

const exportConfig = computed<ServerDataGridExportConfig<SessionGridRow> | undefined>(() => canExport.value
  ? {
      columns: finishedSessionExportColumns,
      fileName: () => `finished-sessions-${new Date().toISOString().slice(0, 10)}.xlsx`,
      load: loadFinishedSessionExport,
      sheetName: 'Завершённые сеансы',
    }
  : undefined)

function loadFinishedSessions(request: ServerDataGridQueryRequest): Promise<ServerDataGridQueryResult<SessionGridRow>> {
  return sessionApi.gridQuery({
    ...withTenantFilter(request),
    statuses: finishedSessionStatuses,
  })
}

function loadFinishedSessionExport(request: ServerDataGridQueryRequest, selectedRowIds: string[]): Promise<ServerDataGridQueryResult<SessionGridRow>> {
  return sessionApi.gridExport({
    ...withTenantFilter(request),
    statuses: finishedSessionStatuses,
    selectedIds: selectedRowIds.map(Number),
  })
}

function withTenantFilter(request: ServerDataGridQueryRequest) {
  return {
    ...request,
    tenantIds: authStore.canFilterTenants && selectedTenantId.value !== ALL_TENANTS ? [selectedTenantId.value] : [],
  }
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

function confirmEndIdentify(row: SessionGridRow) {
  endIdentifyTargetRow.value = row
  endIdentifyConfirmOpen.value = true
}

async function handleEndIdentify() {
  const row = endIdentifyTargetRow.value
  if (!row) {
    return
  }

  actionLoading.value = true
  try {
    await sessionApi.endIdentify(row.id)
    toast.success('Идентификация завершена')
    endIdentifyConfirmOpen.value = false
    endIdentifyTargetRow.value = null
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось завершить идентификацию'))
  }
  finally {
    actionLoading.value = false
  }
}

function confirmSendToPay(row: SessionGridRow) {
  sendToPayTargetRow.value = row
  sendToPayConfirmOpen.value = true
}

async function handleSendToPay() {
  const row = sendToPayTargetRow.value
  if (!row) {
    return
  }

  actionLoading.value = true
  try {
    await sessionApi.sendToPay(row.id)
    toast.success('Сеанс отправлен в оплату')
    sendToPayConfirmOpen.value = false
    sendToPayTargetRow.value = null
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось отправить в оплату'))
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
  <BasicPage title="Завершённые сеансы" description="Завершённые сеансы гемодиализа" sticky>
    <ServerDataGrid
      ref="gridRef"
      :columns="columns"
      :column-labels="finishedSessionColumnLabels"
      :default-column-pinning="finishedSessionDefaultColumnPinning"
      :default-sorting="finishedSessionDefaultSorting"
      :export-config="exportConfig"
      :filter-fields="finishedSessionFilterFields"
      :get-row-id="row => row.id"
      :load="loadFinishedSessions"
      :storage-key="gridStorageKey"
      empty-title="Завершённые сеансы не найдены"
      filter-description="Комбинируйте фильтры для поиска сеансов на сервере."
      filter-title="Фильтры завершённых сеансов"
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
      </template>
    </ServerDataGrid>

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

    <UiAlertDialog v-model:open="endIdentifyConfirmOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Завершение идентификации</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Вы действительно хотите завершить идентификацию?
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="actionLoading">
            Отмена
          </UiAlertDialogCancel>
          <UiAlertDialogAction :disabled="actionLoading" @click="handleEndIdentify">
            Завершить
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>

    <UiAlertDialog v-model:open="sendToPayConfirmOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Отправка в оплату</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Вы действительно хотите отправить сеанс в оплату?
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="actionLoading">
            Отмена
          </UiAlertDialogCancel>
          <UiAlertDialogAction :disabled="actionLoading" @click="handleSendToPay">
            Отправить
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </BasicPage>
</template>

<route lang="yaml">
meta:
  requiredPermission: session.read
</route>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import type {
  ServerDataGridExportConfig,
  ServerDataGridExposed,
  ServerDataGridQueryRequest,
  ServerDataGridQueryResult,
} from '@/components/server-data-grid'
import type { SessionGridRow } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import { ServerDataGrid } from '@/components/server-data-grid'
import { formatApiError } from '@/lib/api-error'
import { sessionApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

import SessionDetailsDialog from '../sessions/components/session-details-dialog.vue'
import {
  createSessionColumns,
  sessionColumnLabels,
  sessionDefaultColumnPinning,
  sessionDefaultColumnVisibility,
  sessionDefaultSorting,
  sessionExportColumns,
  sessionFilterFields,
  sessionGroupOptions,
} from '../sessions/session-grid-config'

const authStore = useAuthStore()
const ALL_TENANTS = '__all__'
const gridRef = ref<ServerDataGridExposed | null>(null)
const actionLoading = ref(false)
const selectedTenantId = ref(ALL_TENANTS)

const detailsDialogOpen = ref(false)
const detailsTargetRow = ref<SessionGridRow | null>(null)

const markPaidConfirmOpen = ref(false)
const markPaidTargetRow = ref<SessionGridRow | null>(null)

const bulkMarkPaidConfirmOpen = ref(false)

const canMarkPaid = computed(() => authStore.hasPermission('session.mark_paid'))
const canExport = computed(() => authStore.hasPermission('session.export'))
const gridStorageKey = computed(() => `dialysis:all-sessions-grid:${authStore.user?.id ?? 'anonymous'}`)

const selectedSessionIds = computed(() =>
  (gridRef.value?.getSelectedIds() ?? []).map(Number),
)
const selectedCount = computed(() => selectedSessionIds.value.length)

const columns = computed(() => createSessionColumns({
  canMarkPaid: canMarkPaid.value,
  onDetails: openDetails,
  onMarkPaid: confirmMarkPaid,
}))

const exportConfig = computed<ServerDataGridExportConfig<SessionGridRow> | undefined>(() => canExport.value
  ? {
      columns: sessionExportColumns,
      fileName: () => `all-sessions-${new Date().toISOString().slice(0, 10)}.xlsx`,
      load: loadSessionExport,
      sheetName: 'Все сеансы',
    }
  : undefined)

function loadSessions(request: ServerDataGridQueryRequest): Promise<ServerDataGridQueryResult<SessionGridRow>> {
  return sessionApi.gridQuery(withTenantFilter(request))
}

function loadSessionExport(request: ServerDataGridQueryRequest, selectedRowIds: string[]): Promise<ServerDataGridQueryResult<SessionGridRow>> {
  return sessionApi.gridExport({
    ...withTenantFilter(request),
    selectedIds: selectedRowIds.map(Number),
  })
}

function withTenantFilter(request: ServerDataGridQueryRequest) {
  return {
    ...request,
    tenantIds: authStore.canFilterTenants && selectedTenantId.value !== ALL_TENANTS ? [selectedTenantId.value] : [],
  }
}

function openDetails(row: SessionGridRow) {
  detailsTargetRow.value = row
  detailsDialogOpen.value = true
}

function confirmMarkPaid(row: SessionGridRow) {
  markPaidTargetRow.value = row
  markPaidConfirmOpen.value = true
}

async function handleMarkPaid() {
  const row = markPaidTargetRow.value
  if (!row) {
    return
  }

  actionLoading.value = true
  try {
    await sessionApi.markPaid(row.id)
    toast.success('Сеанс отмечен оплаченным')
    markPaidConfirmOpen.value = false
    markPaidTargetRow.value = null
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось отметить оплаченным'))
  }
  finally {
    actionLoading.value = false
  }
}

async function handleBulkMarkPaid() {
  const ids = selectedSessionIds.value
  if (ids.length === 0) {
    return
  }

  actionLoading.value = true
  try {
    const result = await sessionApi.bulkMarkPaid(ids)
    toast.success(`Сеансы отмечены оплаченными: ${result.updatedCount}`)
    bulkMarkPaidConfirmOpen.value = false
    gridRef.value?.clearSelection()
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось отметить сеансы оплаченными'))
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
  <BasicPage title="Все сеансы" description="Полный журнал сеансов гемодиализа" sticky>
    <ServerDataGrid
      ref="gridRef"
      :columns="columns"
      :column-labels="sessionColumnLabels"
      :default-column-pinning="sessionDefaultColumnPinning"
      :default-column-visibility="sessionDefaultColumnVisibility"
      :default-sorting="sessionDefaultSorting"
      :export-config="exportConfig"
      :filter-fields="sessionFilterFields"
      :get-row-id="row => row.id"
      :group-options="sessionGroupOptions"
      :load="loadSessions"
      :storage-key="gridStorageKey"
      empty-title="Сеансы не найдены"
      filter-description="Комбинируйте фильтры для поиска сеансов на сервере."
      filter-title="Фильтры сеансов"
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
          v-if="canMarkPaid"
          size="sm"
          variant="outline"
          class="h-9"
          :disabled="selectedCount === 0 || actionLoading"
          @click="bulkMarkPaidConfirmOpen = true"
        >
          Оплатить выбранные ({{ selectedCount }})
        </UiButton>
      </template>
    </ServerDataGrid>

    <SessionDetailsDialog
      v-model:open="detailsDialogOpen"
      :session="detailsTargetRow"
    />

    <UiAlertDialog v-model:open="markPaidConfirmOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Отметить оплаченным</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Вы действительно хотите перевести сеанс в статус "Оплачен"?
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="actionLoading">
            Отмена
          </UiAlertDialogCancel>
          <UiAlertDialogAction :disabled="actionLoading" @click="handleMarkPaid">
            Оплачен
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>

    <UiAlertDialog v-model:open="bulkMarkPaidConfirmOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Отметить оплаченными</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Вы действительно хотите перевести выбранные сеансы в статус "Оплачен"?
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="actionLoading">
            Отмена
          </UiAlertDialogCancel>
          <UiAlertDialogAction :disabled="actionLoading || selectedCount === 0" @click="handleBulkMarkPaid">
            Оплачен
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

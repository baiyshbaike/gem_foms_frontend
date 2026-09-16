<script setup lang="ts">
import type {
  ServerDataGridExportConfig,
  ServerDataGridQueryRequest,
  ServerDataGridQueryResult,
} from '@/components/server-data-grid'
import type { AuditLogGridExportRequest, AuditLogGridRow } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import { ServerDataGrid } from '@/components/server-data-grid'
import { auditApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

import {
  auditLogColumnLabels,
  auditLogDefaultColumnPinning,
  auditLogDefaultColumnVisibility,
  auditLogDefaultSorting,
  auditLogExportColumns,
  auditLogFilterFields,
  auditLogGroupOptions,
  createAuditLogColumns,
} from './audit-log-grid-config'

const authStore = useAuthStore()
const canExport = computed(() => authStore.hasPermission('admin.audit'))
const gridStorageKey = computed(() => `dialysis:audit-log-grid:${authStore.user?.id ?? 'anonymous'}`)

const exportConfig = computed<ServerDataGridExportConfig<AuditLogGridRow> | undefined>(() => canExport.value
  ? {
      columns: auditLogExportColumns,
      fileName: () => `audit-logs-${new Date().toISOString().slice(0, 10)}.xlsx`,
      load: loadAuditLogExport,
      sheetName: 'Журнал аудита',
    }
  : undefined)

function loadAuditLogs(
  request: ServerDataGridQueryRequest,
): Promise<ServerDataGridQueryResult<AuditLogGridRow>> {
  return auditApi.gridQuery(request)
}

function loadAuditLogExport(
  request: ServerDataGridQueryRequest,
  selectedRowIds: string[],
): Promise<ServerDataGridQueryResult<AuditLogGridRow>> {
  const payload: AuditLogGridExportRequest = {
    ...request,
    selectedIds: selectedRowIds.map(Number),
  }
  return auditApi.gridExport(payload)
}
</script>

<template>
  <BasicPage title="Журнал аудита" description="История действий пользователей" sticky>
    <ServerDataGrid
      :columns="createAuditLogColumns()"
      :column-labels="auditLogColumnLabels"
      :default-column-pinning="auditLogDefaultColumnPinning"
      :default-column-visibility="auditLogDefaultColumnVisibility"
      :default-sorting="auditLogDefaultSorting"
      :export-config="exportConfig"
      :filter-fields="auditLogFilterFields"
      :get-row-id="row => row.id"
      :group-options="auditLogGroupOptions"
      :load="loadAuditLogs"
      :storage-key="gridStorageKey"
      empty-title="Записи аудита не найдены"
      filter-description="Комбинируйте фильтры для поиска записей аудита на сервере."
      filter-title="Фильтры аудита"
      item-label="записей"
      load-error-message="Не удалось загрузить записи аудита"
      loading-label="Загрузка аудита"
      search-placeholder="Поиск записей аудита..."
    />
  </BasicPage>
</template>

<route lang="yaml">
meta:
  requiredPermission: admin.audit
</route>

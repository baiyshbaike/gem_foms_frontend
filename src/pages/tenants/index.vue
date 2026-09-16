<script setup lang="ts">
import { PlusIcon, PowerIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

import type {
  ServerDataGridExportConfig,
  ServerDataGridExposed,
  ServerDataGridQueryRequest,
  ServerDataGridQueryResult,
} from '@/components/server-data-grid'
import type {
  Region,
  TenantGridExportRequest,
  TenantGridRow,
} from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import { ServerDataGrid } from '@/components/server-data-grid'
import { formatApiError } from '@/lib/api-error'
import { regionApi, tenantApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

import TenantEditorPopup from './components/tenant-editor-popup.vue'
import {
  createTenantColumns,
  createTenantFilterFields,
  tenantColumnLabels,
  tenantDefaultColumnPinning,
  tenantDefaultColumnVisibility,
  tenantDefaultSorting,
  tenantExportColumns,
  tenantGroupOptions,
} from './tenant-grid-config'

interface TenantEditorComponent {
  openCreate: () => void
  openEdit: (tenant: TenantGridRow) => void
}

const authStore = useAuthStore()
const gridRef = ref<ServerDataGridExposed | null>(null)
const tenantEditorRef = ref<TenantEditorComponent | null>(null)
const regions = ref<Region[]>([])
const loadingLookups = ref(false)
const deactivating = ref(false)
const deactivateTarget = ref<TenantGridRow | null>(null)

const lookupsReady = computed(() =>
  regions.value.some(region =>
    region.isActive && region.districts.some(district => district.isActive),
  ),
)
const gridStorageKey = computed(() => `dialysis:tenant-grid:v2:${authStore.user?.id ?? 'anonymous'}`)
const columns = computed(() => createTenantColumns({
  disableActions: loadingLookups.value || !lookupsReady.value,
  onDeactivate: requestDeactivateTenant,
  onEdit: openEditTenant,
}))
const filterFields = computed(() => createTenantFilterFields(regions.value))
const exportConfig = computed<ServerDataGridExportConfig<TenantGridRow>>(() => ({
  columns: tenantExportColumns,
  fileName: () => `tenants-${new Date().toISOString().slice(0, 10)}.xlsx`,
  load: loadTenantExport,
  sheetName: 'Мед центры',
}))

onMounted(loadLookups)

function loadTenants(
  request: ServerDataGridQueryRequest,
): Promise<ServerDataGridQueryResult<TenantGridRow>> {
  return tenantApi.gridQuery(request)
}

function loadTenantExport(
  request: ServerDataGridQueryRequest,
  selectedRowIds: string[],
): Promise<ServerDataGridQueryResult<TenantGridRow>> {
  const payload: TenantGridExportRequest = {
    ...request,
    selectedIds: selectedRowIds,
  }
  return tenantApi.gridExport(payload)
}

async function loadLookups() {
  loadingLookups.value = true
  try {
    regions.value = await regionApi.list(true)
  }
  catch (error) {
    toast.error(formatTenantError(error, 'Не удалось загрузить справочники'))
  }
  finally {
    loadingLookups.value = false
  }
}

function openCreateTenant() {
  tenantEditorRef.value?.openCreate()
}

function openEditTenant(tenant: TenantGridRow) {
  tenantEditorRef.value?.openEdit(tenant)
}

function requestDeactivateTenant(tenant: TenantGridRow) {
  deactivateTarget.value = tenant
}

async function deactivateTenant() {
  if (!deactivateTarget.value) {
    return
  }

  const tenant = deactivateTarget.value
  deactivating.value = true
  try {
    await tenantApi.deactivate(tenant.id)
    gridRef.value?.removeSelection(tenant.id)
    deactivateTarget.value = null
    await reconcileTenantSelection()
    toast.success('Мед центр отключён')
    gridRef.value?.refresh()
  }
  catch (error) {
    toast.error(formatTenantError(error, 'Не удалось отключить мед центр'))
  }
  finally {
    deactivating.value = false
  }
}

async function onTenantSaved(action: 'created' | 'updated') {
  await reconcileTenantSelection()
  toast.success(action === 'created' ? 'Мед центр создан' : 'Мед центр обновлён')
  gridRef.value?.refresh()
}

async function reconcileTenantSelection() {
  try {
    await authStore.reconcileTenants()
  }
  catch {
    toast.warning('Не удалось обновить список мед центров')
  }
}

function formatTenantError(error: unknown, fallback: string): string {
  return formatApiError(error, fallback)
}
</script>

<template>
  <BasicPage title="Мед центры" description="Реестр диализных центров" sticky>
    <ServerDataGrid
      ref="gridRef"
      :columns="columns"
      :column-labels="tenantColumnLabels"
      :default-column-pinning="tenantDefaultColumnPinning"
      :default-column-visibility="tenantDefaultColumnVisibility"
      :default-sorting="tenantDefaultSorting"
      :export-config="exportConfig"
      :filter-fields="filterFields"
      :format-error="formatTenantError"
      :get-row-id="tenant => tenant.id"
      :group-options="tenantGroupOptions"
      :load="loadTenants"
      :storage-key="gridStorageKey"
      :state-version="2"
      empty-title="Мед центры не найдены"
      filter-description="Комбинируйте фильтры для поиска мед центров на сервере."
      filter-title="Фильтры мед центров"
      item-label="мед центров"
      load-error-message="Не удалось загрузить мед центры"
      loading-label="Загрузка мед центров"
      search-placeholder="Поиск мед центров..."
    >
      <template #toolbar-actions>
        <UiButton
          size="sm"
          class="h-9"
          :disabled="!lookupsReady || loadingLookups"
          @click="openCreateTenant"
        >
          <PlusIcon class="size-4" />
          Новый мед центр
        </UiButton>
      </template>
    </ServerDataGrid>

    <TenantEditorPopup
      ref="tenantEditorRef"
      :regions="regions"
      @saved="onTenantSaved"
    />

    <UiAlertDialog :open="!!deactivateTarget" @update:open="open => !open && !deactivating && (deactivateTarget = null)">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Отключить мед центр?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            {{ deactivateTarget?.name }} будет недоступен для переключения и оперативной работы. Существующие записи будут сохранены.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="deactivating">
            Отмена
          </UiAlertDialogCancel>
          <UiAlertDialogAction
            :disabled="deactivating"
            class="bg-destructive text-white hover:bg-destructive/90"
            @click.prevent="deactivateTenant"
          >
            <PowerIcon class="size-4" />
            Отключить
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </BasicPage>
</template>

<route lang="yaml">
meta:
  requiredPermission: admin.tenants
</route>

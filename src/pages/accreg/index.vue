<script setup lang="ts">
import { DownloadIcon, SearchIcon, XIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

import type {
  ServerDataGridExposed,
  ServerDataGridQueryRequest,
  ServerDataGridQueryResult,
} from '@/components/server-data-grid'
import type { AccRegExportPreview, AccRegGridExportRequest, AccRegGridRow, AccRegStatusFilter } from '@/services/types/dialysis'

import AccRegExportPreviewDialog from '@/components/accreg/accreg-export-preview-dialog.vue'
import { BasicPage } from '@/components/global-layout'
import { ServerDataGrid } from '@/components/server-data-grid'
import { formatApiError } from '@/lib/api-error'
import { accregApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

import {
  accRegColumnLabels,
  accRegDefaultColumnPinning,
  accRegDefaultColumnVisibility,
  accRegDefaultSorting,
  accRegExportFileName,
  accRegStatusOptions,
  ALL_TENANTS,
  buildAccRegGridRequest,
  createAccRegColumns,
  createAccRegExportRequest,
  currentMonthDateRange,
  emptyAccRegSummary,
  formatInteger,
  formatMoney,
  summarizeAccRegRows,
} from './accreg-grid-config'

const authStore = useAuthStore()
const gridRef = ref<ServerDataGridExposed | null>(null)
const dateRange = currentMonthDateRange()
const selectedTenantId = ref(ALL_TENANTS)
const fromDate = ref(dateRange.fromDate)
const toDate = ref(dateRange.toDate)
const status = ref<AccRegStatusFilter>('All')
const search = ref('')
const summary = ref(emptyAccRegSummary())
const exporting = ref<'excel' | 'word' | null>(null)
const exportPreviewOpen = ref(false)
const exportPreviewLoading = ref(false)
const exportPreview = ref<AccRegExportPreview | null>(null)
const exportRequest = ref<AccRegGridExportRequest | null>(null)

const gridStorageKey = computed(() => `dialysis:accreg-grid:${authStore.user?.id ?? 'anonymous'}`)
const columns = computed(() => createAccRegColumns())
const reportFilters = computed(() => ({
  canFilterTenants: authStore.canFilterTenants,
  tenantId: selectedTenantId.value,
  fromDate: fromDate.value,
  toDate: toDate.value,
  status: status.value,
}))

function loadRows(
  request: ServerDataGridQueryRequest,
): Promise<ServerDataGridQueryResult<AccRegGridRow>> {
  return accregApi.gridQuery(buildAccRegGridRequest({
    ...request,
    search: search.value || null,
  }, reportFilters.value)).then((result) => {
    summary.value = result.summary ?? summarizeAccRegRows(result.items)
    return result
  })
}

function refreshGrid() {
  gridRef.value?.clearSelection()
  gridRef.value?.refresh()
}

function createExportRequest() {
  return createAccRegExportRequest(
    reportFilters.value,
    gridRef.value?.getSelectedIds() ?? [],
    search.value || null,
  )
}

async function openExportPreview() {
  exportPreviewOpen.value = true
  exportPreviewLoading.value = true
  exportPreview.value = null
  exportRequest.value = createExportRequest()

  try {
    exportPreview.value = await accregApi.exportPreview(exportRequest.value)
  }
  catch (error) {
    exportPreviewOpen.value = false
    toast.error(formatApiError(error, 'Не удалось подготовить счет-реестр'))
  }
  finally {
    exportPreviewLoading.value = false
  }
}

async function exportReport(format: 'excel' | 'word') {
  const request = exportRequest.value
  if (!request) {
    return
  }

  exporting.value = format
  try {
    const blob = format === 'excel'
      ? await accregApi.exportExcel(request)
      : await accregApi.exportWord(request)

    downloadBlob(
      blob,
      accRegExportFileName(format === 'excel' ? 'xlsx' : 'docx', fromDate.value, toDate.value),
    )
    toast.success(format === 'excel' ? 'Excel файл сформирован' : 'Word файл сформирован')
    exportPreviewOpen.value = false
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось сформировать файл'))
  }
  finally {
    exporting.value = null
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

watch([selectedTenantId, fromDate, toDate, status], refreshGrid)
watch(search, refreshGrid)

watch(
  () => authStore.activeTenant?.id,
  () => {
    if (authStore.isTenantSwitchMode) {
      refreshGrid()
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
  <BasicPage title="Счет реестр" description="Реестр к оплате" sticky>
    <div class="mb-3 grid gap-3 rounded-md border bg-background p-3 xl:grid-cols-[minmax(260px,1fr)_180px_180px_170px_auto]">
      <label v-if="authStore.canFilterTenants" class="grid gap-1.5 text-sm font-medium">
        Мед. центр
        <select v-model="selectedTenantId" class="h-9 rounded-md border bg-background px-3 text-sm">
          <option :value="ALL_TENANTS">
            Все мед. центры
          </option>
          <option v-for="tenant in authStore.tenants" :key="tenant.id" :value="tenant.id">
            {{ tenant.name }}
          </option>
        </select>
      </label>

      <label class="grid gap-1.5 text-sm font-medium">
        Дата с
        <input v-model="fromDate" type="date" class="h-9 rounded-md border bg-background px-3 text-sm">
      </label>

      <label class="grid gap-1.5 text-sm font-medium">
        Дата по
        <input v-model="toDate" type="date" class="h-9 rounded-md border bg-background px-3 text-sm">
      </label>

      <label class="grid gap-1.5 text-sm font-medium">
        Статус
        <select v-model="status" class="h-9 rounded-md border bg-background px-3 text-sm">
          <option v-for="option in accRegStatusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <div class="flex items-end">
        <UiButton class="h-9" :disabled="exportPreviewLoading || exporting !== null" @click="openExportPreview">
          <DownloadIcon class="size-4" />
          Скачать
        </UiButton>
      </div>
    </div>

    <div class="mb-3 grid gap-3 md:grid-cols-4">
      <div class="rounded-md border bg-background p-3">
        <div class="text-xs text-muted-foreground">
          Пациенты
        </div>
        <div class="text-xl font-semibold tabular-nums">
          {{ formatInteger(summary.patientCount) }}
        </div>
      </div>
      <div class="rounded-md border bg-background p-3">
        <div class="text-xs text-muted-foreground">
          Сеансы
        </div>
        <div class="text-xl font-semibold tabular-nums">
          {{ formatInteger(summary.sessionCount) }}
        </div>
      </div>
      <div class="rounded-md border bg-background p-3 md:col-span-2">
        <div class="text-xs text-muted-foreground">
          Сумма
        </div>
        <div class="text-xl font-semibold tabular-nums">
          {{ formatMoney(summary.totalPrice) }}
        </div>
      </div>
    </div>

    <ServerDataGrid
      ref="gridRef"
      :columns="columns"
      :column-labels="accRegColumnLabels"
      :default-column-pinning="accRegDefaultColumnPinning"
      :default-column-visibility="accRegDefaultColumnVisibility"
      :default-sorting="accRegDefaultSorting"
      :filter-fields="[]"
      :get-row-id="row => row.id"
      :group-options="[]"
      :load="loadRows"
      :show-search="false"
      :storage-key="gridStorageKey"
      :state-version="1"
      empty-title="Записи счета не найдены"
      item-label="записей"
      load-error-message="Не удалось загрузить счет реестр"
      loading-label="Загрузка счета"
      search-placeholder="Поиск записей..."
    >
      <template #toolbar-actions>
        <UiInputGroup class="w-full sm:w-[280px]">
          <UiInputGroupAddon align="inline-start">
            <SearchIcon class="size-4 text-muted-foreground" />
          </UiInputGroupAddon>
          <UiInputGroupInput v-model="search" placeholder="Поиск по ФИО или ИНН..." />
          <UiInputGroupAddon v-if="search" align="inline-end">
            <UiInputGroupButton type="button" size="icon-xs" title="Очистить поиск" @click="search = ''">
              <XIcon class="size-3.5" />
              <span class="sr-only">Очистить поиск</span>
            </UiInputGroupButton>
          </UiInputGroupAddon>
        </UiInputGroup>
      </template>
    </ServerDataGrid>

    <AccRegExportPreviewDialog
      v-model:open="exportPreviewOpen"
      :downloading="exporting"
      :loading="exportPreviewLoading"
      :preview="exportPreview"
      @download="exportReport"
    />
  </BasicPage>
</template>

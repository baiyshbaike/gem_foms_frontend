<script setup lang="ts">
import { PlusIcon, Trash2Icon } from '@lucide/vue'
import { toast } from 'vue-sonner'

import type {
  ServerDataGridExportConfig,
  ServerDataGridExposed,
  ServerDataGridQueryRequest,
  ServerDataGridQueryResult,
} from '@/components/server-data-grid'
import type { MedCenterMachineGridRow } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import { ServerDataGrid } from '@/components/server-data-grid'
import { machineApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

import MachineEditorPopup from './components/machine-editor-popup.vue'
import {
  createMachineColumns,
  machineColumnLabels,
  machineDefaultColumnPinning,
  machineDefaultColumnVisibility,
  machineDefaultSorting,
  machineExportColumns,
  machineFilterFields,
  machineGroupOptions,
} from './machine-grid-config'

interface MachineEditorComponent {
  openCreate: () => void
  openEdit: (machineId: number) => void
}

const authStore = useAuthStore()
const ALL_TENANTS = '__all__'
const gridRef = ref<ServerDataGridExposed | null>(null)
const machineEditorRef = ref<MachineEditorComponent | null>(null)
const deleting = ref(false)
const deleteTarget = ref<MedCenterMachineGridRow | null>(null)
const selectedTenantId = ref(ALL_TENANTS)

const canCreate = computed(() => authStore.hasPermission('medcenter.machine.create'))
const canUpdate = computed(() => authStore.hasPermission('medcenter.machine.update'))
const canDelete = computed(() => authStore.hasPermission('medcenter.machine.delete'))
const canExport = computed(() => authStore.hasPermission('medcenter.machine.export'))
const gridStorageKey = computed(() => `dialysis:machine-grid:${authStore.user?.id ?? 'anonymous'}`)

const columns = computed(() => createMachineColumns({
  canDelete: canDelete.value,
  canUpdate: canUpdate.value,
  onDelete: requestDeleteMachine,
  onEdit: openEditMachine,
}))

const exportConfig = computed<ServerDataGridExportConfig<MedCenterMachineGridRow> | undefined>(() => canExport.value
  ? {
      columns: machineExportColumns,
      fileName: () => `machines-${new Date().toISOString().slice(0, 10)}.xlsx`,
      load: loadMachineExport,
      sheetName: 'Аппараты',
    }
  : undefined)

function loadMachines(
  request: ServerDataGridQueryRequest,
): Promise<ServerDataGridQueryResult<MedCenterMachineGridRow>> {
  return machineApi.gridQuery(withTenantFilter(request))
}

function loadMachineExport(
  request: ServerDataGridQueryRequest,
  selectedRowIds: string[],
): Promise<ServerDataGridQueryResult<MedCenterMachineGridRow>> {
  return machineApi.gridExport({
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

function openCreateMachine() {
  machineEditorRef.value?.openCreate()
}

function openEditMachine(machine: MedCenterMachineGridRow) {
  machineEditorRef.value?.openEdit(machine.id)
}

function requestDeleteMachine(machine: MedCenterMachineGridRow) {
  deleteTarget.value = machine
}

async function deleteMachine() {
  if (!deleteTarget.value)
    return

  const machine = deleteTarget.value
  deleting.value = true
  try {
    await machineApi.delete(machine.id)
    gridRef.value?.removeSelection(machine.id)
    deleteTarget.value = null
    toast.success('Аппарат удалён')
    gridRef.value?.refresh()
  }
  catch {
    toast.error('Не удалось удалить аппарат')
  }
  finally {
    deleting.value = false
  }
}

function onMachineSaved() {
  toast.success('Аппарат сохранён')
  gridRef.value?.refresh()
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
  <BasicPage title="Аппараты" description="Аппараты диализного центра" sticky>
    <ServerDataGrid
      ref="gridRef"
      :columns="columns"
      :column-labels="machineColumnLabels"
      :default-column-pinning="machineDefaultColumnPinning"
      :default-column-visibility="machineDefaultColumnVisibility"
      :default-sorting="machineDefaultSorting"
      :export-config="exportConfig"
      :filter-fields="machineFilterFields"
      :get-row-id="machine => machine.id"
      :group-options="machineGroupOptions"
      :load="loadMachines"
      :storage-key="gridStorageKey"
      :state-version="2"
      empty-title="Аппараты не найдены"
      filter-description="Комбинируйте фильтры для поиска аппаратов на сервере."
      filter-title="Фильтры аппаратов"
      item-label="аппараты"
      load-error-message="Не удалось загрузить аппараты"
      loading-label="Загрузка аппаратов"
      search-placeholder="Поиск аппаратов..."
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
          @click="openCreateMachine"
        >
          <PlusIcon class="size-4" />
          Новый аппарат
        </UiButton>
      </template>
    </ServerDataGrid>

    <MachineEditorPopup
      ref="machineEditorRef"
      @saved="onMachineSaved"
    />

    <UiAlertDialog :open="!!deleteTarget" @update:open="open => !open && !deleting && (deleteTarget = null)">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Удалить аппарат?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Аппарат <strong>{{ deleteTarget?.name }}</strong> ({{ deleteTarget?.model }}) будет удалён.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="deleting">
            Отмена
          </UiAlertDialogCancel>
          <UiAlertDialogAction
            :disabled="deleting"
            class="bg-destructive text-white hover:bg-destructive/90"
            @click.prevent="deleteMachine"
          >
            <Trash2Icon class="size-4" />
            Удалить
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </BasicPage>
</template>

<route lang="yaml">
meta:
  requiredPermission: medcenter.machine.read
</route>

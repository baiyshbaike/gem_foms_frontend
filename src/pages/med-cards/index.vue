<script setup lang="ts">
import { PlusIcon, Trash2Icon } from '@lucide/vue'
import { toast } from 'vue-sonner'

import type {
  ServerDataGridExportConfig,
  ServerDataGridExposed,
  ServerDataGridQueryRequest,
  ServerDataGridQueryResult,
} from '@/components/server-data-grid'
import type { MedCardGridRow } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import { ServerDataGrid } from '@/components/server-data-grid'
import { medCardApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

import MedCardEditorPopup from './components/med-card-editor-popup.vue'
import {
  createMedCardColumns,
  medCardColumnLabels,
  medCardDefaultColumnPinning,
  medCardDefaultColumnVisibility,
  medCardDefaultSorting,
  medCardExportColumns,
  medCardFilterFields,
  medCardGroupOptions,
} from './med-card-grid-config'

const router = useRouter()

interface MedCardEditorComponent {
  openCreate: () => void
}

const authStore = useAuthStore()
const ALL_TENANTS = '__all__'
const gridRef = ref<ServerDataGridExposed | null>(null)
const medCardEditorRef = ref<MedCardEditorComponent | null>(null)
const deleting = ref(false)
const deleteTarget = ref<MedCardGridRow | null>(null)
const selectedTenantId = ref(ALL_TENANTS)

const canCreate = computed(() => authStore.hasPermission('medcard.create'))
const canUpdate = computed(() => authStore.hasPermission('medcard.update'))
const canDelete = computed(() => authStore.hasPermission('medcard.delete'))
const canExport = computed(() => authStore.hasPermission('medcard.export'))
const gridStorageKey = computed(() => `dialysis:medcard-grid:${authStore.user?.id ?? 'anonymous'}`)

const columns = computed(() => createMedCardColumns({
  canDelete: canDelete.value,
  canUpdate: canUpdate.value,
  onDelete: requestDeleteMedCard,
  onEdit: openEditMedCard,
  onView: viewMedCard,
}))

const exportConfig = computed<ServerDataGridExportConfig<MedCardGridRow> | undefined>(() => canExport.value
  ? {
      columns: medCardExportColumns,
      fileName: () => `med-cards-${new Date().toISOString().slice(0, 10)}.xlsx`,
      load: loadMedCardExport,
      sheetName: 'Медицинские карты',
    }
  : undefined)

function loadMedCards(
  request: ServerDataGridQueryRequest,
): Promise<ServerDataGridQueryResult<MedCardGridRow>> {
  return medCardApi.gridQuery(withTenantFilter(request))
}

function loadMedCardExport(
  request: ServerDataGridQueryRequest,
  selectedRowIds: string[],
): Promise<ServerDataGridQueryResult<MedCardGridRow>> {
  return medCardApi.gridExport({
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

function openCreateMedCard() {
  medCardEditorRef.value?.openCreate()
}

function viewMedCard(medCard: MedCardGridRow) {
  router.push(`/med-cards/${medCard.id}`)
}

function openEditMedCard(medCard: MedCardGridRow) {
  router.push(`/med-cards/${medCard.id}`)
}

function requestDeleteMedCard(medCard: MedCardGridRow) {
  deleteTarget.value = medCard
}

async function deleteMedCard() {
  if (!deleteTarget.value)
    return

  const medCard = deleteTarget.value
  deleting.value = true
  try {
    await medCardApi.delete(medCard.id)
    gridRef.value?.removeSelection(medCard.id)
    deleteTarget.value = null
    toast.success('Медицинская карта удалена')
    gridRef.value?.refresh()
  }
  catch {
    toast.error('Не удалось удалить медицинскую карту')
  }
  finally {
    deleting.value = false
  }
}

function onMedCardSaved() {
  toast.success('Медицинская карта сохранена')
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
  <BasicPage title="Медицинские карты" description="Карты лечения в рамках мед центра" sticky>
    <ServerDataGrid
      ref="gridRef"
      :columns="columns"
      :column-labels="medCardColumnLabels"
      :default-column-pinning="medCardDefaultColumnPinning"
      :default-column-visibility="medCardDefaultColumnVisibility"
      :default-sorting="medCardDefaultSorting"
      :export-config="exportConfig"
      :filter-fields="medCardFilterFields"
      :get-row-id="medCard => medCard.id"
      :group-options="medCardGroupOptions"
      :load="loadMedCards"
      :storage-key="gridStorageKey"
      empty-title="Медицинские карты не найдены"
      filter-description="Комбинируйте фильтры для поиска медицинских карт на сервере."
      filter-title="Фильтры мед. карт"
      item-label="мед. карт"
      load-error-message="Не удалось загрузить медицинские карты"
      loading-label="Загрузка медицинских карт"
      search-placeholder="Поиск мед. карт..."
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
          @click="openCreateMedCard"
        >
          <PlusIcon class="size-4" />
          Новая мед. карта
        </UiButton>
      </template>
    </ServerDataGrid>

    <MedCardEditorPopup
      ref="medCardEditorRef"
      @saved="onMedCardSaved"
    />

    <UiAlertDialog :open="!!deleteTarget" @update:open="open => !open && !deleting && (deleteTarget = null)">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Удалить медицинскую карту?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Мед. карта пациента <strong>{{ deleteTarget?.patientName }}</strong> будет удалена.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="deleting">
            Отмена
          </UiAlertDialogCancel>
          <UiAlertDialogAction
            :disabled="deleting"
            class="bg-destructive text-white hover:bg-destructive/90"
            @click.prevent="deleteMedCard"
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
  requiredPermission: medcard.read
</route>

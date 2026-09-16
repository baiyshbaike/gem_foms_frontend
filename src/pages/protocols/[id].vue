<script setup lang="ts">
import {
  ArrowLeftIcon,
  FileDownIcon,
  PrinterIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'

import type { Protocol, ProtocolHistory } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import { Badge } from '@/components/ui/badge'
import { API_BASE_URL } from '@/constants/app-config'
import { formatApiError } from '@/lib/api-error'
import { protocolApi } from '@/services/api/dialysis.api'
import { getStoredAuthSession } from '@/services/auth-session'

const route = useRoute()

const protocol = ref<Protocol | null>(null)
const loading = ref(true)
const notFound = ref(false)

function formatDate(value: string): string {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPatientName(history: ProtocolHistory): string {
  return [history.patient.lastName, history.patient.firstName, history.patient.middleName]
    .filter(Boolean)
    .join(' ')
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} Б`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} КБ`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

function documentUrl(protocolId: number, documentId: number): string {
  const session = getStoredAuthSession()
  const token = session?.accessToken
  const url = `${API_BASE_URL}/api/v1/protocols/${protocolId}/documents/${documentId}`
  return token ? `${url}?access_token=${encodeURIComponent(token)}` : url
}

const groupedHistories = computed(() => {
  if (!protocol.value) {
    return []
  }

  const groups = new Map<string, ProtocolHistory[]>()
  for (const history of protocol.value.patientHistories) {
    const key = history.oldStatusName
    const list = groups.get(key) ?? []
    list.push(history)
    groups.set(key, list)
  }

  return Array.from(groups.entries()).map(([oldStatusName, histories]) => ({
    oldStatusName,
    createdAt: histories[0].createdAt,
    histories,
  }))
})

function printProtocol() {
  window.print()
}

onMounted(async () => {
  const id = Number((route.params as Record<string, string>).id)
  if (!Number.isInteger(id) || id <= 0) {
    notFound.value = true
    loading.value = false
    return
  }

  try {
    protocol.value = await protocolApi.get(id)
  }
  catch (error) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      notFound.value = true
    }
    else {
      toast.error(formatApiError(error, 'Не удалось загрузить протокол'))
    }
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <BasicPage title="Протокол комиссии" description="Просмотр протокола освидетельствования" sticky>
    <template #actions>
      <UiButton as-child size="sm" variant="outline" class="h-9" :disabled="loading">
        <RouterLink to="/protocols">
          <ArrowLeftIcon class="size-4" />
          К списку
        </RouterLink>
      </UiButton>
      <UiButton size="sm" variant="outline" class="h-9 print:hidden" :disabled="loading || !protocol" @click="printProtocol">
        <PrinterIcon class="size-4" />
        Печать / PDF
      </UiButton>
    </template>

    <div v-if="loading" class="flex justify-center py-12">
      <Loading />
    </div>

    <div v-else-if="notFound || !protocol" class="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <p class="text-sm text-muted-foreground">
        Протокол не найден.
      </p>
      <UiButton as-child size="sm" variant="outline">
        <RouterLink to="/protocols">
          Вернуться к списку
        </RouterLink>
      </UiButton>
    </div>

    <div v-else class="space-y-6 print:space-y-4">
      <!-- Заголовок -->
      <section class="rounded-md border bg-card p-4 print:border-0 print:p-0">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold">
              Протокол №{{ protocol.id }}
            </h2>
            <p class="text-sm text-muted-foreground">
              Дата создания: {{ formatDate(protocol.createdAt) }}
            </p>
            <Badge :variant="protocol.isActive ? 'default' : 'secondary'" class="mt-1">
              {{ protocol.isActive ? 'Активен' : 'Неактивен' }}
            </Badge>
          </div>
        </div>

        <div v-if="protocol.notes" class="mt-3 border-t pt-3 print:mt-2 print:pt-2">
          <p class="text-xs font-medium text-muted-foreground">
            Примечания
          </p>
          <p class="mt-1 whitespace-pre-wrap text-sm">
            {{ protocol.notes }}
          </p>
        </div>
      </section>

      <!-- Движение пациентов -->
      <section class="space-y-4 print:space-y-3">
        <div v-for="group in groupedHistories" :key="group.oldStatusName">
          <h3 class="mb-2 text-sm font-semibold">
            Выбывшие из списка {{ group.oldStatusName }} — {{ formatDate(group.createdAt) }}
          </h3>

          <div class="overflow-x-auto rounded-md border print:border-0">
            <table class="w-full text-left text-xs">
              <thead class="bg-muted/50">
                <tr class="text-muted-foreground">
                  <th class="px-3 py-2 font-medium">
                    Пациент
                  </th>
                  <th class="px-3 py-2 font-medium">
                    ИНН
                  </th>
                  <th class="px-3 py-2 font-medium">
                    Этап
                  </th>
                  <th class="px-3 py-2 font-medium">
                    Основание
                  </th>
                  <th class="px-3 py-2 font-medium">
                    ЛПУ
                  </th>
                  <th class="px-3 py-2 font-medium">
                    Файлы
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="history in group.histories"
                  :key="history.id"
                  class="border-t"
                >
                  <td class="whitespace-nowrap px-3 py-2 font-medium">
                    {{ formatPatientName(history) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {{ history.patient.inn }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2">
                    {{ history.newStatusName }}
                  </td>
                  <td class="px-3 py-2">
                    {{ history.basisProtocolName }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {{ history.lpuName ?? '—' }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2">
                    <div v-if="history.documents.length > 0" class="flex flex-col gap-1">
                      <a
                        v-for="doc in history.documents"
                        :key="doc.id"
                        :href="documentUrl(protocol.id, doc.id)"
                        :download="doc.fileName"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex items-center gap-1 text-primary hover:underline print:text-black"
                      >
                        <FileDownIcon class="size-3" />
                        <span class="truncate">{{ doc.fileName }}</span>
                        <span class="text-[10px] text-muted-foreground">{{ formatFileSize(doc.fileSizeBytes) }}</span>
                      </a>
                    </div>
                    <span v-else class="text-muted-foreground">
                      —
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="group.histories.some(h => h.cause)" class="mt-2 space-y-1">
            <p
              v-for="history in group.histories.filter(h => h.cause)"
              :key="`cause-${history.id}`"
              class="text-xs text-muted-foreground"
            >
              <span class="font-medium">{{ formatPatientName(history) }}:</span>
              {{ history.cause }}
            </p>
          </div>
        </div>
      </section>

      <!-- Комиссия -->
      <section class="rounded-md border bg-card p-4 print:border-0 print:p-0">
        <h3 class="mb-2 text-sm font-semibold">
          Состав комиссии
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-muted/50">
              <tr class="text-muted-foreground">
                <th class="px-3 py-2 font-medium">
                  Должность
                </th>
                <th class="px-3 py-2 font-medium">
                  ФИО
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="employee in protocol.employees"
                :key="employee.id"
                class="border-t"
              >
                <td class="whitespace-nowrap px-3 py-2">
                  {{ employee.employeePosition }}
                </td>
                <td class="whitespace-nowrap px-3 py-2 font-medium">
                  {{ employee.fio }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </BasicPage>
</template>

<style scoped>
@media print {
  :deep(.global-layout-sidebar) {
    display: none !important;
  }

  :deep(.global-layout-header) {
    display: none !important;
  }

  :deep(.global-layout-content) {
    margin: 0 !important;
    padding: 0 !important;
    max-width: none !important;
  }
}
</style>

<route lang="yaml">
meta:
  requiredPermission: protocol.read
</route>

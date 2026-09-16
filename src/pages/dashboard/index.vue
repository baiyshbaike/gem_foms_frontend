<script lang="ts" setup>
import { ActivityIcon, HeartPulseIcon, MonitorCogIcon, RefreshCwIcon, UsersIcon } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'

import type { AuditLog } from '@/services/types/dialysis'

import { BasicPage } from '@/components/global-layout'
import { formatDateTime } from '@/lib/dialysis'
import { auditApi, machineApi, medCardApi, patientApi, sessionApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { activeTenant, user } = storeToRefs(authStore)
const loading = ref(false)
const counts = reactive({
  patients: 0,
  medCards: 0,
  machines: 0,
  sessions: 0,
})
const latestLogs = ref<AuditLog[]>([])

const cards = computed(() => [
  { title: 'Пациенты', value: counts.patients, icon: UsersIcon },
  { title: 'Медкарты', value: counts.medCards, icon: HeartPulseIcon },
  { title: 'Аппараты', value: counts.machines, icon: MonitorCogIcon },
  { title: 'Сеансы', value: counts.sessions, icon: ActivityIcon },
])

async function loadDashboard() {
  loading.value = true
  try {
    const patientRequest = authStore.hasPermission('patient.read')
      ? patientApi.list()
      : Promise.resolve([])
    const [patients, medCards, machines, sessions, logs] = await Promise.allSettled([
      patientRequest,
      medCardApi.list(),
      machineApi.list(),
      sessionApi.list(),
      auditApi.latest(),
    ])

    counts.patients = patients.status === 'fulfilled' ? patients.value.length : 0
    counts.medCards = medCards.status === 'fulfilled' ? medCards.value.length : 0
    counts.machines = machines.status === 'fulfilled' ? machines.value.length : 0
    counts.sessions = sessions.status === 'fulfilled' ? sessions.value.length : 0
    latestLogs.value = logs.status === 'fulfilled' ? logs.value.slice(0, 8) : []
  }
  catch {
    toast.error('Не удалось загрузить панель')
  }
  finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <BasicPage
    title="Панель"
    :description="activeTenant ? `Активный мед центр: ${activeTenant.name}` : 'Мед центр не выбран'"
    sticky
  >
    <template #actions>
      <UiButton variant="outline" :disabled="loading" @click="loadDashboard">
        <RefreshCwIcon class="mr-2 size-4" />
        Обновить
      </UiButton>
    </template>

    <div class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UiCard
          v-for="card in cards"
          :key="card.title"
        >
          <UiCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <UiCardTitle class="text-sm font-medium">
              {{ card.title }}
            </UiCardTitle>
            <component :is="card.icon" class="size-4 text-muted-foreground" />
          </UiCardHeader>
          <UiCardContent>
            <div class="text-2xl font-bold">
              {{ card.value }}
            </div>
          </UiCardContent>
        </UiCard>
      </div>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle>Последние действия</UiCardTitle>
            <UiCardDescription>
              Последние действия пользователей, зафиксированные системой аудита.
            </UiCardDescription>
          </UiCardHeader>
          <UiCardContent>
            <div class="overflow-x-auto rounded-md border">
              <table class="w-full min-w-[700px] text-sm">
                <thead class="bg-muted/60 text-left">
                  <tr>
                    <th class="px-3 py-2 font-medium">
                      Время
                    </th>
                    <th class="px-3 py-2 font-medium">
                      Модуль
                    </th>
                    <th class="px-3 py-2 font-medium">
                      Действие
                    </th>
                    <th class="px-3 py-2 font-medium">
                      Результат
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="latestLogs.length === 0">
                    <td colspan="4" class="px-3 py-8 text-center text-muted-foreground">
                      Нет данных об активности.
                    </td>
                  </tr>
                  <template v-else>
                    <tr
                      v-for="log in latestLogs"
                      :key="log.id"
                      class="border-t"
                    >
                      <td class="px-3 py-2">
                        {{ formatDateTime(log.createdAt) }}
                      </td>
                      <td class="px-3 py-2">
                        {{ log.module }}
                      </td>
                      <td class="px-3 py-2">
                        {{ log.action }}
                      </td>
                      <td class="px-3 py-2">
                        <UiBadge :variant="log.succeeded ? 'default' : 'destructive'">
                          {{ log.succeeded ? 'OK' : 'Ошибка' }}
                        </UiBadge>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </UiCardContent>
        </UiCard>

        <UiCard>
          <UiCardHeader>
            <UiCardTitle>Контекст сеанса</UiCardTitle>
            <UiCardDescription>
              Вход, обновление токена и переключение мед центра обрабатываются Pinia и axios.
            </UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="space-y-3 text-sm">
            <div class="rounded-md border p-3">
              <div class="text-xs text-muted-foreground">
                Пользователь
              </div>
              <div class="font-medium">
                {{ user?.username ?? '-' }}
              </div>
            </div>
            <div class="rounded-md border p-3">
              <div class="text-xs text-muted-foreground">
                Мед центр
              </div>
              <div class="font-medium">
                {{ activeTenant?.name ?? '-' }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ activeTenant?.code ?? '-' }}
              </div>
            </div>
          </UiCardContent>
        </UiCard>
      </div>
    </div>
  </BasicPage>
</template>

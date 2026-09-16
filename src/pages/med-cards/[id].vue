<script setup lang="ts">
import { ActivityIcon, ArrowLeftIcon, ClipboardListIcon, FileTextIcon, FlaskConicalIcon, SaveIcon, Trash2Icon } from '@lucide/vue'
import { toast } from 'vue-sonner'

import type { HdSession, MedCard, MedCardStatus } from '@/services/types/dialysis'

import { emptyToNull, formatDateTime, medCardStatusOptions, toDateTimeLocal, toIsoDateTime } from '@/lib/dialysis'
import { medCardApi, sessionApi } from '@/services/api/dialysis.api'

const route = useRoute('/med-cards/[id]')
const router = useRouter()

const infoSections = [
  { key: 'med-card', label: 'Медицинская карта', description: 'Основные поля карты лечения доступны для редактирования.' },
  { key: 'first-admission-inspection', label: 'Первичный осмотр', description: 'Раздел подготовлен для будущих полей.' },
  { key: 'respiratory-system', label: 'Дыхательная система', description: 'Раздел подготовлен для будущих полей.' },
  { key: 'cardiovascular-system', label: 'Сердечно-сосудистая система', description: 'Раздел подготовлен для будущих полей.' },
  { key: 'digestive-system', label: 'Пищеварительная система', description: 'Раздел подготовлен для будущих полей.' },
  { key: 'urogenital-system', label: 'Мочеполовая система', description: 'Раздел подготовлен для будущих полей.' },
  { key: 'endocrine-system', label: 'Эндокринная система', description: 'Раздел подготовлен для будущих полей.' },
  { key: 'neuro-psychic-system', label: 'Нервно-психическая система', description: 'Раздел подготовлен для будущих полей.' },
  { key: 'lab-instrumental-admission-exams', label: 'Лаб./инстр. обследования', description: 'Раздел подготовлен для будущих полей.' },
] as const

type InfoSectionKey = typeof infoSections[number]['key']

const loading = ref(true)
const saving = ref(false)
const medCard = ref<MedCard | null>(null)
const showDeleteDialog = ref(false)
const deleting = ref(false)
const activeTab = ref('info')
const activeInfoSection = ref<InfoSectionKey>('med-card')
const sessions = ref<HdSession[]>([])
const sessionsLoading = ref(false)
const sessionsLoaded = ref(false)

const form = reactive({
  openedAt: '',
  closedAt: '',
  status: '2',
  notes: '',
})

const patientName = ref('')
const selectedInfoSection = computed(() => infoSections.find(section => section.key === activeInfoSection.value) ?? infoSections[0])
const medCardSessions = computed(() => {
  if (!medCard.value) {
    return []
  }

  return sessions.value.filter(session => session.medCardId === medCard.value?.id)
})

async function loadMedCard() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const card = await medCardApi.get(id)
    medCard.value = card
    patientName.value = card.patientName
    Object.assign(form, {
      openedAt: toDateTimeLocal(card.openedAt),
      closedAt: toDateTimeLocal(card.closedAt),
      status: String(card.status),
      notes: card.notes ?? '',
    })
  }
  catch {
    toast.error('Не удалось загрузить медицинскую карту')
    router.push('/med-cards')
  }
  finally {
    loading.value = false
  }
}

async function loadSessions(force = false) {
  if (!medCard.value || (sessionsLoaded.value && !force)) {
    return
  }

  sessionsLoading.value = true
  try {
    sessions.value = await sessionApi.list([medCard.value.tenantId])
    sessionsLoaded.value = true
  }
  catch {
    toast.error('Не удалось загрузить сеансы')
  }
  finally {
    sessionsLoading.value = false
  }
}

async function saveMedCard() {
  if (!medCard.value)
    return

  saving.value = true
  try {
    await medCardApi.update(medCard.value.id, {
      openedAt: toIsoDateTime(form.openedAt) ?? new Date().toISOString(),
      closedAt: toIsoDateTime(form.closedAt),
      status: Number(form.status) as MedCardStatus,
      notes: emptyToNull(form.notes),
    })
    toast.success('Медицинская карта обновлена')
    await loadMedCard()
  }
  catch {
    toast.error('Не удалось обновить медицинскую карту')
  }
  finally {
    saving.value = false
  }
}

async function deleteMedCard() {
  if (!medCard.value)
    return

  deleting.value = true
  try {
    await medCardApi.delete(medCard.value.id)
    toast.success('Медицинская карта удалена')
    router.push('/med-cards')
  }
  catch {
    toast.error('Не удалось удалить медицинскую карту')
  }
  finally {
    deleting.value = false
  }
}

function formatMinutes(value: number | null) {
  return value === null ? '-' : `${value} мин`
}

watch(activeTab, (tab) => {
  if (tab === 'sessions') {
    loadSessions()
  }
})

onMounted(loadMedCard)
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="flex items-center gap-4">
      <UiButton variant="ghost" size="icon" @click="router.push('/med-cards')">
        <ArrowLeftIcon class="size-5" />
      </UiButton>
      <div>
        <h1 v-if="medCard" class="text-xl font-semibold">
          Мед. карта #{{ medCard.id }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ patientName || 'Загрузка...' }}
        </p>
      </div>
    </div>

    <UiCard v-if="loading">
      <UiCardContent class="py-8 text-center text-muted-foreground">
        Загрузка медицинской карты...
      </UiCardContent>
    </UiCard>

    <UiTabs v-else-if="medCard" v-model:model-value="activeTab" class="gap-4">
      <div class="overflow-x-auto">
        <UiTabsList class="grid h-10 w-max min-w-[640px] grid-cols-4">
          <UiTabsTrigger value="info" class="gap-2">
            <ClipboardListIcon class="size-4" />
            Карта
          </UiTabsTrigger>
          <UiTabsTrigger value="sessions" class="gap-2">
            <ActivityIcon class="size-4" />
            Сеансы
          </UiTabsTrigger>
          <UiTabsTrigger value="analyses" class="gap-2">
            <FlaskConicalIcon class="size-4" />
            Анализы
          </UiTabsTrigger>
          <UiTabsTrigger value="epicrises" class="gap-2">
            <FileTextIcon class="size-4" />
            Эпикризы
          </UiTabsTrigger>
        </UiTabsList>
      </div>

      <UiTabsContent value="info" class="mt-0">
        <div class="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside class="rounded-md border bg-background p-2">
            <button
              v-for="section in infoSections"
              :key="section.key"
              type="button"
              class="flex min-h-10 w-full items-center rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted"
              :class="section.key === activeInfoSection ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'"
              @click="activeInfoSection = section.key"
            >
              {{ section.label }}
            </button>
          </aside>

          <section v-if="activeInfoSection === 'med-card'" class="rounded-md border bg-background">
            <div class="border-b px-5 py-4">
              <h2 class="text-base font-semibold">
                Медицинская карта
              </h2>
              <p class="text-sm text-muted-foreground">
                Редактирование информации карты лечения.
              </p>
            </div>

            <form class="space-y-4 p-5" @submit.prevent="saveMedCard">
              <div class="grid gap-4 md:grid-cols-2">
                <div class="grid gap-2">
                  <UiLabel for="status" required>
                    Статус
                  </UiLabel>
                  <select id="status" v-model="form.status" class="h-9 rounded-md border bg-background px-3 text-sm">
                    <option
                      v-for="s in medCardStatusOptions"
                      :key="s.value"
                      :value="s.value"
                    >
                      {{ s.label }}
                    </option>
                  </select>
                </div>

                <div class="grid gap-2">
                  <UiLabel for="openedAt" required>
                    Открыта
                  </UiLabel>
                  <UiInput id="openedAt" v-model="form.openedAt" type="datetime-local" required />
                </div>

                <div class="grid gap-2">
                  <UiLabel for="closedAt">
                    Закрыта
                  </UiLabel>
                  <UiInput id="closedAt" v-model="form.closedAt" type="datetime-local" />
                </div>
              </div>

              <div class="grid gap-2">
                <UiLabel for="notes">
                  Примечания
                </UiLabel>
                <UiTextarea id="notes" v-model="form.notes" rows="4" />
              </div>

              <div class="flex justify-between gap-2">
                <UiButton type="button" variant="destructive" @click="showDeleteDialog = true">
                  <Trash2Icon class="mr-2 size-4" />
                  Удалить
                </UiButton>
                <UiButton type="submit" :disabled="saving">
                  <SaveIcon class="mr-2 size-4" />
                  Сохранить
                </UiButton>
              </div>
            </form>
          </section>

          <section v-else class="flex min-h-[360px] items-center justify-center rounded-md border border-dashed bg-muted/10 p-8 text-center">
            <div class="max-w-md space-y-2">
              <h2 class="text-base font-semibold">
                {{ selectedInfoSection.label }}
              </h2>
              <p class="text-sm text-muted-foreground">
                {{ selectedInfoSection.description }}
              </p>
            </div>
          </section>
        </div>
      </UiTabsContent>

      <UiTabsContent value="sessions" class="mt-0">
        <section class="rounded-md border bg-background">
          <div class="border-b px-5 py-4">
            <h2 class="text-base font-semibold">
              Сеансы
            </h2>
            <p class="text-sm text-muted-foreground">
              Сеансы диализа, привязанные к данной карте.
            </p>
          </div>

          <div v-if="sessionsLoading" class="py-12 text-center text-sm text-muted-foreground">
            Загрузка сеансов...
          </div>

          <div v-else-if="!medCardSessions.length" class="py-12 text-center text-sm text-muted-foreground">
            К данной карте ещё не привязано ни одного сеанса.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[860px] text-sm">
              <thead class="border-b bg-muted/30 text-left">
                <tr>
                  <th class="px-4 py-3 font-medium">
                    ID
                  </th>
                  <th class="px-4 py-3 font-medium">
                    Статус
                  </th>
                  <th class="px-4 py-3 font-medium">
                    Идентифицирован
                  </th>
                  <th class="px-4 py-3 font-medium">
                    Начат
                  </th>
                  <th class="px-4 py-3 font-medium">
                    Завершён
                  </th>
                  <th class="px-4 py-3 text-right font-medium">
                    Активных минут
                  </th>
                  <th class="px-4 py-3 text-right font-medium">
                    Минут паузы
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="session in medCardSessions" :key="session.id" class="border-b last:border-0">
                  <td class="px-4 py-3 font-medium">
                    {{ session.id }}
                  </td>
                  <td class="px-4 py-3">
                    <UiBadge variant="secondary">
                      {{ session.status }}
                    </UiBadge>
                  </td>
                  <td class="px-4 py-3">
                    {{ formatDateTime(session.identifiedAt) }}
                  </td>
                  <td class="px-4 py-3">
                    {{ formatDateTime(session.startedAt) }}
                  </td>
                  <td class="px-4 py-3">
                    {{ formatDateTime(session.finishedAt) }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    {{ formatMinutes(session.activeMinutes) }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    {{ formatMinutes(session.pauseMinutes) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </UiTabsContent>

      <UiTabsContent value="analyses" class="mt-0">
        <section class="flex min-h-[360px] items-center justify-center rounded-md border border-dashed bg-muted/10 p-8 text-center">
          <div class="max-w-md space-y-2">
            <h2 class="text-base font-semibold">
              Анализы
            </h2>
            <p class="text-sm text-muted-foreground">
              Раздел подготовлен для будущих моделей анализов.
            </p>
          </div>
        </section>
      </UiTabsContent>

      <UiTabsContent value="epicrises" class="mt-0">
        <section class="flex min-h-[360px] items-center justify-center rounded-md border border-dashed bg-muted/10 p-8 text-center">
          <div class="max-w-md space-y-2">
            <h2 class="text-base font-semibold">
              Эпикризы
            </h2>
            <p class="text-sm text-muted-foreground">
              Раздел подготовлен для будущих моделей эпикризов.
            </p>
          </div>
        </section>
      </UiTabsContent>
    </UiTabs>

    <UiAlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Удалить медицинскую карту?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Мед. карта пациента <strong>{{ medCard?.patientName }}</strong> будет безвозвратно удалена.
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
  </div>
</template>

<route lang="yaml">
meta:
  requiredPermission: medcard.read
</route>

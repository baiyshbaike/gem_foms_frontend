<script setup lang="ts">
import type { HubConnection } from '@microsoft/signalr'

import { QrCodeIcon, SearchIcon } from '@lucide/vue'
import { HubConnectionBuilder } from '@microsoft/signalr'
import { storeToRefs } from 'pinia'
import QRCode from 'qrcode'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { toast } from 'vue-sonner'

import type {
  SessionIdentificationPatientLookup,
  SessionIdentificationQr,
} from '@/services/types/dialysis'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { API_BASE_URL } from '@/constants/app-config'
import { formatApiError, parseApiError } from '@/lib/api-error'
import { sessionApi, sessionIdentificationApi, tundukVerificationApi } from '@/services/api/dialysis.api'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'created': []
}>()

const authStore = useAuthStore()
const { activeTenant, tenants } = storeToRefs(authStore)

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

const inn = ref('')
const selectedTenantId = ref('')
const lookup = ref<SessionIdentificationPatientLookup | null>(null)
const qr = ref<SessionIdentificationQr | null>(null)
const qrImage = ref('')
const lookupLoading = ref(false)
const qrLoading = ref(false)
const createLoading = ref(false)

const hubConnection = shallowRef<HubConnection | null>(null)
const qrTimer = ref<number | null>(null)
const qrExpired = ref(false)
const timeRemaining = ref('')
const verified = ref(false)

const isAdminMode = computed(() => authStore.hasPermission('tenant.access_all'))
const isDoctorMode = computed(() => authStore.isTenantSwitchMode)
const effectiveTenantId = computed(() => isAdminMode.value ? selectedTenantId.value : activeTenant.value?.id ?? '')
const innIsValid = computed(() => /^\d{14}$/.test(inn.value))

const tenantMissingMessage = computed(() => {
  if (isAdminMode.value && !selectedTenantId.value)
    return 'Выберите мед. центр'

  if (isDoctorMode.value && !activeTenant.value)
    return 'Выберите активный мед. центр'

  return ''
})

const canLookup = computed(() =>
  innIsValid.value
  && Boolean(effectiveTenantId.value)
  && !lookupLoading.value,
)

const confirmed = computed(() => verified.value)
const canCreate = computed(() =>
  Boolean(lookup.value)
  && (lookup.value?.canCreateImmediately || confirmed.value)
  && !createLoading.value,
)

function cleanupHubAndTimer() {
  if (hubConnection.value) {
    hubConnection.value.stop().catch(() => undefined)
    hubConnection.value = null
  }
  if (qrTimer.value !== null) {
    window.clearTimeout(qrTimer.value)
    qrTimer.value = null
  }
  qrExpired.value = false
  timeRemaining.value = ''
}

function resetFlow() {
  cleanupHubAndTimer()
  inn.value = ''
  selectedTenantId.value = ''
  lookup.value = null
  qr.value = null
  qrImage.value = ''
  verified.value = false
  lookupLoading.value = false
  qrLoading.value = false
  createLoading.value = false
}

function resetVerificationOnly() {
  lookup.value = null
  qr.value = null
  qrImage.value = ''
  verified.value = false
  cleanupHubAndTimer()
}

async function loadTenantsIfNeeded() {
  if ((isAdminMode.value || isDoctorMode.value) && tenants.value.length === 0) {
    await authStore.loadTenants()
  }
}

function tenantIdForRequest() {
  return isAdminMode.value ? selectedTenantId.value : null
}

function getSessionCreateErrorMessage(error: unknown) {
  const problem = parseApiError(error)
  if (!problem)
    return 'Не удалось создать сеанс'

  if (problem?.errorCode === 'session.patient_daily_limit') {
    return 'У пациента уже есть сеанс за сегодняшний день. Архивируйте предыдущий сеанс перед созданием нового.'
  }

  if (problem?.errorCode === 'session.tunduk_required') {
    return 'Сначала подтвердите пациента через Тундук.'
  }

  if (problem?.errorCode === 'session.tunduk_invalid') {
    return 'Подтверждение Тундук истекло или уже использовано. Создайте новый QR.'
  }

  return problem?.detail || problem?.title || 'Не удалось создать сеанс'
}

async function lookupPatient() {
  if (!canLookup.value)
    return

  lookupLoading.value = true
  resetVerificationOnly()

  try {
    const result = await sessionIdentificationApi.lookupPatient({
      tenantId: tenantIdForRequest(),
      inn: inn.value,
    })

    lookup.value = result

    if (result.canCreateImmediately) {
      toast.success('Пациент найден. Можно создать сеанс.')
      return
    }

    toast.info('Пациент найден. Требуется подтверждение через Тундук.')
  }
  catch (error) {
    toast.error(formatApiError(error, 'Медкарта не найдена. Сначала откройте медкарту.'))
  }
  finally {
    lookupLoading.value = false
  }
}

async function createQr() {
  if (!lookup.value || lookup.value.canCreateImmediately)
    return

  qrLoading.value = true
  cleanupHubAndTimer()

  try {
    const result = await tundukVerificationApi.request({
      tenantId: tenantIdForRequest(),
      medCardId: lookup.value.medCardId,
    })

    qr.value = {
      requestId: result.sessionId,
      expiresAt: result.expires,
      qrPayload: result.qrPayload,
      status: 'Pending',
    }
    qrImage.value = await QRCode.toDataURL(result.qrPayload, {
      margin: 1,
      width: 220,
    })
    qrExpired.value = false
    verified.value = false

    await startHub(result.sessionId)
    startQrTimer(result.expires)
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось создать QR'))
  }
  finally {
    qrLoading.value = false
  }
}

async function startHub(sessionId: string) {
  cleanupHubAndTimer()

  const hubUrl = `${API_BASE_URL.replace(/\/api\/v\d+$/, '')}/verificationHub`
  const connection = new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => authStore.accessToken,
    })
    .withAutomaticReconnect()
    .build()

  connection.on('VerificationCompleted', (isVerified: boolean) => {
    verified.value = isVerified
    stopQrTimer()

    if (isVerified) {
      qrExpired.value = false
      toast.success('Верификация прошла успешно!')
      return
    }

    qrImage.value = ''
    toast.error('Верификация не пройдена. Создайте новый QR.')
  })

  await connection.start()
  await connection.invoke('JoinVerificationGroup', sessionId)
  hubConnection.value = connection
}

function startQrTimer(expiresAt: string) {
  stopQrTimer()
  const expiry = new Date(expiresAt).getTime()

  function tick() {
    const remaining = expiry - Date.now()
    if (remaining <= 0) {
      qrExpired.value = true
      verified.value = false
      qrImage.value = ''
      timeRemaining.value = ''
      toast.warning('Срок действия QR истёк. Создайте новый QR.')
      return
    }
    const totalSeconds = Math.ceil(remaining / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    timeRemaining.value = `${minutes}:${seconds.toString().padStart(2, '0')}`
    qrTimer.value = window.setTimeout(tick, 1000)
  }

  tick()
}

function stopQrTimer() {
  if (qrTimer.value !== null) {
    window.clearTimeout(qrTimer.value)
    qrTimer.value = null
  }
}

async function createSession() {
  if (!lookup.value || !canCreate.value)
    return

  createLoading.value = true

  try {
    await sessionApi.create({
      tenantId: tenantIdForRequest(),
      medCardId: lookup.value.medCardId,
      identificationRequestId: confirmed.value ? qr.value?.requestId ?? null : null,
    })

    toast.success('Сеанс идентифицирован')
    emit('created')
    isOpen.value = false
  }
  catch (error) {
    toast.error(getSessionCreateErrorMessage(error))
  }
  finally {
    createLoading.value = false
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      resetFlow()
      return
    }

    resetFlow()
    await loadTenantsIfNeeded()
  },
)

watch([inn, selectedTenantId], resetVerificationOnly)

onBeforeUnmount(cleanupHubAndTimer)
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[680px]">
      <DialogHeader>
        <DialogTitle>Идентификация сеанса</DialogTitle>
        <DialogDescription>
          Найдите пациента по ИНН и подтвердите через Тундук, если это требуется.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div v-if="isAdminMode" class="grid gap-2">
          <Label for="sessionTenantId">Мед. центр</Label>
          <UiNativeSelect id="sessionTenantId" v-model="selectedTenantId">
            <option value="" disabled>
              Выберите мед. центр
            </option>
            <UiNativeSelectOption
              v-for="tenant in tenants"
              :key="tenant.id"
              :value="tenant.id"
            >
              {{ tenant.name }}
            </UiNativeSelectOption>
          </UiNativeSelect>
        </div>

        <p v-if="tenantMissingMessage" class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {{ tenantMissingMessage }}
        </p>

        <div class="grid gap-2">
          <Label for="sessionInn">ИНН</Label>
          <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <UiInput
              id="sessionInn"
              v-model="inn"
              inputmode="numeric"
              maxlength="14"
              placeholder="14 цифр"
            />
            <UiButton :disabled="!canLookup" @click="lookupPatient">
              <SearchIcon class="size-4" />
              Найти
            </UiButton>
          </div>
          <p v-if="inn && !innIsValid" class="text-sm text-destructive">
            ИНН должен содержать ровно 14 цифр.
          </p>
        </div>

        <div v-if="lookup" class="rounded-md border p-4">
          <div class="font-medium">
            {{ lookup.lastName }} {{ lookup.firstName }} {{ lookup.middleName }}
          </div>
          <div class="mt-1 text-sm text-muted-foreground">
            Медкарта #{{ lookup.medCardId }}
          </div>
          <div v-if="lookup.specialStatus" class="mt-2 text-sm text-amber-700">
            Особый статус: {{ lookup.specialStatusReasonName ?? 'без причины' }}
          </div>
          <div class="mt-2 text-sm">
            <span v-if="lookup.canCreateImmediately" class="text-emerald-700">
              Можно создать сеанс без QR.
            </span>
            <span v-else class="text-muted-foreground">
              Требуется подтверждение через Тундук.
            </span>
          </div>
        </div>

        <div v-if="lookup && !lookup.canCreateImmediately" class="grid gap-3 rounded-md border p-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div class="font-medium">
                QR подтверждение
              </div>
              <div class="text-sm text-muted-foreground">
                Статус: {{ verified ? 'Подтверждён' : qrExpired ? 'Истёк' : qr?.status ?? 'не создан' }}
              </div>
            </div>
            <UiButton variant="outline" :disabled="qrLoading" @click="createQr">
              <QrCodeIcon class="size-4" />
              Создать QR
            </UiButton>
          </div>

          <div v-if="qrImage && !qrExpired" class="flex justify-center">
            <img :src="qrImage" alt="Tunduk QR" class="size-[220px] rounded-md border bg-white p-2">
          </div>

          <p v-if="qrExpired" class="text-center text-sm text-destructive">
            Срок действия QR истёк. Создайте новый QR.
          </p>

          <p v-else-if="qr?.expiresAt" class="text-center text-sm text-muted-foreground">
            <template v-if="timeRemaining">
              Осталось: {{ timeRemaining }}
            </template>
            <template v-else>
              Действует до {{ new Date(qr.expiresAt).toLocaleString('ru-RU') }}
            </template>
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <UiButton variant="outline" :disabled="createLoading" @click="isOpen = false">
          Отмена
        </UiButton>
        <UiButton :disabled="!canCreate" @click="createSession">
          Создать сеанс
        </UiButton>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { RefreshCwIcon, SaveIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

import { settingsApi } from '@/services/api/dialysis.api'

import SettingsLayout from './components/settings-layout.vue'

const systemLoading = ref(false)
const systemSaving = ref(false)

const systemForm = reactive({
  tundukVerificationEnabled: true,
  tundukQrExpiresMinutes: 5,
  specialStatusBypassesTunduk: true,
  defaultSessionPrice: 6500,
  sessionTimeStart: 120,
  sessionTimeEnd: 30,
  identificationStartLimitMinutes: 240,
  autoFinishActiveMinutes: 270,
  endIdentificationLimitMinutes: 120,
  sendToPayLimitMinutes: 360,
})

const minuteSettingRows = [
  {
    key: 'sessionTimeStart',
    title: 'Макс. перенос начала назад',
    description: 'На сколько минут можно перенести начало активного сеанса назад.',
    min: 0,
  },
  {
    key: 'sessionTimeEnd',
    title: 'Макс. перенос завершения назад',
    description: 'На сколько минут можно указать завершение сеанса раньше текущего времени.',
    min: 0,
  },
  {
    key: 'identificationStartLimitMinutes',
    title: 'Лимит начала идентификации',
    description: 'Макс. минут после идентификации до просрочки неначатого сеанса.',
    min: 1,
  },
  {
    key: 'autoFinishActiveMinutes',
    title: 'Автоматическое завершение',
    description: 'Активных минут лечения без пауз до автоматического завершения.',
    min: 1,
  },
  {
    key: 'endIdentificationLimitMinutes',
    title: 'Лимит завершения идентификации',
    description: 'Макс. минут после завершения до просрочки завершения идентификации.',
    min: 1,
  },
  {
    key: 'sendToPayLimitMinutes',
    title: 'Лимит отправки в оплату',
    description: 'Макс. минут после завершения идентификации до просрочки отправки в оплату.',
    min: 1,
  },
] as const

async function loadSystemSettings() {
  systemLoading.value = true
  try {
    Object.assign(systemForm, await settingsApi.getSystem())
  }
  catch {
    toast.error('Не удалось загрузить системные настройки')
  }
  finally {
    systemLoading.value = false
  }
}

async function saveSystemSettings() {
  systemSaving.value = true
  try {
    await settingsApi.updateSystem({
      tundukVerificationEnabled: systemForm.tundukVerificationEnabled,
      tundukQrExpiresMinutes: Number(systemForm.tundukQrExpiresMinutes),
      specialStatusBypassesTunduk: systemForm.specialStatusBypassesTunduk,
      defaultSessionPrice: Number(systemForm.defaultSessionPrice),
      sessionTimeStart: Number(systemForm.sessionTimeStart),
      sessionTimeEnd: Number(systemForm.sessionTimeEnd),
      identificationStartLimitMinutes: Number(systemForm.identificationStartLimitMinutes),
      autoFinishActiveMinutes: Number(systemForm.autoFinishActiveMinutes),
      endIdentificationLimitMinutes: Number(systemForm.endIdentificationLimitMinutes),
      sendToPayLimitMinutes: Number(systemForm.sendToPayLimitMinutes),
    })
    toast.success('Системные настройки сохранены')
    await loadSystemSettings()
  }
  catch {
    toast.error('Не удалось сохранить системные настройки')
  }
  finally {
    systemSaving.value = false
  }
}

onMounted(loadSystemSettings)
</script>

<template>
  <SettingsLayout>
    <UiCard>
      <UiCardHeader>
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <UiCardTitle>Системные настройки</UiCardTitle>
            <UiCardDescription>
              Тундук, стоимость сеанса и сроки рабочего процесса.
            </UiCardDescription>
          </div>
          <div class="flex gap-2">
            <UiButton variant="outline" :disabled="systemLoading" @click="loadSystemSettings">
              <RefreshCwIcon class="mr-2 size-4" />
              Обновить
            </UiButton>
            <UiButton :disabled="systemSaving || systemLoading" @click="saveSystemSettings">
              <SaveIcon class="mr-2 size-4" />
              Сохранить
            </UiButton>
          </div>
        </div>
      </UiCardHeader>
      <UiCardContent>
        <form class="space-y-4" @submit.prevent="saveSystemSettings">
          <div class="grid gap-3 rounded-md border p-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <div class="font-medium">
                Тундук-верификация
              </div>
              <div class="text-sm text-muted-foreground">
                Требовать подтверждение личности через Тундук при идентификации сеанса.
              </div>
            </div>
            <UiSwitch
              id="system-tunduk-verification"
              :model-value="systemForm.tundukVerificationEnabled"
              :disabled="systemSaving || systemLoading"
              @update:model-value="value => systemForm.tundukVerificationEnabled = Boolean(value)"
            />
          </div>

          <div class="grid gap-3 rounded-md border p-4 md:grid-cols-[minmax(0,1fr)_200px]">
            <div>
              <div class="font-medium">
                Срок действия QR Тундук
              </div>
              <div class="text-sm text-muted-foreground">
                Минут до истечения QR-кода подтверждения.
              </div>
            </div>
            <div class="grid gap-2">
              <UiLabel for="system-qr-expires" required>
                Минуты
              </UiLabel>
              <UiInput id="system-qr-expires" v-model.number="systemForm.tundukQrExpiresMinutes" type="number" min="1" max="30" required />
            </div>
          </div>

          <div class="grid gap-3 rounded-md border p-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <div class="font-medium">
                Пропуск Тундука для особого статуса
              </div>
              <div class="text-sm text-muted-foreground">
                Пациенты с особым статусом могут создать сеанс без QR-подтверждения.
              </div>
            </div>
            <UiSwitch
              id="system-special-bypass"
              :model-value="systemForm.specialStatusBypassesTunduk"
              :disabled="systemSaving || systemLoading"
              @update:model-value="value => systemForm.specialStatusBypassesTunduk = Boolean(value)"
            />
          </div>

          <div class="grid gap-3 rounded-md border p-4 md:grid-cols-[minmax(0,1fr)_200px]">
            <div>
              <div class="font-medium">
                Стоимость сеанса по умолчанию
              </div>
              <div class="text-sm text-muted-foreground">
                Цена фиксируется при отправке сеанса в оплату.
              </div>
            </div>
            <div class="grid gap-2">
              <UiLabel for="system-default-price" required>
                Сом
              </UiLabel>
              <UiInput id="system-default-price" v-model.number="systemForm.defaultSessionPrice" type="number" min="0" step="100" required />
            </div>
          </div>

          <div
            v-for="row in minuteSettingRows"
            :key="row.key"
            class="grid gap-3 rounded-md border p-4 md:grid-cols-[minmax(0,1fr)_200px]"
          >
            <div>
              <div class="font-medium">
                {{ row.title }}
              </div>
              <div class="text-sm text-muted-foreground">
                {{ row.description }}
              </div>
            </div>
            <div class="grid gap-2">
              <UiLabel :for="row.key" required>
                Минуты
              </UiLabel>
              <UiInput
                :id="row.key"
                v-model.number="systemForm[row.key]"
                type="number"
                :min="row.min"
                max="1440"
                required
              />
            </div>
          </div>

          <div class="flex justify-end">
            <UiButton type="submit" :disabled="systemSaving || systemLoading">
              <SaveIcon class="mr-2 size-4" />
              Сохранить системные настройки
            </UiButton>
          </div>
        </form>
      </UiCardContent>
    </UiCard>
  </SettingsLayout>
</template>

<route lang="yaml">
meta:
  requiredPermission: session.settings.manage
</route>

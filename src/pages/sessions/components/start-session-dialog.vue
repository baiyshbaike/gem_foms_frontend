<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import type { SessionGridRow, SessionStartMachineOption } from '@/services/types/dialysis'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { formatApiError } from '@/lib/api-error'
import { sessionApi } from '@/services/api/dialysis.api'

const props = defineProps<{
  open: boolean
  session: SessionGridRow | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'sessionStarted': []
}>()

const machines = ref<SessionStartMachineOption[]>([])
const machineId = ref('')
const machinesLoading = ref(false)
const actionLoading = ref(false)

const selectedMachine = computed(() =>
  machines.value.find(machine => machine.id === Number(machineId.value)) ?? null,
)
const canStart = computed(() =>
  Boolean(selectedMachine.value?.isAvailable)
  && !machinesLoading.value
  && !actionLoading.value,
)

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

async function loadMachines() {
  if (!props.session) {
    machines.value = []
    return
  }

  machinesLoading.value = true
  try {
    machines.value = await sessionApi.startMachineOptions(props.session.id)
  }
  catch (error) {
    machines.value = []
    toast.error(formatApiError(error, 'Не удалось загрузить аппараты'))
  }
  finally {
    machinesLoading.value = false
  }
}

async function confirmStart() {
  if (!props.session || !selectedMachine.value?.isAvailable) {
    toast.error('Выберите доступный аппарат')
    return
  }

  actionLoading.value = true
  try {
    await sessionApi.start(props.session.id, {
      machineId: selectedMachine.value.id,
    })
    machineId.value = ''
    emit('sessionStarted')
    isOpen.value = false
    toast.success('Сеанс начат')
  }
  catch (error) {
    toast.error(formatApiError(error, 'Не удалось начать сеанс'))
  }
  finally {
    actionLoading.value = false
  }
}

function machineUnavailableText(reason: string | null) {
  const labels: Record<string, string> = {
    'Machine has active session': 'занят другим сеансом',
    'Machine cooldown is active': 'идет межсеансовая очистка',
    'Machine daily session limit reached': 'достигнут дневной лимит',
    'Machine permit expired': 'истек срок разрешения',
    'Machine is inactive or not approved': 'неактивен или не одобрен',
    'Machine not found in active tenant': 'аппарат не найден в мед. центре',
  }

  return reason ? labels[reason] ?? reason : 'недоступен'
}

function machineOptionText(machine: SessionStartMachineOption) {
  const title = `${machine.name} / ${machine.serialNumber}`
  return machine.isAvailable
    ? title
    : `${title} - ${machineUnavailableText(machine.unavailableReason)}`
}

watch(
  () => [props.open, props.session?.id] as const,
  ([open]) => {
    if (open) {
      machineId.value = ''
      loadMachines()
      return
    }

    machines.value = []
    machinesLoading.value = false
    machineId.value = ''
    actionLoading.value = false
  },
)

watch(
  machines,
  () => {
    if (selectedMachine.value && !selectedMachine.value.isAvailable) {
      machineId.value = ''
    }
  },
)
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Начало сеанса на аппарате</DialogTitle>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <p v-if="session" class="text-sm text-muted-foreground">
          Начало сеанса #{{ session.id }} для {{ session.patientName }}
        </p>
        <div class="grid gap-2">
          <Label for="startMachineId">Аппарат</Label>
          <UiNativeSelect
            id="startMachineId"
            v-model="machineId"
            :disabled="machinesLoading || actionLoading"
          >
            <option value="" disabled>
              {{ machinesLoading ? 'Загрузка аппаратов...' : 'Выберите аппарат' }}
            </option>
            <option
              v-for="machine in machines"
              :key="machine.id"
              :value="machine.id"
              :disabled="!machine.isAvailable"
            >
              {{ machineOptionText(machine) }}
            </option>
          </UiNativeSelect>
          <p v-if="!machinesLoading && machines.length === 0" class="text-sm text-muted-foreground">
            Для этого мед. центра нет аппаратов.
          </p>
          <p v-if="selectedMachine && !selectedMachine.isAvailable" class="text-sm text-destructive">
            {{ machineUnavailableText(selectedMachine.unavailableReason) }}
          </p>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <UiButton variant="outline" :disabled="actionLoading" @click="isOpen = false">
          Отмена
        </UiButton>
        <UiButton :disabled="!canStart" @click="confirmStart">
          Начать
        </UiButton>
      </div>
    </DialogContent>
  </Dialog>
</template>

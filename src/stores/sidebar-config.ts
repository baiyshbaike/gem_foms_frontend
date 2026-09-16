import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NavigationMode = 'collapsible' | 'vercel'

/**
 * Хранилище конфигурации бокового меню
 * Управляет пользовательскими настройками режима навигации бокового меню
 */
export const useSidebarConfigStore = defineStore(
  'sidebar-config',
  () => {
    const navigationMode = ref<NavigationMode>('collapsible')

    function setNavigationMode(mode: NavigationMode) {
      navigationMode.value = mode
    }

    return {
      navigationMode,
      setNavigationMode,
    }
  },
  {
    persist: true,
  },
)

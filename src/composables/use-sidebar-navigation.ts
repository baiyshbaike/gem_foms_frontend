import { useSessionStorage } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import type { NavGroup, NavItem } from '@/components/app-sidebar/types'

/**
 * Функция для управления навигацией бокового меню в стиле Vercel
 * Обрабатывает переходы состояния меню между разными уровнями
 */
export function useSidebarNavigation(navMain: Readonly<NavGroup[]>) {
  const route = useRoute()

  // Стек пути навигации, например ['Pages', 'Auth']
  const navigationPath = ref<string[]>([])

  // Ключ sessionStorage для сохранения пути навигации
  const STORAGE_KEY = 'sidebar-nav-path'
  const savedNavigationPath = useSessionStorage(STORAGE_KEY, navigationPath.value)

  /**
   * Находит пункт меню по его пути в иерархии навигации
   * Ищет пункт во всех NavGroup
   */
  function findItemByPath(path: string[]): NavItem | null {
    if (path.length === 0)
      return null

    // Сначала ищем начальный пункт в любой NavGroup
    const firstTitle = path[0]
    let current: any = null

    // Ищем пункт первого уровня во всех NavGroup
    for (const group of navMain as NavGroup[]) {
      const found = group.items.find((item: NavItem) => item.title === firstTitle)
      if (found) {
        if (path.length === 1)
          return found
        current = found
        break
      }
    }

    if (!current)
      return null

    // Продолжаем обход более глубоких уровней
    for (let i = 1; i < path.length; i++) {
      const title = path[i]
      if (!current.items)
        return null

      const found = current.items.find((item: NavItem) => item.title === title)
      if (!found)
        return null
      if (i === path.length - 1)
        return found

      current = found
    }

    return current
  }

  /**
   * Возвращает текущие пункты меню на основе пути навигации
   */
  const currentMenuItems = computed<any[]>(() => {
    if (navigationPath.value.length === 0) {
      // Корневой уровень: возвращаем пункты первой NavGroup
      return navMain[0]?.items || []
    }

    const parent = findItemByPath(navigationPath.value)
    return parent?.items || []
  })

  /**
   * Возвращает текущий заголовок меню для отображения хлебных крошек
   */
  const currentMenuTitle = computed(() => {
    if (navigationPath.value.length === 0) {
      return navMain[0]?.title || ''
    }
    return navigationPath.value.at(-1) || ''
  })

  /**
   * Переходит на следующий уровень меню
   */
  function enterMenu(item: NavItem) {
    if (item.items && item.items.length > 0) {
      navigationPath.value.push(item.title)
      saveNavigationPath()
    }
  }

  /**
   * Возвращается на предыдущий уровень меню
   */
  function goBack() {
    if (navigationPath.value.length > 0) {
      navigationPath.value.pop()
      saveNavigationPath()
    }
  }

  /**
   * Сбрасывает меню к корневому уровню
   */
  function reset() {
    navigationPath.value = []
    clearNavigationPath()
  }

  /**
   * Возвращает элементы хлебных крошек для отображения
   */
  function getBreadcrumbs() {
    const breadcrumbs: Array<{ title: string, path: string[] }> = [
      { title: navMain[0]?.title || 'Home', path: [] },
    ]

    for (let i = 0; i < navigationPath.value.length; i++) {
      const path = navigationPath.value.slice(0, i + 1)
      breadcrumbs.push({
        title: path.at(-1) ?? '',
        path,
      })
    }

    return breadcrumbs
  }

  /**
   * Проверяет, активен ли пункт меню относительно текущего маршрута
   */
  function isMenuItemActive(item: NavItem): boolean {
    const currentPath = route.path
    if (item.url) {
      return currentPath === item.url
    }
    if (item.items) {
      return item.items.some(subItem => isMenuItemActive(subItem as NavItem))
    }
    return false
  }

  /**
   * Сохраняет путь навигации в sessionStorage
   */
  function saveNavigationPath() {
    savedNavigationPath.value = navigationPath.value
  }

  /**
   * Загружает путь навигации из sessionStorage
   */
  function loadNavigationPath() {
    navigationPath.value = savedNavigationPath.value ?? []
  }

  /**
   * Очищает путь навигации в sessionStorage
   */
  function clearNavigationPath() {
    savedNavigationPath.value = []
  }

  // Восстанавливаем состояние навигации при монтировании
  onMounted(() => {
    loadNavigationPath()
  })

  // При необходимости очищаем путь навигации при переходе к конечному пункту меню
  // Это предотвращает сохранение вложенного вида меню при прямом переходе на страницу
  watch(
    () => route.path,
    () => {
      // Примечание: здесь можно добавить автосброс навигации при переходе на страницу
      // Пока сохраняем состояние навигации при изменении маршрута
    },
  )

  return {
    navigationPath,
    currentMenuItems,
    currentMenuTitle,
    enterMenu,
    goBack,
    reset,
    getBreadcrumbs,
    isMenuItemActive,
    saveNavigationPath,
    loadNavigationPath,
    clearNavigationPath,
  }
}

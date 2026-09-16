import type { Router } from 'vue-router'

import nprogress from 'nprogress'

/**
 * Глобальный guard маршрутизатора
 * Сейчас используется только для индикатора прогресса
 */
export function setupCommonGuard(router: Router) {
  router.beforeEach(() => {
    nprogress.start()
  })

  router.afterEach(() => {
    nprogress.done()
  })
}

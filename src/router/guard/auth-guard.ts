import type { Router } from 'vue-router'

import { storeToRefs } from 'pinia'

import pinia from '@/plugins/pinia/setup'
import { useAuthStore } from '@/stores/auth'

export function setupAuthGuard(router: Router) {
  router.beforeEach((to, from) => {
    const authStore = useAuthStore(pinia)
    const { isLogin } = storeToRefs(authStore)

    const authPaths = ['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password', '/auth/otp']
    const publicPrefixes = ['/auth', '/errors']
    const isAuthPage = authPaths.includes(to.path)
    const isFromAuthPage = authPaths.includes(from.path)
    const isPublicPage = publicPrefixes.some(path => to.path.startsWith(path))

    // Если пользователь вошел, перенаправляем со страниц входа на предыдущую страницу без аутентификации или на главную
    if (isLogin.value && isAuthPage) {
      // Проверяем, что исходный маршрут валиден: есть путь, он отличается от целевого и не является страницей аутентификации
      if (from.path && from.path !== to.path && !isFromAuthPage) {
        return from
      }
      // Резервный вариант: отправляем на главную при первом визите или небезопасном источнике
      return { path: '/' }
    }

    // Если страница требует входа, а пользователь не вошел, перенаправляем на страницу входа
    if (!isLogin.value && !isPublicPage) {
      return {
        name: '/auth/sign-in',
        query: { redirect: to.fullPath },
      }
    }

    const requiredPermission = to.meta.requiredPermission
    if (isLogin.value
      && requiredPermission
      && !authStore.hasPermission(requiredPermission)) {
      return { path: '/errors/403' }
    }
  })
}

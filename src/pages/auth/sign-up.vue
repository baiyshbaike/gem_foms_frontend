<script setup lang="ts">
import AuthTitle from './components/auth-title.vue'
import GitHubButton from './components/github-button.vue'
import GoogleButton from './components/google-button.vue'
import PrivacyPolicyButton from './components/privacy-policy-button.vue'
import TermsOfServiceButton from './components/terms-of-service-button.vue'
</script>

<template>
  <div class="flex items-center justify-center min-h-screen p-4 min-w-screen">
    <main class="flex flex-col gap-4">
      <AuthTitle />
      <UiCard class="max-w-sm mx-auto">
        <UiCardHeader>
          <UiCardTitle class="text-xl">
            Регистрация
          </UiCardTitle>
          <UiCardDescription>
            Введите email и пароль для создания аккаунта.
            Уже есть аккаунт?
            <UiButton
              variant="link" class="px-0 text-muted-foreground"
              @click="$router.push('/auth/sign-in')"
            >
              Войти
            </UiButton>
          </UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <div class="grid gap-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="grid gap-2">
                <UiLabel for="first-name" required>
                  Имя
                </UiLabel>
                <UiInput id="first-name" placeholder="Иван" required />
              </div>
              <div class="grid gap-2">
                <UiLabel for="last-name" required>
                  Фамилия
                </UiLabel>
                <UiInput id="last-name" placeholder="Иванов" required />
              </div>
            </div>
            <div class="grid gap-2">
              <UiLabel for="email" required>
                Email
              </UiLabel>
              <UiInput
                id="email"
                type="email"
                placeholder="user@example.com"
                required
              />
            </div>
            <div class="grid gap-2">
              <UiLabel for="password">
                Пароль
              </UiLabel>
              <UiInput id="password" type="password" placeholder="******" />
            </div>
            <div class="grid gap-2">
              <UiLabel for="password">
                Подтвердите пароль
              </UiLabel>
              <UiInput id="password" type="password" placeholder="******" />
            </div>
            <UiButton type="submit" class="w-full">
              Создать аккаунт
            </UiButton>

            <UiSeparator label="Или продолжить через" />

            <div class="flex flex-col items-center justify-between gap-4">
              <GitHubButton />
              <GoogleButton />
            </div>

            <UiCardDescription>
              Создавая аккаунт, вы соглашаетесь с нашими
              <TermsOfServiceButton />
              and
              <PrivacyPolicyButton />
            </UiCardDescription>
          </div>
        </UiCardContent>
      </UiCard>
    </main>
  </div>
</template>

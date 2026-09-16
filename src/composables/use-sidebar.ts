import { ActivityIcon, BellDotIcon, BookOpenCheckIcon, Building2Icon, CheckCircleIcon, ClipboardListIcon, FileQuestionIcon, FilterIcon, HeartPulseIcon, HistoryIcon, IdCardIcon, LayoutDashboardIcon, LogsIcon, MonitorCogIcon, PaletteIcon, PictureInPicture2Icon, PillIcon, ReceiptTextIcon, SettingsIcon, StethoscopeIcon, UserIcon, UsersIcon, WrenchIcon } from '@lucide/vue'

import type { NavGroup } from '@/components/app-sidebar/types'

export function useSidebar() {
  const settingsNavItems = [
    { title: 'Профиль', url: '/settings/', icon: UserIcon },
    { title: 'Аккаунт', url: '/settings/account', icon: WrenchIcon },
    { title: 'Внешний вид', url: '/settings/appearance', icon: PaletteIcon },
    { title: 'Уведомления', url: '/settings/notifications', icon: BellDotIcon },
    { title: 'Отображение', url: '/settings/display', icon: PictureInPicture2Icon },
  ]
  const ReferenceBooksItems = [
    { title: 'Причины особого статуса', url: '/reasons', icon: FileQuestionIcon, permission: 'reference_book.special_status_reason.read' },
    { title: 'Коды МКБ', url: '/code-mkb', icon: ClipboardListIcon, permission: 'reference_book.code_mkb.read' },
    { title: 'Типы диализатора', url: '/dialyzers', icon: FilterIcon, permission: 'reference_book.dialyzer_type.read' },
    { title: 'Типы лекарство', url: '/medical-types', icon: PillIcon, permission: 'reference_book.medicine_type.read' },
    { title: 'Должности врача', url: '/employee-positions', icon: StethoscopeIcon, permission: 'reference_book.employee_position.read' },
    { title: 'Основание протокола', url: '/basis-protocol', icon: BookOpenCheckIcon, permission: 'reference_book.basis_protocol.read' },
    { title: 'Сотрудники', url: '/employee-tenant', icon: IdCardIcon, permission: 'reference_book.employee_tenant.read' },
  ]

  const navData = ref<NavGroup[]> ([
    {
      title: 'Диализ',
      items: [
        { title: 'Панель', url: '/dashboard', icon: LayoutDashboardIcon },
        { title: 'Пациенты', url: '/patients', icon: UsersIcon, permission: 'patient.read' },
        { title: 'Протокол комиссии', url: '/protocols', icon: ClipboardListIcon, permission: 'protocol.read' },
        { title: 'Медкарты', url: '/med-cards', icon: HeartPulseIcon },
        { title: 'Аппараты', url: '/machines', icon: MonitorCogIcon },
        { title: 'Активные сеансы', url: '/active-sessions', icon: ActivityIcon },
        { title: 'Завершённые сеансы', url: '/finished-sessions', icon: CheckCircleIcon },
        { title: 'Все сеансы', url: '/all-sessions', icon: HistoryIcon },
        { title: 'Счет реестр', url: '/accreg', icon: ReceiptTextIcon },
        { title: 'Журнал аудита', url: '/audit-logs', icon: LogsIcon },
        { title: 'Справочники', items: ReferenceBooksItems, icon: SettingsIcon },
      ],
    },
    {
      title: 'Администрирование',
      items: [
        { title: 'Мед центры', url: '/tenants', icon: Building2Icon, permission: 'admin.tenants' },
        { title: 'Пользователи', url: '/users', icon: UserIcon },
        { title: 'Настройки', items: settingsNavItems, icon: SettingsIcon },
      ],
    },
  ])

  const otherPages = ref<NavGroup[]>([
    {
      title: 'Прочее',
      items: [
        { title: 'Настройки', icon: SettingsIcon, url: '/settings' },
      ],
    },
  ])

  return {
    navData,
    otherPages,
    settingsNavItems,
  }
}

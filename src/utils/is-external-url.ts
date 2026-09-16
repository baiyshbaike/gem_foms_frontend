/**
 * Проверяет, является ли URL внешним: полный домен или протокол
 */
export function isExternalUrl(url?: string): boolean {
  if (!url) {
    return false
  }

  // Если начинается с http:// или https://, это внешний URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true
  }

  // Если начинается с //, это URL относительно протокола, то есть тоже внешний
  if (url.startsWith('//')) {
    return true
  }

  return false
}

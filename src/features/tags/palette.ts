import type { TagColor } from '@/vault/schema'

export const TAG_CHIP_CLASS: Record<TagColor, string> = {
  red: 'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200',
  orange: 'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200',
  amber: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
  yellow: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950/60 dark:text-yellow-200',
  lime: 'bg-lime-100 text-lime-900 dark:bg-lime-950/60 dark:text-lime-200',
  green: 'bg-green-100 text-green-900 dark:bg-green-950/60 dark:text-green-200',
  teal: 'bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200',
  cyan: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-200',
  blue: 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200',
  indigo: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200',
  violet: 'bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200',
  pink: 'bg-pink-100 text-pink-900 dark:bg-pink-950/60 dark:text-pink-200',
}

export const TAG_DOT_CLASS: Record<TagColor, string> = {
  red: 'bg-red-500', orange: 'bg-orange-500', amber: 'bg-amber-500', yellow: 'bg-yellow-500', lime: 'bg-lime-500', green: 'bg-green-500',
  teal: 'bg-teal-500', cyan: 'bg-cyan-500', blue: 'bg-blue-500', indigo: 'bg-indigo-500', violet: 'bg-violet-500', pink: 'bg-pink-500',
}

export const TAG_COLOR_LABEL: Record<TagColor, string> = {
  red: '빨강', orange: '주황', amber: '호박', yellow: '노랑', lime: '라임', green: '초록',
  teal: '청록', cyan: '하늘', blue: '파랑', indigo: '남색', violet: '보라', pink: '분홍',
}

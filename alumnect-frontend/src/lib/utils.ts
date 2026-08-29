import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge conditional class names and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a large number into a compact, human-friendly string (e.g. 12.4k). */
export function compact(n: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

/** Format VND currency. */
export function vnd(n: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
}

/** Derive initials from a full name. */
export function initials(name?: string | null): string {
  if (!name || typeof name !== 'string') return '?'
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

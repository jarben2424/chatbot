'use client'

import * as React from 'react'
import { IconProps } from './types'
import { cn } from '@/lib/utils'

// Generic icon component wrapper
export function Icon({
  children,
  className,
  ...props
}: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  )
}

// Chat/Message Icons
export function IconMessage({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Icon>
  )
}

export function IconArrowElbow({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M21 14V8a2 2 0 0 0-2-2H5" />
      <path d="m3 8 4-4-4-4" />
    </Icon>
  )
}

export function IconUser({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  )
}

export function IconBot({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </Icon>
  )
}

// UI Control Icons
export function IconSpinner({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </Icon>
  )
}

export function IconPlus({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  )
}

export function IconRefresh({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </Icon>
  )
}

export function IconStop({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </Icon>
  )
}

export function IconSidebar({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </Icon>
  )
}

export function IconFile({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </Icon>
  )
}

export function IconCheck({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </Icon>
  )
}

export function IconX({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  )
}

export function IconArrowRight({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Icon>
  )
}

export function IconTrash({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </Icon>
  )
}

// Dashboard and Data Visualization Icons
export function IconBarChart({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </Icon>
  )
}

export function IconLayout({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </Icon>
  )
}

export function IconDatabase({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </Icon>
  )
}

export function IconExport({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </Icon>
  )
}

export function IconExpand({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <path d="m15 3 6 6m0-6-6 6" />
      <path d="M9 21 3 15m0 6 6-6" />
      <path d="M3 9V3h6" />
      <path d="M21 15v6h-6" />
    </Icon>
  )
}

// Add icons needed for our custom features
export function IconDashboard({ className, ...props }: IconProps) {
  return (
    <Icon className={className} {...props}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </Icon>
  )
}

// Original Vercel icons
export function IconEdit({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Icon className={className} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </Icon>
  )
}

// Add any missing icons to your existing icons file
export function IconArrowDown({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

// Add this to your existing icons.tsx file
export function IconClose({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Icon className={className} {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  )
} 
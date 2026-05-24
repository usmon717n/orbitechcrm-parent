import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  href?: string
  className?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  href,
  className,
}: EmptyStateProps) {
  const actionClass =
    'inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_12px_28px_var(--accent-glow)] transition-colors hover:bg-[var(--accent-hover)]'

  return (
    <div className={cn('card py-10 text-center', className)}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)]">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
        {description}
      </p>
      {actionLabel && href && (
        <Link href={href} className="mt-5 inline-flex">
          <span className={actionClass}>{actionLabel}</span>
        </Link>
      )}
      {actionLabel && !href && onAction && (
        <button type="button" onClick={onAction} className="mt-5 inline-flex">
          <span className={actionClass}>{actionLabel}</span>
        </button>
      )}
    </div>
  )
}

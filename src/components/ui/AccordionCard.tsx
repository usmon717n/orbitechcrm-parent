'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface AccordionCardProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  disabled?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  id?: string
  /** If true, removes padding from content area */
  noPadding?: boolean
  /** Content to display to the left of the chevron */
  rightContent?: React.ReactNode
}

/**
 * Premium Reusable Accordion Component
 * Standardized for the entire project.
 */
export function AccordionCard({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = false, // defaults to false as per requirement
  disabled = false,
  className,
  headerClassName,
  contentClassName,
  id,
  noPadding = false,
  rightContent
}: AccordionCardProps) {
  // Requirement: "Har bir accordion default holatda yopiq bo‘lsin"
  // "defaultOpen hech qayerda true bo‘lmasin, kerak bo‘lsa ham false qilib qo‘y"
  // So we strictly initialize with false unless specifically needed, 
  // but we'll follow the user's wish to have it closed by default everywhere.
  const [isOpen, setIsOpen] = useState(false) 

  const toggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  const accordionId = id || `accordion-${Math.random().toString(36).substr(2, 9)}`
  const contentId = `${accordionId}-content`

  return (
    <div 
      className={cn(
        "group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 dark:border-gray-800 dark:bg-gray-900",
        isOpen && "ring-1 ring-gray-100 dark:ring-gray-800/50",
        className
      )}
    >
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={cn(
          "flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02]",
          disabled && "cursor-not-allowed opacity-60",
          isOpen && "border-b border-gray-100 dark:border-gray-800",
          headerClassName
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition-colors dark:bg-gray-800 dark:text-gray-400">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-800 dark:text-gray-100 truncate">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 ml-2 shrink-0">
          {rightContent}
          <ChevronDown
            className={cn(
              "h-5 w-5 text-gray-400 transition-transform duration-300 ease-in-out",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </div>

      <div
        id={contentId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className={cn(!noPadding && "p-4", contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

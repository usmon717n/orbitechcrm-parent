'use client'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Brain,
  Calculator,
  FlaskConical,
  Globe,
  Languages,
  Music,
  PenTool,
  Rocket,
  Terminal,
  User,
  type LucideIcon,
} from 'lucide-react'

interface UserAvatarProps {
  avatar?: string | null
  firstName?: string | null
  lastName?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const PREF_ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Languages,
  Rocket,
  Brain,
  PenTool,
  FlaskConical,
  Calculator,
  Terminal,
  Globe,
  Music,
  User,
}

export default function UserAvatar({ avatar, firstName, lastName, className, size = 'md' }: UserAvatarProps) {
  const isPref = avatar?.startsWith('pref:')
  
  let iconName = ''
  let colorHex = ''
  
  if (isPref) {
    const parts = avatar!.split(':')
    iconName = parts[1] || ''
    colorHex = parts[2] || ''
  }

  // Map color names to hex if needed (though we mostly use hex now)
  const colorMap: Record<string, string> = {
    cyan: '#06B6D4',
    rose: '#F43F5E',
    emerald: '#10B981',
    amber: '#F59E0B',
    indigo: '#6366F1',
    violet: '#8B5CF6',
    orange: '#F97316',
  }

  const finalColor = colorMap[colorHex] || (colorHex.startsWith('#') ? colorHex : '#06B6D4')

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  }

  // Next.js Image uchun piksel qiymatlari
  const sizePx = { sm: 32, md: 40, lg: 64, xl: 80 }

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()

  if (isPref) {
    const IconComponent = PREF_ICON_MAP[iconName]

    return (
      <div 
        className={cn(
          "rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm overflow-hidden",
          sizeClasses[size],
          className
        )}
        style={{ backgroundColor: finalColor }}
      >
        {IconComponent ? (
          <IconComponent className={cn(
            size === 'sm' ? 'w-4 h-4' : 
            size === 'md' ? 'w-5 h-5' : 
            size === 'lg' ? 'w-8 h-8' : 'w-10 h-10',
            "stroke-[2.2px]"
          )} />
        ) : (
          <span className={cn(
            size === 'sm' ? 'text-sm' : 
            size === 'md' ? 'text-base' : 
            size === 'lg' ? 'text-3xl' : 'text-4xl'
          )}>{iconName}</span>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "relative rounded-full flex items-center justify-center shrink-0 overflow-hidden",
      "bg-gradient-to-br from-[var(--accent)] to-indigo-600 text-white font-black",
      "shadow-[0_2px_12px_rgba(0,0,0,0.15)] ring-[1.5px] ring-white/80 dark:ring-white/10",
      sizeClasses[size],
      className
    )}>
      {/* Premium glossy overlay for empty state */}
      {!avatar && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/40 pointer-events-none mix-blend-overlay" />
      )}
      
      {avatar ? (
        <Image
          src={avatar}
          alt="avatar"
          width={sizePx[size]}
          height={sizePx[size]}
          className="w-full h-full object-cover relative z-10"
        />
      ) : (
        <span className="relative z-10 tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
          {initials || <User className="w-[55%] h-[55%] opacity-80 drop-shadow-md" />}
        </span>
      )}
    </div>
  )
}

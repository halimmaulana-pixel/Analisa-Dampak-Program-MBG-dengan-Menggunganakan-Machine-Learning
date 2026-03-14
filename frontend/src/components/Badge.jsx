import React from 'react'
import clsx from 'clsx'

const variants = {
  success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200',
  danger: 'bg-rose-100 text-rose-800 border border-rose-200',
  info: 'bg-blue-100 text-blue-800 border border-blue-200',
  purple: 'bg-purple-100 text-purple-800 border border-purple-200',
  gray: 'bg-gray-100 text-gray-700 border border-gray-200',
  indigo: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  orange: 'bg-orange-100 text-orange-800 border border-orange-200'
}

const sizes = {
  xs: 'text-xs px-1.5 py-0.5',
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5'
}

export default function Badge({
  children,
  variant = 'info',
  size = 'sm',
  dot = false,
  className = ''
}) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap',
      variants[variant] || variants.info,
      sizes[size] || sizes.sm,
      className
    )}>
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          variant === 'success' ? 'bg-emerald-500' :
          variant === 'warning' ? 'bg-amber-500' :
          variant === 'danger' ? 'bg-rose-500' :
          variant === 'purple' ? 'bg-purple-500' :
          'bg-blue-500'
        )} />
      )}
      {children}
    </span>
  )
}

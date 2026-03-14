import React from 'react'
import clsx from 'clsx'

export default function LoadingSpinner({ size = 'md', color = 'blue', label, fullPage = false, className = '' }) {
  const sizes = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4'
  }

  const colors = {
    blue: 'border-blue-200 border-t-blue-600',
    emerald: 'border-emerald-200 border-t-emerald-600',
    amber: 'border-amber-200 border-t-amber-600',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-200 border-t-gray-600'
  }

  const spinner = (
    <div className={clsx('flex flex-col items-center gap-3', className)}>
      <div className={clsx(
        'rounded-full animate-spin',
        sizes[size] || sizes.md,
        colors[color] || colors.blue
      )} />
      {label && (
        <p className={clsx(
          'font-medium text-sm',
          color === 'white' ? 'text-white' : 'text-gray-500'
        )}>
          {label}
        </p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export function PageLoader({ label = 'Memuat data...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 py-16 gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      <p className="text-gray-500 font-medium text-sm">{label}</p>
    </div>
  )
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={clsx('bg-white rounded-xl p-5 shadow-sm border border-gray-100', className)}>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx('skeleton h-4', i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full')}
          />
        ))}
      </div>
    </div>
  )
}

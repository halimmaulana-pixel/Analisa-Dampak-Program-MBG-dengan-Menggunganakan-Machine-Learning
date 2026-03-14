import React from 'react'
import clsx from 'clsx'

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-700',
    border: 'border-blue-100'
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-700',
    border: 'border-emerald-100'
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-700',
    border: 'border-amber-100'
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'bg-rose-100 text-rose-600',
    value: 'text-rose-700',
    border: 'border-rose-100'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    value: 'text-purple-700',
    border: 'border-purple-100'
  },
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'bg-indigo-100 text-indigo-600',
    value: 'text-indigo-700',
    border: 'border-indigo-100'
  }
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  trendLabel,
  loading = false,
  className = ''
}) {
  const colors = colorMap[color] || colorMap.blue

  if (loading) {
    return (
      <div className={clsx('bg-white rounded-xl p-5 shadow-sm border border-gray-100', className)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="skeleton h-4 w-28 mb-3" />
            <div className="skeleton h-8 w-20 mb-2" />
            <div className="skeleton h-3 w-36" />
          </div>
          <div className="skeleton h-12 w-12 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className={clsx(
      'bg-white rounded-xl p-5 shadow-sm border card-hover transition-all duration-200',
      colors.border,
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1 truncate">{title}</p>
          <p className={clsx('text-2xl font-bold mb-1', colors.value)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 leading-relaxed">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center mt-2 gap-1">
              <span className={clsx(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                trend > 0 ? 'bg-emerald-100 text-emerald-700' :
                trend < 0 ? 'bg-rose-100 text-rose-700' :
                'bg-gray-100 text-gray-600'
              )}>
                {trend > 0 ? '+' : ''}{trend}
              </span>
              {trendLabel && (
                <span className="text-xs text-gray-400">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={clsx(
            'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ml-4',
            colors.icon
          )}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  )
}

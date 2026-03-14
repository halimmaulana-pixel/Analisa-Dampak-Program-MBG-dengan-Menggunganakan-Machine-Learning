import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  GraduationCap, LayoutDashboard, BarChart2, Play, Activity,
  Brain, FileText, Database, Users, LogOut, Menu, X,
  ChevronRight, Zap, User, PieChart
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'

const navItems = [
  { path: '/', label: 'Ikhtisar', icon: LayoutDashboard, exact: true, public: true },
  { path: '/eda', label: 'Eksplorasi Data', icon: BarChart2, public: false },
  { path: '/pipeline', label: 'Pipeline', icon: Play, public: false },
  { path: '/analysis', label: 'Analisis', icon: Activity, public: false },
  { path: '/predict', label: 'Prediksi', icon: Brain, public: false },
  { path: '/segmentasi', label: 'Segmentasi Siswa', icon: PieChart, public: false },
  { path: '/conclusions', label: 'Kesimpulan', icon: FileText, public: false },
]

const adminItems = [
  { path: '/data', label: 'Data', icon: Database },
  { path: '/users', label: 'Pengguna', icon: Users },
]

function NavItem({ item, collapsed, onClick }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.exact}
      onClick={onClick}
      className={({ isActive }) => clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
        isActive
          ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className="flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium truncate">{item.label}</span>
          )}
          {!collapsed && isActive && (
            <ChevronRight size={14} className="ml-auto opacity-60" />
          )}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded
                            opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50
                            transition-opacity duration-150">
              {item.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout, isAdmin, isPenelitiOrAbove } = useAuth()
  const { isDemoData } = useData()
  const navigate = useNavigate()
  const location = useLocation()

  // Breadcrumb
  const breadcrumbs = {
    '/': 'Ikhtisar',
    '/eda': 'Eksplorasi Data',
    '/pipeline': 'Pipeline Analisis',
    '/analysis': 'Hasil Analisis',
    '/predict': 'Prediksi',
    '/segmentasi': 'Segmentasi Siswa',
    '/conclusions': 'Kesimpulan',
    '/data': 'Manajemen Data',
    '/users': 'Manajemen Pengguna'
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const roleLabel = {
    admin: 'Administrator',
    peneliti: 'Peneliti',
    viewer: 'Penonton'
  }

  const roleColor = {
    admin: 'bg-blue-100 text-blue-700',
    peneliti: 'bg-purple-100 text-purple-700',
    viewer: 'bg-gray-100 text-gray-600'
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-5 border-b border-slate-100',
        collapsed ? 'justify-center' : ''
      )}>
        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl
                        flex items-center justify-center flex-shrink-0 shadow-sm">
          <GraduationCap size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 leading-tight">MBG Dashboard</div>
            <div className="text-xs text-slate-500 leading-tight">Dampak Akademik</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        )}
        {navItems.map(item => (
          <NavItem key={item.path} item={item} collapsed={collapsed} onClick={() => setSidebarOpen(false)} />
        ))}

        {(isAdmin || isPenelitiOrAbove) && (
          <>
            {!collapsed && (
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mt-4 mb-2">
                Administrasi
              </p>
            )}
            {adminItems.map(item => (
              <NavItem key={item.path} item={item} collapsed={collapsed} onClick={() => setSidebarOpen(false)} />
            ))}
          </>
        )}
      </nav>

      {/* User info */}
      {user && (
        <div className={clsx(
          'px-3 py-4 border-t border-slate-100',
          collapsed ? 'flex justify-center' : ''
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                              flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.username}</p>
                <span className={clsx(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  roleColor[user.role] || roleColor.viewer
                )}>
                  {roleLabel[user.role] || user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50
                           rounded-lg transition-colors"
                title="Keluar"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50
                         rounded-lg transition-colors"
              title="Keluar"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar – desktop */}
      <aside className={clsx(
        'hidden lg:flex flex-col bg-white border-r border-slate-100 flex-shrink-0',
        'transition-all duration-300 sidebar-transition',
        collapsed ? 'w-16' : 'w-60'
      )}>
        {sidebarContent}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(p => !p)}
          className="absolute left-full top-1/2 -translate-y-1/2 -translate-x-0 ml-0 w-5 h-10
                     bg-white border border-slate-200 rounded-r-md flex items-center justify-center
                     text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors z-10"
          style={{ position: 'fixed', left: collapsed ? '64px' : '240px' }}
        >
          <ChevronRight size={12} className={clsx('transition-transform', collapsed ? '' : 'rotate-180')} />
        </button>
      </aside>

      {/* Sidebar – mobile */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100',
        'lg:hidden flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg
                            flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">MBG Dashboard</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={18} className="text-slate-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-100 px-4 lg:px-6 py-3 flex items-center
                           justify-between gap-4 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu size={20} className="text-slate-600" />
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-400">MBG</span>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="font-semibold text-slate-800">
                {breadcrumbs[location.pathname] || 'Halaman'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Data source badge — only shown for demo data */}
            {isDemoData && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <div className="w-1.5 h-1.5 rounded-full badge-pulse bg-amber-500" />
                DATA DEMO
              </div>
            )}

            {/* User chip */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50
                              rounded-full border border-slate-200">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                                flex items-center justify-center">
                  <User size={10} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-slate-700">{user.username}</span>
              </div>
            )}

            {/* Quick run button */}
            <button
              onClick={() => navigate('/pipeline')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white
                         text-xs font-semibold rounded-full hover:bg-blue-700 transition-colors"
            >
              <Zap size={13} />
              Jalankan
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

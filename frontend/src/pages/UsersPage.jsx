import React, { useState, useEffect } from 'react'
import { Users, Plus, UserCheck, UserX, X, ShieldCheck, Eye, Pencil } from 'lucide-react'
import { auth as authApi } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import Badge from '../components/Badge.jsx'
import { PageLoader } from '../components/LoadingSpinner.jsx'
import clsx from 'clsx'

const MOCK_USERS = [
  { username: 'admin', email: 'admin@mbg.ac.id', role: 'admin', active: true, created: '2024-01-10' },
  { username: 'peneliti', email: 'peneliti@mbg.ac.id', role: 'peneliti', active: true, created: '2024-01-12' },
  { username: 'viewer', email: 'viewer@mbg.ac.id', role: 'viewer', active: true, created: '2024-02-01' },
  { username: 'guru_ipa', email: 'guru_ipa@sdn1.ac.id', role: 'viewer', active: false, created: '2024-03-15' },
]

const ROLE_OPTS = [
  { value: 'admin', label: 'Admin', icon: ShieldCheck, variant: 'info' },
  { value: 'peneliti', label: 'Peneliti', icon: Pencil, variant: 'purple' },
  { value: 'viewer', label: 'Penonton', icon: Eye, variant: 'gray' },
]

function RoleBadge({ role }) {
  const opt = ROLE_OPTS.find(r => r.value === role) || ROLE_OPTS[2]
  return <Badge variant={opt.variant} size="sm">{opt.label}</Badge>
}

function AddUserModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'viewer' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { setError('Username dan password wajib diisi'); return }
    setLoading(true)
    setError('')
    try {
      const res = await authApi.register(form)
      onAdd(res.data)
      toast.success('Pengguna berhasil ditambahkan')
      onClose()
    } catch (err) {
      // Fallback: add locally
      onAdd({ ...form, active: true, created: new Date().toISOString().slice(0, 10) })
      toast.success('Pengguna berhasil ditambahkan (demo)')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Tambah Pengguna Baru</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="mis. peneliti_baru"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="mis. user@sekolah.ac.id"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Minimal 8 karakter"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Peran</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            >
              {ROLE_OPTS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl
                         hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Tambah Pengguna'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold text-sm
                         rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const { user: currentUser } = useAuth()
  const toast = useToast()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await authApi.getUsers()
        setUsers(res.data)
      } catch {
        setUsers(MOCK_USERS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleChangeRole = async (username, newRole) => {
    try {
      await authApi.updateRole(username, newRole)
    } catch {
      // Demo: update locally
    }
    setUsers(prev => prev.map(u => u.username === username ? { ...u, role: newRole } : u))
    toast.success(`Peran ${username} diubah ke ${newRole}`)
  }

  const handleToggleActive = (username) => {
    setUsers(prev => prev.map(u =>
      u.username === username ? { ...u, active: !u.active } : u
    ))
    const user = users.find(u => u.username === username)
    toast.info(`Pengguna ${username} ${user?.active ? 'dinonaktifkan' : 'diaktifkan'}`)
  }

  const handleAddUser = (newUser) => {
    setUsers(prev => [...prev, newUser])
  }

  const roleColor = {
    admin: 'bg-blue-100 text-blue-700',
    peneliti: 'bg-purple-100 text-purple-700',
    viewer: 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddUser}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Manajemen Pengguna</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola akun pengguna, peran, dan akses sistem</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold
                     text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Tambah Pengguna
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Pengguna', value: users.length, color: 'blue' },
          { label: 'Admin', value: users.filter(u => u.role === 'admin').length, color: 'purple' },
          { label: 'Peneliti', value: users.filter(u => u.role === 'peneliti').length, color: 'indigo' },
          { label: 'Aktif', value: users.filter(u => u.active).length, color: 'emerald' },
        ].map(stat => (
          <div key={stat.label} className={clsx(
            'rounded-xl border p-4 text-center',
            stat.color === 'blue' ? 'bg-blue-50 border-blue-200' :
            stat.color === 'purple' ? 'bg-purple-50 border-purple-200' :
            stat.color === 'indigo' ? 'bg-indigo-50 border-indigo-200' :
            'bg-emerald-50 border-emerald-200'
          )}>
            <div className={clsx(
              'text-2xl font-bold',
              stat.color === 'blue' ? 'text-blue-700' :
              stat.color === 'purple' ? 'text-purple-700' :
              stat.color === 'indigo' ? 'text-indigo-700' :
              'text-emerald-700'
            )}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <PageLoader label="Memuat pengguna..." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase">Pengguna</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase">Email</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase">Peran</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase">Dibuat</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.username} className={clsx(
                    'border-b border-slate-50 transition-colors',
                    i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30',
                    'hover:bg-slate-50'
                  )}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                                        flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">
                            {u.username}
                            {u.username === currentUser?.username && (
                              <span className="ml-1.5 text-xs text-blue-500">(Anda)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{u.email || '—'}</td>
                    <td className="px-4 py-3.5">
                      {u.username === currentUser?.username ? (
                        <RoleBadge role={u.role} />
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => handleChangeRole(u.username, e.target.value)}
                          className={clsx(
                            'text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer',
                            roleColor[u.role] || roleColor.viewer
                          )}
                        >
                          {ROLE_OPTS.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.active ? 'success' : 'gray'} dot size="xs">
                        {u.active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">{u.created || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {u.username !== currentUser?.username && (
                          <button
                            onClick={() => handleToggleActive(u.username)}
                            className={clsx(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                              u.active
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            )}
                          >
                            {u.active ? (
                              <><UserX size={13} /> Nonaktifkan</>
                            ) : (
                              <><UserCheck size={13} /> Aktifkan</>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Total {users.length} pengguna · {users.filter(u => u.active).length} aktif
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

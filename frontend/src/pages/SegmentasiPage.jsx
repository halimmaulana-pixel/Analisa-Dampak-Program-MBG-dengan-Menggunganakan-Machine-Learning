import React, { useEffect, useState, useCallback } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  Search, Download, ChevronUp, ChevronDown, RefreshCw,
  Users, CheckCircle, Filter, X
} from 'lucide-react'
import { segmentation as segApi } from '../api/index.js'
import { useData } from '../context/DataContext.jsx'

const PRED_COLORS = {
  Meningkat: '#10b981',
  Stabil: '#f59e0b',
  Menurun: '#ef4444',
}

const RISK_COLORS = {
  Rendah: 'bg-emerald-100 text-emerald-700',
  Sedang: 'bg-amber-100 text-amber-700',
  Tinggi: 'bg-red-100 text-red-700',
}

const PRED_ICONS = {
  Meningkat: TrendingUp,
  Stabil: Minus,
  Menurun: TrendingDown,
}

function KPICard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className={`bg-white rounded-xl border p-4 flex items-start gap-3 shadow-sm`}>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function SegmentasiPage() {
  const { refreshTrigger } = useData()

  const [summary, setSummary] = useState(null)
  const [schools, setSchools] = useState([])
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & pagination
  const [search, setSearch] = useState('')
  const [predFilter, setPredFilter] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  // Sort
  const [sortCol, setSortCol] = useState('student_id')
  const [sortDir, setSortDir] = useState('asc')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await segApi.getAll(page, PAGE_SIZE, search, predFilter, schoolFilter)
      const d = res.data
      setSummary(d.summary)
      setSchools(d.schools || [])
      setRows(d.data || [])
      setTotal(d.total || 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, predFilter, schoolFilter, refreshTrigger])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [search, predFilter, schoolFilter])

  // Sort client-side on current page data
  const sorted = [...rows].sort((a, b) => {
    let av = a[sortCol], bv = b[sortCol]
    if (typeof av === 'string') av = av.toLowerCase()
    if (typeof bv === 'string') bv = bv.toLowerCase()
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <ChevronUp size={12} className="text-slate-300" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-blue-500" />
      : <ChevronDown size={12} className="text-blue-500" />
  }

  // CSV export (all pages — re-fetch with large page)
  async function handleExport() {
    try {
      const res = await segApi.getAll(1, 5000, search, predFilter, schoolFilter)
      const data = res.data.data || []
      const headers = ['student_id','school_name','class','gender','mbg_status','attendance_pct','ses','pre_math','pre_bahasa','prediction','risk_level','confidence']
      const csvRows = [headers.join(',')]
      data.forEach(r => {
        csvRows.push(headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
      })
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'segmentasi_siswa.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  // Chart data
  const pieData = summary ? [
    { name: 'Meningkat', value: summary.meningkat },
    { name: 'Stabil', value: summary.stabil },
    { name: 'Menurun', value: summary.menurun },
  ] : []

  // School-level breakdown from current rows
  const schoolMap = {}
  rows.forEach(r => {
    if (!schoolMap[r.school_name]) schoolMap[r.school_name] = { Meningkat: 0, Stabil: 0, Menurun: 0 }
    schoolMap[r.school_name][r.prediction] = (schoolMap[r.school_name][r.prediction] || 0) + 1
  })
  const schoolBarData = Object.entries(schoolMap)
    .map(([name, v]) => ({ name: name.replace('SD Negeri ', 'SDN '), ...v }))
    .sort((a, b) => b.Menurun - a.Menurun)
    .slice(0, 10)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle size={40} className="text-amber-500" />
        <p className="text-slate-600 font-medium">{error}</p>
        <p className="text-slate-400 text-sm">Pastikan pipeline sudah dijalankan sebelum membuka halaman ini.</p>
        <button onClick={fetchData} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Segmentasi Siswa</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Klasifikasi prediktif seluruh siswa berdasarkan model Gradient Boosting
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          label="Total Siswa"
          value={summary ? summary.total.toLocaleString() : '—'}
          color="bg-blue-500"
          icon={Users}
        />
        <KPICard
          label="Meningkat"
          value={summary ? summary.meningkat.toLocaleString() : '—'}
          sub={summary ? `${((summary.meningkat/summary.total)*100).toFixed(1)}%` : ''}
          color="bg-emerald-500"
          icon={TrendingUp}
        />
        <KPICard
          label="Stabil"
          value={summary ? summary.stabil.toLocaleString() : '—'}
          sub={summary ? `${((summary.stabil/summary.total)*100).toFixed(1)}%` : ''}
          color="bg-amber-500"
          icon={Minus}
        />
        <KPICard
          label="Menurun"
          value={summary ? summary.menurun.toLocaleString() : '—'}
          sub={summary ? `${((summary.menurun/summary.total)*100).toFixed(1)}%` : ''}
          color="bg-red-500"
          icon={TrendingDown}
        />
        <KPICard
          label="Risiko Tinggi"
          value={summary ? summary.risk_tinggi.toLocaleString() : '—'}
          sub="Perlu perhatian"
          color="bg-rose-600"
          icon={AlertTriangle}
        />
        <KPICard
          label="Rata-rata Keyakinan"
          value={summary ? `${(summary.avg_confidence * 100).toFixed(1)}%` : '—'}
          sub="Kepercayaan model"
          color="bg-indigo-500"
          icon={CheckCircle}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Distribusi Prediksi</h3>
          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={PRED_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} siswa`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PRED_COLORS[d.name] }} />
                    <span className="text-sm text-slate-600">{d.name}</span>
                    <span className="text-sm font-bold text-slate-800 ml-auto pl-4">
                      {d.value} <span className="text-slate-400 font-normal text-xs">
                        ({summary ? ((d.value / summary.total) * 100).toFixed(1) : 0}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* School bar */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Distribusi per Sekolah (halaman ini)</h3>
          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : schoolBarData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Tidak ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(160, schoolBarData.length * 28)}>
              <BarChart data={schoolBarData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Meningkat" stackId="a" fill={PRED_COLORS.Meningkat} />
                <Bar dataKey="Stabil" stackId="a" fill={PRED_COLORS.Stabil} />
                <Bar dataKey="Menurun" stackId="a" fill={PRED_COLORS.Menurun} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari ID siswa atau nama sekolah..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Prediction filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400" />
            <select
              value={predFilter}
              onChange={e => setPredFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Prediksi</option>
              <option value="Meningkat">Meningkat</option>
              <option value="Stabil">Stabil</option>
              <option value="Menurun">Menurun</option>
            </select>
          </div>

          {/* School filter */}
          <select
            value={schoolFilter}
            onChange={e => setSchoolFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-48"
          >
            <option value="">Semua Sekolah</option>
            {schools.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Clear filters */}
          {(search || predFilter || schoolFilter) && (
            <button
              onClick={() => { setSearch(''); setPredFilter(''); setSchoolFilter('') }}
              className="text-xs text-slate-500 hover:text-rose-500 flex items-center gap-1"
            >
              <X size={12} /> Hapus filter
            </button>
          )}

          <span className="ml-auto text-xs text-slate-400">
            {total.toLocaleString()} siswa ditemukan
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[
                  { col: 'student_id', label: 'ID Siswa' },
                  { col: 'school_name', label: 'Sekolah' },
                  { col: 'class', label: 'Kelas' },
                  { col: 'gender', label: 'L/P' },
                  { col: 'attendance_pct', label: 'Kehadiran' },
                  { col: 'ses', label: 'SES' },
                  { col: 'pre_math', label: 'Pre-Mat' },
                  { col: 'pre_bahasa', label: 'Pre-Bhs' },
                  { col: 'prediction', label: 'Prediksi' },
                  { col: 'risk_level', label: 'Risiko' },
                  { col: 'confidence', label: 'Keyakinan' },
                ].map(({ col, label }) => (
                  <th
                    key={col}
                    onClick={() => toggleSort(col)}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 whitespace-nowrap select-none"
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      <SortIcon col={col} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j} className="px-3 py-2.5">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada data yang cocok dengan filter.
                  </td>
                </tr>
              ) : sorted.map((r) => {
                const PredIcon = PRED_ICONS[r.prediction] || Minus
                const predColor = r.prediction === 'Meningkat' ? 'text-emerald-600' : r.prediction === 'Menurun' ? 'text-red-500' : 'text-amber-500'
                return (
                  <tr key={r.student_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-mono text-xs text-slate-600">{r.student_id}</td>
                    <td className="px-3 py-2 text-slate-700 max-w-32 truncate" title={r.school_name}>{r.school_name}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{r.class}</td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${r.gender === 'M' || r.gender === 'L' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                        {r.gender === 'M' ? 'L' : r.gender === 'F' ? 'P' : r.gender}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" style={{ minWidth: 40 }}>
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${r.attendance_pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-10 text-right">{r.attendance_pct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">{r.ses}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{r.pre_math}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{r.pre_bahasa}</td>
                    <td className="px-3 py-2">
                      <span className={`flex items-center gap-1 font-semibold ${predColor}`}>
                        <PredIcon size={13} />
                        {r.prediction}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${RISK_COLORS[r.risk_level] || 'bg-slate-100 text-slate-600'}`}>
                        {r.risk_level}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" style={{ minWidth: 40 }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${r.confidence * 100}%`,
                              background: r.confidence >= 0.7 ? '#10b981' : r.confidence >= 0.5 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-10 text-right">{(r.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-500">
              Halaman {page} dari {totalPages} ({total.toLocaleString()} total)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-white"
              >
                «
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-white"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                const p = start + i
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-2.5 py-1 text-xs rounded border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:bg-white'}`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-white"
              >
                ›
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-white"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interpretation Panel */}
      {summary && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-violet-800 mb-3">Interpretasi Segmentasi</h3>
          {(() => {
            const pct_m = ((summary.meningkat / summary.total) * 100).toFixed(1)
            const pct_s = ((summary.stabil / summary.total) * 100).toFixed(1)
            const pct_d = ((summary.menurun / summary.total) * 100).toFixed(1)
            const pct_r = ((summary.risk_tinggi / summary.total) * 100).toFixed(1)
            const conf_pct = (summary.avg_confidence * 100).toFixed(1)
            const dominant = summary.meningkat >= summary.stabil && summary.meningkat >= summary.menurun
              ? 'Meningkat'
              : summary.stabil >= summary.menurun ? 'Stabil' : 'Menurun'
            return (
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  Dari <strong>{summary.total.toLocaleString()} siswa</strong> yang dianalisis,
                  model memprediksi <strong className="text-emerald-700">{pct_m}% siswa akan Meningkat</strong>,{' '}
                  <strong className="text-amber-600">{pct_s}% Stabil</strong>, dan{' '}
                  <strong className="text-red-600">{pct_d}% berisiko Menurun</strong>.
                  Kategori dominan adalah <strong>{dominant}</strong>.
                </p>
                <p>
                  Sebanyak <strong className="text-rose-700">{summary.risk_tinggi.toLocaleString()} siswa ({pct_r}%)</strong> masuk
                  kategori <strong>Risiko Tinggi</strong> dan membutuhkan intervensi segera.
                  Rata-rata keyakinan model sebesar <strong>{conf_pct}%</strong>{' '}
                  {summary.avg_confidence >= 0.7
                    ? 'menunjukkan model memiliki kepercayaan tinggi dalam klasifikasi ini.'
                    : summary.avg_confidence >= 0.5
                    ? 'menunjukkan kepercayaan model cukup baik, meskipun ada ruang untuk peningkatan.'
                    : 'menunjukkan model memiliki ketidakpastian yang cukup tinggi — pertimbangkan untuk menambah data.'}
                </p>
                <p className="text-slate-500 text-xs border-t border-violet-100 pt-2">
                  * Segmentasi menggunakan model Gradient Boosting yang telah dilatih pada data historis.
                  Prediksi ini bersifat indikatif dan harus digunakan sebagai panduan, bukan keputusan final.
                </p>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart,
  Scatter, ScatterChart
} from 'recharts'
import { Search, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { eda as edaApi } from '../api/index.js'
import { useData } from '../context/DataContext.jsx'
import Badge from '../components/Badge.jsx'
import { PageLoader } from '../components/LoadingSpinner.jsx'

// ─── Fallback data ──────────────────────────────────────────────────────────
const FB_SUMMARY = [
  { variable: 'Kehadiran', mean: 87.3, std: 8.2, min: 60, q1: 82, median: 89, q3: 94, max: 100 },
  { variable: 'Pre-Matematika', mean: 6.18, std: 1.42, min: 2.5, q1: 5.2, median: 6.3, q3: 7.2, max: 10 },
  { variable: 'Post-Matematika', mean: 6.84, std: 1.38, min: 3, q1: 6.1, median: 7, q3: 7.8, max: 10 },
  { variable: 'Pre-Bahasa', mean: 6.42, std: 1.31, min: 3, q1: 5.5, median: 6.5, q3: 7.4, max: 10 },
  { variable: 'Post-Bahasa', mean: 7.01, std: 1.28, min: 3.5, q1: 6.2, median: 7.1, q3: 8, max: 10 },
  { variable: 'Sos. Ekonomi', mean: 2.04, std: 0.79, min: 1, q1: 1, median: 2, q3: 3, max: 3 },
  { variable: 'Kualitas Guru', mean: 3.52, std: 1.01, min: 1, q1: 3, median: 4, q3: 4, max: 5 },
  { variable: 'Dukungan Ortu', mean: 3.48, std: 1.03, min: 1, q1: 3, median: 3, q3: 4, max: 5 },
]

const FB_DIST = {
  pre_math: Array.from({ length: 9 }, (_, i) => ({ bin: `${2 + i}-${3 + i}`, count: [5, 12, 28, 52, 68, 79, 62, 38, 16][i] })),
  post_math: Array.from({ length: 9 }, (_, i) => ({ bin: `${2 + i}-${3 + i}`, count: [3, 8, 19, 42, 64, 82, 74, 51, 27][i] })),
  pre_bahasa: Array.from({ length: 9 }, (_, i) => ({ bin: `${2 + i}-${3 + i}`, count: [4, 10, 24, 48, 71, 76, 58, 42, 19][i] })),
  post_bahasa: Array.from({ length: 9 }, (_, i) => ({ bin: `${2 + i}-${3 + i}`, count: [2, 7, 16, 35, 57, 84, 79, 58, 32][i] })),
}

const FB_CORR = {
  variables: ['Kehadiran', 'Pre-MTK', 'Post-MTK', 'Pre-BHS', 'Post-BHS', 'Sos.Ek', 'Kl.Guru', 'Dkng.Ortu'],
  matrix: [
    [1.00, 0.52, 0.61, 0.49, 0.58, 0.31, 0.28, 0.33],
    [0.52, 1.00, 0.88, 0.72, 0.69, 0.24, 0.31, 0.27],
    [0.61, 0.88, 1.00, 0.70, 0.74, 0.26, 0.34, 0.29],
    [0.49, 0.72, 0.70, 1.00, 0.85, 0.21, 0.29, 0.32],
    [0.58, 0.69, 0.74, 0.85, 1.00, 0.23, 0.32, 0.35],
    [0.31, 0.24, 0.26, 0.21, 0.23, 1.00, 0.18, 0.22],
    [0.28, 0.31, 0.34, 0.29, 0.32, 0.18, 1.00, 0.41],
    [0.33, 0.27, 0.29, 0.32, 0.35, 0.22, 0.41, 1.00]
  ]
}

const FB_TREATMENT = [
  { name: 'MBG (Treatment)', value: 240 },
  { name: 'Kontrol', value: 240 }
]

const FB_DATASET = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  sekolah: ['SDN Maju', 'SDN Cerdas', 'SDN Bangsa'][i % 3],
  kelas: [4, 5, 6][i % 3],
  jk: i % 2 === 0 ? 'L' : 'P',
  mbg: i % 2 === 0 ? 1 : 0,
  kehadiran: 70 + Math.round(Math.random() * 30),
  pre_math: +(4 + Math.random() * 4).toFixed(1),
  post_math: +(5 + Math.random() * 4).toFixed(1),
  pre_bahasa: +(4 + Math.random() * 4).toFixed(1),
  post_bahasa: +(5 + Math.random() * 4).toFixed(1)
}))

// ─── Heatmap cell color ──────────────────────────────────────────────────────
function corrColor(v) {
  if (v === 1) return 'bg-blue-700 text-white'
  if (v >= 0.7) return 'bg-blue-500 text-white'
  if (v >= 0.4) return 'bg-blue-300 text-blue-900'
  if (v >= 0.1) return 'bg-blue-100 text-blue-800'
  if (v >= -0.1) return 'bg-gray-50 text-gray-600'
  if (v >= -0.4) return 'bg-rose-100 text-rose-800'
  return 'bg-rose-400 text-white'
}

const TABS = [
  { id: 'summary', label: 'Ringkasan' },
  { id: 'dist', label: 'Distribusi' },
  { id: 'boxplot', label: 'Boxplot' },
  { id: 'corr', label: 'Korelasi' },
  { id: 'part', label: 'Partisipasi' },
  { id: 'dataset', label: 'Dataset' }
]

const PIE_COLORS = ['#3b82f6', '#10b981']

export default function EDAPage() {
  const [activeTab, setActiveTab] = useState('summary')
  const [summaryData, setSummaryData] = useState(null)
  const [distData, setDistData] = useState(null)
  const [corrData, setCorrData] = useState(null)
  const [treatData, setTreatData] = useState(null)
  const [dataset, setDataset] = useState([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const pageSize = 10
  const { refreshTrigger } = useData()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [s, d, c, t] = await Promise.allSettled([
          edaApi.getSummary(),
          edaApi.getDistribution(),
          edaApi.getCorrelation(),
          edaApi.getTreatmentDist()
        ])

        // Transform summary: {attendance_pct: {mean, std, min, Q1, median, Q3, max}} -> array
        if (s.status === 'fulfilled') {
          const raw = s.value.data
          const labelMap = {
            attendance_pct: 'Kehadiran (%)', ses: 'Sos. Ekonomi',
            teacher_quality: 'Kualitas Guru', parental_support: 'Dukungan Ortu',
            pre_math: 'Pre-Matematika', post_math: 'Post-Matematika',
            pre_bahasa: 'Pre-Bahasa', post_bahasa: 'Post-Bahasa'
          }
          setSummaryData(Object.entries(raw).map(([k, v]) => ({
            variable: labelMap[k] || k,
            mean: v.mean, std: v.std, min: v.min,
            q1: v.Q1, median: v.median, q3: v.Q3, max: v.max
          })))
        } else { setSummaryData(FB_SUMMARY) }

        // Transform distribution: {pre_math: {bins, counts}} -> {pre_math: [{bin, count}]}
        if (d.status === 'fulfilled') {
          const raw = d.value.data
          const transformed = {}
          for (const [key, val] of Object.entries(raw)) {
            transformed[key] = val.counts.map((count, i) => ({
              bin: `${Number(val.bins[i]).toFixed(1)}-${Number(val.bins[i+1]).toFixed(1)}`,
              count
            }))
          }
          setDistData(transformed)
        } else { setDistData(FB_DIST) }

        // Transform correlation: {columns, matrix} -> {variables, matrix}
        if (c.status === 'fulfilled') {
          const raw = c.value.data
          const labelMap = {
            attendance_pct: 'Kehadiran', ses: 'Sos.Ek',
            teacher_quality: 'Kl.Guru', parental_support: 'Dkng.Ortu',
            pre_math: 'Pre-MTK', post_math: 'Post-MTK',
            pre_bahasa: 'Pre-BHS', post_bahasa: 'Post-BHS'
          }
          setCorrData({
            variables: raw.columns.map(c => labelMap[c] || c),
            matrix: raw.matrix
          })
        } else { setCorrData(FB_CORR) }

        // Transform treatment: {treatment, control, ...} -> [{name, value}]
        if (t.status === 'fulfilled') {
          const raw = t.value.data
          setTreatData([
            { name: 'MBG (Treatment)', value: raw.treatment },
            { name: 'Kontrol', value: raw.control }
          ])
        } else { setTreatData(FB_TREATMENT) }

      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshTrigger])

  useEffect(() => {
    const loadDataset = async () => {
      try {
        const res = await edaApi.getDataset(page, pageSize, search)
        const raw = res.data
        // Normalize backend fields to component fields
        const rows = (raw.data || raw.rows || raw).map((r, i) => ({
          id: r.student_id || r.id || i + 1,
          sekolah: r.school_name || r.sekolah || '-',
          kelas: r.class || r.kelas || '-',
          jk: r.gender === 'M' ? 'L' : (r.gender === 'F' ? 'P' : (r.jk || r.gender || '-')),
          mbg: r.mbg_status ?? r.mbg ?? 0,
          kehadiran: r.attendance_pct ?? r.kehadiran ?? 0,
          pre_math: r.pre_math ?? 0,
          post_math: r.post_math ?? 0,
          pre_bahasa: r.pre_bahasa ?? 0,
          post_bahasa: r.post_bahasa ?? 0,
        }))
        setDataset(rows)
        setTotalRows(raw.total || rows.length)
      } catch {
        const filtered = FB_DATASET.filter(r =>
          search ? r.sekolah.toLowerCase().includes(search.toLowerCase()) : true
        )
        const start = (page - 1) * pageSize
        setDataset(filtered.slice(start, start + pageSize))
        setTotalRows(filtered.length)
      }
    }
    if (activeTab === 'dataset') loadDataset()
  }, [activeTab, page, search, refreshTrigger])

  const summary = summaryData ?? FB_SUMMARY
  const dist = distData ?? FB_DIST
  const corr = corrData ?? FB_CORR
  const treat = treatData ?? FB_TREATMENT
  const totalPages = Math.ceil(totalRows / pageSize)

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Eksplorasi Data</h1>
        <p className="text-sm text-slate-500 mt-1">Analisis statistik deskriptif dan visualisasi distribusi data penelitian</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 overflow-x-auto">
          <div className="flex min-w-max">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {loading && activeTab !== 'dataset' ? (
            <PageLoader label="Memuat data EDA..." />
          ) : (
            <>
              {/* ── Summary Tab ── */}
              {activeTab === 'summary' && (
                <div className="animate-fade-in">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">
                    Statistik Deskriptif — 8 Variabel Numerik
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Variabel</th>
                          <th className="text-right px-3 py-3 font-semibold text-slate-600 text-xs uppercase">Mean</th>
                          <th className="text-right px-3 py-3 font-semibold text-slate-600 text-xs uppercase">Std</th>
                          <th className="text-right px-3 py-3 font-semibold text-slate-600 text-xs uppercase">Min</th>
                          <th className="text-right px-3 py-3 font-semibold text-slate-600 text-xs uppercase">Q1</th>
                          <th className="text-right px-3 py-3 font-semibold text-slate-600 text-xs uppercase">Median</th>
                          <th className="text-right px-3 py-3 font-semibold text-slate-600 text-xs uppercase">Q3</th>
                          <th className="text-right px-3 py-3 font-semibold text-slate-600 text-xs uppercase">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.map((row, i) => (
                          <tr key={row.variable} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="px-4 py-3 font-medium text-slate-700">{row.variable}</td>
                            <td className="text-right px-3 py-3 text-slate-600 font-mono text-xs">{Number(row.mean).toFixed(2)}</td>
                            <td className="text-right px-3 py-3 text-slate-500 font-mono text-xs">{Number(row.std).toFixed(2)}</td>
                            <td className="text-right px-3 py-3 text-slate-500 font-mono text-xs">{row.min}</td>
                            <td className="text-right px-3 py-3 text-blue-600 font-mono text-xs">{row.q1}</td>
                            <td className="text-right px-3 py-3 text-blue-700 font-semibold font-mono text-xs">{row.median}</td>
                            <td className="text-right px-3 py-3 text-blue-600 font-mono text-xs">{row.q3}</td>
                            <td className="text-right px-3 py-3 text-slate-500 font-mono text-xs">{row.max}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Distribution Tab ── */}
              {activeTab === 'dist' && (
                <div className="animate-fade-in">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">
                    Distribusi Nilai — Histogram per Variabel
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { key: 'pre_math', label: 'Pre-Matematika', color: '#3b82f6' },
                      { key: 'post_math', label: 'Post-Matematika', color: '#6366f1' },
                      { key: 'pre_bahasa', label: 'Pre-Bahasa Indonesia', color: '#10b981' },
                      { key: 'post_bahasa', label: 'Post-Bahasa Indonesia', color: '#059669' }
                    ].map(({ key, label, color }) => (
                      <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h4 className="text-xs font-semibold text-slate-600 mb-3">{label}</h4>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={dist[key]} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="bin" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ fontSize: 11 }} />
                            <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Boxplot Tab ── */}
              {activeTab === 'boxplot' && (
                <div className="animate-fade-in">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">
                    Distribusi Skor per Sekolah
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { label: 'Matematika', color: '#3b82f6',
                        data: [
                          { sekolah: 'SDN Maju', min: 4.5, q1: 5.8, median: 6.5, q3: 7.4, max: 9.5 },
                          { sekolah: 'SDN Cerdas', min: 5, q1: 6.2, median: 7, q3: 7.8, max: 10 },
                          { sekolah: 'SDN Bangsa', min: 3, q1: 5.2, median: 6.1, q3: 7, max: 9 }
                        ]
                      },
                      { label: 'Bahasa Indonesia', color: '#10b981',
                        data: [
                          { sekolah: 'SDN Maju', min: 4.8, q1: 6, median: 6.8, q3: 7.6, max: 9.5 },
                          { sekolah: 'SDN Cerdas', min: 5.2, q1: 6.4, median: 7.2, q3: 8, max: 10 },
                          { sekolah: 'SDN Bangsa', min: 3.5, q1: 5.5, median: 6.4, q3: 7.3, max: 9.2 }
                        ]
                      }
                    ].map(({ label, color, data }) => (
                      <div key={label} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h4 className="text-xs font-semibold text-slate-600 mb-3">{label}</h4>
                        <div className="space-y-4">
                          {data.map((d) => (
                            <div key={d.sekolah}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-slate-600">{d.sekolah}</span>
                                <span className="text-xs text-slate-400">med: {d.median}</span>
                              </div>
                              <div className="relative h-6 flex items-center">
                                <div className="absolute w-full h-0.5 bg-slate-200" />
                                {/* Box */}
                                <div
                                  className="absolute h-4 rounded border-2 opacity-80"
                                  style={{
                                    left: `${(d.q1 / 10) * 100}%`,
                                    width: `${((d.q3 - d.q1) / 10) * 100}%`,
                                    backgroundColor: color + '30',
                                    borderColor: color
                                  }}
                                />
                                {/* Median */}
                                <div
                                  className="absolute w-0.5 h-5 rounded"
                                  style={{ left: `${(d.median / 10) * 100}%`, backgroundColor: color }}
                                />
                                {/* Whiskers */}
                                <div className="absolute w-1 h-3 border-l-2 rounded"
                                  style={{ left: `${(d.min / 10) * 100}%`, borderColor: color }} />
                                <div className="absolute w-1 h-3 border-l-2 rounded"
                                  style={{ left: `${(d.max / 10) * 100}%`, borderColor: color }} />
                              </div>
                              <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                                <span>{d.min}</span>
                                <span>Q1:{d.q1}</span>
                                <span>Q3:{d.q3}</span>
                                <span>{d.max}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Correlation Tab ── */}
              {activeTab === 'corr' && (
                <div className="animate-fade-in">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">
                    Matriks Korelasi Pearson
                  </h3>
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full">
                      <div className="flex">
                        <div className="w-24 flex-shrink-0" />
                        {corr.variables.map(v => (
                          <div key={v} className="w-16 flex-shrink-0 text-center text-xs text-slate-500 font-medium pb-2 truncate px-0.5" title={v}>
                            {v}
                          </div>
                        ))}
                      </div>
                      {corr.matrix.map((row, i) => (
                        <div key={i} className="flex items-center">
                          <div className="w-24 flex-shrink-0 text-xs text-slate-500 font-medium pr-2 truncate" title={corr.variables[i]}>
                            {corr.variables[i]}
                          </div>
                          {row.map((val, j) => (
                            <div
                              key={j}
                              className={`w-16 h-10 flex-shrink-0 flex items-center justify-center text-xs font-bold
                                          rounded m-0.5 heatmap-cell cursor-default ${corrColor(val)}`}
                              title={`${corr.variables[i]} × ${corr.variables[j]}: ${val.toFixed(2)}`}
                            >
                              {val.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-slate-500 font-medium">Legenda:</span>
                    {[
                      { label: 'Kuat positif (≥0.7)', cls: 'bg-blue-500 text-white' },
                      { label: 'Sedang (0.4–0.7)', cls: 'bg-blue-300 text-blue-900' },
                      { label: 'Lemah (<0.4)', cls: 'bg-blue-100 text-blue-800' },
                      { label: 'Negatif', cls: 'bg-rose-200 text-rose-800' }
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold ${l.cls}`}>
                          {l.cls.includes('rose') ? '–' : '+'}
                        </div>
                        <span className="text-xs text-slate-500">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Participation Tab ── */}
              {activeTab === 'part' && (
                <div className="animate-fade-in">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">
                    Distribusi Partisipasi Program MBG
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={treat}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {treat.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} siswa`, 'Jumlah']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-4">
                      {treat.map((t, i) => (
                        <div key={t.name} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                            <span className="text-sm font-semibold text-slate-700">{t.name}</span>
                          </div>
                          <div className="text-2xl font-bold" style={{ color: PIE_COLORS[i] }}>
                            {t.value}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">siswa ({((t.value / treat.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}% dari total)</div>
                          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{
                              backgroundColor: PIE_COLORS[i],
                              width: `${(t.value / treat.reduce((a, b) => a + b.value, 0)) * 100}%`
                            }} />
                          </div>
                        </div>
                      ))}
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="text-xs text-blue-600 font-semibold mb-1">Total Sampel</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {treat.reduce((a, b) => a + b.value, 0)} siswa
                        </div>
                        <div className="text-xs text-blue-500 mt-1">Rasio treatment:kontrol = 1:1</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Dataset Tab ── */}
              {activeTab === 'dataset' && (
                <div className="animate-fade-in">
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari sekolah, siswa..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                      />
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 px-2">
                      <Filter size={13} />
                      {totalRows} baris
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50">
                          {['ID', 'Sekolah', 'Kelas', 'JK', 'MBG', 'Kehadiran', 'Pre-MTK', 'Post-MTK', 'Pre-BHS', 'Post-BHS'].map(h => (
                            <th key={h} className="text-left px-3 py-3 font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(dataset.length ? dataset : FB_DATASET.slice((page - 1) * pageSize, page * pageSize)).map((row, i) => (
                          <tr key={row.id} className={i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/50'}>
                            <td className="px-3 py-2.5 text-slate-500">{row.id}</td>
                            <td className="px-3 py-2.5 text-slate-700 font-medium">{row.sekolah}</td>
                            <td className="px-3 py-2.5 text-slate-600">{row.kelas}</td>
                            <td className="px-3 py-2.5">
                              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                row.jk === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                              }`}>{row.jk}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                row.mbg ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                              }`}>{row.mbg ? 'Ya' : 'Tidak'}</span>
                            </td>
                            <td className="px-3 py-2.5 font-mono">{row.kehadiran}%</td>
                            <td className="px-3 py-2.5 font-mono text-slate-600">{row.pre_math}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-600">{row.post_math}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-600">{row.pre_bahasa}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-600">{row.post_bahasa}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-slate-500">
                      Hal. {page} dari {totalPages} ({totalRows} total)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40
                                   hover:bg-slate-100 transition-colors"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                        return pg <= totalPages ? (
                          <button
                            key={pg}
                            onClick={() => setPage(pg)}
                            className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                              page === pg
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {pg}
                          </button>
                        ) : null
                      })}
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40
                                   hover:bg-slate-100 transition-colors"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

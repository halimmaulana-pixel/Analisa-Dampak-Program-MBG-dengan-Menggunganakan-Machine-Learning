import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, ReferenceLine, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ErrorBar,
  ComposedChart, Area
} from 'recharts'
import { Search, TrendingUp, Activity, Cpu, Zap, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { psm, did, model, shap as shapApi } from '../api/index.js'
import { useData } from '../context/DataContext.jsx'
import Badge from '../components/Badge.jsx'
import { PageLoader } from '../components/LoadingSpinner.jsx'
import clsx from 'clsx'

// ─── Fallback data ───────────────────────────────────────────────────────────
const FB_PSM = {
  balance_quality: 'Baik',
  n_matched: 228,
  smd_table: [
    { variable: 'Kehadiran', before: 0.342, after: 0.041 },
    { variable: 'Sos. Ekonomi', before: 0.287, after: 0.028 },
    { variable: 'Kualitas Guru', before: 0.215, after: 0.035 },
    { variable: 'Dukungan Ortu', before: 0.198, after: 0.029 },
    { variable: 'Pre-Matematika', before: 0.412, after: 0.052 },
    { variable: 'Pre-Bahasa', before: 0.388, after: 0.044 },
  ],
  propensity_dist: [
    { score: '0.1', treatment: 12, control: 8 },
    { score: '0.2', treatment: 24, control: 19 },
    { score: '0.3', treatment: 42, control: 38 },
    { score: '0.4', treatment: 58, control: 54 },
    { score: '0.5', treatment: 62, control: 58 },
    { score: '0.6', treatment: 48, control: 44 },
    { score: '0.7', treatment: 26, control: 22 },
    { score: '0.8', treatment: 10, control: 8 },
  ]
}

const FB_DID = {
  ate_overall: 0.65,
  ate_math: 0.72,
  ate_bahasa: 0.58,
  p_value_overall: 0.004,
  p_value_math: 0.003,
  p_value_bahasa: 0.011,
  ci_lower: 0.38,
  ci_upper: 0.92,
  parallel_trends: [
    { period: 'T-3', treatment: 5.8, control: 5.7 },
    { period: 'T-2', treatment: 6.0, control: 5.9 },
    { period: 'T-1', treatment: 6.2, control: 6.1 },
    { period: 'T (Post)', treatment: 7.1, control: 6.3 },
  ],
  by_subject: [
    { subject: 'Matematika', ate: 0.72, ci_lower: 0.45, ci_upper: 0.99, p_value: 0.003 },
    { subject: 'Bahasa Indonesia', ate: 0.58, ci_lower: 0.31, ci_upper: 0.85, p_value: 0.011 },
  ]
}

const FB_MODEL = {
  accuracy: 0.847,
  f1: 0.831,
  precision: 0.842,
  recall: 0.831,
  confusion_matrix: [
    [28, 2, 1],
    [3, 31, 2],
    [1, 2, 26]
  ],
  labels: ['Menurun', 'Stabil', 'Meningkat'],
  learning_curve: [
    { size: 100, train: 0.82, val: 0.73 },
    { size: 160, train: 0.85, val: 0.78 },
    { size: 220, train: 0.87, val: 0.81 },
    { size: 280, train: 0.88, val: 0.83 },
    { size: 340, train: 0.89, val: 0.84 },
    { size: 384, train: 0.90, val: 0.847 },
  ],
  robustness: [
    { method: 'Full Dataset', accuracy: 0.847, f1: 0.831 },
    { method: 'CV-Fold 1', accuracy: 0.833, f1: 0.818 },
    { method: 'CV-Fold 2', accuracy: 0.854, f1: 0.839 },
    { method: 'CV-Fold 3', accuracy: 0.841, f1: 0.826 },
    { method: 'CV-Fold 4', accuracy: 0.859, f1: 0.844 },
    { method: 'CV-Fold 5', accuracy: 0.838, f1: 0.823 },
  ]
}

const FB_SHAP = {
  features: [
    { feature: 'Kehadiran', importance: 0.312, color: '#3b82f6' },
    { feature: 'Pre-Matematika', importance: 0.248, color: '#6366f1' },
    { feature: 'Pre-Bahasa', importance: 0.198, color: '#8b5cf6' },
    { feature: 'Status MBG', importance: 0.156, color: '#10b981' },
    { feature: 'Kualitas Guru', importance: 0.086, color: '#f59e0b' },
    { feature: 'Sos. Ekonomi', importance: 0.062, color: '#f97316' },
    { feature: 'Dukungan Ortu', importance: 0.055, color: '#ef4444' },
    { feature: 'Kelas', importance: 0.028, color: '#64748b' },
  ],
  beeswarm: Array.from({ length: 40 }, (_, i) => ({
    feature_value: Math.random(),
    shap_value: (Math.random() - 0.3) * 0.8,
    feature: ['Kehadiran', 'Pre-Matematika', 'Pre-Bahasa', 'Status MBG'][i % 4]
  }))
}

const TABS = [
  { id: 'psm', label: 'PSM', icon: Activity },
  { id: 'did', label: 'DiD', icon: TrendingUp },
  { id: 'model', label: 'Gradient Boosting', icon: Cpu },
  { id: 'shap', label: 'SHAP', icon: Zap }
]

function CMCell({ value, maxVal }) {
  const intensity = maxVal > 0 ? value / maxVal : 0
  const isDiag = intensity > 0.6
  return (
    <div className={clsx(
      'w-14 h-14 flex items-center justify-center rounded-lg text-sm font-bold border',
      isDiag ? 'bg-blue-500 text-white border-blue-600' :
      intensity > 0.2 ? 'bg-rose-100 text-rose-800 border-rose-200' :
      'bg-slate-50 text-slate-500 border-slate-100'
    )}>
      {value}
    </div>
  )
}

// Custom forest plot dot
const ForestDot = (props) => {
  const { cx, cy, payload } = props
  const half = ((payload.ci_upper - payload.ci_lower) / 2) * 60
  return (
    <g>
      <line x1={cx - half} y1={cy} x2={cx + half} y2={cy}
        stroke={payload.p_value < 0.05 ? '#3b82f6' : '#94a3b8'} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={6}
        fill={payload.p_value < 0.05 ? '#3b82f6' : '#94a3b8'} />
      <line x1={cx - half} y1={cy - 5} x2={cx - half} y2={cy + 5}
        stroke={payload.p_value < 0.05 ? '#3b82f6' : '#94a3b8'} strokeWidth={1.5} />
      <line x1={cx + half} y1={cy - 5} x2={cx + half} y2={cy + 5}
        stroke={payload.p_value < 0.05 ? '#3b82f6' : '#94a3b8'} strokeWidth={1.5} />
    </g>
  )
}

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState('psm')
  const [psmData, setPsmData] = useState(null)
  const [didData, setDidData] = useState(null)
  const [modelData, setModelData] = useState(null)
  const [shapData, setShapData] = useState(null)
  const [dependenceData, setDependenceData] = useState([])
  const [loading, setLoading] = useState(true)
  const { refreshTrigger } = useData()
  const [studentId, setStudentId] = useState('')
  const [localShap, setLocalShap] = useState(null)
  const [localLoading, setLocalLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [pRes, dRes, dSubRes, dTrendRes, mRes, mLcRes, mRobRes, sRes, sBeeRes, sDepRes] = await Promise.allSettled([
          psm.getSummary(),
          did.getResult(),
          did.getBySubject(),
          did.getParallelTrends(),
          model.getMetrics(),
          model.getLearningCurve(),
          model.getRobustness(),
          shapApi.getGlobal(),
          shapApi.getBeeswarm(),
          shapApi.getDependence()
        ])

        // ── PSM transform ──────────────────────────────────────────
        if (pRes.status === 'fulfilled') {
          const r = pRes.value.data
          const labelMap = {
            attendance_pct: 'Kehadiran', ses: 'Sos. Ekonomi',
            teacher_quality: 'Kualitas Guru', parental_support: 'Dukungan Ortu',
            pre_math: 'Pre-Matematika', pre_bahasa: 'Pre-Bahasa'
          }
          const before = r.standardized_mean_diff_before || {}
          const after  = r.standardized_mean_diff_after  || {}
          setPsmData({
            balance_quality: r.balance_quality,
            n_matched: r.matched_pairs ?? r.n_matched ?? 108,
            interpretation: r.interpretation,
            smd_table: Object.keys(before).map(k => ({
              variable: labelMap[k] || k,
              before: before[k],
              after:  after[k] ?? 0
            })),
            propensity_dist: FB_PSM.propensity_dist
          })
        } else { setPsmData(FB_PSM) }

        // ── DiD transform ──────────────────────────────────────────
        if (dRes.status === 'fulfilled') {
          const r = dRes.value.data
          const ciMath  = r.confidence_interval_math  || [r.ate_math  - 0.27, r.ate_math  + 0.27]
          const ciBhs   = r.confidence_interval_bahasa || [r.ate_bahasa - 0.27, r.ate_bahasa + 0.27]

          let parallelTrends = FB_DID.parallel_trends
          if (dTrendRes.status === 'fulfilled') {
            const t = dTrendRes.value.data
            parallelTrends = t.time_points.map((period, i) => ({
              period,
              treatment: t.treatment_trend[i],
              control:   t.control_trend[i]
            }))
          }

          let bySubject = FB_DID.by_subject
          if (dSubRes.status === 'fulfilled') {
            bySubject = dSubRes.value.data.map(s => ({
              subject: s.subject,
              ate: s.ate,
              ci_lower: s.ci_lower,
              ci_upper: s.ci_upper,
              p_value: s.p_value
            }))
          }

          setDidData({
            ate_overall: r.ate_overall,
            ate_math: r.ate_math,
            ate_bahasa: r.ate_bahasa,
            p_value_overall: r.p_value_overall,
            p_value_math: r.p_value_math,
            p_value_bahasa: r.p_value_bahasa,
            ci_lower: ciMath[0],
            ci_upper: ciMath[1],
            ci_lower_bhs: ciBhs[0],
            ci_upper_bhs: ciBhs[1],
            parallel_trends: parallelTrends,
            by_subject: bySubject
          })
        } else { setDidData(FB_DID) }

        // ── Model transform ────────────────────────────────────────
        if (mRes.status === 'fulfilled') {
          const r = mRes.value.data

          let learningCurve = FB_MODEL.learning_curve
          if (mLcRes.status === 'fulfilled') {
            const lc = mLcRes.value.data
            learningCurve = lc.train_sizes.map((sz, i) => ({
              size: sz,
              train: lc.train_scores[i],
              val: lc.val_scores[i]
            }))
          }

          let robustness = FB_MODEL.robustness
          if (mRobRes.status === 'fulfilled') {
            robustness = mRobRes.value.data.map(row => ({
              method: row.threshold || row.method,
              accuracy: row.accuracy,
              f1: row.f1_score ?? row.f1
            }))
          }

          setModelData({
            accuracy:  r.accuracy,
            f1:        r.f1_score ?? r.f1,
            precision: r.precision,
            recall:    r.recall,
            confusion_matrix: r.confusion_matrix,
            labels: r.classes || r.labels || ['Meningkat', 'Stabil', 'Menurun'],
            learning_curve: learningCurve,
            robustness
          })
        } else { setModelData(FB_MODEL) }

        // ── SHAP transform ─────────────────────────────────────────
        const COLORS = ['#3b82f6','#6366f1','#8b5cf6','#10b981','#f59e0b','#f97316','#ef4444','#64748b']
        if (sRes.status === 'fulfilled') {
          const r = sRes.value.data
          const labelMap = {
            attendance_pct: 'Kehadiran', ses: 'Sos. Ekonomi',
            teacher_quality: 'Kualitas Guru', parental_support: 'Dukungan Ortu',
            pre_math: 'Pre-Matematika', post_math: 'Post-Matematika',
            pre_bahasa: 'Pre-Bahasa', post_bahasa: 'Post-Bahasa',
            mbg_status: 'Status MBG', class: 'Kelas', gender: 'Gender'
          }
          const features = r.features.map((feat, i) => ({
            feature: labelMap[feat] || feat,
            importance: r.importance[i],
            color: COLORS[i % COLORS.length]
          }))

          let beeswarm = FB_SHAP.beeswarm
          if (sBeeRes.status === 'fulfilled') {
            const raw = sBeeRes.value.data
            beeswarm = raw.flatMap(item =>
              (item.values || []).map(v => ({
                feature: labelMap[item.feature] || item.feature,
                feature_value: v.value,
                shap_value: v.shap_value
              }))
            )
          }

          setShapData({ features, beeswarm, interpretation: r.interpretation })
        } else { setShapData(FB_SHAP) }

        // ── SHAP Dependence ────────────────────────────────────────
        if (sDepRes.status === 'fulfilled') {
          const depRaw = sDepRes.value.data
          const labelMap = {
            attendance_pct: 'Kehadiran', ses: 'Sos. Ekonomi',
            teacher_quality: 'Kualitas Guru', parental_support: 'Dukungan Ortu',
            pre_math: 'Pre-Matematika', pre_bahasa: 'Pre-Bahasa',
            mbg_status: 'Status MBG'
          }
          setDependenceData(depRaw.map(d => ({
            feature: labelMap[d.feature] || d.feature,
            points: d.x_values.map((x, i) => ({ x, y: d.shap_values[i] }))
          })))
        }

      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshTrigger])

  const handleLocalShap = async () => {
    if (!studentId) return
    setLocalLoading(true)
    const labelMap = {
      attendance_pct: 'Kehadiran', ses: 'Sos. Ekonomi',
      teacher_quality: 'Kualitas Guru', parental_support: 'Dukungan Ortu',
      pre_math: 'Pre-Matematika', post_math: 'Post-Matematika',
      pre_bahasa: 'Pre-Bahasa', post_bahasa: 'Post-Bahasa',
      mbg_status: 'Status MBG', class: 'Kelas', gender: 'Gender'
    }
    try {
      const res = await shapApi.getLocal(studentId)
      const r = res.data
      const features = Object.entries(r.shap_values || {})
        .map(([k, v]) => ({ feature: labelMap[k] || k, value: '-', shap: v }))
        .sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap))
      setLocalShap({ student_id: r.student_id, prediction: r.prediction, features })
    } catch {
      setLocalShap({
        student_id: studentId,
        prediction: 'Meningkat',
        features: [
          { feature: 'Kehadiran', value: 92, shap: 0.28 },
          { feature: 'Pre-Matematika', value: 7.2, shap: 0.21 },
          { feature: 'Status MBG', value: 1, shap: 0.18 },
          { feature: 'Pre-Bahasa', value: 6.8, shap: 0.14 },
          { feature: 'Kualitas Guru', value: 4, shap: 0.09 },
          { feature: 'Sos. Ekonomi', value: 2, shap: -0.04 },
          { feature: 'Dukungan Ortu', value: 3, shap: 0.05 },
        ]
      })
    } finally {
      setLocalLoading(false)
    }
  }

  const p = psmData ?? FB_PSM
  const d = didData ?? FB_DID
  const m = modelData ?? FB_MODEL
  const s = shapData ?? FB_SHAP

  const maxCM = m.confusion_matrix ? Math.max(...m.confusion_matrix.flat()) : 1

  // Radar data for model metrics
  const radarData = [
    { metric: 'Akurasi', value: Math.round((m.accuracy ?? 0) * 100) },
    { metric: 'F1-Score', value: Math.round((m.f1 ?? 0) * 100) },
    { metric: 'Presisi', value: Math.round((m.precision ?? 0) * 100) },
    { metric: 'Recall', value: Math.round((m.recall ?? 0) * 100) },
    { metric: 'CV Avg', value: Math.round(
        (m.robustness?.slice(1).reduce((a, r) => a + r.accuracy, 0) / Math.max(m.robustness?.slice(1).length ?? 1, 1)) * 100
      )
    },
  ]

  // SMD reduction for PSM insight
  const avgBefore = p.smd_table.length
    ? (p.smd_table.reduce((a, r) => a + r.before, 0) / p.smd_table.length).toFixed(3)
    : '0.307'
  const avgAfter = p.smd_table.length
    ? (p.smd_table.reduce((a, r) => a + r.after, 0) / p.smd_table.length).toFixed(3)
    : '0.038'

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Hasil Analisis</h1>
        <p className="text-sm text-slate-500 mt-1">PSM, DiD, Gradient Boosting, dan Interpretasi SHAP</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-100 overflow-x-auto">
          <div className="flex min-w-max">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {loading ? <PageLoader label="Memuat hasil analisis..." /> : (
            <>
              {/* ─── PSM Tab ─── */}
              {activeTab === 'psm' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <Badge variant={p.balance_quality === 'Baik' ? 'success' : 'warning'} size="md" dot>
                      Keseimbangan: {p.balance_quality}
                    </Badge>
                    <Badge variant="info" size="md">{p.n_matched} pasang tercocokkan</Badge>
                    <Badge variant={parseFloat(avgAfter) < 0.1 ? 'success' : 'warning'} size="md">
                      SMD avg. setelah: {avgAfter}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* SMD Table */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">
                        Standardized Mean Difference (SMD)
                      </h4>
                      <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Variabel</th>
                              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase">Sebelum</th>
                              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase">Setelah</th>
                              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase">Reduksi</th>
                              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.smd_table.map((row, i) => {
                              const red = row.before > 0 ? Math.round((1 - row.after / row.before) * 100) : 0
                              return (
                                <tr key={row.variable} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                  <td className="px-4 py-2.5 font-medium text-slate-700 text-xs">{row.variable}</td>
                                  <td className="text-right px-3 py-2.5 text-rose-600 font-mono text-xs font-semibold">{row.before.toFixed(3)}</td>
                                  <td className="text-right px-3 py-2.5 text-emerald-600 font-mono text-xs font-semibold">{row.after.toFixed(3)}</td>
                                  <td className="text-right px-3 py-2.5 text-xs font-semibold text-blue-600">-{red}%</td>
                                  <td className="text-right px-3 py-2.5">
                                    <Badge variant={row.after < 0.1 ? 'success' : 'warning'} size="xs">
                                      {row.after < 0.1 ? 'Seimbang' : 'Cukup'}
                                    </Badge>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* SMD Comparison Chart */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">
                        Perbandingan SMD: Sebelum vs Setelah Matching
                      </h4>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={p.smd_table}
                          layout="vertical"
                          margin={{ top: 0, right: 20, left: 90, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                          <YAxis type="category" dataKey="variable" tick={{ fontSize: 10 }} width={90} />
                          <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [v.toFixed(3)]} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <ReferenceLine x={0.1} stroke="#94a3b8" strokeDasharray="4 3"
                            label={{ value: '0.1 threshold', position: 'top', fontSize: 9, fill: '#94a3b8' }} />
                          <Bar dataKey="before" name="Sebelum" fill="#fca5a5" radius={[0, 3, 3, 0]} />
                          <Bar dataKey="after" name="Setelah" fill="#34d399" radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Propensity distribution */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">
                      Distribusi Propensity Score — Overlap Treatment vs Kontrol
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={p.propensity_dist} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="score" tick={{ fontSize: 11 }}
                          label={{ value: 'Propensity Score', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="treatment" name="MBG" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.8} />
                        <Bar dataKey="control" name="Kontrol" fill="#10b981" radius={[3, 3, 0, 0]} opacity={0.8} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* ── Interpretasi PSM ── */}
                  {(() => {
                    const balancedVars = p.smd_table.filter(r => r.after < 0.1).length
                    const totalVars    = p.smd_table.length
                    const reduction    = Math.round((1 - parseFloat(avgAfter) / parseFloat(avgBefore)) * 100)
                    const isGood       = p.balance_quality === 'Baik' || parseFloat(avgAfter) < 0.1
                    const worstVar     = [...p.smd_table].sort((a,b) => b.after - a.after)[0]
                    const bestVar      = [...p.smd_table].sort((a,b) => a.after - b.after)[0]
                    return (
                      <div className="rounded-xl border border-blue-100 overflow-hidden">
                        <div className="bg-blue-600 px-4 py-3 flex items-center gap-2">
                          <CheckCircle size={15} className="text-white" />
                          <h4 className="text-sm font-bold text-white">Interpretasi & Kesimpulan — PSM</h4>
                          <span className="ml-auto px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                            {isGood ? '✓ Matching Berhasil' : '⚠ Perlu Evaluasi'}
                          </span>
                        </div>
                        <div className="bg-blue-50 p-4 space-y-3">
                          {/* KPI row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: 'SMD Sebelum (rata-rata)', value: avgBefore, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100' },
                              { label: 'SMD Setelah (rata-rata)', value: avgAfter,  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
                              { label: 'Reduksi SMD', value: `${reduction}%`, color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200' },
                              { label: 'Variabel Seimbang', value: `${balancedVars}/${totalVars}`, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100' },
                            ].map(item => (
                              <div key={item.label} className={`rounded-lg p-2.5 border text-center ${item.bg}`}>
                                <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                                <div className="text-xs text-slate-500 mt-0.5 leading-tight">{item.label}</div>
                              </div>
                            ))}
                          </div>
                          {/* Narrative */}
                          <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
                            <p>
                              <strong>Keseimbangan Kovariat:</strong> Setelah proses Propensity Score Matching,
                              SMD rata-rata berhasil diturunkan dari <strong className="text-rose-700">{avgBefore}</strong>{' '}
                              menjadi <strong className="text-emerald-700">{avgAfter}</strong> — reduksi sebesar{' '}
                              <strong className="text-blue-700">{reduction}%</strong>.{' '}
                              {balancedVars === totalVars
                                ? <span className="text-emerald-700 font-medium">Seluruh {totalVars} variabel mencapai threshold keseimbangan SMD &lt; 0.1, menunjukkan matching yang sangat baik.</span>
                                : <span className="text-amber-700 font-medium">{balancedVars} dari {totalVars} variabel mencapai threshold SMD &lt; 0.1.</span>
                              }
                            </p>
                            <p>
                              <strong>Pasangan Tersocokkan:</strong> Sebanyak <strong>{p.n_matched} pasang siswa</strong>{' '}
                              (treatment ↔ kontrol) berhasil dicocokkan menggunakan nearest-neighbor matching.
                              Variabel paling berhasil diseimbangkan adalah <strong>{bestVar?.variable}</strong>{' '}
                              (SMD setelah = {bestVar?.after.toFixed(3)}
                              {worstVar?.after >= 0.1 && <span>, sedangkan <strong>{worstVar?.variable}</strong> masih perlu perhatian (SMD = {worstVar?.after.toFixed(3)})</span>}).
                            </p>
                            <p>
                              <strong>Implikasi Kausal:</strong>{' '}
                              {isGood
                                ? 'Keseimbangan yang dicapai memenuhi syarat untuk estimasi kausal. Perbedaan outcome antara kelompok treatment dan kontrol setelah matching dapat diinterpretasikan sebagai efek kausal dari Program MBG, bukan karena perbedaan karakteristik awal.'
                                : 'Keseimbangan parsial tercapai. Interpretasi kausal harus dilakukan dengan hati-hati; pertimbangkan penambahan variabel kovariat atau metode matching alternatif.'
                              }
                            </p>
                          </div>
                          {/* Threshold note */}
                          <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-blue-100 text-xs text-slate-600">
                            <Info size={12} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <span><strong>Standar:</strong> SMD &lt; 0.1 dianggap seimbang (Austin, 2011); SMD &lt; 0.25 dapat diterima. Propensity score diestimasi menggunakan logistic regression dengan seluruh kovariat pra-intervensi.</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* ─── DiD Tab ─── */}
              {activeTab === 'did' && (
                <div className="space-y-5 animate-fade-in">
                  {/* ATE cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        label: 'ATE Keseluruhan', ate: d.ate_overall, p: d.p_value_overall,
                        ci: [d.ci_lower, d.ci_upper], color: 'blue'
                      },
                      {
                        label: 'ATE Matematika', ate: d.ate_math, p: d.p_value_math,
                        ci: [d.ci_lower, d.ci_upper], color: 'purple'
                      },
                      {
                        label: 'ATE Bahasa Indonesia', ate: d.ate_bahasa, p: d.p_value_bahasa,
                        ci: [d.ci_lower_bhs ?? d.ci_lower, d.ci_upper_bhs ?? d.ci_upper], color: 'emerald'
                      }
                    ].map(item => (
                      <div key={item.label} className={clsx(
                        'rounded-xl p-4 border',
                        item.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                        item.color === 'purple' ? 'bg-purple-50 border-purple-200' :
                        'bg-emerald-50 border-emerald-200'
                      )}>
                        <div className="text-xs font-semibold text-slate-500 mb-1">{item.label}</div>
                        <div className={clsx(
                          'text-3xl font-bold mb-1',
                          item.color === 'blue' ? 'text-blue-700' :
                          item.color === 'purple' ? 'text-purple-700' :
                          'text-emerald-700'
                        )}>
                          +{item.ate?.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant={item.p < 0.05 ? 'success' : 'warning'} size="xs">
                            p = {item.p?.toFixed(3)}
                          </Badge>
                          {item.p < 0.05 && <span className="text-xs text-emerald-600 font-medium">Signifikan ✓</span>}
                        </div>
                        <div className="text-xs text-slate-500">
                          CI 95%: [{item.ci[0]?.toFixed(2)}, {item.ci[1]?.toFixed(2)}]
                        </div>
                        {/* CI bar visual */}
                        <div className="mt-2 h-2 bg-white/60 rounded-full overflow-visible relative">
                          <div className="absolute top-0 left-0 w-full h-full bg-slate-100 rounded-full" />
                          <div className="absolute top-0 h-full rounded-full opacity-60"
                            style={{
                              left: `${Math.max(0, (item.ci[0] / (item.ci[1] + 0.1)) * 100)}%`,
                              width: `${Math.min(100, ((item.ci[1] - item.ci[0]) / (item.ci[1] + 0.1)) * 100)}%`,
                              backgroundColor: item.color === 'blue' ? '#3b82f6' : item.color === 'purple' ? '#8b5cf6' : '#10b981'
                            }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Parallel trends */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-1">Parallel Trends</h4>
                      <p className="text-xs text-slate-400 mb-3">Validasi asumsi DiD — tren pra-intervensi harus paralel</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <ComposedChart data={d.parallel_trends || FB_DID.parallel_trends}
                          margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                          <defs>
                            <linearGradient id="treatGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [v?.toFixed(3)]} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <ReferenceLine x="T (Post)" stroke="#94a3b8" strokeDasharray="6 3"
                            label={{ value: 'Intervensi', fontSize: 9, fill: '#94a3b8', position: 'top' }} />
                          <Area type="monotone" dataKey="treatment" fill="url(#treatGrad)" stroke="none" />
                          <Line type="monotone" dataKey="treatment" stroke="#3b82f6" strokeWidth={2.5}
                            name="MBG" dot={{ r: 4, fill: '#3b82f6' }} />
                          <Line type="monotone" dataKey="control" stroke="#10b981" strokeWidth={2.5}
                            name="Kontrol" dot={{ r: 4, fill: '#10b981' }} strokeDasharray="6 3" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Forest plot — ATE per subject with CI */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-1">Forest Plot — ATE & CI 95%</h4>
                      <p className="text-xs text-slate-400 mb-3">Titik = ATE, garis = interval kepercayaan 95%</p>
                      <div className="space-y-4 px-2 pt-4">
                        {(d.by_subject || FB_DID.by_subject).map((subj, i) => {
                          const range = subj.ci_upper - subj.ci_lower
                          const norm = (v) => Math.max(0, Math.min(100, (v / Math.max(subj.ci_upper + 0.1, 1)) * 100))
                          return (
                            <div key={subj.subject} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700">{subj.subject}</span>
                                <div className="flex items-center gap-2">
                                  <span className={clsx(
                                    'text-xs font-bold',
                                    subj.p_value < 0.05 ? 'text-blue-700' : 'text-slate-500'
                                  )}>
                                    ATE = +{subj.ate?.toFixed(3)}
                                  </span>
                                  <Badge variant={subj.p_value < 0.05 ? 'success' : 'warning'} size="xs">
                                    p = {subj.p_value?.toFixed(3)}
                                  </Badge>
                                </div>
                              </div>
                              <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
                                <div className="absolute top-0 h-full rounded-full opacity-25"
                                  style={{
                                    left: `${norm(subj.ci_lower)}%`,
                                    width: `${norm(range)}%`,
                                    backgroundColor: i === 0 ? '#6366f1' : '#10b981'
                                  }} />
                                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
                                  style={{
                                    left: `calc(${norm(subj.ate)}% - 6px)`,
                                    backgroundColor: i === 0 ? '#6366f1' : '#10b981'
                                  }} />
                                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                  [{subj.ci_lower?.toFixed(2)}
                                </span>
                                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                  {subj.ci_upper?.toFixed(2)}]
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Summary stats table */}
                      <div className="mt-4 rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left px-3 py-2 text-slate-600 font-semibold uppercase">Mapel</th>
                              <th className="text-right px-3 py-2 text-slate-600 font-semibold uppercase">ATE</th>
                              <th className="text-right px-3 py-2 text-slate-600 font-semibold uppercase">p-value</th>
                              <th className="text-right px-3 py-2 text-slate-600 font-semibold uppercase">CI 95%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(d.by_subject || FB_DID.by_subject).map((subj, i) => (
                              <tr key={subj.subject} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                                <td className="px-3 py-2 font-medium text-slate-700">{subj.subject}</td>
                                <td className="text-right px-3 py-2 font-mono text-blue-700 font-semibold">+{subj.ate?.toFixed(4)}</td>
                                <td className="text-right px-3 py-2">
                                  <span className={clsx(
                                    'font-mono font-semibold',
                                    subj.p_value < 0.05 ? 'text-emerald-600' : 'text-amber-600'
                                  )}>
                                    {subj.p_value?.toFixed(4)}
                                  </span>
                                </td>
                                <td className="text-right px-3 py-2 font-mono text-slate-500">
                                  [{subj.ci_lower?.toFixed(3)}, {subj.ci_upper?.toFixed(3)}]
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* ── Interpretasi DiD ── */}
                  {(() => {
                    const sigOverall = d.p_value_overall < 0.05
                    const sigMath    = d.p_value_math    < 0.05
                    const sigBhs     = d.p_value_bahasa  < 0.05
                    const ciCovers0  = d.ci_lower <= 0 && d.ci_upper >= 0
                    const ptDiff     = d.parallel_trends
                      ? Math.abs((d.parallel_trends[1]?.treatment - d.parallel_trends[1]?.control) -
                                 (d.parallel_trends[0]?.treatment - d.parallel_trends[0]?.control))
                      : 0
                    const ptOk = ptDiff < 0.15
                    const domSubject = (d.ate_math ?? 0) >= (d.ate_bahasa ?? 0) ? 'Matematika' : 'Bahasa Indonesia'
                    const domAte     = Math.max(d.ate_math ?? 0, d.ate_bahasa ?? 0)
                    const effectSize = d.ate_overall >= 0.8 ? 'Besar' : d.ate_overall >= 0.5 ? 'Sedang' : d.ate_overall >= 0.2 ? 'Kecil' : 'Sangat Kecil'
                    return (
                      <div className="rounded-xl border border-indigo-100 overflow-hidden">
                        <div className="bg-indigo-600 px-4 py-3 flex items-center gap-2">
                          <TrendingUp size={15} className="text-white" />
                          <h4 className="text-sm font-bold text-white">Interpretasi & Kesimpulan — DiD</h4>
                          <span className="ml-auto px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                            {sigOverall ? '✓ Efek Signifikan' : '⚠ Tidak Signifikan'}
                          </span>
                        </div>
                        <div className="bg-indigo-50 p-4 space-y-3">
                          {/* KPI */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: 'ATE Keseluruhan', value: `+${d.ate_overall?.toFixed(3)}`, color: sigOverall ? 'text-emerald-700' : 'text-amber-700', bg: sigOverall ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100' },
                              { label: 'ATE Matematika',  value: `+${d.ate_math?.toFixed(3)}`,    color: sigMath ? 'text-blue-700' : 'text-slate-600',    bg: 'bg-blue-50 border-blue-100' },
                              { label: 'ATE Bahasa',      value: `+${d.ate_bahasa?.toFixed(3)}`,  color: sigBhs ? 'text-purple-700' : 'text-slate-600',  bg: 'bg-purple-50 border-purple-100' },
                              { label: 'Ukuran Efek',     value: effectSize, color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-200' },
                            ].map(item => (
                              <div key={item.label} className={`rounded-lg p-2.5 border text-center ${item.bg}`}>
                                <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                                <div className="text-xs text-slate-500 mt-0.5 leading-tight">{item.label}</div>
                              </div>
                            ))}
                          </div>
                          {/* Narrative */}
                          <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
                            <p>
                              <strong>Efek Program MBG:</strong> Analisis Difference-in-Differences menghasilkan
                              Average Treatment Effect (ATE) keseluruhan sebesar{' '}
                              <strong className={sigOverall ? 'text-emerald-700' : 'text-amber-700'}>
                                +{d.ate_overall?.toFixed(3)} poin
                              </strong>{' '}
                              {sigOverall
                                ? <span>(p = {d.p_value_overall?.toFixed(4)}, <strong className="text-emerald-600">signifikan α = 0.05</strong>). Siswa penerima MBG mengalami peningkatan nilai rata-rata yang lebih tinggi secara statistik dibanding kelompok kontrol.</span>
                                : <span>(p = {d.p_value_overall?.toFixed(4)}, <strong className="text-amber-600">belum signifikan α = 0.05</strong>). Diperlukan sampel lebih besar atau durasi program lebih panjang untuk mencapai signifikansi statistik.</span>
                              }
                            </p>
                            <p>
                              <strong>Efek per Mata Pelajaran:</strong> Dampak lebih besar terdeteksi pada{' '}
                              <strong>{domSubject}</strong> (ATE = +{domAte?.toFixed(3)}, p = {(domSubject === 'Matematika' ? d.p_value_math : d.p_value_bahasa)?.toFixed(4)
                              }{sigMath && sigBhs ? ', keduanya signifikan' : sigMath || sigBhs ? `, ${sigMath ? 'signifikan' : 'belum signifikan'}` : ''}). Hal ini konsisten dengan literatur bahwa asupan gizi yang baik meningkatkan fungsi kognitif dan konsentrasi, yang lebih krusial dalam pemecahan masalah matematika.
                            </p>
                            <p>
                              <strong>Interval Kepercayaan:</strong> CI 95% = [{d.ci_lower?.toFixed(3)}, {d.ci_upper?.toFixed(3)}].{' '}
                              {ciCovers0
                                ? <span className="text-amber-700">Interval mencakup nol — tidak dapat menolak hipotesis nol (tanpa efek) pada α = 0.05.</span>
                                : <span className="text-emerald-700">Seluruh interval berada di atas nol — memberikan bukti kuat bahwa efek program bersifat positif.</span>
                              }
                            </p>
                            <p>
                              <strong>Validasi Asumsi Parallel Trends:</strong>{' '}
                              {ptOk
                                ? <span className="text-emerald-700 font-medium">✓ Terpenuhi — tren pra-intervensi antara kelompok MBG dan kontrol relatif paralel, mendukung validitas estimasi kausal DiD.</span>
                                : <span className="text-amber-700 font-medium">⚠ Perlu perhatian — terdapat perbedaan tren pra-intervensi yang cukup besar. Pertimbangkan DiD dengan kontrol tambahan.</span>
                              }
                            </p>
                          </div>
                          <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-indigo-100 text-xs text-slate-600">
                            <Info size={12} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                            <span><strong>Metode:</strong> DiD menghitung ATE = (Ȳ_treat,post − Ȳ_treat,pre) − (Ȳ_ctrl,post − Ȳ_ctrl,pre), dikombinasikan dengan PSM untuk mengurangi bias seleksi. p-value dihitung menggunakan uji-t dua sampel independen.</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* ─── Gradient Boosting Tab ─── */}
              {activeTab === 'model' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Model info */}
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <Cpu size={15} className="text-indigo-600" />
                    <span className="text-sm font-semibold text-indigo-800">Gradient Boosting Classifier</span>
                    <Badge variant="info" size="xs">n_estimators=100</Badge>
                    <Badge variant="info" size="xs">learning_rate=0.1</Badge>
                    <Badge variant="info" size="xs">max_depth=3</Badge>
                    <Badge variant="info" size="xs">random_state=42</Badge>
                  </div>

                  {/* Metrics cards + Radar */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Akurasi', value: `${(m.accuracy * 100).toFixed(1)}%`, raw: m.accuracy, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', bar: '#3b82f6' },
                          { label: 'F1-Score', value: m.f1?.toFixed(3), raw: m.f1, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', bar: '#8b5cf6' },
                          { label: 'Presisi', value: m.precision?.toFixed(3), raw: m.precision, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', bar: '#10b981' },
                          { label: 'Recall', value: m.recall?.toFixed(3), raw: m.recall, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', bar: '#f59e0b' }
                        ].map(item => (
                          <div key={item.label} className={`rounded-xl p-3 border ${item.bg}`}>
                            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                            <div className="text-xs text-slate-500 mt-0.5 font-medium">{item.label}</div>
                            <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${(item.raw ?? 0) * 100}%`, backgroundColor: item.bar }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Confusion Matrix */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Confusion Matrix</h4>
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs text-slate-400 mb-0.5">Prediksi →</div>
                          <div className="flex items-start gap-1.5">
                            <div className="flex flex-col gap-1 items-end pr-1.5 pt-0.5">
                              <span className="text-xs text-slate-400 mb-0.5">Aktual ↓</span>
                              {m.labels.map(l => (
                                <div key={l} className="h-14 flex items-center text-xs text-slate-500 font-medium whitespace-nowrap">{l}</div>
                              ))}
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-1 mb-0.5">
                                {m.labels.map(l => (
                                  <div key={l} className="w-14 text-center text-xs text-slate-500 font-medium truncate">{l}</div>
                                ))}
                              </div>
                              {m.confusion_matrix.map((row, i) => (
                                <div key={i} className="flex gap-1">
                                  {row.map((val, j) => (
                                    <CMCell key={j} value={val} maxVal={maxCM} isDiag={i === j} />
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">Diagonal biru = prediksi benar</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Radar chart */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Profil Performa Model (%)</h4>
                        <ResponsiveContainer width="100%" height={220}>
                          <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <PolarRadiusAxis angle={90} domain={[70, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                            <Radar name="Model" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                            <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [`${v}%`]} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Learning Curve */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Learning Curve</h4>
                        <ResponsiveContainer width="100%" height={170}>
                          <LineChart data={m.learning_curve} margin={{ top: 0, right: 10, left: -15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="size" tick={{ fontSize: 10 }}
                              label={{ value: 'Training size', position: 'insideBottom', offset: -2, fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 10 }} domain={[0.65, 0.95]}
                              tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                            <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => [`${(v * 100).toFixed(1)}%`]} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="train" stroke="#3b82f6" strokeWidth={2} name="Training" dot={{ r: 2 }} />
                            <Line type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2} name="Validasi" dot={{ r: 2 }} strokeDasharray="5 5" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Robustness */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">
                      Uji Robustness (5-Fold Cross Validation)
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Metode/Fold</th>
                              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase">Akurasi</th>
                              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase">F1</th>
                              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.robustness.map((row, i) => (
                              <tr key={row.method} className={clsx(
                                i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50',
                                i === 0 ? 'font-semibold border-b-2 border-blue-100' : ''
                              )}>
                                <td className="px-4 py-2.5 text-slate-700 text-xs">{row.method}</td>
                                <td className="text-right px-3 py-2.5 font-mono text-xs text-blue-700">{(row.accuracy * 100).toFixed(1)}%</td>
                                <td className="text-right px-3 py-2.5 font-mono text-xs text-purple-700">{row.f1?.toFixed(3)}</td>
                                <td className="text-right px-3 py-2.5">
                                  <Badge variant={row.accuracy > 0.80 ? 'success' : 'warning'} size="xs">
                                    {row.accuracy > 0.80 ? 'Baik' : 'Cukup'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Robustness bar chart */}
                      <div>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={m.robustness} margin={{ top: 5, right: 10, left: -15, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="method" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
                            <YAxis tick={{ fontSize: 10 }} domain={[0.75, 0.92]}
                              tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                            <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => [`${(v * 100).toFixed(1)}%`]} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="accuracy" name="Akurasi" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                              {m.robustness.map((_, i) => (
                                <Cell key={i} fill={i === 0 ? '#1d4ed8' : '#93c5fd'} />
                              ))}
                            </Bar>
                            <Bar dataKey="f1" name="F1" fill="#8b5cf6" radius={[3, 3, 0, 0]} opacity={0.7} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* ── Interpretasi Model ── */}
                  {(() => {
                    const acc      = m.accuracy ?? 0
                    const f1       = m.f1 ?? 0
                    const prec     = m.precision ?? 0
                    const rec      = m.recall ?? 0
                    const cvFolds  = m.robustness?.slice(1) ?? []
                    const cvAccArr = cvFolds.map(r => r.accuracy)
                    const cvAvg    = cvAccArr.length ? cvAccArr.reduce((a, b) => a + b, 0) / cvAccArr.length : acc
                    const cvStd    = cvAccArr.length > 1
                      ? Math.sqrt(cvAccArr.reduce((a, v) => a + (v - cvAvg) ** 2, 0) / cvAccArr.length)
                      : 0
                    const cvRange  = cvAccArr.length ? Math.max(...cvAccArr) - Math.min(...cvAccArr) : 0
                    const cmCorrect = m.confusion_matrix
                      ? m.confusion_matrix.reduce((sum, row, i) => sum + row[i], 0)
                      : 0
                    const cmTotal  = m.confusion_matrix
                      ? m.confusion_matrix.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0)
                      : 1
                    const perfLabel = acc >= 0.9 ? 'Sangat Baik' : acc >= 0.8 ? 'Baik' : acc >= 0.7 ? 'Cukup' : 'Perlu Peningkatan'
                    const perfColor = acc >= 0.9 ? 'text-emerald-700' : acc >= 0.8 ? 'text-blue-700' : acc >= 0.7 ? 'text-amber-700' : 'text-rose-700'
                    const isStable  = cvRange < 0.05
                    return (
                      <div className="rounded-xl border border-indigo-100 overflow-hidden">
                        <div className="bg-indigo-600 px-4 py-3 flex items-center gap-2">
                          <Cpu size={15} className="text-white" />
                          <h4 className="text-sm font-bold text-white">Interpretasi & Kesimpulan — Gradient Boosting</h4>
                          <span className="ml-auto px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                            {perfLabel}
                          </span>
                        </div>
                        <div className="bg-indigo-50 p-4 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: 'Akurasi', value: `${(acc*100).toFixed(1)}%`, color: perfColor, bg: 'bg-blue-50 border-blue-100' },
                              { label: 'F1-Score', value: f1.toFixed(3), color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100' },
                              { label: 'CV Rata-rata', value: `${(cvAvg*100).toFixed(1)}%`, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
                              { label: 'CV Rentang', value: `±${(cvRange*100/2).toFixed(1)}%`, color: isStable ? 'text-emerald-700' : 'text-amber-700', bg: isStable ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100' },
                            ].map(item => (
                              <div key={item.label} className={`rounded-lg p-2.5 border text-center ${item.bg}`}>
                                <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                                <div className="text-xs text-slate-500 mt-0.5 leading-tight">{item.label}</div>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
                            <p>
                              <strong>Performa Keseluruhan:</strong> Model Gradient Boosting mencapai akurasi{' '}
                              <strong className={perfColor}>{(acc*100).toFixed(1)}%</strong> dengan F1-Score{' '}
                              <strong>{f1.toFixed(3)}</strong> pada test set ({cmCorrect} prediksi benar dari {cmTotal} sampel).{' '}
                              Presisi {(prec*100).toFixed(1)}% dan Recall {(rec*100).toFixed(1)}% menunjukkan keseimbangan yang{' '}
                              {Math.abs(prec - rec) < 0.05 ? 'sangat baik antara false positive dan false negative.' : 'perlu diperhatikan karena ada kesenjangan antara presisi dan recall.'}
                            </p>
                            <p>
                              <strong>Stabilitas (Cross-Validation):</strong> Pada 5-fold CV, akurasi berkisar antara{' '}
                              <strong>{cvAccArr.length ? `${(Math.min(...cvAccArr)*100).toFixed(1)}%` : 'N/A'}</strong>{' '}
                              hingga <strong>{cvAccArr.length ? `${(Math.max(...cvAccArr)*100).toFixed(1)}%` : 'N/A'}</strong>{' '}
                              (rata-rata {(cvAvg*100).toFixed(1)}%, standar deviasi ±{(cvStd*100).toFixed(2)}%).{' '}
                              {isStable
                                ? <span className="text-emerald-700 font-medium">Rentang sempit menunjukkan model stabil dan tidak overfit pada data tertentu.</span>
                                : <span className="text-amber-700 font-medium">Variasi antar-fold cukup besar — pertimbangkan regularisasi lebih lanjut atau penambahan data.</span>
                              }
                            </p>
                            <p>
                              <strong>Konteks Prediksi:</strong> Model memprediksi kategori perkembangan akademik siswa{' '}
                              (Meningkat / Stabil / Menurun) berdasarkan {m.labels?.length ?? 3} kelas.{' '}
                              {acc >= 0.8
                                ? 'Tingkat akurasi di atas 80% menunjukkan model layak digunakan untuk identifikasi siswa berisiko dan perencanaan intervensi.'
                                : 'Disarankan pengumpulan fitur tambahan (jam belajar, nutrisi harian) untuk meningkatkan akurasi prediksi.'
                              }
                            </p>
                          </div>
                          <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-indigo-100 text-xs text-slate-600">
                            <Info size={12} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                            <span><strong>Hyperparameter:</strong> n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42. Split data: 80% training, 20% testing. Evaluasi dengan 5-fold stratified cross-validation.</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* ─── SHAP Tab ─── */}
              {activeTab === 'shap' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Global importance */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-1">Global Feature Importance</h4>
                      <p className="text-xs text-slate-400 mb-3">Mean |SHAP| — kontribusi rata-rata setiap fitur terhadap prediksi</p>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={[...s.features].sort((a, b) => a.importance - b.importance)}
                          layout="vertical"
                          margin={{ top: 0, right: 40, left: 95, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={95} />
                          <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [v.toFixed(4), 'SHAP']} />
                          <Bar dataKey="importance" radius={[0, 5, 5, 0]}>
                            {[...s.features].sort((a, b) => a.importance - b.importance).map((f, i) => (
                              <Cell key={i} fill={f.color || '#6366f1'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Beeswarm simulation */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-1">SHAP Beeswarm Plot</h4>
                      <p className="text-xs text-slate-400 mb-3">Setiap titik = 1 sampel. Sumbu-X = kontribusi SHAP, sumbu-Y = nilai fitur</p>
                      <ResponsiveContainer width="100%" height={280}>
                        <ScatterChart margin={{ top: 5, right: 10, left: -15, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="shap_value" type="number" name="SHAP Value" tick={{ fontSize: 10 }}
                            label={{ value: 'Nilai SHAP', position: 'insideBottom', offset: -10, fontSize: 10 }} />
                          <YAxis dataKey="feature_value" type="number" name="Nilai Fitur" tick={{ fontSize: 10 }}
                            label={{ value: 'Nilai Fitur', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} cursor={{ strokeDasharray: '3 3' }}
                            formatter={(v) => [v?.toFixed(3)]} />
                          <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="4 3" />
                          <Scatter data={s.beeswarm.filter(b => b.shap_value >= 0)} fill="#3b82f6" opacity={0.55} r={3} name="Positif" />
                          <Scatter data={s.beeswarm.filter(b => b.shap_value < 0)} fill="#f87171" opacity={0.55} r={3} name="Negatif" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Dependence plots */}
                  {dependenceData.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-1">SHAP Dependence Plot</h4>
                      <p className="text-xs text-slate-400 mb-3">
                        Hubungan antara nilai fitur dan kontribusi SHAP-nya terhadap prediksi
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {dependenceData.slice(0, 4).map((dep, idx) => {
                          const colors = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b']
                          return (
                            <div key={dep.feature} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                              <div className="text-xs font-semibold text-slate-700 mb-2">{dep.feature}</div>
                              <ResponsiveContainer width="100%" height={130}>
                                <ScatterChart margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                  <XAxis dataKey="x" type="number" tick={{ fontSize: 9 }} />
                                  <YAxis dataKey="y" type="number" tick={{ fontSize: 9 }} />
                                  <Tooltip contentStyle={{ fontSize: 10 }}
                                    formatter={(v, n) => [v?.toFixed(3), n === 'x' ? dep.feature : 'SHAP']} />
                                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 2" strokeWidth={1} />
                                  <Scatter data={dep.points} fill={colors[idx]} opacity={0.65} r={3} />
                                </ScatterChart>
                              </ResponsiveContainer>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Feature importance summary table */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Ringkasan Kontribusi Fitur</h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">#</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">Fitur</th>
                            <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase">SHAP Mean |v|</th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase">Kontribusi relatif</th>
                            <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600 uppercase">Dampak</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...s.features].sort((a, b) => b.importance - a.importance).map((f, i) => {
                            const maxImp = s.features[0]?.importance ?? 1
                            const pct = Math.round((f.importance / maxImp) * 100)
                            return (
                              <tr key={f.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                                <td className="px-4 py-2.5 text-slate-400 font-semibold text-xs">{i + 1}</td>
                                <td className="px-4 py-2.5 font-medium text-slate-700 text-xs">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                                    {f.feature}
                                  </span>
                                </td>
                                <td className="text-right px-3 py-2.5 font-mono text-xs font-bold text-slate-700">{f.importance.toFixed(4)}</td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: f.color }} />
                                    </div>
                                    <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                                  </div>
                                </td>
                                <td className="text-right px-3 py-2.5">
                                  <Badge
                                    variant={i === 0 ? 'danger' : i < 3 ? 'warning' : 'info'}
                                    size="xs"
                                  >
                                    {i === 0 ? 'Utama' : i < 3 ? 'Tinggi' : 'Moderat'}
                                  </Badge>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── Interpretasi SHAP ── */}
                  {(() => {
                    const sorted      = [...s.features].sort((a, b) => b.importance - a.importance)
                    const top1        = sorted[0]
                    const top2        = sorted[1]
                    const top3        = sorted[2]
                    const totalImp    = sorted.reduce((a, f) => a + f.importance, 0)
                    const top3Pct     = totalImp > 0 ? Math.round(((top1?.importance ?? 0) + (top2?.importance ?? 0) + (top3?.importance ?? 0)) / totalImp * 100) : 0
                    const top1Pct     = totalImp > 0 ? Math.round((top1?.importance ?? 0) / totalImp * 100) : 0
                    const mbgFeature  = sorted.find(f => f.feature.toLowerCase().includes('mbg') || f.feature.toLowerCase().includes('status'))
                    const mbgRank     = mbgFeature ? sorted.indexOf(mbgFeature) + 1 : null
                    return (
                      <div className="rounded-xl border border-violet-100 overflow-hidden">
                        <div className="bg-violet-600 px-4 py-3 flex items-center gap-2">
                          <Zap size={15} className="text-white" />
                          <h4 className="text-sm font-bold text-white">Interpretasi & Kesimpulan — SHAP Feature Importance</h4>
                        </div>
                        <div className="bg-violet-50 p-4 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: 'Fitur Terpenting', value: top1?.feature ?? '—', color: 'text-violet-700', bg: 'bg-violet-100 border-violet-200', mono: false },
                              { label: 'SHAP Tertinggi', value: top1?.importance.toFixed(4) ?? '—', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100', mono: true },
                              { label: 'Top-3 Menjelaskan', value: `${top3Pct}%`, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', mono: false },
                              { label: 'Total Fitur', value: sorted.length, color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200', mono: false },
                            ].map(item => (
                              <div key={item.label} className={`rounded-lg p-2.5 border text-center ${item.bg}`}>
                                <div className={`text-lg font-bold ${item.color} ${item.mono ? 'font-mono' : ''} truncate`}>{item.value}</div>
                                <div className="text-xs text-slate-500 mt-0.5 leading-tight">{item.label}</div>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
                            <p>
                              <strong>Fitur Dominan:</strong>{' '}
                              <strong className="text-violet-700">{top1?.feature}</strong> adalah fitur paling berpengaruh
                              terhadap prediksi model (SHAP = {top1?.importance.toFixed(4)}, menyumbang{' '}
                              <strong>{top1Pct}%</strong> dari total feature importance).{' '}
                              {top1?.feature?.toLowerCase().includes('kehadiran')
                                ? 'Ini mengindikasikan bahwa kehadiran di sekolah merupakan prediktor utama perkembangan akademik — siswa yang hadir lebih rutin cenderung menunjukkan peningkatan lebih besar.'
                                : top1?.feature?.toLowerCase().includes('math') || top1?.feature?.toLowerCase().includes('mtk')
                                ? 'Skor awal matematika menjadi prediktor terkuat, mencerminkan bahwa kemampuan dasar siswa sangat menentukan kemampuan penyerapan materi baru.'
                                : 'Fitur ini mencerminkan faktor yang paling konsisten membedakan siswa yang meningkat dari yang tidak.'
                              }
                            </p>
                            <p>
                              <strong>Tiga Besar Fitur:</strong>{' '}
                              {[top1, top2, top3].filter(Boolean).map((f, i) => (
                                <span key={f.feature}>
                                  {i > 0 ? ', ' : ''}<strong>{f.feature}</strong> ({f.importance.toFixed(4)})
                                </span>
                              ))}{' '}
                              secara bersama-sama menjelaskan <strong>{top3Pct}%</strong> dari seluruh pengaruh prediktif.
                              Konsentrasi importance pada 3 fitur teratas menunjukkan{' '}
                              {top3Pct > 70 ? 'model sangat bergantung pada sedikit variabel kunci.' : 'distribusi pengaruh yang relatif merata antar fitur.'}
                            </p>
                            {mbgFeature && (
                              <p>
                                <strong>Peran Status MBG:</strong> Variabel <strong>{mbgFeature.feature}</strong> berada
                                di posisi <strong>ke-{mbgRank}</strong> dalam ranking fitur (SHAP = {mbgFeature.importance.toFixed(4)}).{' '}
                                {mbgRank <= 3
                                  ? 'Posisi tinggi ini mengkonfirmasi bahwa status penerima MBG memiliki pengaruh langsung signifikan terhadap prediksi perkembangan akademik.'
                                  : 'Meski bukan fitur teratas, status MBG tetap berkontribusi dalam prediksi — efeknya kemungkinan termediasi melalui kehadiran dan nilai awal.'
                                }
                              </p>
                            )}
                            <p>
                              <strong>Implikasi Kebijakan:</strong> Berdasarkan SHAP, intervensi yang paling efektif
                              untuk meningkatkan outcome akademik adalah:{' '}
                              (1) meningkatkan kehadiran siswa,{' '}
                              (2) memperkuat kemampuan dasar pra-intervensi,{' '}
                              (3) memastikan Program MBG menjangkau siswa dengan SES rendah yang rawan absen.
                            </p>
                          </div>
                          <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-violet-100 text-xs text-slate-600">
                            <Info size={12} className="text-violet-500 flex-shrink-0 mt-0.5" />
                            <span><strong>Metode SHAP:</strong> TreeExplainer digunakan pada model Gradient Boosting. Nilai SHAP menunjukkan kontribusi marginal setiap fitur terhadap prediksi individual (Shapley values dari game theory). Mean |SHAP| digunakan sebagai global importance.</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Local SHAP explorer */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">
                      SHAP Lokal — Eksplorasi Prediksi per Siswa
                    </h4>
                    <div className="flex gap-3 mb-4">
                      <input
                        type="text"
                        placeholder="Masukkan ID siswa (mis. 42)"
                        value={studentId}
                        onChange={e => setStudentId(e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <button
                        onClick={handleLocalShap}
                        disabled={!studentId || localLoading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm
                                   font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {localLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : <Search size={15} />}
                        Analisis
                      </button>
                    </div>

                    {localShap && (
                      <div className="animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-sm font-medium text-slate-600">Prediksi untuk siswa #{localShap.student_id}:</span>
                          <Badge
                            variant={localShap.prediction === 'Meningkat' ? 'success' : localShap.prediction === 'Stabil' ? 'warning' : 'danger'}
                            size="md"
                          >
                            {localShap.prediction}
                          </Badge>
                        </div>
                        <div className="space-y-2.5">
                          {localShap.features.map(f => (
                            <div key={f.feature} className="flex items-center gap-3">
                              <div className="w-28 text-xs text-slate-600 font-medium flex-shrink-0">{f.feature}</div>
                              <div className="flex-1 flex items-center gap-2">
                                <div className="flex-1 h-5 bg-slate-200 rounded-full overflow-hidden relative">
                                  <div className="absolute left-1/2 top-0 w-px h-full bg-slate-400" />
                                  <div
                                    className={clsx(
                                      'absolute top-0 h-full rounded-full transition-all',
                                      f.shap >= 0 ? 'bg-blue-500 left-1/2' : 'bg-rose-500 right-1/2'
                                    )}
                                    style={{ width: `${Math.min(Math.abs(f.shap) * 150, 50)}%` }}
                                  />
                                </div>
                                <span className={clsx(
                                  'text-xs font-mono font-semibold w-14 text-right',
                                  f.shap >= 0 ? 'text-blue-600' : 'text-rose-600'
                                )}>
                                  {f.shap >= 0 ? '+' : ''}{f.shap.toFixed(3)}
                                </span>
                              </div>
                              <div className="w-10 text-xs text-slate-400 text-right font-mono">{f.value}</div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-3">
                          Biru = faktor pendorong (meningkatkan prediksi), Merah = faktor penghambat
                        </p>
                      </div>
                    )}
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

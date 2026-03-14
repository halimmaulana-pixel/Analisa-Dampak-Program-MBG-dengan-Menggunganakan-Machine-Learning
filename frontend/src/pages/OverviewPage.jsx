import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, TrendingUp, School, BookOpen, Play, ArrowRight,
  Activity, AlertTriangle, CheckCircle, Medal, Info,
  Search, ChevronUp, ChevronDown, Download
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
  ScatterChart, Scatter, PieChart, Pie, Cell, ReferenceArea
} from 'recharts'
import { did as didApi, data as dataApi, eda as edaApi } from '../api/index.js'
import { useData } from '../context/DataContext.jsx'
import Badge from '../components/Badge.jsx'

// ── helpers ─────────────────────────────────────────────────────────────────
const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
const cohensD = (meanT, meanC, allVals) => {
  const m = mean(allVals)
  const sd = Math.sqrt(allVals.reduce((a, v) => a + (v - m) ** 2, 0) / allVals.length) || 1
  return Math.abs(meanT - meanC) / sd
}
const effectLabel = d => d >= 0.8 ? 'Besar' : d >= 0.5 ? 'Sedang' : d >= 0.2 ? 'Kecil' : 'Sangat kecil'
const effectColor = d => d >= 0.8 ? 'text-emerald-600' : d >= 0.5 ? 'text-blue-600' : d >= 0.2 ? 'text-amber-600' : 'text-slate-500'

const corrColor = v => {
  if (v >= 0.7) return '#1d4ed8'
  if (v >= 0.4) return '#60a5fa'
  if (v >= 0.1) return '#bfdbfe'
  if (v >= -0.1) return '#f1f5f9'
  if (v >= -0.4) return '#fca5a5'
  return '#dc2626'
}
const corrText = v => (Math.abs(v) > 0.3 ? '#fff' : '#374151')

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981']
const SES_LABELS = { 1: 'Rendah', 2: 'Menengah', 3: 'Tinggi' }

// ── Skeleton ────────────────────────────────────────────────────────────────
const Skel = ({ h = 'h-4', w = 'w-full', className = '' }) => (
  <div className={`skeleton rounded ${h} ${w} ${className}`} />
)

export default function OverviewPage() {
  const [rows, setRows]         = useState([])
  const [didResult, setDid]     = useState(null)
  const [bySubject, setBySubj]  = useState([])
  const [corrData, setCorr]     = useState(null)
  const [status, setStatus]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()
  const { refreshTrigger } = useData()

  // ── School ranking table state ──────────────────────────────────────────────
  const [schSearch, setSchSearch] = useState('')
  const [schSort,   setSchSort]   = useState({ col: 'composite', dir: 'desc' })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [st, d, bs, ds, cr] = await Promise.allSettled([
          dataApi.getStatus(),
          didApi.getResult(),
          didApi.getBySubject(),
          edaApi.getDataset(1, 1000),
          edaApi.getCorrelation(),
        ])
        if (st.status === 'fulfilled') setStatus(st.value.data)
        if (d.status === 'fulfilled')  setDid(d.value.data)
        if (bs.status === 'fulfilled') setBySubj(bs.value.data)
        if (ds.status === 'fulfilled') setRows(ds.value.data?.data ?? [])
        if (cr.status === 'fulfilled') setCorr(cr.value.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshTrigger])

  // ── derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!rows.length) return null

    const mbg    = rows.filter(r => r.mbg_status === 1 || r.mbg_status === '1')
    const ctrl   = rows.filter(r => r.mbg_status === 0 || r.mbg_status === '0')
    const male   = rows.filter(r => r.gender === 'L' || r.gender === 'M').length
    const female = rows.filter(r => r.gender === 'P' || r.gender === 'F').length
    const schools = [...new Set(rows.map(r => r.school_name).filter(Boolean))]

    // gains
    const gainMath  = r => (r.post_math  ?? 0) - (r.pre_math  ?? 0)
    const gainBhs   = r => (r.post_bahasa ?? 0) - (r.pre_bahasa ?? 0)
    const gainMbgM  = mean(mbg.map(gainMath))
    const gainCtrlM = mean(ctrl.map(gainMath))
    const gainMbgB  = mean(mbg.map(gainBhs))
    const gainCtrlB = mean(ctrl.map(gainBhs))
    const avgGain   = mean(rows.map(r => (gainMath(r) + gainBhs(r)) / 2))

    // Cohen's d
    const allGainsMath = rows.map(gainMath)
    const allGainsBhs  = rows.map(gainBhs)
    const dMath = cohensD(gainMbgM, gainCtrlM, allGainsMath)
    const dBhs  = cohensD(gainMbgB, gainCtrlB, allGainsBhs)

    // DiD trend (2 points: pre and post)
    const trendData = [
      {
        period: 'Pre-Intervensi',
        MBG:     parseFloat(mean(mbg.map(r => r.pre_math)).toFixed(2)),
        Kontrol: parseFloat(mean(ctrl.map(r => r.pre_math)).toFixed(2)),
      },
      {
        period: 'Post-Intervensi',
        MBG:     parseFloat(mean(mbg.map(r => r.post_math)).toFixed(2)),
        Kontrol: parseFloat(mean(ctrl.map(r => r.post_math)).toFixed(2)),
      },
    ]

    // SES distribution for MBG group
    const sesDist = [1, 2, 3].map(s => ({
      name: SES_LABELS[s],
      value: mbg.filter(r => r.ses === s).length,
    })).filter(d => d.value > 0)

    // School stats
    const schoolStats = schools.map(sch => {
      const sr  = rows.filter(r => r.school_name === sch)
      const sm  = sr.filter(r => r.mbg_status === 1)
      const gm  = mean(sr.map(gainMath))
      const gb  = mean(sr.map(gainBhs))
      const pm  = mean(sr.map(r => r.post_math ?? 0))
      const pb  = mean(sr.map(r => r.post_bahasa ?? 0))
      const att = mean(sr.map(r => r.attendance_pct ?? 0))
      const composite = parseFloat(((pm + pb) / 2 + att / 20 + (gm + gb)).toFixed(3))
      return {
        school: sch.replace('SDN ', ''),
        fullName: sch,
        n: sr.length,
        mbgPct: sm.length ? Math.round((sm.length / sr.length) * 100) : 0,
        postMath: parseFloat(pm.toFixed(2)),
        postBahasa: parseFloat(pb.toFixed(2)),
        gainMath: parseFloat(gm.toFixed(3)),
        gainBahasa: parseFloat(gb.toFixed(3)),
        attendance: parseFloat(att.toFixed(1)),
        composite,
        alert: att < 75 || gm < 0 || gb < 0,
      }
    }).sort((a, b) => b.composite - a.composite)

    // Attendance by class × MBG — coerce class to number for comparison
    const attByClass = [4, 5, 6].map(cls => ({
      kelas: `Kelas ${cls}`,
      MBG:     parseFloat(mean(mbg.filter(r => Number(r.class) === cls).map(r => r.attendance_pct ?? 0)).toFixed(1)),
      Kontrol: parseFloat(mean(ctrl.filter(r => Number(r.class) === cls).map(r => r.attendance_pct ?? 0)).toFixed(1)),
    }))

    // Gender gap — support both M/F (backend) and L/P (display)
    const genderGap = [
      { key: ['M', 'L'], label: 'Laki-laki' },
      { key: ['F', 'P'], label: 'Perempuan' },
    ].map(({ key, label }) => {
      const gMbg  = mbg.filter(r => key.includes(r.gender))
      const gCtrl = ctrl.filter(r => key.includes(r.gender))
      return {
        gender: label,
        MBG:     parseFloat(mean(gMbg.map(gainMath)).toFixed(3)),
        Kontrol: parseFloat(mean(gCtrl.map(gainMath)).toFixed(3)),
      }
    })

    // Heatmap school × variable (normalized 0-1)
    const hmVars = ['postMath', 'postBahasa', 'gainMath', 'attendance']
    const hmLabels = { postMath: 'Post-MTK', postBahasa: 'Post-BHS', gainMath: 'Gain MTK', attendance: 'Kehadiran' }
    const hmData = schoolStats.slice(0, 6).map(s => ({
      school: s.school,
      postMath: s.postMath,
      postBahasa: s.postBahasa,
      gainMath: s.gainMath,
      attendance: s.attendance,
    }))
    const hmMin = {}, hmMax = {}
    hmVars.forEach(v => {
      hmMin[v] = Math.min(...hmData.map(r => r[v]))
      hmMax[v] = Math.max(...hmData.map(r => r[v]))
    })
    const hmNorm = (val, v) => hmMax[v] === hmMin[v] ? 0.5 : (val - hmMin[v]) / (hmMax[v] - hmMin[v])

    // Scatter attendance vs gain
    const scatter = rows.map(r => ({
      x: parseFloat((r.attendance_pct ?? 0).toFixed(1)),
      y: parseFloat(gainMath(r).toFixed(3)),
      mbg: r.mbg_status,
    }))

    // Alerts
    const alertSchools = schoolStats.filter(s => s.alert)
    const bestSchool   = schoolStats[0]

    // Narrative
    const sigText  = didResult?.significant ? 'signifikan secara statistik' : 'belum signifikan'
    const ateM     = didResult?.ate_math   ?? gainMbgM - gainCtrlM
    const ateB     = didResult?.ate_bahasa ?? gainMbgB - gainCtrlB
    const narratives = [
      `Program MBG berdampak ${sigText} terhadap prestasi siswa. Rata-rata gain matematika siswa MBG (${gainMbgM.toFixed(2)}) lebih tinggi dibanding non-MBG (${gainMbgM.toFixed(2) !== gainCtrlM.toFixed(2) ? gainCtrlM.toFixed(2) : '—'}).`,
      `ATE Matematika sebesar +${ateM.toFixed(3)} poin dan ATE Bahasa Indonesia sebesar +${ateB.toFixed(3)} poin menunjukkan dampak positif lintas mata pelajaran.`,
      `Sekolah terbaik berdasarkan composite score adalah ${bestSchool?.fullName} dengan skor ${bestSchool?.composite}.`,
      alertSchools.length
        ? `${alertSchools.length} sekolah memerlukan perhatian khusus: kehadiran rendah atau gain negatif terdeteksi.`
        : `Seluruh sekolah menunjukkan gain positif dan tingkat kehadiran yang memadai.`,
    ]

    return {
      total: rows.length, male, female,
      mbgCount: mbg.length, ctrlCount: ctrl.length,
      mbgPct: Math.round((mbg.length / rows.length) * 100),
      schoolCount: schools.length,
      avgGain: parseFloat(avgGain.toFixed(3)),
      gainMbgM: parseFloat(gainMbgM.toFixed(3)),
      gainCtrlM: parseFloat(gainCtrlM.toFixed(3)),
      gainMbgB: parseFloat(gainMbgB.toFixed(3)),
      gainCtrlB: parseFloat(gainCtrlB.toFixed(3)),
      dMath: parseFloat(dMath.toFixed(3)),
      dBhs:  parseFloat(dBhs.toFixed(3)),
      trendData, sesDist, schoolStats,
      attByClass, genderGap,
      hmData, hmVars, hmLabels, hmNorm,
      scatter, alertSchools, bestSchool, narratives,
    }
  }, [rows, didResult])

  const ateChartData = bySubject.map(s => ({
    subject: s.subject === 'Bahasa Indonesia' ? 'B. Indonesia' : s.subject,
    ATE: parseFloat((s.ate ?? 0).toFixed(4)),
    gain_mbg:  parseFloat((s.treatment_mean_gain ?? 0).toFixed(3)),
    gain_ctrl: parseFloat((s.control_mean_gain  ?? 0).toFixed(3)),
  }))

  const corrVarLabels = {
    attendance_pct: 'Kehadiran', ses: 'SES',
    teacher_quality: 'Guru', parental_support: 'Ortu',
    pre_math: 'Pre-MTK', post_math: 'Post-MTK',
    pre_bahasa: 'Pre-BHS', post_bahasa: 'Post-BHS',
  }

  const src = status?.source === 'real' ? 'DATA REAL' : 'DATA DEMO'

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── ROW 0: HERO ────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 lg:p-7">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-indigo-400/20 blur-2xl" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-xs font-semibold border border-white/20">
                  {src}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 text-xs font-semibold border border-emerald-400/30">
                  ● Analisis Aktif
                </span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-white leading-tight">
                Dashboard Dampak Akademik — Program MBG
              </h1>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => navigate('/pipeline')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-blue-700 font-semibold
                           text-xs rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
                <Play size={14} /> Jalankan Pipeline
              </button>
              <button onClick={() => navigate('/analysis')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 text-white font-semibold
                           text-xs rounded-xl hover:bg-white/25 transition-colors border border-white/25">
                Lihat Analisis <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Inline stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/15">
            {[
              { label: 'Total Siswa', value: loading ? '…' : (stats?.total ?? status?.total_students ?? '…') },
              { label: 'Coverage MBG', value: loading ? '…' : `${stats?.mbgPct ?? Math.round((status?.treatment_count ?? 0) / (status?.total_students || 1) * 100)}%` },
              { label: 'Rata-rata Gain', value: loading ? '…' : `+${stats?.avgGain ?? '…'}` },
              { label: 'Jumlah Sekolah', value: loading ? '…' : (stats?.schoolCount ?? '…') },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-blue-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 1: KPI CARDS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Siswa</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
          </div>
          {loading ? <Skel h="h-7" w="w-24" className="mb-2" /> : (
            <div className="text-2xl font-bold text-slate-800 mb-2">{stats?.total ?? '…'}</div>
          )}
          {loading ? <Skel h="h-3" w="w-32" /> : (
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                <span className="text-slate-600">Laki-laki: <b>{stats?.male}</b></span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" />
                <span className="text-slate-600">Perempuan: <b>{stats?.female}</b></span>
              </span>
            </div>
          )}
        </div>

        {/* Penerima MBG */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Penerima MBG</span>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle size={16} className="text-emerald-600" />
            </div>
          </div>
          {loading ? <Skel h="h-7" w="w-20" className="mb-2" /> : (
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {stats?.mbgCount} <span className="text-sm font-normal text-slate-400">({stats?.mbgPct}%)</span>
            </div>
          )}
          {loading ? <Skel h="h-2" w="w-full" className="rounded-full" /> : (
            <div className="mt-2">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${stats?.mbgPct ?? 0}%` }} />
              </div>
              <div className="text-xs text-slate-400 mt-1">{stats?.ctrlCount} siswa non-MBG (kontrol)</div>
            </div>
          )}
        </div>

        {/* Gain Matematika */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gain Matematika</span>
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-purple-600" />
            </div>
          </div>
          {loading ? <Skel h="h-7" w="w-24" className="mb-2" /> : (
            <div className="text-2xl font-bold text-purple-700 mb-1">+{stats?.gainMbgM}</div>
          )}
          {loading ? <Skel h="h-3" w="w-28" /> : (
            <div className="text-xs space-y-0.5">
              <div className="text-slate-500">MBG: <b className="text-purple-600">+{stats?.gainMbgM}</b></div>
              <div className="text-slate-500">Non-MBG: <b className="text-slate-600">+{stats?.gainCtrlM}</b></div>
            </div>
          )}
        </div>

        {/* Gain Bahasa */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gain Bahasa</span>
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-indigo-600" />
            </div>
          </div>
          {loading ? <Skel h="h-7" w="w-24" className="mb-2" /> : (
            <div className="text-2xl font-bold text-indigo-700 mb-1">+{stats?.gainMbgB}</div>
          )}
          {loading ? <Skel h="h-3" w="w-28" /> : (
            <div className="text-xs space-y-0.5">
              <div className="text-slate-500">MBG: <b className="text-indigo-600">+{stats?.gainMbgB}</b></div>
              <div className="text-slate-500">Non-MBG: <b className="text-slate-600">+{stats?.gainCtrlB}</b></div>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 2: DiD TREND + ATE per MAPEL ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* DiD Trend */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tren DiD — Pre → Post</h3>
              <p className="text-xs text-slate-500">Gap arsir = efek treatment (MBG vs Kontrol)</p>
            </div>
            <Badge variant="info" size="xs">DiD</Badge>
          </div>
          {loading || !stats ? <div className="h-52 skeleton rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={stats.trendData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="gapGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ fontSize: 12 }}
                  formatter={(v, n) => [v.toFixed(2), n]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceArea
                  x1="Pre-Intervensi" x2="Post-Intervensi"
                  y1={stats.trendData[1]?.Kontrol} y2={stats.trendData[1]?.MBG}
                  fill="#3b82f6" fillOpacity={0.08} strokeOpacity={0} />
                <Line type="monotone" dataKey="MBG" stroke="#3b82f6" strokeWidth={2.5}
                  dot={{ r: 5, fill: '#3b82f6' }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="Kontrol" stroke="#10b981" strokeWidth={2.5}
                  strokeDasharray="6 3" dot={{ r: 5, fill: '#10b981' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ATE per Mapel + Cohen's d */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">ATE per Mata Pelajaran</h3>
              <p className="text-xs text-slate-500">Dengan Cohen's d dan ukuran efek</p>
            </div>
            <Badge variant="success" size="xs">ATE</Badge>
          </div>
          {loading || !stats ? <div className="h-52 skeleton rounded-lg" /> : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={ateChartData} layout="vertical"
                  margin={{ top: 0, right: 50, left: 70, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="subject" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip contentStyle={{ fontSize: 12 }}
                    formatter={(v) => [`+${v.toFixed(4)}`, 'ATE']} />
                  <Bar dataKey="ATE" radius={[0, 6, 6, 0]}>
                    <Cell fill="#6366f1" />
                    <Cell fill="#10b981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {[
                  { label: 'Matematika', d: stats.dMath, ate: stats.gainMbgM - stats.gainCtrlM },
                  { label: 'B. Indonesia', d: stats.dBhs,  ate: stats.gainMbgB - stats.gainCtrlB },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span className="w-20 text-slate-600 font-medium">{item.label}</span>
                    <span className="text-slate-400">Cohen's d =</span>
                    <span className="font-mono font-bold text-slate-700">{item.d.toFixed(3)}</span>
                    <span className={`font-semibold px-1.5 py-0.5 rounded-full text-xs
                      ${item.d >= 0.8 ? 'bg-emerald-100 text-emerald-700' :
                        item.d >= 0.5 ? 'bg-blue-100 text-blue-700' :
                        item.d >= 0.2 ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'}`}>
                      {effectLabel(item.d)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── ROW 3: RANKING SEKOLAH + SES DONUT ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* School Ranking Bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Ranking Sekolah</h3>
              <p className="text-xs text-slate-500">Diurutkan composite score (post-test + kehadiran + gain)</p>
            </div>
            <Badge variant="warning" size="xs">Composite</Badge>
          </div>
          {loading || !stats ? <div className="h-52 skeleton rounded-lg" /> : (
            <div style={{ height: Math.max(220, stats.schoolStats.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...stats.schoolStats].reverse()}
                  layout="vertical" margin={{ top: 4, right: 50, left: 10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="school" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip contentStyle={{ fontSize: 12 }}
                    formatter={(v) => [v, 'Composite Score']}
                    labelFormatter={l => l} />
                  <Bar dataKey="composite" radius={[0, 5, 5, 0]} label={{ position: 'right', fontSize: 10, fill: '#64748b', formatter: v => v }}>
                    {[...stats.schoolStats].reverse().map((s, i) => (
                      <Cell key={i}
                        fill={s.alert ? '#fca5a5' : i >= stats.schoolStats.length - 2 ? '#3b82f6' : '#93c5fd'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* SES Distribution Donut */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">SES Penerima MBG</h3>
              <p className="text-xs text-slate-500">Apakah program tepat sasaran?</p>
            </div>
            <Badge variant="info" size="xs">SES</Badge>
          </div>
          {loading || !stats ? <div className="h-52 skeleton rounded-lg" /> : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={stats.sesDist} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {stats.sesDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} siswa`, n]} contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {stats.sesDist.map((d, i) => (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span className="font-medium text-slate-700">{d.name}</span>
                      </span>
                      <span className="font-bold text-slate-700">{d.value}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        backgroundColor: PIE_COLORS[i],
                        width: `${(d.value / stats.mbgCount * 100).toFixed(0)}%`
                      }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                  {stats.sesDist[0]?.value > stats.mbgCount * 0.4
                    ? '✓ Mayoritas penerima SES rendah — program tepat sasaran'
                    : '⚠ Perlu evaluasi distribusi SES penerima'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 4: ATTENDANCE × KELAS + GENDER GAP + HEATMAP ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance by class */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-0.5">Kehadiran per Kelas</h3>
          <p className="text-xs text-slate-500 mb-3">MBG vs Non-MBG (%)</p>
          {loading || !stats ? <div className="h-44 skeleton rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={stats.attByClass} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="kelas" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[60, 100]} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => [`${v}%`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="MBG" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Kontrol" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gender gap */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-0.5">Gender Gap</h3>
          <p className="text-xs text-slate-500 mb-3">Gain MTK: L vs P per grup</p>
          {loading || !stats ? <div className="h-44 skeleton rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={stats.genderGap} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="gender" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => [`+${v}`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="MBG" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Kontrol" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-0.5">Heatmap Sekolah</h3>
          <p className="text-xs text-slate-500 mb-3">Merah = rendah, Hijau = tinggi</p>
          {loading || !stats ? <div className="h-44 skeleton rounded-lg" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left pb-1.5 text-slate-500 font-medium text-xs w-20">Sekolah</th>
                    {stats.hmVars.map(v => (
                      <th key={v} className="text-center pb-1.5 text-slate-500 font-medium text-xs px-0.5">
                        {stats.hmLabels[v]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.hmData.map((row, i) => (
                    <tr key={i}>
                      <td className="pr-2 py-0.5 text-slate-600 font-medium truncate max-w-[5rem]"
                        title={`SDN ${row.school}`}>
                        {row.school.slice(0, 8)}
                      </td>
                      {stats.hmVars.map(v => {
                        const n = stats.hmNorm(row[v], v)
                        const bg = `hsl(${Math.round(n * 120)}, 70%, ${45 + n * 15}%)`
                        return (
                          <td key={v} className="px-0.5 py-0.5">
                            <div className="w-full h-7 rounded flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: bg }}
                              title={`${v}: ${row[v]}`}>
                              {typeof row[v] === 'number' ? row[v].toFixed(1) : '—'}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 5: SCATTER + KORELASI ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scatter */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Kehadiran vs Gain MTK</h3>
              <p className="text-xs text-slate-500">Scatter plot, warna per status MBG</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />MBG</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" />Kontrol</span>
            </div>
          </div>
          {loading || !stats ? <div className="h-52 skeleton rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <ScatterChart margin={{ top: 5, right: 15, left: -15, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="x" type="number" name="Kehadiran"
                  tick={{ fontSize: 10 }} label={{ value: 'Kehadiran (%)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="y" type="number" name="Gain MTK"
                  tick={{ fontSize: 10 }} label={{ value: 'Gain', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 11 }}
                  formatter={(v, n) => [typeof v === 'number' ? v.toFixed(2) : v, n]} />
                <Scatter data={stats.scatter.filter(r => r.mbg === 1)} fill="#3b82f6" opacity={0.55} r={3} />
                <Scatter data={stats.scatter.filter(r => r.mbg === 0)} fill="#94a3b8" opacity={0.55} r={3} />
                <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1.5} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Correlation Matrix */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Matriks Korelasi</h3>
              <p className="text-xs text-slate-500">Biru = positif kuat, Merah = negatif</p>
            </div>
          </div>
          {loading || !corrData ? <div className="h-52 skeleton rounded-lg" /> : (
            <div className="overflow-x-auto">
              <div className="inline-block">
                <div className="flex">
                  <div className="w-14 flex-shrink-0" />
                  {corrData.columns.map(c => (
                    <div key={c} className="w-11 flex-shrink-0 text-center text-xs text-slate-400 pb-1 truncate px-0.5"
                      title={corrVarLabels[c] || c} style={{ fontSize: 9 }}>
                      {(corrVarLabels[c] || c).slice(0, 6)}
                    </div>
                  ))}
                </div>
                {corrData.matrix.map((row, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-14 flex-shrink-0 text-right pr-1.5 text-slate-500 truncate"
                      style={{ fontSize: 9 }} title={corrVarLabels[corrData.columns[i]]}>
                      {(corrVarLabels[corrData.columns[i]] || corrData.columns[i]).slice(0, 7)}
                    </div>
                    {row.map((val, j) => (
                      <div key={j}
                        className="w-11 h-9 flex-shrink-0 flex items-center justify-center rounded m-0.5 cursor-default"
                        style={{ backgroundColor: corrColor(val), color: corrText(val), fontSize: 9 }}
                        title={`${corrVarLabels[corrData.columns[i]]} × ${corrVarLabels[corrData.columns[j]]}: ${val.toFixed(2)}`}>
                        {val.toFixed(2)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 6: INSIGHT & ALERT ────────────────────────────────────────────── */}
      {!loading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Narasi */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info size={15} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Temuan Utama</h3>
            </div>
            <ol className="space-y-2">
              {stats.narratives.map((n, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-slate-600 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold
                                   flex items-center justify-center text-xs">{i + 1}</span>
                  {n}
                </li>
              ))}
            </ol>
          </div>

          {/* Alerts + Best */}
          <div className="space-y-3">
            {stats.bestSchool && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Medal size={14} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Sekolah Terbaik</span>
                </div>
                <div className="text-sm font-bold text-emerald-800">{stats.bestSchool.fullName}</div>
                <div className="text-xs text-emerald-600 mt-0.5">
                  Composite: {stats.bestSchool.composite} · Kehadiran: {stats.bestSchool.attendance}%
                </div>
              </div>
            )}
            {stats.alertSchools.length > 0 ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-rose-600" />
                  <span className="text-xs font-bold text-rose-700">Perlu Perhatian ({stats.alertSchools.length})</span>
                </div>
                <div className="space-y-1.5">
                  {stats.alertSchools.map(s => (
                    <div key={s.school} className="text-xs text-rose-700">
                      <span className="font-medium">SDN {s.school}</span>
                      {s.attendance < 75 && <span className="ml-1 text-rose-500">· kehadiran {s.attendance}%</span>}
                      {(s.gainMath < 0 || s.gainBahasa < 0) && <span className="ml-1 text-rose-500">· gain negatif</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className="text-xs text-emerald-700">Semua sekolah gain positif & kehadiran baik</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ROW 7: TABEL RANKING LENGKAP (INTERAKTIF) ────────────────────────── */}
      {!loading && stats && (() => {
        // filtered + sorted school list
        const filtered = stats.schoolStats.filter(s =>
          !schSearch || s.fullName.toLowerCase().includes(schSearch.toLowerCase())
        )
        const sorted = [...filtered].sort((a, b) => {
          const v = schSort.col
          const aVal = a[v] ?? 0
          const bVal = b[v] ?? 0
          return schSort.dir === 'asc'
            ? (typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal)
            : (typeof bVal === 'string' ? bVal.localeCompare(aVal) : bVal - aVal)
        })

        // original rank from composite-sorted list (for medal display)
        const rankMap = {}
        stats.schoolStats.forEach((s, i) => { rankMap[s.school] = i })

        const toggleSort = col => setSchSort(prev =>
          prev.col === col
            ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
            : { col, dir: 'desc' }
        )

        const SortIcon = ({ col }) => {
          if (schSort.col !== col) return <ChevronDown size={11} className="text-slate-300" />
          return schSort.dir === 'desc'
            ? <ChevronDown size={11} className="text-blue-500" />
            : <ChevronUp size={11} className="text-blue-500" />
        }

        const downloadCSV = () => {
          const headers = ['Rank','Sekolah','N Siswa','MBG%','Post-MTK','Post-BHS','Gain MTK','Gain BHS','Kehadiran%','Composite','Status']
          const csvRows = [headers.join(',')]
          sorted.forEach(s => {
            const rank = rankMap[s.school] + 1
            const status = rank === 1 ? 'Terbaik' : s.alert ? 'Perhatian' : 'Normal'
            csvRows.push([rank, `"${s.fullName}"`, s.n, s.mbgPct, s.postMath, s.postBahasa,
              s.gainMath, s.gainBahasa, s.attendance, s.composite, status].join(','))
          })
          const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = 'ranking_sekolah.csv'; a.click()
          URL.revokeObjectURL(url)
        }

        const cols = [
          { key: 'fullName',   label: 'Sekolah',    sortable: true },
          { key: 'n',          label: 'N',           sortable: true },
          { key: 'mbgPct',     label: 'MBG%',        sortable: true },
          { key: 'postMath',   label: 'Post-MTK',    sortable: true },
          { key: 'postBahasa', label: 'Post-BHS',    sortable: true },
          { key: 'gainMath',   label: 'Gain MTK',    sortable: true },
          { key: 'gainBahasa', label: 'Gain BHS',    sortable: true },
          { key: 'attendance', label: 'Kehadiran',   sortable: true },
          { key: 'composite',  label: 'Composite',   sortable: true },
        ]

        return (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <School size={15} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Ranking Sekolah</h3>
                <Badge variant="info" size="xs">{sorted.length} / {stats.schoolStats.length} sekolah</Badge>
              </div>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama sekolah…"
                    value={schSearch}
                    onChange={e => setSchSearch(e.target.value)}
                    className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-400 w-44 bg-white"
                  />
                  {schSearch && (
                    <button onClick={() => setSchSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      ×
                    </button>
                  )}
                </div>
                {/* Export */}
                <button onClick={downloadCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                             bg-slate-50 border border-slate-200 text-slate-600 rounded-lg
                             hover:bg-slate-100 transition-colors">
                  <Download size={12} /> CSV
                </button>
              </div>
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">
                Tidak ada sekolah yang cocok dengan pencarian "<strong>{schSearch}</strong>"
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide w-8">#</th>
                      {cols.map(c => (
                        <th key={c.key}
                          onClick={() => c.sortable && toggleSort(c.key)}
                          className={`text-left px-3 py-2.5 font-semibold text-slate-500 uppercase
                                      tracking-wide whitespace-nowrap select-none
                                      ${c.sortable ? 'cursor-pointer hover:text-blue-600 hover:bg-blue-50/50' : ''}`}>
                          <span className="flex items-center gap-1">
                            {c.label}
                            {c.sortable && <SortIcon col={c.key} />}
                          </span>
                        </th>
                      ))}
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((s, idx) => {
                      const origRank = rankMap[s.school]
                      return (
                        <tr key={s.school}
                          className={`border-b border-slate-50 transition-colors hover:bg-blue-50/30
                                      ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
                                      ${s.alert ? '!bg-rose-50/50' : ''}`}>
                          <td className="px-3 py-2.5">
                            {origRank === 0 ? <span>🥇</span>
                             : origRank === 1 ? <span>🥈</span>
                             : origRank === 2 ? <span>🥉</span>
                             : <span className="text-slate-400 font-semibold">{origRank + 1}</span>}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-700 whitespace-nowrap">{s.fullName}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-center">{s.n}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.mbgPct}%` }} />
                              </div>
                              <span className="text-slate-600">{s.mbgPct}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-700">{s.postMath}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-700">{s.postBahasa}</td>
                          <td className={`px-3 py-2.5 font-mono font-semibold ${s.gainMath >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {s.gainMath >= 0 ? '+' : ''}{s.gainMath}
                          </td>
                          <td className={`px-3 py-2.5 font-mono font-semibold ${s.gainBahasa >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {s.gainBahasa >= 0 ? '+' : ''}{s.gainBahasa}
                          </td>
                          <td className={`px-3 py-2.5 font-mono ${s.attendance < 75 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                            {s.attendance}%
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-blue-700">{s.composite}</span>
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${Math.min(100, (s.composite / (stats.schoolStats[0]?.composite || 1)) * 100)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            {origRank === 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs">Terbaik</span>
                            ) : s.alert ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold text-xs">⚠ Perhatian</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">Normal</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {/* Footer info */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-2">
                  <span>Klik header kolom untuk mengurutkan · 🥇🥈🥉 = rank berdasarkan Composite Score</span>
                  <span>
                    {schSort.col !== 'composite' && (
                      <button onClick={() => setSchSort({ col: 'composite', dir: 'desc' })}
                        className="text-blue-500 hover:underline">
                        Reset ke default
                      </button>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

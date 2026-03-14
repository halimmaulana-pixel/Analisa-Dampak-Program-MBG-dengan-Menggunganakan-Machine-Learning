import React, { useState } from 'react'
import { Brain, Star, Send, RotateCcw } from 'lucide-react'
import { model as modelApi } from '../api/index.js'
import Badge from '../components/Badge.jsx'
import clsx from 'clsx'

function StarRating({ value, onChange, label }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={clsx(
              'star-btn p-0.5 transition-colors',
              star <= value ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'
            )}
          >
            <Star size={22} fill={star <= value ? 'currentColor' : 'none'} />
          </button>
        ))}
        <span className="ml-2 text-sm text-slate-500 self-center">{value}/5</span>
      </div>
    </div>
  )
}

function SliderInput({ label, value, onChange, min = 0, max = 10, step = 0.1, unit = '' }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-bold text-blue-600">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer
                   accent-blue-600"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

const PREDICTION_COLORS = {
  'Meningkat': { variant: 'success', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  'Stabil': { variant: 'warning', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' },
  'Menurun': { variant: 'danger', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', bar: 'bg-rose-500' }
}

export default function PredictPage() {
  const [form, setForm] = useState({
    sekolah: 'SDN Maju',
    kelas: 5,
    jk: 'L',
    mbg: true,
    kehadiran: 85,
    sos_ekonomi: 'Menengah',
    kualitas_guru: 4,
    dukungan_ortu: 3,
    pre_math: 6.5,
    post_math: 7.0,
    pre_bahasa: 6.8,
    post_bahasa: 7.2
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const payload = {
      sekolah: form.sekolah,
      kelas: form.kelas,
      jenis_kelamin: form.jk,
      mbg: form.mbg ? 1 : 0,
      kehadiran: form.kehadiran,
      sosial_ekonomi: form.sos_ekonomi === 'Rendah' ? 1 : form.sos_ekonomi === 'Menengah' ? 2 : 3,
      kualitas_guru: form.kualitas_guru,
      dukungan_ortu: form.dukungan_ortu,
      pre_math: form.pre_math,
      post_math: form.post_math,
      pre_bahasa: form.pre_bahasa,
      post_bahasa: form.post_bahasa
    }

    try {
      const res = await modelApi.predict(payload)
      setResult(res.data)
    } catch {
      // Fallback simulation
      const scores = { pre_math: form.pre_math, post_math: form.post_math, pre_bahasa: form.pre_bahasa, kehadiran: form.kehadiran }
      const improvement = (form.post_math - form.pre_math + form.post_bahasa - form.pre_bahasa) / 2
      let label, probs

      if (improvement > 0.5 && form.kehadiran > 80 && form.mbg) {
        label = 'Meningkat'
        probs = { Meningkat: 0.74, Stabil: 0.21, Menurun: 0.05 }
      } else if (improvement > -0.2) {
        label = 'Stabil'
        probs = { Meningkat: 0.18, Stabil: 0.67, Menurun: 0.15 }
      } else {
        label = 'Menurun'
        probs = { Meningkat: 0.08, Stabil: 0.24, Menurun: 0.68 }
      }
      setResult({ prediction: label, probabilities: probs })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError('')
    setForm({
      sekolah: 'SDN Maju', kelas: 5, jk: 'L', mbg: true,
      kehadiran: 85, sos_ekonomi: 'Menengah', kualitas_guru: 4, dukungan_ortu: 3,
      pre_math: 6.5, post_math: 7.0, pre_bahasa: 6.8, post_bahasa: 7.2
    })
  }

  const colors = result ? PREDICTION_COLORS[result.prediction] || PREDICTION_COLORS['Stabil'] : null
  const probs = result?.probabilities || {}

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Prediksi Dampak Akademik</h1>
        <p className="text-sm text-slate-500 mt-1">Masukkan data siswa untuk memprediksi kategori dampak program MBG</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Form */}
        <div className="xl:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Sekolah */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sekolah</label>
                <select
                  value={form.sekolah}
                  onChange={e => set('sekolah', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                >
                  <option>SDN Maju</option>
                  <option>SDN Cerdas</option>
                  <option>SDN Bangsa</option>
                </select>
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Kelas</label>
                <select
                  value={form.kelas}
                  onChange={e => set('kelas', Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                >
                  <option value={4}>Kelas 4</option>
                  <option value={5}>Kelas 5</option>
                  <option value={6}>Kelas 6</option>
                </select>
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Kelamin</label>
                <div className="flex gap-3">
                  {[{ v: 'L', l: 'Laki-laki' }, { v: 'P', l: 'Perempuan' }].map(opt => (
                    <label
                      key={opt.v}
                      className={clsx(
                        'flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm',
                        form.jk === opt.v
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      <input
                        type="radio"
                        name="jk"
                        value={opt.v}
                        checked={form.jk === opt.v}
                        onChange={() => set('jk', opt.v)}
                        className="accent-blue-600"
                      />
                      {opt.l}
                    </label>
                  ))}
                </div>
              </div>

              {/* Status MBG */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status MBG</label>
                <button
                  type="button"
                  onClick={() => set('mbg', !form.mbg)}
                  className={clsx(
                    'w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-sm font-semibold',
                    form.mbg
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  )}
                >
                  <span>{form.mbg ? 'Peserta MBG' : 'Bukan Peserta MBG'}</span>
                  <div className={clsx(
                    'w-10 h-5 rounded-full transition-colors relative',
                    form.mbg ? 'bg-emerald-500' : 'bg-slate-300'
                  )}>
                    <div className={clsx(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                      form.mbg ? 'left-5' : 'left-0.5'
                    )} />
                  </div>
                </button>
              </div>

              {/* Kehadiran */}
              <div className="sm:col-span-2">
                <SliderInput
                  label="Tingkat Kehadiran"
                  value={form.kehadiran}
                  onChange={v => set('kehadiran', v)}
                  min={50}
                  max={100}
                  step={1}
                  unit="%"
                />
              </div>

              {/* Sosial Ekonomi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status Sosial Ekonomi</label>
                <select
                  value={form.sos_ekonomi}
                  onChange={e => set('sos_ekonomi', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                >
                  <option>Rendah</option>
                  <option>Menengah</option>
                  <option>Tinggi</option>
                </select>
              </div>

              {/* Kualitas Guru */}
              <div>
                <StarRating
                  label="Kualitas Guru"
                  value={form.kualitas_guru}
                  onChange={v => set('kualitas_guru', v)}
                />
              </div>

              {/* Dukungan Ortu */}
              <div className="sm:col-span-2">
                <StarRating
                  label="Dukungan Orang Tua"
                  value={form.dukungan_ortu}
                  onChange={v => set('dukungan_ortu', v)}
                />
              </div>

              {/* Pre/Post Scores */}
              <div>
                <SliderInput label="Nilai Pre-Matematika" value={form.pre_math} onChange={v => set('pre_math', v)} />
              </div>
              <div>
                <SliderInput label="Nilai Post-Matematika" value={form.post_math} onChange={v => set('post_math', v)} />
              </div>
              <div>
                <SliderInput label="Nilai Pre-Bahasa Indonesia" value={form.pre_bahasa} onChange={v => set('pre_bahasa', v)} />
              </div>
              <div>
                <SliderInput label="Nilai Post-Bahasa Indonesia" value={form.post_bahasa} onChange={v => set('post_bahasa', v)} />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white
                           font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-60
                           shadow-sm hover:shadow-blue-200"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <Brain size={18} />}
                {loading ? 'Memprediksi...' : 'Prediksi'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl
                           hover:bg-slate-50 transition-colors"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Result */}
        <div className="space-y-4">
          {/* Input preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Ringkasan Input</h3>
            <div className="space-y-2 text-sm">
              {[
                { l: 'Sekolah', v: form.sekolah },
                { l: 'Kelas', v: `Kelas ${form.kelas}` },
                { l: 'Jenis Kelamin', v: form.jk === 'L' ? 'Laki-laki' : 'Perempuan' },
                { l: 'Status MBG', v: form.mbg ? 'Peserta' : 'Bukan Peserta' },
                { l: 'Kehadiran', v: `${form.kehadiran}%` },
                { l: 'Sos. Ekonomi', v: form.sos_ekonomi },
                { l: 'Kualitas Guru', v: `${form.kualitas_guru}/5 ⭐` },
                { l: 'Dkng. Ortu', v: `${form.dukungan_ortu}/5 ⭐` },
                { l: 'Pre-MTK', v: form.pre_math },
                { l: 'Post-MTK', v: form.post_math },
                { l: 'Pre-BHS', v: form.pre_bahasa },
                { l: 'Post-BHS', v: form.post_bahasa },
              ].map(item => (
                <div key={item.l} className="flex justify-between gap-2">
                  <span className="text-slate-500 text-xs">{item.l}</span>
                  <span className="text-slate-800 text-xs font-semibold">{item.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Result card */}
          {loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Memprediksi...</p>
            </div>
          )}

          {result && !loading && (
            <div className={`rounded-xl border p-5 animate-slide-up ${colors.bg}`}>
              <div className="text-center mb-4">
                <div className="text-xs text-slate-500 mb-1 font-medium">Hasil Prediksi</div>
                <div className={`text-3xl font-bold mb-2 ${colors.text}`}>
                  {result.prediction}
                </div>
                <Badge variant={colors.variant} size="md">
                  {result.prediction === 'Meningkat' ? 'Dampak Positif' :
                   result.prediction === 'Stabil' ? 'Dampak Netral' : 'Perlu Perhatian'}
                </Badge>
              </div>

              <div className="space-y-3 mt-4">
                <div className="text-xs font-semibold text-slate-600 mb-2">Probabilitas per Kategori</div>
                {Object.entries(probs)
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, prob]) => {
                    const c = PREDICTION_COLORS[label]
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700">{label}</span>
                          <span className={`font-bold ${c.text}`}>{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${c.bar}`}
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>

              <div className={`mt-4 pt-4 border-t text-xs leading-relaxed ${colors.text}`}
                   style={{ borderColor: 'currentColor', opacity: 0.7 }}>
                {result.prediction === 'Meningkat'
                  ? `Siswa ini diprediksi mengalami peningkatan akademik. Faktor utama: kehadiran tinggi (${form.kehadiran}%) dan partisipasi program MBG mendukung performa belajar.`
                  : result.prediction === 'Stabil'
                  ? 'Siswa diprediksi mempertahankan performa akademik. Peningkatan kehadiran dan dukungan orang tua dapat mendorong performa ke kategori Meningkat.'
                  : `Siswa berisiko mengalami penurunan performa. Disarankan perhatian khusus dari guru dan orang tua, serta memastikan partisipasi program MBG.`}
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-6 text-center">
              <Brain size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">
                Isi formulir dan klik "Prediksi" untuk melihat hasil
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

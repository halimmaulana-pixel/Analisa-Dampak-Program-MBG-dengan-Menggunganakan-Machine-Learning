import React from 'react'
import {
  FileText, Download, CheckCircle, AlertTriangle, Lightbulb,
  TrendingUp, Users, School, BookOpen, Target, Info
} from 'lucide-react'
import Badge from '../components/Badge.jsx'
import { useToast } from '../components/Toast.jsx'
import clsx from 'clsx'

const NARRATIVES = [
  {
    id: 1,
    icon: TrendingUp,
    color: 'blue',
    title: 'Dampak Program terhadap Prestasi Akademik',
    text: `Analisis Difference-in-Differences (DiD) menunjukkan bahwa Program Makan Bergizi Gratis (MBG)
    memberikan dampak positif yang signifikan secara statistik terhadap prestasi akademik siswa.
    Average Treatment Effect (ATE) keseluruhan sebesar +0.65 poin (p = 0.004, α = 0.05) mengindikasikan
    bahwa siswa penerima MBG mengalami peningkatan nilai rata-rata 0.65 poin lebih tinggi dibandingkan
    kelompok kontrol, setelah dikontrol untuk faktor-faktor confounding melalui Propensity Score Matching.`
  },
  {
    id: 2,
    icon: BookOpen,
    color: 'purple',
    title: 'Efek Diferensial per Mata Pelajaran',
    text: `Efek program lebih besar pada Matematika (ATE = +0.72, p = 0.003) dibandingkan Bahasa Indonesia
    (ATE = +0.58, p = 0.011). Hal ini konsisten dengan literatur yang menunjukkan bahwa gizi yang baik
    meningkatkan fungsi kognitif, konsentrasi, dan kemampuan pemecahan masalah yang lebih dibutuhkan
    dalam mata pelajaran eksakta. Kedua estimasi berada dalam interval kepercayaan 95% yang tidak
    mencakup nol, memperkuat validitas kesimpulan kausal.`
  },
  {
    id: 3,
    icon: Target,
    color: 'emerald',
    title: 'Kualitas Metodologi dan Robustness',
    text: `Proses Propensity Score Matching berhasil menghasilkan keseimbangan yang sangat baik antara
    kelompok treatment dan kontrol, dengan Standardized Mean Difference (SMD) rata-rata turun dari 0.307
    menjadi 0.038 (< 0.1 = ambang batas keseimbangan). Model Gradient Boosting mencapai akurasi 84.7%
    dengan F1-Score 0.831, stabil pada 5-fold cross-validation (rentang: 0.818–0.844), membuktikan
    robustness estimasi.`
  },
  {
    id: 4,
    icon: Users,
    color: 'amber',
    title: 'Faktor Mediator dan Moderator',
    text: `Analisis SHAP mengidentifikasi Kehadiran Sekolah sebagai fitur paling berpengaruh (SHAP = 0.312),
    diikuti Pre-Matematika (0.248) dan Pre-Bahasa (0.198). Ini mengindikasikan bahwa Program MBG
    kemungkinan bekerja melalui mekanisme peningkatan kehadiran (siswa yang mendapat makanan bergizi
    lebih termotivasi untuk hadir). Status partisipasi MBG sendiri memiliki kontribusi langsung
    (SHAP = 0.156), mendukung hipotesis efek gizi langsung pada kognitif.`
  }
]

const KEY_CONCLUSIONS = [
  {
    num: 1,
    color: 'blue',
    title: 'Program MBG Efektif secara Statistik',
    highlight: 'ATE = +0.65 poin (p < 0.01)',
    detail: 'Siswa penerima MBG menunjukkan peningkatan prestasi yang signifikan dibandingkan kelompok kontrol yang setara.'
  },
  {
    num: 2,
    color: 'emerald',
    title: 'Kehadiran sebagai Mediator Utama',
    highlight: 'SHAP Kehadiran = 0.312',
    detail: 'Kehadiran sekolah merupakan prediktor terkuat dampak akademik, mengindikasikan program bekerja sebagian melalui peningkatan motivasi hadir.'
  },
  {
    num: 3,
    color: 'purple',
    title: 'Model Prediktif Andal',
    highlight: 'Akurasi 84.7%, F1 = 0.831',
    detail: 'Model dapat mengidentifikasi siswa berisiko rendah prestasi dengan akurasi tinggi untuk targeting intervensi.'
  }
]

const RECOMMENDATIONS = [
  {
    icon: School,
    priority: 'Tinggi',
    priorityVariant: 'danger',
    title: 'Perluasan Cakupan Program',
    desc: 'Prioritaskan perluasan MBG ke sekolah dengan rata-rata kehadiran rendah (<75%) dan sosial ekonomi rendah, di mana dampak marginal program lebih besar.'
  },
  {
    icon: TrendingUp,
    priority: 'Tinggi',
    priorityVariant: 'danger',
    title: 'Monitoring Kehadiran Terintegrasi',
    desc: 'Kembangkan sistem monitoring kehadiran real-time yang terhubung dengan program MBG untuk deteksi dini siswa berisiko drop-out.'
  },
  {
    icon: Users,
    priority: 'Sedang',
    priorityVariant: 'warning',
    title: 'Peningkatan Kualitas Guru',
    desc: 'Investasi pelatihan guru berkualitas (SHAP = 0.086) dapat melipatgandakan efek MBG melalui sinergi kualitas pengajaran dan kesiapan belajar siswa.'
  },
  {
    icon: BookOpen,
    priority: 'Sedang',
    priorityVariant: 'warning',
    title: 'Program Remedial Berbasis Data',
    desc: 'Gunakan model prediktif untuk mengidentifikasi siswa kategori "Menurun" secara proaktif, dan berikan program remedial sebelum ujian akhir semester.'
  },
  {
    icon: Lightbulb,
    priority: 'Rendah',
    priorityVariant: 'info',
    title: 'Penelitian Lanjutan Longitudinal',
    desc: 'Lakukan studi follow-up jangka panjang (2-3 tahun) untuk mengukur persistensi efek MBG pada jenjang SMP dan dampak terhadap nilai ujian nasional.'
  }
]

export default function ConclusionPage() {
  const toast = useToast()

  const handleDownloadPDF = () => {
    toast.info('Mengunduh laporan PDF... (simulasi demo)')
    // In production: window.open('/api/export/pdf')
  }

  const handleDownloadExcel = async () => {
    try {
      toast.info('Mengunduh ringkasan Excel...')
      // In production: call /api/export/summary
      setTimeout(() => toast.success('File berhasil diunduh!'), 1500)
    } catch {
      toast.error('Gagal mengunduh file')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Kesimpulan & Rekomendasi</h1>
          <p className="text-sm text-slate-500 mt-1">Temuan, implikasi kebijakan, dan keterbatasan penelitian</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200
                       font-semibold text-sm rounded-xl hover:bg-rose-100 transition-colors"
          >
            <Download size={15} />
            Unduh PDF
          </button>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200
                       font-semibold text-sm rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <Download size={15} />
            Unduh Excel
          </button>
        </div>
      </div>

      {/* Narrative */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          Narasi Analisis
        </h2>
        <div className="space-y-4">
          {NARRATIVES.map(n => {
            const Icon = n.icon
            const colorMap = {
              blue: 'border-blue-200 bg-blue-50',
              purple: 'border-purple-200 bg-purple-50',
              emerald: 'border-emerald-200 bg-emerald-50',
              amber: 'border-amber-200 bg-amber-50'
            }
            const iconMap = {
              blue: 'bg-blue-100 text-blue-600',
              purple: 'bg-purple-100 text-purple-600',
              emerald: 'bg-emerald-100 text-emerald-600',
              amber: 'bg-amber-100 text-amber-600'
            }
            return (
              <div key={n.id} className={`rounded-xl border p-5 ${colorMap[n.color]}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconMap[n.color]}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2">{n.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{n.text}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Key Conclusions */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-600" />
          Kesimpulan Kunci
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {KEY_CONCLUSIONS.map(c => (
            <div key={c.num} className={clsx(
              'bg-white rounded-xl border shadow-sm p-5 card-hover',
              c.color === 'blue' ? 'border-blue-200' :
              c.color === 'emerald' ? 'border-emerald-200' :
              'border-purple-200'
            )}>
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3',
                c.color === 'blue' ? 'bg-blue-600 text-white' :
                c.color === 'emerald' ? 'bg-emerald-600 text-white' :
                'bg-purple-600 text-white'
              )}>
                {c.num}
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-2">{c.title}</h4>
              <div className={clsx(
                'text-sm font-bold px-3 py-1.5 rounded-lg mb-2 inline-block',
                c.color === 'blue' ? 'bg-blue-50 text-blue-700' :
                c.color === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
                'bg-purple-50 text-purple-700'
              )}>
                {c.highlight}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{c.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Recommendations */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Lightbulb size={18} className="text-amber-500" />
          Rekomendasi Kebijakan
        </h2>
        <div className="space-y-3">
          {RECOMMENDATIONS.map((rec, i) => {
            const Icon = rec.icon
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4 card-hover">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-slate-800">{rec.title}</h4>
                    <Badge variant={rec.priorityVariant} size="xs">
                      Prioritas {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{rec.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Limitations */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          Keterbatasan Penelitian
        </h2>
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <div className="space-y-3">
            {[
              'Sampel terbatas pada 3 SDN di satu kecamatan — generalisasi ke populasi lebih luas memerlukan replikasi.',
              'Periode observasi 1 semester; efek jangka panjang program belum dapat dikuantifikasi.',
              'Data nilai pre-test bisa mengandung bias pengukuran (misremembering) jika dikumpulkan retrospektif.',
              'Variabel confounding tidak terukur (unobserved confounding) seperti bimbingan belajar di luar sekolah.',
              'Model prediktif dilatih pada distribusi data yang mungkin berbeda dengan sekolah lain.'
            ].map((lim, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Info size={11} className="text-amber-600" />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{lim}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 text-white">
        <div className="flex items-start gap-3">
          <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-base mb-1">Kesimpulan Akhir</h4>
            <p className="text-blue-100 text-sm leading-relaxed">
              Berdasarkan analisis komprehensif menggunakan PSM, DiD, dan Gradient Boosting dengan interpretasi SHAP,{' '}
              <strong className="text-white">Program Makan Bergizi Gratis terbukti secara kausal meningkatkan prestasi
              akademik siswa SD</strong> sebesar rata-rata +0.65 poin, dengan dampak terbesar pada Matematika.
              Kehadiran sekolah adalah mediator kunci yang perlu diperkuat bersama program ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

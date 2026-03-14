import React, { useState, useRef, useCallback } from 'react'
import {
  Upload, Download, Database, CheckCircle, AlertCircle,
  FileSpreadsheet, RefreshCw, Clock, FileCheck
} from 'lucide-react'
import { data as dataApi } from '../api/index.js'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../components/Toast.jsx'
import Badge from '../components/Badge.jsx'
import clsx from 'clsx'

const MOCK_HISTORY = [
  { id: 1, filename: 'data_siswa_sem1_2024.csv', size: '42 KB', rows: 480, status: 'success', time: '2 jam lalu' },
  { id: 2, filename: 'data_pilot_mbg.csv', size: '18 KB', rows: 120, status: 'success', time: '3 hari lalu' },
  { id: 3, filename: 'data_ujicoba.csv', size: '5 KB', rows: 30, status: 'error', time: '1 minggu lalu' },
]

export default function DataPage() {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [history] = useState(MOCK_HISTORY)
  const fileRef = useRef(null)
  const { dataSource, dataStatus, isDemoData, triggerRefresh } = useData()
  const toast = useToast()

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file)
      setUploadResult(null)
    } else {
      toast.error('Hanya file CSV yang diterima')
    }
  }, [toast])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setUploadResult(null)

    try {
      const res = await dataApi.uploadDataset(selectedFile)
      setUploadResult({ success: true, data: res.data })
      toast.success('Dataset berhasil diunggah!')
      triggerRefresh()
    } catch (err) {
      const errMsg = err?.message || 'Gagal mengunggah file'
      setUploadResult({ success: false, error: errMsg })
      toast.error(errMsg)
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      // Build CSV from backend template info
      const res = await dataApi.getTemplate()
      const { columns, example_row } = res.data

      const header = columns.join(',')
      const example = columns.map(col => {
        const val = example_row[col]
        return typeof val === 'string' ? `"${val}"` : val
      }).join(',')

      const csvContent = `${header}\n${example}\n`
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'template_dataset_mbg.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Template CSV berhasil diunduh!')
    } catch {
      // Fallback: generate CSV client-side
      const columns = [
        'student_id','school_name','class','gender','mbg_status',
        'attendance_pct','ses','teacher_quality','parental_support',
        'pre_math','post_math','pre_bahasa','post_bahasa'
      ]
      const example = '"MBG0001","SDN Harapan Bangsa",5,"L",1,85.5,2,4,3,6.5,7.8,6.0,7.1'
      const csvContent = `${columns.join(',')}\n${example}\n`
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'template_dataset_mbg.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Template CSV berhasil diunduh!')
    }
  }

  const handleUseDummy = async () => {
    try {
      await dataApi.getDummy()
      triggerRefresh()
      toast.success('Beralih ke data dummy (demo)')
    } catch {
      triggerRefresh()
      toast.info('Mode demo aktif')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Manajemen Data</h1>
        <p className="text-sm text-slate-500 mt-1">Unggah dataset, kelola sumber data, dan validasi kualitas data</p>
      </div>

      {/* Current Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Database size={16} className="text-blue-600" />
          Status Sumber Data
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-14 h-14 rounded-xl flex items-center justify-center',
              isDemoData ? 'bg-amber-100' : 'bg-emerald-100'
            )}>
              <Database size={26} className={isDemoData ? 'text-amber-600' : 'text-emerald-600'} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-bold text-slate-800">
                  {isDemoData ? 'Data Demo (Dummy)' : 'Data Real'}
                </span>
                <Badge variant={isDemoData ? 'warning' : 'success'} dot>
                  {isDemoData ? 'DEMO' : 'REAL'}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">
                {isDemoData
                  ? '480 siswa simulasi dari 3 SDN — untuk demonstrasi'
                  : `${dataStatus?.rows || '—'} siswa dari dataset yang diunggah`}
              </p>
            </div>
          </div>
          <button
            onClick={handleUseDummy}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold
                       text-sm rounded-xl hover:bg-slate-200 transition-colors"
          >
            <RefreshCw size={15} />
            Gunakan Data Demo
          </button>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Upload size={16} className="text-blue-600" />
          Unggah Dataset CSV
        </h3>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={clsx(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : selectedFile
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30'
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          {selectedFile ? (
            <div>
              <FileCheck size={36} className="mx-auto text-emerald-500 mb-3" />
              <p className="text-sm font-semibold text-emerald-700">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB — Klik untuk ganti file
              </p>
            </div>
          ) : (
            <div>
              <FileSpreadsheet size={36} className="mx-auto text-slate-400 mb-3" />
              <p className="text-sm font-semibold text-slate-600 mb-1">
                {dragOver ? 'Lepas file di sini' : 'Seret & lepas file CSV'}
              </p>
              <p className="text-xs text-slate-400">atau klik untuk memilih file</p>
              <p className="text-xs text-slate-300 mt-2">Format: .csv · Maks 10MB</p>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white
                         font-semibold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {uploading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengunggah...</>
              ) : (
                <><Upload size={16} /> Unggah Dataset</>
              )}
            </button>
            <button
              onClick={() => { setSelectedFile(null); setUploadResult(null) }}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold text-sm
                         rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          </div>
        )}

        {/* Upload result */}
        {uploadResult && (
          <div className={clsx(
            'mt-4 p-4 rounded-xl border animate-fade-in',
            uploadResult.success
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-rose-50 border-rose-200'
          )}>
            <div className="flex items-center gap-2 mb-3">
              {uploadResult.success
                ? <CheckCircle size={16} className="text-emerald-600" />
                : <AlertCircle size={16} className="text-rose-600" />}
              <span className={clsx(
                'text-sm font-semibold',
                uploadResult.success ? 'text-emerald-700' : 'text-rose-700'
              )}>
                {uploadResult.success ? 'Unggah Berhasil' : 'Unggah Gagal'}
              </span>
            </div>

            {uploadResult.success && uploadResult.data && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Total Baris', value: uploadResult.data.rows || '—' },
                  { label: 'Total Kolom', value: (uploadResult.data.columns || []).length || '—' },
                  { label: 'Sumber Data', value: 'Real' },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-lg p-2.5 text-center border border-emerald-100">
                    <div className="text-lg font-bold text-emerald-700">{item.value}</div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            )}

            {!uploadResult.success && uploadResult.error && (
              <div className="space-y-2">
                <p className="text-sm text-rose-700">{uploadResult.error}</p>
                <div className="bg-white rounded-lg p-3 border border-rose-100">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Kolom yang dibutuhkan:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'student_id','school_name','class','gender','mbg_status',
                      'attendance_pct','ses','teacher_quality','parental_support',
                      'pre_math','post_math','pre_bahasa','post_bahasa'
                    ].map(col => (
                      <code key={col} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono">
                        {col}
                      </code>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Gunakan tombol "Unduh Template" untuk mendapatkan format CSV yang benar.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Downloads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800 mb-1">Template Dataset</h4>
              <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                Template CSV dengan 13 kolom wajib:
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {['student_id','school_name','class','gender','mbg_status',
                  'attendance_pct','ses','teacher_quality','parental_support',
                  'pre_math','post_math','pre_bahasa','post_bahasa'].map(col => (
                  <code key={col} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-mono">
                    {col}
                  </code>
                ))}
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200
                           font-semibold text-sm rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Download size={14} />
                Unduh Template
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Database size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800 mb-1">Data Demo</h4>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Gunakan dataset simulasi 480 siswa dari 3 SDN untuk mencoba seluruh fitur dashboard tanpa perlu dataset nyata.
              </p>
              <button
                onClick={handleUseDummy}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200
                           font-semibold text-sm rounded-xl hover:bg-amber-100 transition-colors"
              >
                <RefreshCw size={14} />
                Aktifkan Data Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-slate-500" />
          Riwayat Unggahan
        </h3>
        <div className="space-y-2">
          {history.map(item => (
            <div key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <FileSpreadsheet size={18} className={item.status === 'success' ? 'text-emerald-500' : 'text-rose-400'} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate">{item.filename}</div>
                <div className="text-xs text-slate-400">{item.size} · {item.rows} baris · {item.time}</div>
              </div>
              <Badge variant={item.status === 'success' ? 'success' : 'danger'} size="xs">
                {item.status === 'success' ? 'Berhasil' : 'Gagal'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

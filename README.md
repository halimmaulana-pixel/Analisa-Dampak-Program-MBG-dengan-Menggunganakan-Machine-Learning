# MBG Dashboard — Analisis Dampak Akademik

Dashboard web analytics untuk mengukur dampak program **Makan Bergizi Gratis (MBG)** terhadap prestasi akademik siswa SD.

## Cara Menjalankan

### Metode Cepat (Windows)
Double-click file `start.bat`

### Manual

**Backend (FastAPI):**
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend (React):**
```bash
cd frontend
npm run dev
```

## Akses

| URL | Deskripsi |
|-----|-----------|
| http://localhost:5173 | Aplikasi Web |
| http://localhost:8000/docs | API Documentation (Swagger) |
| http://localhost:8000/redoc | API Documentation (ReDoc) |

## Akun Demo

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| peneliti | peneliti123 | Peneliti |
| viewer | viewer123 | Viewer |

## Fitur

- **Overview**: KPI cards, mini charts, quick actions
- **EDA**: 6 tab analisis data eksplorasi
- **Pipeline**: Jalankan analisis real-time dengan SSE
- **Analisis**: PSM, DiD, Model ML, SHAP
- **Prediksi**: Form prediksi hasil siswa
- **Kesimpulan**: Narasi otomatis & rekomendasi kebijakan
- **Data**: Upload/download dataset
- **Pengguna**: Manajemen user (admin)

## Stack Teknologi

- **Backend**: Python FastAPI + scikit-learn + SHAP + pandas
- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts
- **Auth**: JWT (24 jam)

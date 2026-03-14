import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { ToastProvider } from './components/Toast.jsx'
import Layout from './components/Layout.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'

// Pages (lazy loaded)
import { lazy, Suspense } from 'react'

const OverviewPage = lazy(() => import('./pages/OverviewPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const EDAPage = lazy(() => import('./pages/EDAPage.jsx'))
const PipelinePage = lazy(() => import('./pages/PipelinePage.jsx'))
const AnalysisPage = lazy(() => import('./pages/AnalysisPage.jsx'))
const PredictPage = lazy(() => import('./pages/PredictPage.jsx'))
const ConclusionPage = lazy(() => import('./pages/ConclusionPage.jsx'))
const DataPage = lazy(() => import('./pages/DataPage.jsx'))
const UsersPage = lazy(() => import('./pages/UsersPage.jsx'))
const SegmentasiPage = lazy(() => import('./pages/SegmentasiPage.jsx'))

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-64 py-20">
      <LoadingSpinner size="lg" label="Memuat halaman..." />
    </div>
  )
}

function ProtectedRoute({ children, adminOnly = false, penelitiOrAbove = false }) {
  const { isAuthenticated, isAdmin, isPenelitiOrAbove, loading } = useAuth()

  if (loading) return <PageFallback />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  if (penelitiOrAbove && !isPenelitiOrAbove) return <Navigate to="/" replace />

  return children
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <LoadingSpinner size="xl" label="Memuat aplikasi..." />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : (
            <Suspense fallback={<PageFallback />}>
              <LoginPage />
            </Suspense>
          )
        }
      />
      <Route
        path="/*"
        element={
          <Layout>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={
  <ProtectedRoute><OverviewPage /></ProtectedRoute>
} />
                <Route path="/eda" element={
                  <ProtectedRoute><EDAPage /></ProtectedRoute>
                } />
                <Route path="/pipeline" element={
                  <ProtectedRoute><PipelinePage /></ProtectedRoute>
                } />
                <Route path="/analysis" element={
                  <ProtectedRoute><AnalysisPage /></ProtectedRoute>
                } />
                <Route path="/predict" element={
                  <ProtectedRoute><PredictPage /></ProtectedRoute>
                } />
                <Route path="/segmentasi" element={
                  <ProtectedRoute><SegmentasiPage /></ProtectedRoute>
                } />
                <Route path="/conclusions" element={
                  <ProtectedRoute><ConclusionPage /></ProtectedRoute>
                } />
                <Route path="/data" element={
                  <ProtectedRoute penelitiOrAbove><DataPage /></ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

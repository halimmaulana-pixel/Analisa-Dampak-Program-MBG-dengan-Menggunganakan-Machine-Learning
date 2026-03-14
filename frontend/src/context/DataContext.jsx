import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { data as dataApi } from '../api/index.js'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [dataSource, setDataSource] = useState('dummy') // 'dummy' | 'real'
  const [dataStatus, setDataStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const response = await dataApi.getStatus()
      const status = response.data
      setDataStatus(status)
      setDataSource(status.source || 'dummy')
    } catch {
      // Fallback to dummy if API not available
      setDataSource('dummy')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus, refreshTrigger])

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const isRealData = dataSource === 'real'
  const isDemoData = dataSource === 'dummy'

  return (
    <DataContext.Provider value={{
      dataSource,
      dataStatus,
      loading,
      isRealData,
      isDemoData,
      refreshTrigger,
      triggerRefresh,
      fetchStatus
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

export default DataContext

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mbg_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mbg_token')
      localStorage.removeItem('mbg_user')
      window.location.href = '/login'
    }
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Terjadi kesalahan'
    return Promise.reject(new Error(message))
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const auth = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),

  logout: () =>
    api.post('/auth/logout'),

  me: () =>
    api.get('/auth/me'),

  getUsers: () =>
    api.get('/auth/users'),

  register: (data) =>
    api.post('/auth/register', data),

  updateRole: (username, role) =>
    api.put(`/auth/users/${username}/role`, { role })
}

// ─── Data ────────────────────────────────────────────────────────────────────
export const data = {
  getStatus: () =>
    api.get('/data/status'),

  getDummy: () =>
    api.get('/dataset/dummy'),

  uploadDataset: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/dataset/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  getTemplate: () =>
    api.get('/dataset/template')
}

// ─── EDA ─────────────────────────────────────────────────────────────────────
export const eda = {
  getSummary: () =>
    api.get('/eda/summary'),

  getDistribution: () =>
    api.get('/eda/distribution'),

  getBoxplot: () =>
    api.get('/eda/boxplot'),

  getCorrelation: () =>
    api.get('/eda/correlation'),

  getTreatmentDist: () =>
    api.get('/eda/treatment_dist'),

  getDataset: (page = 1, pageSize = 10, search = '', filters = {}) =>
    api.get('/eda/dataset', {
      params: { page, page_size: pageSize, search, ...filters }
    })
}

// ─── PSM ─────────────────────────────────────────────────────────────────────
export const psm = {
  getSummary: () =>
    api.get('/psm/summary')
}

// ─── DiD ─────────────────────────────────────────────────────────────────────
export const did = {
  getResult: () =>
    api.get('/did/result'),

  getBySubject: () =>
    api.get('/did/by-subject'),

  getParallelTrends: () =>
    api.get('/did/parallel-trends')
}

// ─── Model ───────────────────────────────────────────────────────────────────
export const model = {
  getMetrics: () =>
    api.get('/model/metrics'),

  getLearningCurve: () =>
    api.get('/model/learning-curve'),

  getRobustness: () =>
    api.get('/model/robustness'),

  predict: (inputData) =>
    api.post('/model/predict', inputData)
}

// ─── SHAP ────────────────────────────────────────────────────────────────────
export const shap = {
  getGlobal: () =>
    api.get('/shap/global'),

  getLocal: (studentId) =>
    api.get('/shap/local', { params: { student_id: studentId } }),

  getBeeswarm: () =>
    api.get('/shap/beeswarm'),

  getDependence: () =>
    api.get('/shap/dependence')
}

// ─── Segmentation ────────────────────────────────────────────────────────────
export const segmentation = {
  getAll: (page = 1, pageSize = 20, search = '', predictionFilter = '', schoolFilter = '') =>
    api.get('/segmentation', {
      params: { page, page_size: pageSize, search, prediction_filter: predictionFilter, school_filter: schoolFilter }
    })
}

// ─── Pipeline ────────────────────────────────────────────────────────────────
export const pipeline = {
  run: () =>
    api.post('/pipeline/run'),

  cancel: (runId) =>
    api.post(`/pipeline/cancel/${runId}`),

  getStatus: (runId) =>
    api.get(`/pipeline/status/${runId}`)
}

// ─── Conclusion ──────────────────────────────────────────────────────────────
export const conclusion = {
  getNarrative: () =>
    api.get('/conclusion/narrative'),

  getSummary: () =>
    api.get('/conclusion/summary')
}

export default api

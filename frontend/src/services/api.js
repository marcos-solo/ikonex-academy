import axios from 'axios';

// Use different URLs for development and production
const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://ikonex-academy-1.onrender.com/api'
    : 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Streams API
export const streamAPI = {
    getAll: () => api.get('/streams'),
    getById: (id) => api.get(`/streams/${id}`),
    create: (data) => api.post('/streams', data),
    update: (id, data) => api.put(`/streams/${id}`, data),
    delete: (id) => api.delete(`/streams/${id}`),
};

// Students API
export const studentAPI = {
    getAll: () => api.get('/students'),
    getByStream: (streamId) => api.get(`/students/stream/${streamId}`),
    getById: (id) => api.get(`/students/${id}`),
    create: (data) => api.post('/students', data),
    update: (id, data) => api.put(`/students/${id}`, data),
    delete: (id) => api.delete(`/students/${id}`),
};

// Subjects API
export const subjectAPI = {
    getAll: () => api.get('/subjects'),
    getByStream: (streamId) => api.get(`/subjects/stream/${streamId}`),
    create: (data) => api.post('/subjects', data),
    update: (id, data) => api.put(`/subjects/${id}`, data),
    delete: (id) => api.delete(`/subjects/${id}`),
    assignToStream: (data) => api.post('/subjects/assign-to-stream', data),
    removeFromStream: (streamId, subjectId) => api.delete(`/subjects/remove-from-stream/${streamId}/${subjectId}`),
};

// Scores API
export const scoreAPI = {
    create: (data) => api.post('/scores', data),
    getStudentScores: (studentId) => api.get(`/scores/student/${studentId}`),
    getClassRanking: (streamId) => api.get(`/scores/class-ranking/${streamId}`),
    getStudentSummary: (studentId) => api.get(`/scores/student-summary/${studentId}`),
    getClassPerformance: (streamId, subjectId) => api.get(`/scores/class-performance/${streamId}/${subjectId}`),
};

export default api;
import axios from 'axios'

export const api = axios.create({
    baseURL: 'http://localhost:5047',
})

api.interceptors.request.use((config) => {
    const stored = localStorage.getItem('auth')
    if (stored) {
        const auth = JSON.parse(stored)
        config.headers.Authorization = `Bearer ${auth.token}`
    }
    return config
})
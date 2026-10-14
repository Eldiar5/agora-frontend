import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import type { TokenResponse } from "@/types"

const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
})

// Переменные для механизма обновления токена
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

// Request interceptor - подставляет Access токен
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("accessToken")
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error),
)

// Response interceptor - обрабатывает 401 и обновляет токены
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Если получили 401 и запрос еще не повторялся
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {

            // Если 401 прилетел от самого эндпоинта /refresh - значит refresh токен мертв.
            // Делаем жесткий логаут.
            if (originalRequest.url?.includes("/auth/refresh")) {
                localStorage.removeItem("accessToken")
                localStorage.removeItem("refreshToken")
                localStorage.removeItem("userLogin")
                window.location.href = "/login"
                return Promise.reject(error)
            }

            if (isRefreshing) {
                // Если уже идет процесс обновления, ставим запросы в очередь
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject })
                })
                    .then(token => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`
                        }
                        return api(originalRequest)
                    })
                    .catch(err => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            const refreshToken = localStorage.getItem("refreshToken")

            if (!refreshToken) {
                localStorage.removeItem("accessToken")
                localStorage.removeItem("userLogin")
                window.location.href = "/login"
                return Promise.reject(error)
            }

            try {
                // ВАЖНО: используем чистый axios, а не наш api инстанс, чтобы избежать бесконечного цикла интерсепторов
                const { data } = await axios.post<TokenResponse>("/api/v1/auth/refresh", null, {
                    headers: { "Refresh-Token": refreshToken }
                })

                // Сохраняем новые токены
                localStorage.setItem("accessToken", data.accessToken)
                localStorage.setItem("refreshToken", data.refreshToken)

                // Подставляем новый токен в заголовок упавшего запроса
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
                }

                // Пропускаем все зависшие запросы
                processQueue(null, data.accessToken)

                // Повторяем оригинальный запрос
                return api(originalRequest)

            } catch (refreshError) {
                // Если обновить токен не удалось (например, он истек)
                processQueue(refreshError as AxiosError, null)
                localStorage.removeItem("accessToken")
                localStorage.removeItem("refreshToken")
                localStorage.removeItem("userLogin")
                window.location.href = "/login"
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        // Обработка 403 (без изменений)
        else if (error.response?.status === 403) {
            const event = new CustomEvent("show-toast", {
                detail: { message: "No permissions", type: "error" },
            })
            window.dispatchEvent(event)
        }

        return Promise.reject(error)
    },
)

export default api

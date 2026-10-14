import api from "@/lib/axios"
import type { LoginResponse } from "@/types"

export type UserType = "PERSON" | "ORGANIZATION"

export interface PersonRegistrationPayload {
  login: string
  password: string
  userType: "PERSON"
  name: string
  surname: string
  dateOfBirth: string // YYYY-MM-DD format
}

export interface OrganizationRegistrationPayload {
  login: string
  password: string
  userType: "ORGANIZATION"
  title: string
  specialization: string
  dateOfFoundation: string // YYYY-MM-DD format
}

export type RegistrationPayload = PersonRegistrationPayload | OrganizationRegistrationPayload

export const authService = {
  async login(login: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login", {
      login,
      password,
    })
    return response.data
  },

  async register(payload: RegistrationPayload): Promise<LoginResponse> {
    // === ПРЕОБРАЗОВАНИЕ ДАННЫХ ДЛЯ БЭКЕНДА ===

    // 1. Маппинг типа пользователя в Integer (0 или 1)
    const userTypeInt = payload.userType === "PERSON" ? 0 : 1;

    // 2. Формируем тело запроса так, как ждет DTO на Java
    const requestBody: any = {
      login: payload.login,
      password: payload.password,
      userType: userTypeInt,
    };

    if (payload.userType === "PERSON") {
      // Меняем surname -> lastName, dateOfBirth -> birthDate
      requestBody.name = payload.name;
      requestBody.lastName = payload.surname;
      requestBody.birthDate = payload.dateOfBirth;
    } else {
      requestBody.title = payload.title;
      requestBody.specialization = payload.specialization;
      requestBody.dateOfFoundation = payload.dateOfFoundation;
    }

    // 3. Исправленный URL (убрали /auth)
    const response = await api.post<LoginResponse>("/register", requestBody)
    return response.data

  },

  logout() {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("userLogin")
  },

  getAccessToken(): string | null {
    return localStorage.getItem("accessToken")
  },

  getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken")
  },

  getUserLogin(): string | null {
    return localStorage.getItem("userLogin")
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  },

  saveAuth(accessToken: string, refreshToken: string, login: string) {
    localStorage.setItem("accessToken", accessToken)
    localStorage.setItem("refreshToken", refreshToken)
    localStorage.setItem("userLogin", login)
  },
}

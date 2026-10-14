import api from "@/lib/axios"

export interface UserInfo {
    id: number
    login: string
    avatarUrl?: string

    name?: string
    lastName?: string
    birthDate?: string

    title?: string
    specialization?: string
    dateOfFoundation?: string

    followersCount?: number
    followingCount?: number
}

export const usersService = {
    async getByLogin(login: string): Promise<UserInfo> {
        const response = await api.get<UserInfo>("/info/by-login", {
            params: { login },
        })
        return response.data
    },

    async getMe(): Promise<UserInfo> {
        const response = await api.get<UserInfo>("/info/my")
        return response.data
    },

    async search(query: string): Promise<UserInfo[]> {
        if (!query) return []
        const response = await api.get<UserInfo[]>("/info/search", {
            params: { query }
        })
        return response.data
    },

    async uploadAvatar(file: File): Promise<UserInfo> {
        const formData = new FormData()
        formData.append("file", file)

        // Отправляем на наш новый эндпоинт в UserController
        const response = await api.put<UserInfo>("/user/avatar", formData, {
            headers: { "Content-Type": undefined },
        })
        return response.data
    },
}
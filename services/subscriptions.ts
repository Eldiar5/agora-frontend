import api from "@/lib/axios"

export const subscriptionsService = {
    async subscribe(userId: number): Promise<void> {
        await api.post(`/subscription/subscribe/${userId}`)
    },

    async unsubscribe(userId: number): Promise<void> {
        await api.post(`/subscription/unsubscribe/${userId}`)
    },

    async checkIsFollowing(userId: number): Promise<boolean> {
        const response = await api.get<boolean>(`/subscription/check/${userId}`)
        return response.data
    }
}
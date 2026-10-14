import api from "@/lib/axios"

export const likesService = {
    /**
     * Ставит лайк посту.
     * Бекенд ожидает POST /api/v1/likes/{postId}
     * Заголовки X-User-Id проставит Gateway.
     */
    async addLike(postId: number): Promise<void> {
        await api.post(`/likes/${postId}`)
    },

    /**
     * Удаляет лайк с поста.
     * Бекенд ожидает DELETE /api/v1/likes/{postId}
     */
    async removeLike(postId: number): Promise<void> {
        await api.delete(`/likes/${postId}`)
    },
}

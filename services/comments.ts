import api from "@/lib/axios"
import type { Comment, CreateCommentDTO } from "@/types"

export const commentsService = {
  async getByPostId(postId: number): Promise<Comment[]> {
    const response = await api.get<Comment[]>(`/comments/post/${postId}`)
    return response.data
  },

  async create(data: CreateCommentDTO): Promise<Comment> {
    const response = await api.post<Comment>(
        "/comments",
        { text: data.text }, // Тело запроса (соответствует CommentRequestDto)
        {
          params: { postId: data.postId } // Query параметры (соответствует @RequestParam)
        }
    )
    return response.data
  },

  async delete(id: number, postId: number): Promise<void> {
    await api.delete(`/comments/${id}?postId=${postId}`)
  },
}

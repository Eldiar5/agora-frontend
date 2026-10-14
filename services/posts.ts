import api from "@/lib/axios"
import type { Post } from "@/types"

// Добавляем интерфейс для создания
export interface CreatePostPayload {
  topic: string
  text: string
  tags: string[]
  imageUrl?: string
}

export const postsService = {
  async getAll(): Promise<Post[]> {
    const response = await api.get("/post/all")
    console.log("Posts API response:", response.data)
    // Handle both array response and nested object response
    const data = response.data
    if (Array.isArray(data)) {
      return data
    }
    // If response is an object with posts/data/content array, extract it
    if (data && typeof data === "object") {
      if (Array.isArray(data.posts)) return data.posts
      if (Array.isArray(data.data)) return data.data
      if (Array.isArray(data.content)) return data.content
    }
    return []
  },

  async getById(id: number): Promise<Post> {
    const response = await api.get<Post>(`/post/by-postId/${id}`)
    console.log("Single post API response:", response.data)
    return response.data
  },

  async getByLogin(login: string): Promise<Post[]> {
    const response = await api.get("/post/by-login", {
      params: { login },
    })
    const data = response.data
    // Стандартная проверка, так как формат может быть разным
    if (Array.isArray(data)) return data
    if (data && typeof data === "object") {
      if (Array.isArray(data.posts)) return data.posts
      if (Array.isArray(data.content)) return data.content
    }
    return []
  },

  async getFeed(): Promise<Post[]> {
    const response = await api.get("/post/feed")
    const data = response.data
    if (Array.isArray(data)) return data
    if (data && typeof data === "object") {
      if (Array.isArray(data.posts)) return data.posts
      if (Array.isArray(data.content)) return data.content
    }
    return []
  },

  // === МЕТОД СОЗДАНИЯ ПОСТА ===
  async create(payload: CreatePostPayload): Promise<Post> {
    const response = await api.post<Post>("/post/create", payload)
    return response.data
  },

  async delete(postId: number): Promise<void> {
    await api.delete(`/post/${postId}`)
  },

}

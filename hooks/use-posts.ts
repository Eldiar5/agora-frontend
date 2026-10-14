"use client"

import { useQuery } from "@tanstack/react-query"
import { postsService } from "@/services/posts"

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: postsService.getAll,
  })
}

export function usePost(id: number) {
  return useQuery({
    queryKey: ["post", id],
    queryFn: () => postsService.getById(id),
    enabled: !!id,
  })
}

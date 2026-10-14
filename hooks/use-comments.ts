"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { commentsService } from "@/services/comments"
import { toast } from "sonner"

export function useComments(postId: number) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => commentsService.getByPostId(postId),
    enabled: !!postId,
  })
}

export function useCreateComment(postId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (text: string) => commentsService.create({ text, postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] })
      toast.success("Comment posted successfully!")
    },
    onError: () => {
      toast.error("Failed to post comment")
    },
  })
}

export function useDeleteComment(postId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: number) => commentsService.delete(commentId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] })
      toast.success("Comment deleted")
    },
    onError: (error: Error & { response?: { status: number } }) => {
      if (error.response?.status === 404) {
        toast.error("Comment not found")
      } else if (error.response?.status === 403) {
        toast.error("No permissions to delete this comment")
      } else {
        toast.error("Failed to delete comment")
      }
    },
  })
}

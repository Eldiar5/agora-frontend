"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import type { Post } from "@/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { likesService } from "@/services/likes"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()

  const toggleLikeMutation = useMutation({
    // ИСПРАВЛЕНИЕ: Логика toggle теперь здесь
    mutationFn: () => {
      return post.isLiked
          ? likesService.removeLike(post.postId)
          : likesService.addLike(post.postId)
    },
    onMutate: async () => {
      if (!isAuthenticated) return

      await queryClient.cancelQueries({ queryKey: ["posts"] })
      const previousPosts = queryClient.getQueryData(["posts"])

      queryClient.setQueryData(["posts"], (old: Post[] | undefined) => {
        if (!old) return []
        return old.map((p) => {
          if (p.postId === post.postId) {
            return {
              ...p,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
              isLiked: !p.isLiked,
            }
          }
          return p
        })
      })

      return { previousPosts }
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["posts"], context?.previousPosts)
      toast.error("Failed to update like")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
    },
  })

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to like posts")
      return
    }
    toggleLikeMutation.mutate()
  }

  return (
      <Card className="border-muted transition-colors hover:bg-muted/10">
        <CardHeader className="flex-row gap-4 items-center space-y-0 pb-4">
          <Link href={`/profile/${post.authorLogin}`}>
            <Avatar className="h-10 w-10 cursor-pointer transition-opacity hover:opacity-80 border">
              {/* Если есть реальный аватар - берем его, иначе - генерируем */}
              <AvatarImage
                  src={post.authorAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorLogin}`}
                  className="object-cover"
              />
              <AvatarFallback>{post.authorLogin[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex justify-between items-center flex-1">
            <div>
              <Link href={`/profile/${post.authorLogin}`} className="font-semibold hover:underline underline-offset-4">
                @{post.authorLogin}
              </Link>
              {/* ИСПРАВЛЕНИЕ: Закрывающий тег теперь </p> */}
              <p className="text-xs text-muted-foreground leading-none mt-1">
                {formatDistanceToNow(new Date(post.createdAt.endsWith("Z") ? post.createdAt : `${post.createdAt}Z`), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3 space-y-4">
          {/* Topic */}
          <Link href={`/post/${post.postId}`} className="block hover:underline underline-offset-4">
            <h3 className="text-xl font-bold text-balance">{post.topic}</h3>
          </Link>

          {/* === ОТОБРАЖЕНИЕ КАРТИНКИ === */}
          {post.imageUrl && (
              <div className="rounded-xl overflow-hidden border bg-muted/30 shadow-sm">
                <img
                    src={post.imageUrl}
                    alt={`Image for ${post.topic}`}
                    className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.005] transition-transform duration-300"
                    loading="lazy"
                />
              </div>
          )}

          {/* Text Content */}
          <div
              className="text-muted-foreground whitespace-pre-wrap break-words text-[15px] leading-relaxed cursor-pointer"
              onClick={() => (window.location.href = `/post/${post.postId}`)}
          >
            {post.text.length > 300 ? (
                <>
                  {post.text.slice(0, 300)}...
                  <span className="text-primary font-medium ml-1 hover:underline">Read more</span>
                </>
            ) : (
                post.text
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 font-normal text-muted-foreground hover:text-foreground transition-colors">
                      #{tag}
                    </Badge>
                ))}
              </div>
          )}
        </CardContent>

        {/* Actions Footer */}
        <CardFooter className="border-t pt-3 pb-3 text-muted-foreground">
          <div className="flex gap-4 w-full">
            <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 rounded-full px-3 hover:text-red-500 hover:bg-red-500/10 transition-colors ${
                    post.isLiked ? "text-red-500 font-medium" : ""
                }`}
                onClick={handleLike}
            >
              <Heart className={`h-[18px] w-[18px] ${post.isLiked ? "fill-current" : ""}`} />
              <span className="text-sm tabular-nums">{post.likesCount}</span>
            </Button>

            <Link href={`/post/${post.postId}`} className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 rounded-full px-3 hover:text-blue-500 hover:bg-blue-500/10 transition-colors">
                <MessageCircle className="h-[18px] w-[18px]" />
                <span className="text-sm tabular-nums">{post.comments?.length || 0}</span>
              </Button>
            </Link>

            <Button variant="ghost" size="sm" className="flex items-center gap-2 rounded-full px-3 ml-auto hover:text-primary hover:bg-primary/10 transition-colors">
              <Share2 className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </CardFooter>
      </Card>
  )
}
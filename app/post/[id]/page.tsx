"use client"

import { useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { usePost } from "@/hooks/use-posts"
import { useComments, useCreateComment, useDeleteComment } from "@/hooks/use-comments"
import { CommentItem } from "@/components/comment-item"
import { CommentForm } from "@/components/comment-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // <--- Добавлен импорт
import { ArrowLeft, Heart, MessageCircle, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PostPageProps {
  params: Promise<{ id: string }>
}

export default function PostPage({ params }: PostPageProps) {
  const { id } = use(params)
  const postId = Number.parseInt(id, 10)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const { data: post, isLoading: postLoading, error: postError } = usePost(postId)
  const { data: comments, isLoading: commentsLoading } = useComments(postId)
  const createComment = useCreateComment(postId)
  const deleteComment = useDeleteComment(postId)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  if (authLoading) {
    return <PostSkeleton />
  }

  if (!isAuthenticated) {
    return null
  }

  if (postLoading) {
    return <PostSkeleton />
  }

  if (postError || !post) {
    return (
        <div className="container max-w-2xl py-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Post not found</h2>
            <p className="text-muted-foreground mb-4">
              The post you{"'"}re looking for doesn{"'"}t exist or was deleted.
            </p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Feed
              </Button>
            </Link>
          </div>
        </div>
    )
  }

  const timeValue = post.createdAt.endsWith("Z") ? post.createdAt : `${post.createdAt}Z`

  const formattedDate = formatDistanceToNow(new Date(timeValue), {
    addSuffix: true,
  })

  const handleCreateComment = (text: string) => {
    createComment.mutate(text)
  }

  const handleDeleteComment = (commentId: number) => {
    deleteComment.mutate(commentId)
  }

  return (
      <div className="container max-w-2xl py-8">
        <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Link>

        <Card className="mb-8 border-muted shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              {/* АВАТАРКА С ССЫЛКОЙ НА ПРОФИЛЬ */}
              <Link href={`/profile/${post.authorLogin}`}>
                <Avatar className="h-12 w-12 border cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage
                      src={post.authorAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorLogin}`}
                      className="object-cover"
                  />
                  <AvatarFallback>{post.authorLogin[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>

              <div>
                <Link href={`/profile/${post.authorLogin}`} className="font-medium hover:underline underline-offset-4 text-lg">
                  @{post.authorLogin}
                </Link>
                <p className="text-sm text-muted-foreground leading-none mt-1">{formattedDate}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <h1 className="text-2xl font-bold text-balance">{post.topic}</h1>

            {/* === ОТОБРАЖЕНИЕ КАРТИНКИ (Если есть) === */}
            {post.imageUrl && (
                <div className="rounded-xl overflow-hidden border bg-muted/30">
                  <img
                      src={post.imageUrl}
                      alt={post.topic}
                      className="w-full h-auto max-h-[600px] object-contain"
                  />
                </div>
            )}

            <p className="text-foreground leading-relaxed whitespace-pre-wrap text-lg">{post.text}</p>

            {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="px-2 py-1 text-sm">
                        #{tag}
                      </Badge>
                  ))}
                </div>
            )}

            <div className="flex items-center gap-6 pt-6 border-t text-muted-foreground mt-4">
              <div className="flex items-center gap-2">
                <Heart className={`h-5 w-5 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                <span>{post.likesCount} likes</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span>{comments?.length || 0} comments</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Add a comment</h2>
            <CommentForm onSubmit={handleCreateComment} isSubmitting={createComment.isPending} />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Comments ({comments?.length || 0})</h2>
            {commentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                  ))}
                </div>
            ) : comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                      <CommentItem
                          key={comment.id}
                          comment={comment}
                          onDelete={handleDeleteComment}
                          isDeleting={deleteComment.isPending}
                      />
                  ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-12 bg-muted/10 rounded-xl border border-dashed">
                  No comments yet. Be the first to start the discussion!
                </p>
            )}
          </div>
        </div>
      </div>
  )
}

function PostSkeleton() {
  return (
      <div className="container max-w-2xl py-8">
        <Skeleton className="h-4 w-24 mb-6" />
        <div className="rounded-lg border p-6 space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-48 w-full rounded-xl" /> {/* Placeholder под картинку */}
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
  )
}
"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Comment } from "@/types"
import { useAuth } from "@/contexts/auth-context"

interface CommentItemProps {
  comment: Comment
  onDelete: (commentId: number) => void
  isDeleting: boolean
}

export function CommentItem({ comment, onDelete, isDeleting }: CommentItemProps) {
  const { userLogin } = useAuth()
  const isOwner = userLogin === comment.authorLogin

  // FIX: Время комментария
  const timeValue = comment.createdAt.endsWith("Z") ? comment.createdAt : `${comment.createdAt}Z`

  return (
      <div className="flex gap-3 p-4 rounded-xl bg-card border shadow-sm transition-colors hover:bg-muted/30">
        {/* АВАТАРКА */}
        <Link href={`/profile/${comment.authorLogin}`} className="shrink-0">
          <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity border">
            <AvatarImage
                src={comment.authorAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorLogin}`}
            />
            <AvatarFallback>{comment.authorLogin[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* ИМЯ АВТОРА */}
              <Link
                  href={`/profile/${comment.authorLogin}`}
                  className="font-semibold text-sm hover:underline underline-offset-4"
              >
                @{comment.authorLogin}
              </Link>

              <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(timeValue), { addSuffix: true })}
            </span>
            </div>

            {/* Кнопка удаления (только для автора) */}
            {isOwner && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive -mr-2"
                    onClick={() => onDelete(comment.id)}
                    disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
            )}
          </div>

          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {comment.text}
          </p>
        </div>
      </div>
  )
}
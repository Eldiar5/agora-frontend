"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

interface CommentFormProps {
  onSubmit: (text: string) => void
  isSubmitting: boolean
}

export function CommentForm({ onSubmit, isSubmitting }: CommentFormProps) {
  const [text, setText] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSubmit(text.trim())
      setText("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Write a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[100px] resize-none"
        disabled={isSubmitting}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={!text.trim() || isSubmitting}>
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  )
}

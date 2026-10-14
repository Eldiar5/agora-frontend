"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { postsService, type CreatePostPayload } from "@/services/posts"
import { imagesService } from "@/services/images"
import { usersService } from "@/services/users" // Импорт сервиса пользователей
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Image as ImageIcon, Send, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import Image from "next/image"

// Схема валидации
const postSchema = z.object({
    topic: z.string().min(3, "Topic must be at least 3 characters").max(100),
    text: z.string().min(10, "Text must be at least 10 characters"),
})

type PostFormData = z.infer<typeof postSchema>

export function CreatePostForm() {
    const { userLogin } = useAuth()
    const queryClient = useQueryClient()

    // 1. Подгружаем инфо о текущем пользователе, чтобы взять актуальную аватарку
    const { data: userInfo } = useQuery({
        queryKey: ["user", userLogin],
        queryFn: () => usersService.getByLogin(userLogin || ""),
        enabled: !!userLogin, // Запрос только если мы залогинены
        staleTime: 1000 * 60 * 5 // Кэшируем на 5 минут
    })

    // Состояние для тегов
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")

    // Состояние для картинок
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
    })

    const createPostMutation = useMutation({
        mutationFn: async (data: PostFormData) => {
            let imageUrl = ""

            // Если файл выбран, грузим его
            if (selectedFile) {
                try {
                    imageUrl = await imagesService.upload(selectedFile)
                } catch (error) {
                    console.error("Image upload failed", error)
                    throw new Error("Failed to upload image")
                }
            }

            // Создаем пост
            const payload: CreatePostPayload = {
                topic: data.topic,
                text: data.text,
                tags: tags,
                imageUrl: imageUrl || undefined,
            }

            return postsService.create(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] })
            toast.success("Post published successfully!")

            // Полная очистка формы
            reset()
            setTags([])
            clearFile()
        },
        onError: () => {
            toast.error("Failed to publish post")
        },
    })

    const onSubmit = (data: PostFormData) => {
        createPostMutation.mutate(data)
    }

    // --- Логика тегов ---
    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            const newTag = tagInput.trim().replace(/^#/, "")
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag])
                setTagInput("")
            }
        }
    }

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove))
    }

    // --- Логика файлов ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const clearFile = () => {
        setSelectedFile(null)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    return (
        <Card className="mb-6 border-muted bg-card/50">
            <CardContent className="pt-6">
                <div className="flex gap-4">
                    {/* АВАТАРКА ТЕПЕРЬ ПОДГРУЖАЕТСЯ ИЗ ПРОФИЛЯ */}
                    <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage
                            src={userInfo?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userLogin}`}
                            className="object-cover"
                        />
                        <AvatarFallback>{userLogin?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="What's on your mind? (Topic)"
                                {...register("topic")}
                                className="bg-background border-none shadow-none text-lg font-semibold px-0 focus-visible:ring-0"
                            />
                            {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}

                            <Textarea
                                placeholder="Share your story..."
                                {...register("text")}
                                className="min-h-[100px] resize-none bg-background border-none shadow-none px-0 focus-visible:ring-0 text-base"
                            />
                            {errors.text && <p className="text-sm text-destructive">{errors.text.message}</p>}
                        </div>

                        {/* ПРЕВЬЮ КАРТИНКИ */}
                        {previewUrl && (
                            <div className="relative mt-2 rounded-lg overflow-hidden border max-h-[300px] w-fit">
                                <Image
                                    src={previewUrl}
                                    alt="Preview"
                                    width={400}
                                    height={300}
                                    className="object-cover"
                                    unoptimized // Важно для blob: ссылок
                                />
                                <button
                                    type="button"
                                    onClick={clearFile}
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* Теги */}
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="px-2 py-1 gap-1">
                                        #{tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <Input
                                placeholder="Add tags (press Enter)..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="h-8 text-sm bg-muted/30 border-transparent focus-visible:border-primary w-full max-w-xs"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex gap-2 text-muted-foreground">
                                {/* Скрытый инпут */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />

                                {/* Кнопка выбора картинки */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 ${selectedFile ? 'text-primary' : ''}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon className="h-4 w-4" />
                                </Button>
                            </div>

                            <Button type="submit" disabled={createPostMutation.isPending} className="rounded-full px-6">
                                {createPostMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Post
                            </Button>
                        </div>
                    </form>
                </div>
            </CardContent>
        </Card>
    )
}
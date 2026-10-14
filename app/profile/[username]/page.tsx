"use client"

import { use, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { postsService } from "@/services/posts"
import { usersService } from "@/services/users"
import { subscriptionsService } from "@/services/subscriptions"
import { PostCard } from "@/components/post-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, MapPin, ArrowLeft, PlusCircle, Loader2, Camera } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface ProfilePageProps {
    params: Promise<{ username: string }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
    const resolvedParams = use(params)
    const username = decodeURIComponent(resolvedParams.username)

    const { isAuthenticated, isLoading: authLoading, userLogin } = useAuth()
    const router = useRouter()
    const queryClient = useQueryClient()

    // Реф для скрытого инпута файла
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 1. Запрос информации о пользователе
    const { data: userInfo, isLoading: userLoading, error: userError } = useQuery({
        queryKey: ["user", username],
        queryFn: () => usersService.getByLogin(username),
        retry: false,
    })

    // 2. Запрос постов пользователя
    const { data: posts, isLoading: postsLoading } = useQuery({
        queryKey: ["posts", "user", username],
        queryFn: () => postsService.getByLogin(username),
        enabled: !!userInfo,
    })

    // Определяем, мой ли это профиль
    const isMyProfile = userLogin === username

    // 3. Запрос статуса подписки (ТОЛЬКО если это не мой профиль)
    const { data: isFollowing, isLoading: isCheckLoading } = useQuery({
        queryKey: ["isFollowing", userInfo?.id],
        queryFn: () => (userInfo ? subscriptionsService.checkIsFollowing(userInfo.id) : false),
        enabled: !!userInfo && !isMyProfile && isAuthenticated,
    })

    // 4. Мутация Подписки / Отписки
    const toggleFollowMutation = useMutation({
        mutationFn: async () => {
            if (!userInfo) return
            if (isFollowing) {
                await subscriptionsService.unsubscribe(userInfo.id)
            } else {
                await subscriptionsService.subscribe(userInfo.id)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["isFollowing", userInfo?.id] })
            queryClient.invalidateQueries({ queryKey: ["user", username] })
            toast.success(isFollowing ? `Unfollowed @${username}` : `Following @${username}`)
        },
        onError: () => {
            toast.error("Failed to update subscription status")
        },
    })

    // 5. Мутация Загрузки Аватара
    const uploadAvatarMutation = useMutation({
        mutationFn: (file: File) => usersService.uploadAvatar(file),
        onSuccess: (updatedUser) => {
            // Обновляем данные пользователя в кэше, чтобы аватарка сменилась сразу
            queryClient.setQueryData(["user", username], updatedUser)
            toast.success("Avatar updated!")
        },
        onError: () => toast.error("Failed to update avatar"),
    })

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            uploadAvatarMutation.mutate(e.target.files[0])
        }
    }

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login")
        }
    }, [isAuthenticated, authLoading, router])

    if (authLoading || userLoading) return <ProfileSkeleton />
    if (!isAuthenticated) return null

    if (userError) {
        return (
            <div className="container max-w-2xl py-8 text-center">
                <h2 className="text-xl font-bold text-destructive">User not found</h2>
                <Button variant="ghost" onClick={() => router.push("/")} className="mt-4">
                    Go Home
                </Button>
            </div>
        )
    }

    return (
        <div className="container max-w-2xl py-8">
            <Button variant="ghost" className="mb-4 pl-0 gap-2" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                Back
            </Button>

            {/* ШАПКА ПРОФИЛЯ */}
            {userInfo && (
                <div className="bg-card border rounded-xl p-6 mb-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center gap-6">

                        {/* === БЛОК АВАТАРКИ С ЗАГРУЗКОЙ === */}
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                                {/* Логика: Если есть avatarUrl -> показываем его, иначе -> DiceBear */}
                                <AvatarImage
                                    src={userInfo.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                                    className="object-cover"
                                />
                                <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>

                            {/* Оверлей для редактирования (ТОЛЬКО для владельца профиля) */}
                            {isMyProfile && (
                                <>
                                    <div
                                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {uploadAvatarMutation.isPending ? (
                                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        ) : (
                                            <Camera className="h-6 w-6 text-white" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                    />
                                </>
                            )}
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                            <div className="flex items-center justify-center sm:justify-between w-full">
                                <h1 className="text-2xl font-bold">@{userInfo.login}</h1>

                                {/* КНОПКА ПОДПИСКИ (Скрываем на своем профиле) */}
                                {!isMyProfile && (
                                    <Button
                                        variant={isFollowing ? "outline" : "default"}
                                        size="sm"
                                        disabled={isCheckLoading || toggleFollowMutation.isPending}
                                        onClick={() => toggleFollowMutation.mutate()}
                                        className={
                                            isFollowing
                                                ? "text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
                                                : ""
                                        }
                                    >
                                        {toggleFollowMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : isFollowing ? (
                                            "Unfollow"
                                        ) : (
                                            "Follow"
                                        )}
                                    </Button>
                                )}
                            </div>

                            {userInfo.name ? (
                                <p className="text-lg font-medium">
                                    {userInfo.name} {userInfo.lastName}
                                </p>
                            ) : (
                                <p className="text-lg font-medium">{userInfo.title}</p>
                            )}

                            <p className="text-muted-foreground">
                                {userInfo.specialization || "Microservices enthusiast & Java Developer"}
                            </p>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-muted-foreground pt-2">
                                <div className="flex items-center gap-1">
                                    <CalendarDays className="h-4 w-4" />
                                    <span>{userInfo.birthDate || userInfo.dateOfFoundation || "Joined recently"}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>Bishkek, KG</span>
                                </div>
                            </div>

                            <div className="flex justify-center sm:justify-start gap-4 pt-2 font-medium">
                                <div className="flex gap-1">
                                    <span className="text-foreground">{posts?.length || 0}</span>
                                    <span className="text-muted-foreground">Posts</span>
                                </div>

                                <div className="flex gap-1">
                                    <span className="text-foreground">{userInfo.followersCount || 0}</span>
                                    <span className="text-muted-foreground">Followers</span>
                                </div>
                                <div className="flex gap-1">
                                    <span className="text-foreground">{userInfo.followingCount || 0}</span>
                                    <span className="text-muted-foreground">Following</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-xl font-bold mb-4">Posts</h2>

            {/* СПИСОК ПОСТОВ */}
            {postsLoading ? (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-40 w-full rounded-xl" />
                    ))}
                </div>
            ) : posts && posts.length > 0 ? (
                <div className="space-y-6">
                    {posts.map((post) => (
                        <PostCard key={post.postId} post={post} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl flex flex-col items-center gap-4">
                    <p>This user hasn{"'"}t posted anything yet.</p>

                    {isMyProfile && (
                        <Button onClick={() => router.push("/")} variant="outline" className="gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Create your first post
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

function ProfileSkeleton() {
    return (
        <div className="container max-w-2xl py-8">
            <Skeleton className="h-48 w-full rounded-xl mb-6" />
            <Skeleton className="h-40 w-full rounded-xl" />
        </div>
    )
}
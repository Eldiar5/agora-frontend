"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { postsService } from "@/services/posts"
import { PostCard } from "@/components/post-card"
import { CreatePostForm } from "@/components/create-post-form"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Users, Globe } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { UserSearch } from "@/components/user-search"

export default function FeedPage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const router = useRouter()

    // СОСТОЯНИЕ ТАБОВ: 'all' (Общая лента) или 'feed' (Подписки)
    const [activeTab, setActiveTab] = useState<"all" | "feed">("all")

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login")
        }
    }, [isAuthenticated, authLoading, router])

    const {
        data: posts,
        isLoading: postsLoading,
        error
    } = useQuery({
        queryKey: ["posts", activeTab],
        queryFn: () => activeTab === "all" ? postsService.getAll() : postsService.getFeed(),
        enabled: isAuthenticated,
    })

    if (authLoading) return <FeedSkeleton />
    if (!isAuthenticated) return null

    return (
        // 1. Увеличили контейнер до max-w-5xl, чтобы вместить две колонки
        <div className="container max-w-5xl py-8">

            {/* 2. Grid Layout: На мобильных 1 колонка, на Desktop (lg) - 12 колонок */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* === ЛЕВАЯ КОЛОНКА (ФОРМА) === */}
                {/* Занимает 4 из 12 колонок на десктопе */}
                <div className="lg:col-span-5 xl:col-span-4 order-1">
                    {/* Sticky делает так, чтобы форма "прилипала" при скролле ленты */}
                    <div className="sticky top-20">

                        {/* 1. Вставляем поиск СЮДА */}
                        <UserSearch />

                        <CreatePostForm />

                        {/* Сюда можно будет потом добавить блок "Recomendations" или "Trending tags" */}
                    </div>
                </div>

                {/* === ПРАВАЯ КОЛОНКА (ЛЕНТА) === */}
                {/* Занимает 8 из 12 колонок на десктопе */}
                <div className="lg:col-span-7 xl:col-span-8 order-2">

                    {/* ПЕРЕКЛЮЧАТЕЛЬ ТАБОВ */}
                    <div className="flex items-center border-b border-border mb-6">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`flex-1 pb-3 text-center text-sm font-medium transition-colors relative ${
                                activeTab === "all"
                                    ? "text-foreground font-bold"
                                    : "text-muted-foreground hover:text-foreground/80"
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Globe className="h-4 w-4" />
                                Global Feed
                            </div>
                            {activeTab === "all" && (
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab("feed")}
                            className={`flex-1 pb-3 text-center text-sm font-medium transition-colors relative ${
                                activeTab === "feed"
                                    ? "text-foreground font-bold"
                                    : "text-muted-foreground hover:text-foreground/80"
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Users className="h-4 w-4" />
                                Following
                            </div>
                            {activeTab === "feed" && (
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />
                            )}
                        </button>
                    </div>

                    {/* СПИСОК ПОСТОВ */}
                    {postsLoading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex flex-col space-y-3">
                                    <Skeleton className="h-[125px] w-full rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[250px]" />
                                        <Skeleton className="h-4 w-[200px]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <AlertCircle className="h-10 w-10 mb-4 opacity-50" />
                            <p>Failed to load posts.</p>
                            <Button variant="link" onClick={() => window.location.reload()}>Try again</Button>
                        </div>
                    ) : posts && posts.length > 0 ? (
                        <div className="space-y-6">
                            {posts.map((post) => (
                                <PostCard key={post.postId} post={post} />
                            ))}
                        </div>
                    ) : (
                        // EMPTY STATE
                        <div className="text-center py-16 px-4 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                            {activeTab === "feed" ? (
                                <div className="space-y-2">
                                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <h3 className="text-lg font-semibold text-foreground">Your following feed is empty</h3>
                                    <p>You aren't following anyone yet.</p>
                                    <p className="text-sm">Switch to the <b>Global Feed</b> to find interesting people!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Globe className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <p>No posts in the system yet.</p>
                                    <p>Be the first to publish something!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function FeedSkeleton() {
    return (
        <div className="container max-w-5xl py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                </div>
                <div className="lg:col-span-8 space-y-6">
                    <Skeleton className="h-10 w-full mb-6" />
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[150px] w-full rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    )
}
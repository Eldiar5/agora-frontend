"use client"

import { useState } from "react"
import { CheckCheck, Heart, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNotifications } from "@/components/providers/notification-provider"
import Link from "next/link"
import { cn } from "@/lib/utils"

const TorchIcon = ({ isUnread, className }: { isUnread: boolean, className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Рукоять и Чаша */}
            <path d="M14 11.5L12 22L10 11.5" className="text-stone-500 dark:text-stone-400 fill-stone-300 dark:fill-stone-700" />
            <path d="M10 11.5H14" className="text-stone-600" />
            <path d="M9 11.5L9.5 7H14.5L15 11.5" className="text-stone-600 dark:text-stone-500" />

            {/* 🔥 ПЛАМЯ (Синее) */}
            <path
                d="M12 2C12 2 8 6 8 8C8 10.5 10 12 12 12C14 12 16 10.5 16 8C16 6 12 2 12 2Z"
                className={cn(
                    "transition-all duration-500",
                    isUnread
                        ? "text-blue-600 fill-blue-500 animate-pulse drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                        : "text-muted-foreground/40 fill-none"
                )}
            />

            {/* ✨ ВОТ ОНИ, ИСКРЫ (Добавь этот блок перед закрывающим </svg>) */}
            {isUnread && (
                <>
                    <circle cx="10" cy="5" r="0.5" className="fill-cyan-300 animate-ping" style={{ animationDuration: '2s' }} />
                    <circle cx="14" cy="4" r="0.5" className="fill-blue-400 animate-ping" style={{ animationDelay: '0.5s' }} />
                </>
            )}
        </svg>
    )
}

export function NotificationCenter() {
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
    const [isOpen, setIsOpen] = useState(false)

    const getShortTimeAgo = (dateString: string) => {
        if (!dateString) return ""

        const timeValue = dateString.endsWith("Z") ? dateString : `${dateString}Z`
        const date = new Date(timeValue)

        if (isNaN(date.getTime())) return ""

        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return "только что"
        const minutes = Math.floor(diffInSeconds / 60)
        if (minutes < 60) return `${minutes} мин.`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours} ч.`
        const days = Math.floor(hours / 24)
        if (days < 7) return `${days} дн.`
        return `${Math.floor(days / 7)} нед.`
    }

    // Функция для генерации чистого текста в списке
    const getNotificationText = (type: string, message: string) => {
        switch (type) {
            case 'LIKE':
                return 'поставил(а) "нравится" вашей публикации'
            case 'COMMENT':
                return 'прокомментировал(а) вашу публикацию'
            default:
                return message // Для системных сообщений оставляем как есть
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 relative rounded-full hover:bg-accent transition-colors">
                    <TorchIcon isUnread={unreadCount > 0} className="h-7 w-7" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-96 p-0 shadow-xl border-stone-200 dark:border-stone-800" align="end" sideOffset={5}>
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <h4 className="font-semibold text-sm flex items-center gap-2">Уведомления</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto text-xs px-2 text-primary hover:text-primary/80" onClick={markAllRead}>
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Всё прочитано
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-3">
                            <TorchIcon isUnread={false} className="h-12 w-12 text-muted-foreground/10" />
                            <p className="text-sm">Пока нет новых уведомлений</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <Link
                                    key={n.id}
                                    href={`/post/${n.targetId}`}
                                    onClick={() => !n.read && markRead(n.id)}
                                    className={cn(
                                        "relative px-4 py-3 border-b last:border-0 transition-all hover:bg-muted/40 flex gap-3 items-center group",
                                        !n.read ? "bg-orange-50/30 dark:bg-orange-950/10" : "bg-background"
                                    )}
                                >
                                    {/* Аватарка + Бейдж */}
                                    <div className="relative flex-shrink-0">
                                        <Avatar className="h-10 w-10 border border-border/50">
                                            <AvatarImage
                                                src={n.senderAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.senderLogin}`}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="text-[10px] font-bold">
                                                {n.senderLogin.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 rounded-full p-0.5 border-2 border-background flex items-center justify-center h-5 w-5",
                                            n.type === 'LIKE' ? "bg-red-500" : "bg-blue-500"
                                        )}>
                                            {n.type === 'LIKE' ? (
                                                <Heart className="h-2.5 w-2.5 text-white fill-white" />
                                            ) : (
                                                <MessageCircle className="h-2.5 w-2.5 text-white fill-white" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Текст уведомления */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm leading-snug break-words">
                                            <span className="font-semibold hover:underline mr-1">{n.senderLogin}</span>
                                            <span className="text-foreground/80">
                                    {/* 👇 ВОТ ГЛАВНОЕ ИЗМЕНЕНИЕ */}
                                                {getNotificationText(n.type, n.message)}
                                </span>
                                        </p>

                                        <p className="text-xs text-muted-foreground/60 mt-0.5 font-medium">
                                            {getShortTimeAgo(n.timestamp)}
                                        </p>
                                    </div>

                                    {!n.read && (
                                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-orange-500 shadow-sm animate-pulse ml-1" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
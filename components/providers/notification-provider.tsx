"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { Bell, Flame } from "lucide-react"
import { Notification } from "@/types"
import { NotificationService } from "@/services/notifications"

// 1. Создаем контекст, чтобы шарить данные
interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    markRead: (id: number) => void
    markAllRead: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) throw new Error("useNotifications must be used within NotificationProvider")
    return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { token, isAuthenticated } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const clientRef = useRef<Client | null>(null)

    // Вычисляем количество непрочитанных
    const unreadCount = notifications.filter(n => !n.read).length

    // 2. Загружаем историю при входе
    useEffect(() => {
        if (isAuthenticated) {
            NotificationService.getAll()
                .then(data => setNotifications(data))
                .catch(err => console.error("Failed to fetch notifications", err))
        } else {
            setNotifications([])
        }
    }, [isAuthenticated])

    // 3. Логика WebSocket
    useEffect(() => {
        if (!isAuthenticated || !token) return

        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:9000/ws"),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000, // Авто-реконнект

            onConnect: () => {
                console.log("✅ WebSocket Connected (Notification Center)")

                client.subscribe("/user/queue/notifications", (message) => {
                    try {
                        const newNotif = JSON.parse(message.body) as Notification

                        // А. Добавляем в список (сверху)
                        setNotifications(prev => [newNotif, ...prev])

                        // Б. Показываем красивый тост
                        showToast(newNotif)

                    } catch (e) {
                        console.error("Parse error", e)
                    }
                })
            }
        })

        client.activate()
        clientRef.current = client

        return () => {
            if (clientRef.current) clientRef.current.deactivate()
        }
    }, [isAuthenticated, token])

    // 4. Методы управления
    const markRead = async (id: number) => {
        // Оптимистичное обновление интерфейса (сначала меняем стейт, потом шлем запрос)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        try {
            await NotificationService.markAsRead(id)
        } catch (e) {
            console.error("Error marking read", e)
        }
    }

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        try {
            await NotificationService.markAllAsRead()
        } catch (e) {
            console.error("Error marking all read", e)
        }
    }

    const showToast = (n: Notification) => {
        toast(
            <div className="flex flex-col gap-1">
                <p className="font-semibold text-sm">{n.message}</p>
                <p className="text-xs text-muted-foreground">Только что</p>
            </div>,
            {
                // Если лайк - огонек, иначе колокольчик
                icon: n.type === 'LIKE' ? <Flame className="h-5 w-5 text-orange-500" /> : <Bell className="h-5 w-5 text-blue-500" />,
                position: "top-right",
                duration: 4000,
            }
        )
    }

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>
            {children}
        </NotificationContext.Provider>
    )
}
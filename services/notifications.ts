import api from "@/lib/axios"; // Твой настроенный axios instance
import { Notification } from "@/types";

export const NotificationService = {
    // Получить историю
    getAll: async () => {
        const { data } = await api.get<Notification[]>("notifications");
        return data;
    },

    // Пометить одно как прочитанное
    markAsRead: async (id: number) => {
        await api.put(`notifications/${id}/read`);
    },

    // Пометить все (погасить факел)
    markAllAsRead: async () => {
        await api.put("notifications/read-all");
    }
};
import { createContext } from "react";
import { Notification } from "../types/notification-type";

export const NotificationsContext = createContext({
    getUnreadNotifications: <Notification[]>[],
    markAsRead: (id: string) => {},
    sendNotification: (notification: Notification) => {},
});
import { useContext } from "react";

import { NotificationsContext } from "../../../store/notifications-context";
import NotificationsListItem from "./NotificationsListItem/NotificationsListItem";
import { Notification } from "../../../types/notification-type";

export default function NotificationsList() {
    const { unreadNotifications } = useContext(NotificationsContext);

    return (
        <>
            {unreadNotifications.length === 0 && <p>No notifications found</p>}
            {unreadNotifications.length > 0 && unreadNotifications.map((item: Notification) => {
                return (
                    <NotificationsListItem key={item.id} {...item}></NotificationsListItem>
                )
            })}
        </>
    );
}
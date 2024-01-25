import { useContext } from "react";

import { Notification } from "../../../../types/notification-type"
import { NotificationsListItemContainer } from "./NotificationsListItemContainer"
import { NotificationsContext } from "../../../../store/notifications-context";

export default function NotificationsListItem(props: Notification) {

    const { markAsRead } = useContext(NotificationsContext);

    return (
        <NotificationsListItemContainer>
            Id: {props.id} <br />
            Title: {props.title}
            <a href="#" onClick={() => {markAsRead(props.id!)}}>Mark as read</a>
        </NotificationsListItemContainer>
    )
}
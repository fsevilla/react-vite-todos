import { useContext } from "react";
import { TodosContext } from "../../../../store/todos-context";
import { NotificationsContext } from "../../../../store/notifications-context";
import { Todo } from "../../../../types/todo-type";
import { Notification } from "../../../../types/notification-type";

export default function TodoDetails() {

    const { selectedTodo, clearTodo } = useContext(TodosContext);
    const { sendNotification } = useContext(NotificationsContext);

    function setAsFavorite(task: Todo) {
        console.log('Will set this as favorite: ', task);
        const notification: Notification = {
            title: `Selected task ${task.id }as favorite`
        }

        sendNotification(notification);
    }

    return (
        <>
            {selectedTodo.id && <p>Task: {selectedTodo.title}</p>}
            {!selectedTodo.id && <p>Select a task</p>}
            {selectedTodo.id && <>
                <button onClick={() => setAsFavorite(selectedTodo)}>Add to Cart</button>
                <button onClick={clearTodo}>Clear</button>
            </>}
        </>
    )
}
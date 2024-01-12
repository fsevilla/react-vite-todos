import { useContext } from "react";

import { TodosContext } from "../../../../store/todos-context";
import { TodoItemProps } from "./todo-item-props"

export default function TodoItem (props: TodoItemProps) {

    const { todo } = props;
    const { selectTodo } = useContext(TodosContext);

    return (
        <div
            className="heading"
            style={{
                'backgroundColor': props.isOdd ? 'lightgray' : undefined
            }}
            onClick={() => {selectTodo(todo)}}>{todo.title} (assigned to: {todo.user?.name})</div>
    )
}
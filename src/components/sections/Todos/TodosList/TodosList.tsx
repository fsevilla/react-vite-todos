import { Todo } from "../../../../types/todo-type";
import TodoItem from "../TodoItem/TodoItem";
import { TodosListProps } from "./todos-list-props";

export default function TodosList(props: TodosListProps) {
    const { todos } = props;

    return (
        <>
            {todos.map((todo: Todo, idx) => {
                return (
                    <TodoItem key={todo.id} todo={todo} isOdd={idx % 2 === 1} />
                )
            })}
        </>
    )
}
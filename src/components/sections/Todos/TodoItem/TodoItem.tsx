import { useContext } from "react";

import { TodosContext } from "../../../../store/todos-context";
import { TodoItemProps } from "./todo-item-props"
import { TodoItemContainer, NarrowTodoItemContainer } from './TodoItemContainer';


export default function TodoItem (props: TodoItemProps) {

    const { todo } = props;
    const { selectTodo } = useContext(TodosContext);

    return (
        <>
            {props.isOdd && 
                <TodoItemContainer onClick={() => {selectTodo(todo)}}>
                    {todo.title} (assigned to: {todo.user?.name})
                </TodoItemContainer>}

            {!props.isOdd && 
                <NarrowTodoItemContainer onClick={() => {selectTodo(todo)}}>
                    {todo.title} (assigned to: {todo.user?.name})
                </NarrowTodoItemContainer>}
        </>
    )
}
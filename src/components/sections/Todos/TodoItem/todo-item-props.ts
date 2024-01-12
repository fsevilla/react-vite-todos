import { Todo } from "../../../../types/todo-type";

type OnSelectFunction = (item: Todo) => void;

export interface TodoItemProps {
    todo: Todo;
    isOdd: boolean;
    onSelect?: OnSelectFunction;
}
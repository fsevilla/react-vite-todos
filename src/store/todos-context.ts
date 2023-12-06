import { createContext } from "react";
import { Todo } from "../types/todo-type";

export const TodosContext = createContext({
    selectedTodo: <Todo>{},
    selectTodo: (todo: Todo) => {},
    clearTodo: () => {}
});
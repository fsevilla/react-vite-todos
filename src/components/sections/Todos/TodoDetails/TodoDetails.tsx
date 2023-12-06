import { useContext } from "react";
import { TodosContext } from "../../../../store/todos-context";

export default function TodoDetails() {

    const { selectedTodo } = useContext(TodosContext);

    return (
        <>
            {selectedTodo.id && <p>Task: {selectedTodo.title}</p>}
            {!selectedTodo.id && <p>Select a task</p>}
        </>
    )
}
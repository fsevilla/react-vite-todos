// import { useEffect } from "react";
import { useCreateTodoMutation } from "../../../../services/api/todo-api";

import { Todo } from "../../../../types/todo-type";

export default function() {
    // Will hard code the task for now
    const newTodo: Todo = {
        title: 'new task',
        description: 'random new task'
    }

    const [createTodo, { isLoading }] = useCreateTodoMutation();

    // useEffect(() => {
    //     createTodo(newTodo);
    // }, []);

    function handleCreateTodo() {
        console.log('Will create new task', newTodo);
        createTodo(newTodo);
    }

    if(isLoading) {
        return <p>Creating task!!!</p>
    }

    return (
        <>
            <button onClick={handleCreateTodo}>Create Todo</button>
        </>
    )
}
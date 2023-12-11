// import { useEffect } from "react";
import { useCreateTodoMutation } from "../../../../services/api/todo-api";

import { Todo } from "../../../../types/todo-type";

export default function TodoInputs() {
    // Will hard code the task for now
    const newTodo: Todo = {
        title: 'new task',
        description: 'random new task'
    }

    const [createTodo, { data, isLoading, isError }] = useCreateTodoMutation();

    async function handleCreateTodo() {
        console.log('Will create new task', newTodo);
        try {
            await createTodo(newTodo);
        } catch(err) {
            console.error('An error occurred, here it is: ', err);
        }
        
    }


    return (
        <>
            <button onClick={handleCreateTodo}>Create Todo</button>
            {isLoading && <p>Loading...</p>}
            {data && (
                <p>CREATED A TASK!!!! {(data as Todo).title}</p>
            )}
            {isError && (
                <p>Oops!!! Something failed!</p>
            )}
        </>
    )
}
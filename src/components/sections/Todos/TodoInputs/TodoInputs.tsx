// import { useEffect } from "react";
import { createTodo } from "../../../../services/api/new-todo-api";

import { Todo } from "../../../../types/todo-type";

export default function TodoInputs() {
    // Will hard code the task for now
    const newTodo: Todo = {
        title: 'new task',
        description: 'random new task'
    }

    // const { data, isLoading, error, promise: sendCreateTodo } = createTodo();
    const { data, isLoading, error, resubmit } = createTodo();

    async function handleCreateTodo() {
        // console.log('Will create new task', newTodo);
        try {
            await resubmit!({title: 'just checking', description: 'what about now?'});
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
            {error && (
                <p>Oops!!! Something failed!</p>
            )}
        </>
    )
}
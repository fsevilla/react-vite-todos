// import { useEffect } from "react";
import { createTodo } from "../../../../services/api/new-todo-api";

import { Todo } from "../../../../types/todo-type";

export default function TodoInputs() {
    // Will hard code the task for now
    const newTodo: Todo = {
        title: 'new task',
        description: 'random new task'
    }

    // const { data, isFetching, error, promise: sendCreateTodo } = createTodo();
    const [ sendCreateTodo, {data, error, isFetching} ] = createTodo();

    async function handleCreateTodo() {
        // console.log('Will create new task', newTodo);
        try {
            await sendCreateTodo({title: 'just checking', description: 'what about now?'});
        } catch(err) {
            console.error('An error occurred, here it is: ', err);
        }
        
    }


    return (
        <>
            <button onClick={handleCreateTodo}>Create Todo</button>
            {isFetching && <p>Loading...</p>}
            {data && (
                <p>CREATED A TASK!!!! {(data as Todo).title}</p>
            )}
            {error && (
                <p>Oops!!! Something failed!</p>
            )}
        </>
    )
}
// import { useEffect } from "react";
import { createTodo, updateTodo, deleteTodo } from "../../../../services/api/new-todo-api";

import { Todo } from "../../../../types/todo-type";

export default function TodoInputs() {
    // Will hard code the task for now
    const newTodo: Todo = {
        title: 'new task',
        description: 'random new task'
    }

    // const { data, isFetching, error, promise: sendCreateTodo } = createTodo();
    const [ sendCreateTodo, {data, error, isFetching} ] = createTodo();
    const [ sendUpdateTodo ] = updateTodo();
    const [ sendDeleteTodo ] = deleteTodo();

    async function handleCreateTodo() {
        try {
            await sendCreateTodo({title: 'just checking', description: 'what about now?'});
        } catch(err) {
            console.error('An error occurred, here it is: ', err);
        }        
    }

    async function handleUpdateTodo() {
        try {
            const response = await sendUpdateTodo({
                title: 'edited task',
                description: 'lorem ipsum dolor sit amet'
            }, { params: { id: 100 } });
            console.log('Updated task', response);
        } catch(e) {
            console.log('An error occured: ', e);
        }
    }

    async function handleDeleteTodo() {
        try {
            const response = await sendDeleteTodo({params: { id: 10 }});
            console.log('DELETED the task ', response);
        } catch(e) {
            console.log('An error occured when deleting the task: ', e);
        }
    }


    return (
        <>
            <button onClick={handleCreateTodo}>Create Todo</button>
            <button onClick={handleUpdateTodo}>Update Todo</button>
            <button onClick={handleDeleteTodo}>Delete Todo</button>
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
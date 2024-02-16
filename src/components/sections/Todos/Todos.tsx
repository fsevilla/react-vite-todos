import { useEffect, useState } from "react";

import TodoDetails from "./TodoDetails/TodoDetails";
import TodosList from "./TodosList/TodosList";

import { fetchTodos } from "../../../services/api/new-todo-api";

import { TodosContext } from "../../../store/todos-context";
import { Todo } from "../../../types/todo-type";


export default function Todos() {

    const [ getTodos, { isFetching, error, data} ] = fetchTodos({}, { skipInitialRequest: false });

    const [ selectedTodo, setSelectedTodo ] = useState<Todo>({title: ''});


    useEffect(() => {
        sendGetTodosRequest();
    }, []);

    async function sendGetTodosRequest() {
        try {
            const results = getTodos();
            handleDisplayResults(results);
        } catch(e) {
            handleDisplayError(e);
        }
    }

    function handleDisplayResults(todos: any) {
        console.log('What I got: ', todos);
    }

    function handleDisplayError(e: any) {
        console.log('Error? ', e);
    }

    const todosContextValue = {
        selectedTodo,
        selectTodo: setSelectedTodo,
        clearTodo: () => {
            setSelectedTodo({ title: '' });
        }

    }

    return (
        <>
            <TodosContext.Provider value={todosContextValue}>
                {isFetching && <p>Loading...</p>}
                {error && <p>Oops! Something went wrong</p>}
                {data && 
                    <>
                        <TodoDetails></TodoDetails>
                        <TodosList todos={data as Todo[]} />
                    </>
                }

            </TodosContext.Provider>
        </>
    )
}

import { useEffect, useState } from "react";

// import TodoDetails from "./TodoDetails/TodoDetails";
// import TodoInputs from "./TodoInputs/TodoInputs";
import TodosList from "./TodosList/TodosList";

import { fetchTodos } from "../../../services/api/new-todo-api";


// import { TodosContext } from "../../../store/todos-context";
import { Todo } from "../../../types/todo-type";
import { User } from "../../../types/user-type";

type TodoUserResponse = [Todo[], User[]];

export default function Todos() {

    const [ getTodos, { isFetching, error, data} ] = fetchTodos({}, { skipInitialRequest: false });

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

    return (
        <>
            {isFetching && <p>Loading...</p>}
            {error && <p>Oops! Something went wrong</p>}
            {data && <TodosList todos={data as Todo[]} />}
        </>
    )
}

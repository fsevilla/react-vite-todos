import { useEffect, useState } from "react";

import { useFetchUsersQuery } from "../../../services/api/user-api";
import { useFetchTodosQuery } from "../../../services/api/todo-api";

import TodoDetails from "./TodoDetails/TodoDetails";
import TodoInputs from "./TodoInputs/TodoInputs";
import TodosList from "./TodosList/TodosList";

import { TodosContext } from "../../../store/todos-context";
import { Todo } from "../../../types/todo-type";
import { User } from "../../../types/user-type";

// import todos from './todos.json';

export default function Todos() {

    const [selectedTodo, setSelectedTodo] = useState({title: ''});

    const [fullDataTodos, setFullDataTodos] = useState<Todo[]>([]);

    const { data: todos, error: getTodosError, isLoading: isTodosLoading, isFetching: isTodosFetching, refetch: refetchTodos } = useFetchTodosQuery();
    const { data: users, error: getUsersError, isLoading: isUsersLoading, isFetching: isUsersFetching, refetch: refetchUsers } = useFetchUsersQuery();

    useEffect(() => {
        if(users && todos) {
            const usersMap: any = {};
            users.map((user: User) => {
                usersMap[user.id!] = user;
            });

            setFullDataTodos((oldTodos: Todo[]) => {
                return oldTodos.map((todo: Todo) => {
                    return {
                        ...todo, 
                        user: usersMap[todo.userId!]
                    }
                });
            });
        }
    }, [todos, users]);
    
    if(isTodosLoading || isTodosFetching || isUsersLoading || isUsersFetching) {
        return <p>Loading...</p>;
    }

    function getTodos() {
        refetchTodos();
        refetchUsers();
    }

    function handleSelectTodo(item: Todo) {
        setSelectedTodo(item);
    }

    function handleClearTodo() {
        setSelectedTodo({title: ''});
    }

    const todosContextValue = {
        selectedTodo: selectedTodo,
        selectTodo: handleSelectTodo,
        clearTodo: handleClearTodo
    };

    return (
        <>
            {(getTodosError || getUsersError) && <p>Oops! Something failed. Try again!</p>}
            {fullDataTodos && (
                <>
                    <TodosContext.Provider value={todosContextValue}>
                        <TodoInputs />
                        <hr />
                        <button onClick={getTodos}>Reload</button>
                        <TodoDetails />
                        <TodosList todos={fullDataTodos} />
                    </TodosContext.Provider>
                </>
            )}
        </>

    )
}

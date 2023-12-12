import { useEffect, useState } from "react";

// import { useFetchTodosQuery } from "../../../services/api/todo-api";
// import { useFetchUsersQuery } from "../../../services/api/user-api";
import { fetchItems } from "../../../services/api/new-todo-api";
import { TodosContext } from "../../../store/todos-context";
import { Todo } from "../../../types/todo-type";
// import { User } from "../../../types/user-type";

import TodoDetails from "./TodoDetails/TodoDetails";
import TodoInputs from "./TodoInputs/TodoInputs";
import TodosList from "./TodosList/TodosList";

// import todos from './todos.json';

export default function Todos() {

    const [selectedTodo, setSelectedTodo] = useState({title: ''});
    const [fullDataTodos, setFullDataTodos] = useState<Todo[]>([]);
    const [skipFetch, setSkipFetch] = useState(false);

    // const { data: todos, isFetching: isFetchingTodos, error: getTodosError, refetch: refetchTodos } = useFetchTodosQuery({}, {skip: skipFetch});
    // const { data: users, isFetching: isFetchingUsers, error: getUsersError, refetch: refetchUsers } = useFetchUsersQuery({}, {skip: skipFetch});
    const { data: todos, isLoading, error, refetch } = fetchItems({skipInitialRequest: false});

    useEffect(() => {
        // if(users && todos) {
        //     const usersMap: any = {};
        //     (users as User[]).map((user) => {
        //         usersMap[user.id!] = user;
        //     });

        //     setFullDataTodos(() => {
        //         return (todos as Todo[]).map((todo) => {
        //             return {
        //                 ...todo, 
        //                 user: usersMap[todo.userId!]
        //             }
        //         });
        //     });
        // }
    }, []);


    function getTodos() {
        setSkipFetch(() => false);
        try {
            refetch!();
            // refetchTodos();
            // refetchUsers();
        } catch(e) {}
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
            {/* {(getTodosError || getUsersError) && <p>Oops! Something failed. Try again!</p>} */}
            {error && <p>Failed to retrieve tasks!!!</p>}
            {isLoading && <p>loading...</p>}
            <TodoInputs />
            <button onClick={getTodos}>Reload</button>
            {todos && (
                <>
                    <TodosContext.Provider value={todosContextValue}>
                        <hr />
                        <TodoDetails />
                        <TodosList todos={todos as Todo[]} />
                    </TodosContext.Provider>
                </>
            )}
        </>

    )
}

import { useEffect, useState } from "react";

// import { useFetchDataQuery as useFetchUsersQuery } from "../../../services/api/user-api";
import { useFetchDataQuery } from "../../../services/api/todo-api";
import { Todo } from "../../../types/todo-type";

// import TodoDetails from "./TodoDetails/TodoDetails";
// import TodoInputs from "./TodoInputs/TodoInputs";
import TodosList from "./TodosList/TodosList";

// import { TodosContext } from "../../../store/todos-context";
// import { Todo } from "../../../types/todo-type";
// import { User } from "../../../types/user-type";

// import todos from './todos.json';

export default function Todos() {

    const [selectedTodo, setSelectedTodo] = useState({title: ''});

    // const [fullDataTodos, setFullDataTodos] = useState<Todo[]>([]);

    // const { data: todos, error: getTodosError, isLoading: isTodosLoading, isFetching: isTodosFetching, refetch: refetchTodos } = useFetchTodosQuery();
    // const { data: users, error: getUsersError, isLoading: isUsersLoading, isFetching: isUsersFetching, refetch: refetchUsers } = useFetchUsersQuery();
    const { data, isLoading, isFetching, isError, error, refetch } = useFetchDataQuery({});
    useEffect(() => {
        console.log('useFetch', useFetchDataQuery);
    }, []);

    if(isFetching) {
        return <p>Still fetching</p>
    }

    // useEffect(() => {
    //     if(users && todos) {
    //         const usersMap: any = {};
    //         users.map((user: User) => {
    //             usersMap[user.id!] = user;
    //         });

    //         setFullDataTodos(() => {
    //             return todos.map((todo: Todo) => {
    //                 return {
    //                     ...todo, 
    //                     user: usersMap[todo.userId!]
    //                 }
    //             });
    //         });
    //     }
    // }, [todos, users]);

    function getTodos() {
        refetch();
        // refetchUsers();
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
            {/* {todos && (
                <>
                    <TodosContext.Provider value={todosContextValue}>
                        <TodoInputs />
                        <hr />
                        <button onClick={getTodos}>Reload</button>
                        <TodoDetails />
                        <TodosList todos={todos} />
                    </TodosContext.Provider>
                </>
            )} */}
            <h2>Todos</h2>
            <button onClick={getTodos}>Reload</button>
            {isLoading && <p>loading...</p>}
            {isError && <p>error occurred...</p>}
            {error && <p>something failed</p>}
            {data && (
                <>
                    <p>Loaded!!!</p>
                    <ul>
                        {
                            (data as Todo[]).map((todo: Todo) => {
                                return (
                                    <li key={todo.id}>{todo.title}</li>
                                )
                            })
                        }
                    </ul>
                </>
            )}
        </>

    )
}

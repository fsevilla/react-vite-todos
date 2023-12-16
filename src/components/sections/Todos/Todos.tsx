import { useEffect, useState } from "react";

import TodoDetails from "./TodoDetails/TodoDetails";
import TodoInputs from "./TodoInputs/TodoInputs";
import TodosList from "./TodosList/TodosList";

import { fetchTodos } from "../../../services/api/new-todo-api";
import { fetchUsers } from "../../../services/api/user-api";

import { RequestsGroup, RequestsHandler } from "../../../utils/requests-handler";

import { TodosContext } from "../../../store/todos-context";
import { Todo } from "../../../types/todo-type";
import { User } from "../../../types/user-type";

type TodoUserResponse = [Todo[], User[]];

export default function Todos() {

    const [ selectedTodo, setSelectedTodo ] = useState({title: ''});
    const [ items, setItems ] = useState<Todo[]|null>(null);

    const [ getTodos ] = fetchTodos({}, { skipInitialRequest: true });
    const [ getUsers ] = fetchUsers({}, { skipInitialRequest: true });

    const [ fetchData, {response, isLoading, error, warning} ] = RequestsGroup({
        required: [getTodos],
        optional: [getUsers]
    }, {
        onSuccess: handleFetchItems,
        onWarning: handleFetchItemsWarning
    });


    function reload() { }

    type UsersMap = {
        [key: number]: User;
    }

    function handleFetchItems(response: TodoUserResponse) {
        const [todos, users] = response;
        const usersMap: UsersMap = {};
        users.map(user => {
            usersMap[user.id!] = user;
        });
        const items: Todo[] = todos.map(todo => {
            todo.user = usersMap[todo.userId!];
            return todo;
        });
        setItems(items);
    }

    function handleFetchItemsWarning(error: { results: [{ results: TodoUserResponse }]}) {
        console.log('Got todos only', error.results[0].results);
        const response = error.results[0].results;
        const [todos] = response;
        setItems(todos);
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
            
            {isLoading && <p>loading...</p>}
            {error && <p>Failed to get Todos</p>}
            {warning && <p>Failed to get Users only</p>}
            <TodoInputs />
            <button onClick={reload}>Reload</button>
            {items && (
                <>
                    <TodosContext.Provider value={todosContextValue}>
                        <hr />
                        <TodoDetails />
                        <TodosList todos={items as Todo[]} />
                    </TodosContext.Provider>
                </>
            )}
        </>

    )
}

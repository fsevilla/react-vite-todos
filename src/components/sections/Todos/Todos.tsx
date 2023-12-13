import { useEffect, useState } from "react";
import { AxiosError } from "axios";

import { fetchTodos } from "../../../services/api/new-todo-api";
import { fetchUsers } from "../../../services/api/user-api";

import { TodosContext } from "../../../store/todos-context";
import { Todo } from "../../../types/todo-type";
import { User } from "../../../types/user-type";

import { RequestsHandler } from "../../../utils/requests-handler";

import TodoDetails from "./TodoDetails/TodoDetails";
import TodoInputs from "./TodoInputs/TodoInputs";
import TodosList from "./TodosList/TodosList";

// import todos from './todos.json';

export default function Todos() {

    const [ selectedTodo, setSelectedTodo ] = useState({title: ''});
    const [ items, setItems ] = useState<Todo[]>([]);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ isError, setIsError ] = useState(false);
    
    const [getTodos] = fetchTodos({skipInitialRequest: true});
    const [getUsers] = fetchUsers({skipInitialRequest: true});
    
    useEffect(() => {
        fetchData();
    }, []);

    function fetchData() {
        setIsLoading(true);
        const requestsHandler = new RequestsHandler();
        requestsHandler.parallel([getUsers, getTodos]).then((responses) => {
            handleApiResponses((responses as [User[], Todo[]]));
            setIsLoading(false);
            setIsError(false);
        }).catch(() => {
            setIsLoading(false);
            setIsError(true);
        });
    }

    function sendGetUsers(data: any) {
        console.log('Here is some data: ', data);
        return new Promise((resolve, reject) => {
            getUsers().then((response) => {
                console.log('I can manage this response individually: ', response);
                resolve(response);
            }).catch((error: AxiosError) => {
                console.log('I can also manage errors individually: ', error);
                reject(error);
            });
        });
    }

    function sendGetTodos() {
        return new Promise((resolve, reject) => {
            getTodos().then((response) => {
                console.log('I can manage this todos response individually: ', response);
                resolve(response);
            }).catch((error: AxiosError) => {
                console.log('I can also manage errors individually: ', error);
                reject(error);
            });
        });
    }

    function reload() {
        fetchData();
    }

    type UsersMap = {
        [key: number]: User;
    }

    function handleApiResponses(data: [User[], Todo[]]) {
        const [users, todos] = data;
        const usersMap: UsersMap = {};
        users.map(user => {
            usersMap[user.id!] = user;
        });

        const items: Todo[] = todos.map(item => {
            item.user = usersMap[item.userId!];
            return item;
        });

        setItems(items);
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
            {isError && <p>Failed to get data</p>}
            <TodoInputs />
            <button onClick={getTodos}>Reload</button>
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

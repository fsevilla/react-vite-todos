import { useEffect, useState } from "react";

import { fetchTodos } from "../../../services/api/new-todo-api";
import { fetchUsers } from "../../../services/api/user-api";

import { Todo } from "../../../types/todo-type";
import { User } from "../../../types/user-type";

import { HandlerRequestsResponse, RequestsHandler, RequestsHandlerError, RequiredRequestFailure, RequestsGroup } from "../../../utils/requests-handler";

type UsersMap = {
    [key: number]: User;
}

export default function Test() {

    const [ getTodos ] = fetchTodos({}, { skipInitialRequest: true });
    const [ getUsers ] = fetchUsers({}, { skipInitialRequest: true });

    const [ fetchAll ] = RequestsGroup([getTodos, getUsers], {
        skipInitialRequest: true
    });

    const [items, setItems] = useState<undefined|Todo[]>();

    useEffect(()=>{
        getItems();
        const rh = new RequestsHandler();
        
    }, []);

    function getItems() {
        fetchAll({
            asynchronous: false
        }).then(responses => {
            console.log('Responses: ', responses);
            handleFulfilledResponses(responses);
        });
    }

    function handleFulfilledResponses(data: [Todo[], User[]]) {
        const [todos, users] = data;
        const usersMap: UsersMap = {};
        
        users.map(user => {
            usersMap[user.id!] = user;
        });

        const todoItems = todos.map(todo => {
            todo.user = usersMap[todo.userId!];
            return todo;
        });

        setItems(todoItems);
    }

    function handleFetchErrors(error: {error: RequestsHandlerError, results: HandlerRequestsResponse}) {
        if(error.error instanceof RequiredRequestFailure) {
            console.error('Required request failed: ', error);
        } else {
            console.log('Ok, we at least got users', error);
        }
    }

    return (
        <>
            <h2>Todos</h2>
            <button onClick={getItems}>Reload</button>
            {items && (
                <>
                    <ul>
                        {
                            items.map(todo => {
                                return <li key={todo.id}>{todo.title} (assigned to: {todo.user?.name || 'unassigned'})</li>
                            })
                        }
                    </ul>
                </>
            )}
        </>
    )
}
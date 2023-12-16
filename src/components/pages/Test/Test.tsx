import { useEffect, useState } from "react";

import { fetchTodos } from "../../../services/api/new-todo-api";
import { fetchUsers } from "../../../services/api/user-api";
import { fetchPosts, fetchOnePost } from "../../../services/api/post-api";

import { Todo } from "../../../types/todo-type";
import { Post } from "../../../types/post-type";
import { User } from "../../../types/user-type";

import { HandlerRequestsResponse, RequestsHandler, RequestsHandlerError, RequiredRequestFailure } from "../../../utils/requests-handler";

type UsersMap = {
    [key: number]: User;
}

export default function Test() {

    const [ getTodos ] = fetchTodos({}, { skipInitialRequest: true });
    const [ getUsers ] = fetchUsers({}, { skipInitialRequest: true });
    const [ getPosts ] = fetchPosts({}, { skipInitialRequest: true });
    const [ getOnePost ] = fetchOnePost({}, { skipInitialRequest: true });

    const [items, setItems] = useState<undefined|Todo[]>();


    useEffect(() => {
        const rh = new RequestsHandler();
        rh.parallel([getUsers])
            .series([getTodos, getPosts])
            .parallel([getTodos, getPosts, getUsers])
            .then(response => {
                // handleFulfilledResponses(response);
                console.log('Got all: ', response);
            });
    }, []);

    function getPostById(data: any) {
        console.log('Got this data from the previous request', data);
        return getOnePost({params: {id: 10}});
    }

    // if(isInitialLoad) {
    //     if(response) {
    //         console.log('Response: ', response);
    //         setTodos(response[1]);
    //         handleFulfilledResponses(response);

    //         // Will get ONE post with id 1
    //         getOnePost({
    //             params: { id: 1 }
    //         }).then(response => {
    //             console.log('Got one Post', response);
    //         })
    //     }
    
    //     if(error) {
    //         handleFetchErrors(error);
    //     }
    // }

    function handleFulfilledResponses(data: [User[], Todo[], Post[]]) {
        const [users, todos, posts] = data;
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
            <h2>Test Page</h2>
            <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ad, eaque.</p>
            <h2>Todos</h2>
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
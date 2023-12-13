import { useEffect, useState } from "react";

import { fetchTodos } from "../../../services/api/new-todo-api";
import { fetchUsers } from "../../../services/api/user-api";
import { fetchPosts } from "../../../services/api/post-api";

import { Todo } from "../../../types/todo-type";
import { Post } from "../../../types/post-type";
import { User } from "../../../types/user-type";

import { HandlerRequestsResponse, RequestsGroup, RequestsHandler, RequestsHandlerError, RequiredRequestFailure } from "../../../utils/requests-handler";

type UsersMap = {
    [key: number]: User;
}

export default function Test() {

    const [ getTodos ] = fetchTodos({ skipInitialRequest: true });
    const [ getUsers, { data } ] = fetchUsers({ skipInitialRequest: true });
    const [ getPosts ] = fetchPosts({ skipInitialRequest: true });

    const [ todos, setTodos ] = useState<Todo[]>([]);
    const [ posts, setPosts ] = useState<Todo[]>([]);

    const { response, isInitialLoad, error, warning } = RequestsGroup({
        required: [getUsers],
        optional: [getTodos, getPosts]
    }, { asynchronous: false });

    useEffect(() => {
        // const rh = new RequestsHandler();
        // rh.series([getUsers])
        //     .parallel({
        //         required: [getTodos],
        //         optional: [getPosts]
        //     })
        //     .then(responses => {
        //     console.log('Responses: ', responses);
        // }).catch(error => {
        //     if(error.error instanceof RequiredRequestFailure) {
        //         console.log('Required failed');
        //     } else {
        //         console.log('Optional request failed');
        //     }
        // });

    }, []);

    if(isInitialLoad) {
        if(response) {
            console.log('Response: ', response);
            setTodos(response[1]);
            handleFulfilledResponses(response);
        }
    
        if(error) {
            handleFetchErrors(error);
        }
    }

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

        const postItems = posts.map(post => {
            post.user = usersMap[post.userId!];
            return post;
        });

        setTodos(todoItems);
        setPosts(postItems);
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
            {error && <p>REQUIRED REQUEST FAILED</p>}
            {warning && <p>OPTIONAL REQUEST FAILED</p>}
            {data && (
                <ul>
                {data.map((user: User) => {
                    return <li key={user.id!}>{user.name}</li>
                })}
                </ul>
            )}
            {todos && (
                <>
                    <ul>
                        {
                            todos.map(todo => {
                                return <li key={todo.id}>{todo.title} (assigned to: {todo.user?.name || 'unassigned'})</li>
                            })
                        }
                    </ul>
                </>
            )}
            <h2>Posts</h2>
            {posts && (
                <>
                    <ul>
                        {
                            posts.map(post => {
                                return <li key={post.id}>{post.title} (assigned to: {post.user!.name})</li>
                            })
                        }
                    </ul>
                </>
            )}
        </>
    )
}
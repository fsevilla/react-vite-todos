import { useEffect } from "react";

import { fetchTodos } from "../../../services/api/new-todo-api";
import { fetchUsers } from "../../../services/api/user-api";
import { fetchPosts } from "../../../services/api/post-api";

import { Todo } from "../../../types/todo-type";
import { Post } from "../../../types/post-type";
import { User } from "../../../types/user-type";

import { RequestsHandler, RequestsHandlerError, RequiredRequestFailure } from "../../../utils/requests-handler";

export default function Test() {

    const [ getTodos ] = fetchTodos({ skipInitialRequest: true });
    const [ getUsers ] = fetchUsers({ skipInitialRequest: true });
    const [ getPosts ] = fetchPosts({ skipInitialRequest: true });

    useEffect(() => {
        const rh = new RequestsHandler();
        rh.parallel({
            required: [getUsers],
            optional: [getPosts, getTodos]
        })
            .then((response) => {
                handleFulfilledResponses(response as [Todo[], User[], Post[]]);
            })
            .catch((error) => {
                handleFetchErrors(error);
            });
    }, []);

    function handleFulfilledResponses(data: [Todo[], User[], Post[]]) {
        console.log('All promises fulfilled: ', data);
    }

    function handleFetchErrors(error: { error: RequestsHandlerError}) {
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
            
        </>
    )
}
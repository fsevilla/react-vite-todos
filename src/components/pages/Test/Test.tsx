import { useEffect } from "react";
import { fetchTodos } from "../../../services/api/new-todo-api";
import { Todo } from "../../../types/todo-type";

export default function Test() {

    const [refetch, { data, isLoading, error, promise }] = fetchTodos(); 

    useEffect(() => {
        promise.then((response: any) => {
            console.log('Tenemos respuesta!', response);
        }).catch((err: any) => {
            console.log('Fallo?????', err);
        })
    }, []);

    if(isLoading) {
        return <p>loading....</p>
    }

    if(error) {
        return <p>Failed to retrieve todos!</p>
    }



    function handleReloadTodosClick() {
        console.log('Click to reload')
    }

    return (
        <>
            <h2>Test Page</h2>
            <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ad, eaque.</p>
            {/* <button onClick={handleReloadTodosClick}>Reload</button> */}
            {data && (
                <ul>
                    { data.map((item: Todo) => {
                        return (
                            <li key={item.id}>{item.title}</li>
                        )
                    })}
                </ul>
            )}
        </>
    )
}
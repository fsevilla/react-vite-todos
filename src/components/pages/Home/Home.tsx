import Todos from "../../sections/Todos/Todos"

// import { TodosContext } from "../../../store/todos-context";

export default function Home() {

    // const todosContextValue = {
    //     selectedTodo: {},
    //     selectTodo: () => {},
    //     clearTodo: () => {}
    // }

    return (
        <>
            <h1>Welcome</h1>
            <Todos />
        </>
    )
}
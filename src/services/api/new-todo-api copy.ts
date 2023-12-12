// import { Todo } from '../../types/todo-type';
// import { HttpServiceOptions, createHttpService } from '../../utils/http-service';

// type TodoEndpoints = {
//   createTodo: () => Promise<Todo>
//   fetchTodos: () => any
// }

// export const TodoApi = createHttpService({
//   authHeather: false,
//   baseApiPath: 'todos',
//   endpoints: [
//     {
//       name: 'fetchTodos',
//       path: 'todos', // overrides the baseApi
//       method: 'GET',
//       transformResponse: (data: Todo[]) => {
//         return data.map((todo: Todo) => {
//           return todo;
//         });
//       }
//     },
//     {
//       name: 'createTodo',
//       path: 'todos',
//       method: 'POST',
//       prepareData: (data) => {
//         return { ...data, newData: true };
//       }
//     } 
//   ]
// } as HttpServiceOptions)


// export const { fetchTodos } = (TodoApi as TodoEndpoints)
// import { Todo } from '../../types/todo-type';
// import { CreateApiOptions, createApiService } from '../../utils/create-api';


// export const api = createApiService({
//   authHeather: false,
//   baseApiPath: 'todos',
//   name: 'todos',
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
// } as CreateApiOptions)

  
// export const { useFetchTodosQuery, useCreateTodoMutation } = api;

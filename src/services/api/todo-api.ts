import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { Todo } from '../../types/todo-type';

const apiUrl: string = 'https://jsonplaceholder.typicode.com'; // api base url. fetch from env variable
const apiPath: string = 'todos';

export const todoApi = createApi({
    reducerPath: 'todoApi',
    baseQuery: fetchBaseQuery({ 
        baseUrl: apiUrl,
        prepareHeaders: (headers) => {
            headers.set('Authorization', 'token123');
            return headers;
        }
    }),
    endpoints: (builder) => ({
      fetchTodos: builder.query<Todo[], void>({
        query: () => apiPath, // the actual endpoint path
      }),
      createTodo: builder.mutation<{data: any}, Todo>({
        query: (requestBody) => ({
            url: apiPath,
            method: 'POST',
            body: requestBody
        }),
        async onQueryStarted(requestBody) {
            requestBody.title = 'updated title';
            requestBody.description = 'updated description';
        }
      })
    })
  });
  
  export const { useFetchTodosQuery, useCreateTodoMutation } = todoApi;

//   /todos 
//   /users
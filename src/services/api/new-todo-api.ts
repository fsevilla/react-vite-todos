import { createApiService, CreateApiOptions } from '../../utils/create-api';

const options: CreateApiOptions = {
  requiresAuth: false,
  baseApiPath: 'todos',
  endpoints: [
    { name: 'fetchTodos', method: 'GET', cache: true, cacheExpiration: 10 },
    { name: 'fetchOneTodo', method: 'GET', cache: true, path: 'todos/{id}' },
    {
      name: 'createTodo',
      method: 'POST',
      prepareData: (data: any) => {
        return { ...data, newData: true };
      },
      transformResponse: (response) => {
        return response.map((item: any) => {
          item.modified = true;
          return item;
        })
      }
    },
    {
      name: 'updateTodo',
      method: 'PUT',
      path: 'todos/{id}',
      prepareData: (data: any) => {
        return { ...data, isEdited: true };
      }
    },
    {
      name: 'deleteTodo',
      method: 'DELETE',
      path: 'todos/{id}'
    }
  ]
}

export const TodoApi = createApiService(options);
export const { fetchTodos, createTodo, updateTodo, deleteTodo } = TodoApi;

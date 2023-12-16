import { createApiService, CreateApiOptions } from '../../utils/create-api';

const options: CreateApiOptions = {
  requiresAuth: false,
  baseApiPath: 'todos',
  endpoints: [
    { name: 'fetchTodos', method: 'GET' },
    { name: 'fetchOneTodo', method: 'GET', path: 'todos/{id}' },
    {
      name: 'createTodo',
      method: 'POST',
      prepareData: (data: any) => {
        return { ...data, newData: true };
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

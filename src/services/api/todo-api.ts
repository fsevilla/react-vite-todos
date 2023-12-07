import { Todo } from '../../types/todo-type';
import { CreateApiOptions, createApiService } from '../../utils/create-api';


export const api = createApiService({
  authHeather: false,
  baseApiPath: 'todos',
  name: 'todos',
  endpoints: [
    {
      name: 'fetchData',
      path: 'todos', // overrides the baseApi
      method: 'GET',
      transformResponse: (data: Todo[]) => {
        return data.map((todo: Todo) => {
          return todo;
        });
      }
    },
    {
      name: 'postData',
      path: 'todos',
      method: 'POST',
      prepareData: (data) => {
        return { ...data, newData: true };
      }
    } 
  ]
} as CreateApiOptions)

  
export const { useDefaultFetchDataQuery, useFetchDataQuery, usePostDataMutation } = api;


import { CreateApiOptions, createApiService } from '../../utils/create-api';

const options: CreateApiOptions = {
  requiresAuth: false,
  baseApiPath: 'users2',
  endpoints: [
    {
      name: 'fetchUsers',
      method: 'GET',
      transformResponse: (data) => {
        return data;
      },
      prepareData: (data) => {
        return {...data}
      }
    }
  ]
}

export const api = createApiService(options);
  
export const { fetchUsers } = api;

import { CreateApiOptions, createApiService } from '../../utils/create-api';

const options: CreateApiOptions = {
  requiresAuth: false,
  baseApiPath: 'users',
  endpoints: [
    {
      name: 'fetchUsers',
      method: 'GET',
      cache: true,
      cacheExpiration: 10,
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

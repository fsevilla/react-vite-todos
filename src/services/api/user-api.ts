import { createApiService } from '../../utils/create-api';

export const userApi = createApiService({
  authHeather: false,
  name: 'users',
  endpoints: [
    {
      name: 'fetchData',
      path: 'users', // overrides the baseApiPath
      method: 'GET'
    } 
  ]
})

export const { useFetchDataQuery } = userApi;
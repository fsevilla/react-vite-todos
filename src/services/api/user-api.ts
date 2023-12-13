import { CreateApiOptions, createApiService } from '../../utils/create-api';

export const api = createApiService({
  authHeather: false,
  baseApiPath: 'users',
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
} as CreateApiOptions)


  
export const { fetchUsers } = api;

import { CreateApiOptions, createApiService } from '../../utils/create-api';
import { User } from '../../types/user-type';

export const api = createApiService({
  authHeather: false,
  baseApiPath: 'users',
  endpoints: [
    {
      name: 'fetchUsers',
      method: 'GET',
      transformResponse: (data: User[]) => {
        return [...data];
      },
      prepareData: (data) => {
        return {...data}
      },
      onSuccess: (response) => {}
    }
  ]
} as CreateApiOptions)


  
export const { useFetchUsersQuery } = api;

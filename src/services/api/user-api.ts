import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { User } from '../../types/user-type';

const apiUrl: string = 'https://jsonplaceholder.typicode.com'; // api base url. fetch from env variable
const apiPath: string = 'users';

export const userApi = createApi({
    reducerPath: 'usersApi',
    baseQuery: fetchBaseQuery({ 
        baseUrl: apiUrl,
        prepareHeaders: (headers) => {
            headers.set('Authorization', 'token123');
            return headers;
        }
    }),
    endpoints: (builder) => ({
      fetchUsers: builder.query<User[], void>({
        query: () => apiPath, // the actual endpoint path
      })
    })
  });
  
  export const { useFetchUsersQuery } = userApi;

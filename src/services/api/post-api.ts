import { CreateApiOptions, createApiService } from '../../utils/create-api';

export const api = createApiService({
  authHeather: false,
  baseApiPath: 'posts',
  endpoints: [
    { name: 'fetchPosts', method: 'GET' }
  ]
} as CreateApiOptions)


  
export const { fetchPosts } = api;

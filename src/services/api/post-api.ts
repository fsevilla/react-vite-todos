import { CreateApiOptions, createApiService } from '../../utils/create-api';

export const api = createApiService({
  authHeather: false,
  baseApiPath: 'posts2',
  endpoints: [
    { name: 'fetchPosts', method: 'GET' }
  ]
} as CreateApiOptions)


  
export const { fetchPosts } = api;

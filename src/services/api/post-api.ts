import { CreateApiOptions, createApiService } from '../../utils/create-api';

export const api = createApiService({
  authHeather: false,
  baseApiPath: 'posts',
  endpoints: [
    { name: 'fetchPosts', method: 'GET' },
    { name: 'fetchOnePost', method: 'GET', path: 'posts/{id}' }
  ]
} as CreateApiOptions)

export const { fetchPosts, fetchOnePost } = api;

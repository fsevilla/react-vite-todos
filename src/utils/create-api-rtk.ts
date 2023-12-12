// import { instanceToPlain, plainToInstance } from 'class-transformer';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const apiUrl: string = 'https://jsonplaceholder.typicode.com'; // api base url. fetch from env variable

export interface ApiEndpoint {
    name: string,
    method: string,
    path?: string, // overrides baseApiPath
    prepareData?: (requestBody: any) => {};
    transformResponse?: (response: any) => {};
    transformErrorResponse?: (response: any) => {};
    onSuccess?: (response: any) => void;
}

export interface CreateApiOptions {
    authHeather?: boolean;
    name?: string;
    baseUrl?: string;
    baseApiPath?: string;
    prepareData?: (requestBody: any) => {};
    transformResponse?: (response: any) => {};
    transformErrorResponse?: (response: any) => {};
    endpoints?: ApiEndpoint[]
}

const defaultApiOptions: CreateApiOptions = {
    name: '',
    baseUrl: apiUrl,
    baseApiPath: '',
    authHeather: true
}

function createApiServiceEndpoint (builder: any, endpointConfig: ApiEndpoint, baseApiPath: string) {

    const transformResponse = (response: any) => {
        let res = response;

        if(typeof endpointConfig.transformResponse === 'function') {
            res = endpointConfig.transformResponse(response);
        }

        if(typeof endpointConfig.onSuccess === 'function') {
            endpointConfig.onSuccess(res);
        }
        
        return res;
    }

    if(endpointConfig.method === 'GET') {
        return builder.query({
            query: () => endpointConfig.path || baseApiPath,
            transformResponse
        });
    } else {
        return builder.mutation({
            query: (requestBody?: any) => ({
                url: endpointConfig.path || baseApiPath,
                method: endpointConfig.method,
                body: requestBody
            }),
            async onQueryStarted(requestBody: any) {
                if(typeof endpointConfig.prepareData === 'function') {
                    Object.assign(requestBody, endpointConfig.prepareData(requestBody));
                }
            },
            transformResponse
        });
    }
}

function createApiServiceEndpointsMap (builder: any, endpoints: ApiEndpoint[], baseApiPath: string) {
    const endpointsMap: any = {};
    endpoints.map((endpoint: ApiEndpoint) => {
        endpointsMap[endpoint.name] = createApiServiceEndpoint(builder, endpoint, baseApiPath);
    });
    return endpointsMap;
}

export function createApiService(options: CreateApiOptions = {}) {
    options = {
        ...defaultApiOptions,
        ...options
    };

    const baseApiPath = options.baseApiPath || options.name || '';
    const name = options.name || baseApiPath;
    const apiName = name.charAt(0).toUpperCase() + name.toLowerCase().slice(1);

    return createApi({
        reducerPath: apiName + 'Api',
        baseQuery: fetchBaseQuery({ 
            baseUrl: apiUrl,
            prepareHeaders: (headers) => {
                if(options?.authHeather) {
                    headers.set('Authorization', 'token123');
                }
                return headers;
            }
        }),
        endpoints: (builder) => {
            const predefinedEndpoints = {
                defaultFetchData: builder.query<string, void>({
                  query: () => 'todos',
                }),
            };

           const customEndpoints = options.endpoints ? createApiServiceEndpointsMap(builder, options.endpoints, baseApiPath) : {};

            return {
                ...predefinedEndpoints,
                ...customEndpoints
            }
        }
    });
}

// import { instanceToPlain, plainToInstance } from 'class-transformer';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const apiUrl: string = 'https://jsonplaceholder.typicode.com'; // api base url. fetch from env variable

export interface ApiEndpoint {
    name: string,
    method: string,
    path?: string, // overrides baseApiPath
    prepareData?: (requestBody: {data: any}) => {};
    transformResponse?: (response: { status: any}) => {};
    transformErrorResponse?: (response: { status: any}) => {};
}

export interface CreateApiOptions {
    authHeather?: boolean;
    name?: string;
    baseUrl?: string;
    baseApiPath?: string;
    prepareData?: (requestBody: {data: any}) => {};
    transformResponse?: (response: { status: any}) => {};
    transformErrorResponse?: (response: { status: any}) => {};
    endpoints?: ApiEndpoint[]
}

const defaultApiOptions: CreateApiOptions = {
    name: '',
    baseUrl: apiUrl,
    baseApiPath: '',
    authHeather: true
}

function createApiServiceEndpoint (builder: any, endpointConfig: ApiEndpoint) {

    if(endpointConfig.method === 'GET') {
        return builder.query({
            query: () => endpointConfig.path,
            transformResponse: (response: any) => {
                if(typeof endpointConfig.transformResponse === 'function') {
                    return endpointConfig.transformResponse(response);
                } else {
                    return response;
                }
            }
        });
    }

    return builder.mutation({
        query: (requestBody?: any) => ({
            url: endpointConfig.path,
            method: endpointConfig.method,
            body: requestBody
        }),
        async onQueryStarted(requestBody: any) {
            if(typeof endpointConfig.prepareData === 'function') {
                Object.assign(requestBody, endpointConfig.prepareData(requestBody));
            }
        },
        transformResponse: (response: any) => {
            if(typeof endpointConfig.transformResponse === 'function') {
                return endpointConfig.transformResponse(response);
            } else {
                return response;
            }
        }
    });
}

function createApiServiceEndpointsMap (builder: any, endpoints: ApiEndpoint[]) {
    const endpointsMap: any = {};
    endpoints.map((endpoint: ApiEndpoint) => {
        endpointsMap[endpoint.name] = createApiServiceEndpoint(builder, endpoint);
    });
    return endpointsMap;
}



export function createApiService(options: CreateApiOptions = {}) {
    options = {
        ...defaultApiOptions,
        ...options
    };

    const baseApiPath = options.baseApiPath || options.name;
    const name = options.name || baseApiPath || '';
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

           const customEndpoints = options.endpoints ? createApiServiceEndpointsMap(builder, options.endpoints) : {};

            return {
                ...predefinedEndpoints,
                ...customEndpoints
            }
        }
    });
}

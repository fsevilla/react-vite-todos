import { useState, useEffect } from 'react';
import { HttpService, HttpRequestOptions, RequestData } from "./http-service";

const apiUrl: string = 'https://jsonplaceholder.typicode.com/';

export interface CreateApiOptions {
    requiresAuth?: boolean;
    baseUrl?: string;
    baseApiPath?: string;
    endpoints?: HttpRequestOptions[];
    prepareData?: (requestBody: any) => {};
    skipDefaultEndpoints?: boolean;
    transformResponse?: (response: any) => {};
    transformErrorResponse?: (response: any) => {};
}

export type ApiServiceEndpointResponse = [(data?: RequestData) => Promise<unknown>, ApiServiceResults];

export interface ApiServiceResults {
    data: any;
    promise: Promise<unknown>;
    isLoading: boolean;
    isFetching: boolean;
    error: any;
}

export type ApiServiceEndpoints = {
    [key: string]: (data?: RequestData|UseApiConfig, config?: UseApiConfig) => ApiServiceEndpointResponse;
}

export type UseApiConfig = {
    skipInitialRequest?: boolean;
}

const defaultFetchApiConfig: UseApiConfig = {
    skipInitialRequest: false
}

const defaultPostApiConfig: UseApiConfig = {
    skipInitialRequest: true
}

const defaultApiOptions: CreateApiOptions = {
    requiresAuth: true,
    baseApiPath: '',
    baseUrl: apiUrl,
    skipDefaultEndpoints: false
}

function createApiFetchEndpoint(http: HttpService, endpointConfig: HttpRequestOptions, baseApiPath: string): (config?: UseApiConfig) => ApiServiceEndpointResponse {
    return (config?: UseApiConfig) => {
        const options: HttpRequestOptions = {
            baseUrl: baseApiPath,
            ...endpointConfig
        }

        config = {
            ...defaultFetchApiConfig,
            ...config
        };
    
        const {data, setData} = useFetchData();
        const {data: error, setData: setError} = useFetchData();
        const [isLoading, setIsLoading] = useState(true);
        const [isFetching, setIsFetching] = useState(false);
        const [isReady, setIsReady] = useState(false);
    
        const request = (force?: boolean) => {
            return new Promise((resolve, reject) => {
                if((!isFetching && !isReady) || !!force) {
                  setIsLoading(true);
                  setIsFetching(true);
                  http.request(options).then(response => {
                    setIsLoading(false);
                    setIsFetching(false);
                    setIsReady(true);
                    setData(response);
                    resolve(response);
                  }).catch(err => {
                    setIsLoading(false);
                    setIsFetching(false);
                    setIsReady(true);
                    setError(err);
                    reject(err);
                  })
                }
            });
        }

        let promise = new Promise(() => {});

        const refetch = () => {
            return request(true);
        }

        if(config && !config.skipInitialRequest) {
            promise = request();
        }

        return [ refetch, { data, isLoading, isFetching, error, promise }];
    }
}

function createApiPostEndpoint(http: HttpService, endpointConfig: HttpRequestOptions, baseApiPath: string): (data?: RequestData, config?: UseApiConfig) => ApiServiceEndpointResponse {
    return (body?: RequestData, config?: UseApiConfig) => {
        body = body || {};

        const options: HttpRequestOptions = {
            baseUrl: baseApiPath,
            ...endpointConfig
        }


        config = {
            ...defaultPostApiConfig,
            ...config
        };
    
        const {data, setData} = useFetchData();
        const {data: error, setData: setError} = useFetchData();
        const [isLoading, setIsLoading] = useState(true);
        const [isFetching, setIsFetching] = useState(false);
        const [isReady, setIsReady] = useState(false);
    
        const request = (requestBody: RequestData, force?: boolean) => {
            options.data = requestBody;
            return new Promise((resolve, reject) => {
                if((!isFetching && !isReady) || !!force) {
                  setIsLoading(true);
                  setIsFetching(true);
                  http.request(options).then(response => {
                    setIsLoading(false);
                    setIsFetching(false);
                    setIsReady(true);
                    setData(response);
                    resolve(response);
                  }).catch(err => {
                    setIsLoading(false);
                    setIsFetching(false);
                    setIsReady(true);
                    setError(err);
                    reject(err);
                  })
                }
            });
        }

        let promise = new Promise(() => {});

        const reload = (data?: RequestData) => {
            data = data || {};
            return request(data, true);
        }

        if(config && !config.skipInitialRequest) {
            promise = request(body);
        }

        return [ reload, { data, isLoading, isFetching, error, promise } ];
    }
}

function createApiServiceEndpoint (http: HttpService, endpointConfig: HttpRequestOptions, baseApiPath: string): (params?: RequestData|UseApiConfig, config?: UseApiConfig) => ApiServiceEndpointResponse {
    if(endpointConfig.method === 'GET') {
        return createApiFetchEndpoint(http, endpointConfig, baseApiPath);
    } else {
        return createApiPostEndpoint(http, endpointConfig, baseApiPath);
    }
}

function createApiServiceEndpointsMap (http: HttpService, endpoints: HttpRequestOptions[], baseApiPath: string) {
    const endpointsMap: ApiServiceEndpoints = {};
    endpoints.map((endpoint: HttpRequestOptions) => {
        if(endpoint.name) {
            endpointsMap[endpoint.name] = createApiServiceEndpoint(http, endpoint, baseApiPath);
        } else {
            throw Error('Endpoint name missing');
        }
    });
    return endpointsMap;
}

export function createApiService(apiOptions: CreateApiOptions = {}) {
    apiOptions = {
        ...defaultApiOptions,
        ...apiOptions
    };
    const http: HttpService = new HttpService(apiOptions.baseApiPath, apiOptions.baseUrl);

    const baseApiPath = http.baseUrl;

    // const predefinedEndpoints  = !!apiOptions.skipDefaultEndpoints ? {} : {
    //     fetchData: (options?:HttpRequestOptions) => {
    //         const url: string = apiOptions.baseApiPath || '';
    //         return http.get(url, options);
    //     },
    //     getOne: (id: string|number) => {
    //         const url: string = apiOptions.baseApiPath + `/${id}`;
    //         return http.get(url);
    //     },
    //     createOne: (data: RequestData, options?:HttpRequestOptions) => {
    //         const url: string = apiOptions.baseApiPath || '';
    //         return http.post(url, data, options);
    //     },
    //     updateOne: (id: string|number, data: RequestData, options?:HttpRequestOptions) => {
    //         const url: string = apiOptions.baseApiPath + `/${id}`;
    //         return http.put(url, data, options);
    //     }        
    // };

    const customEndpoints = apiOptions.endpoints ? createApiServiceEndpointsMap(http, apiOptions.endpoints, baseApiPath) : {};

    const endpoints: ApiServiceEndpoints = {
        // ...predefinedEndpoints,
        ...customEndpoints
    }

   return endpoints;
}

function useFetchData() {
    const [data, setData] = useState<any>(undefined);
  
    useEffect(() => {}, [data]);
  
    const updateValue = (newValue: any) => {
      if(data !== newValue) {
        setData(newValue);  
      }
    };
  
    return {
      data,
      setData: updateValue,
    };
  }
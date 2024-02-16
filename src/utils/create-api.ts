import { useState, useEffect } from 'react';
import { HttpService, HttpRequestOptions, RequestData, RequestParams } from "./http-service";
import { ClassConstructor } from 'class-transformer';

const apiUrl: string = 'https://jsonplaceholder.typicode.com/';

export interface CreateApiOptions {
    requiresAuth?: boolean;
    baseUrl?: string;
    baseApiPath?: string;
    endpoints?: HttpRequestOptions[];
    prepareData?: (requestBody: unknown) => unknown;
    skipDefaultEndpoints?: boolean;
}

export type ApiServiceEndpointResponse = [(data?: RequestData|RequestArguments, args?: RequestArguments) => Promise<unknown>, ApiServiceResults];

export interface ApiServiceResults {
    data: any;
    isLoading: boolean;
    isFetching: boolean;
    error: any;
}

export type ApiServiceFetchEndpoint = (args?: RequestArguments, config?: UseApiConfig) => ApiServiceEndpointResponse;
export type ApiServicePostEndpoint = (data?: RequestData, args?: RequestArguments, config?: UseApiConfig) => ApiServiceEndpointResponse;

export type ApiServiceEndpoints = {
    [key: string]: ApiServiceFetchEndpoint | ApiServicePostEndpoint;
}

export type UseApiConfig = {
    skipInitialRequest?: boolean;
    invalidateCache?: boolean;
}

interface RequestArguments {
    params?: RequestParams;
    queryParams?: RequestParams;
}

const defaultFetchApiConfig: UseApiConfig = {
    skipInitialRequest: false
}

const defaultDeleteApiConfig: UseApiConfig = {
    skipInitialRequest: true
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

function createApiFetchEndpoint(http: HttpService, endpointConfig: HttpRequestOptions, baseApiPath: string): ApiServiceFetchEndpoint {
    return (args?: RequestArguments, config?: UseApiConfig) => {
        const initOptions: HttpRequestOptions = {
            baseUrl: baseApiPath,
            ...endpointConfig
        }

        const defaults = endpointConfig.method === 'GET' ? defaultFetchApiConfig : defaultDeleteApiConfig;

        config = {
            ...defaults,
            ...config
        };
    
        const { data, setData } = useFetchData();
        const { data: error, setData: setError } = useFetchData();
        const [ isLoading, setIsLoading ] = useState(true);
        const [ isFetching, setIsFetching ] = useState(false);
        const [ isReady, setIsReady ] = useState(false);
    
        const request = (args?: RequestArguments, force?: boolean) => {
            return new Promise((resolve, reject) => {
                const options = {
                    ...initOptions,
                    ...args
                }

                options.invalidateCache = config?.invalidateCache;

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

        if(config && !config.skipInitialRequest) {
            request(args);
        }

        const refetch = (args?: RequestArguments) => {
            return request(args, true);
        }


        return [ refetch, { data, isLoading, isFetching, error }];
    }
}

function createApiPostEndpoint(http: HttpService, endpointConfig: HttpRequestOptions, baseApiPath: string): ApiServicePostEndpoint {
    return (body?: RequestData, args?: RequestArguments, config?: UseApiConfig) => {
        body = body || {};

        const options: HttpRequestOptions = {
            baseUrl: baseApiPath,
            ...endpointConfig
        }

        config = {
            ...defaultPostApiConfig,
            ...config
        };
    
        const { data, setData } = useFetchData();
        const { data: error, setData: setError } = useFetchData();
        const [ isLoading, setIsLoading ] = useState(true);
        const [ isFetching, setIsFetching ] = useState(false);
        const [ isReady, setIsReady ] = useState(false);
    
        const request = (requestBody: RequestData, args?: RequestArguments, force?: boolean) => {
            options.body = requestBody;
            options.params = args?.params;
            options.queryParams = args?.queryParams;
            options.invalidateCache = config?.invalidateCache;
            return new Promise((resolve, reject) => {
                if((!isFetching && !isReady) || !!force) {
                    setIsLoading(true);
                    setIsFetching(true);
                    http.request(options).then(response => {
                        setData(response);
                        setIsLoading(false);
                        setIsFetching(false);
                        setIsReady(true);
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

        const reload = (data?: RequestData, args?: RequestArguments) => {
            data = data || {};
            return request(data, args, true);
        }

        if(config && !config.skipInitialRequest) {
            request(body, args);
        }

        return [ reload, { data, isLoading, isFetching, error } ];
    }
}

function createApiServiceEndpoint (http: HttpService, endpointConfig: HttpRequestOptions, baseApiPath: string) {
    if(endpointConfig.method === 'GET' || endpointConfig.method === 'DELETE') {
        return createApiFetchEndpoint(http, endpointConfig, baseApiPath);
    } 
        return createApiPostEndpoint(http, endpointConfig, baseApiPath);
    
}

function createApiServiceEndpointsMap (http: HttpService, endpoints: HttpRequestOptions[], baseApiPath: string) {
    const endpointsMap: ApiServiceEndpoints = {};
    endpoints.map((endpoint: HttpRequestOptions) => {
        if(endpoint.name) {
            endpointsMap[endpoint.name] = (createApiServiceEndpoint(http, endpoint, baseApiPath));
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

    const customEndpoints = apiOptions.endpoints ? createApiServiceEndpointsMap(http, apiOptions.endpoints, baseApiPath) : {};

    const endpoints: ApiServiceEndpoints = {
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

export function isErrorOfType(err: Error, instanceClass: ClassConstructor<Error>) {
    try {
        const testInstance = new instanceClass();
        return err.name === testInstance.name;
    } catch (e) {
        return false;
    }
}
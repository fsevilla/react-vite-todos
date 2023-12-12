import { useState, useEffect } from 'react';
import { HttpService, HttpRequestOptions, RequestData } from "./http-service";

const apiUrl: string = 'https://jsonplaceholder.typicode.com/';

export interface CreateApiOptions {
    authHeather?: boolean;
    baseUrl?: string;
    baseApiPath?: string;
    endpoints?: HttpRequestOptions[];
    prepareData?: (requestBody: any) => {};
    skipDefaultEndpoints?: boolean;
    transformResponse?: (response: any) => {};
    transformErrorResponse?: (response: any) => {};
}

export interface ApiServiceEndpointResponse {
    data: any;
    promise: Promise<unknown>|undefined;
    refetch?: () => Promise<unknown>;
    resubmit?: (data?: RequestData) => Promise<unknown>;
    isLoading: boolean;
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
    authHeather: true,
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
        const [isLoading, setIsLoading] = useState(false);
        const [isReady, setIsReady] = useState(false);
    
        let promise;
        const request = (force?: boolean) => {
            return new Promise((resolve, reject) => {
                if((!isLoading && !isReady) || !!force) {
                  setIsLoading(true);
                  http.request(options).then(response => {
                    setIsLoading(false);
                    setIsReady(true);
                    setData(response);
                    resolve(response);
                  }).catch(err => {
                    setIsLoading(false);
                    setIsReady(true);
                    setError(err);
                    reject(err);
                  })
                }
            });
        }

        const refetch = () => {
            return request(true);
        }

        if(config && !config.skipInitialRequest) {
            promise = request();
        }

        return { data, isLoading, error, promise, refetch };
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
        const [isLoading, setIsLoading] = useState(false);
        const [isReady, setIsReady] = useState(false);
    
        let promise;
        const request = (requestBody: RequestData, force?: boolean) => {
            options.data = requestBody;
            return new Promise((resolve, reject) => {
                if((!isLoading && !isReady) || !!force) {
                  setIsLoading(true);
                  http.request(options).then(response => {
                    setIsLoading(false);
                    setIsReady(true);
                    setData(response);
                    resolve(response);
                  }).catch(err => {
                    setIsLoading(false);
                    setIsReady(true);
                    setError(err);
                    reject(err);
                  })
                }
            });
        }

        const resubmit = (data?: RequestData) => {
            data = data || {};
            return request(data, true);
        }

        if(config && !config.skipInitialRequest) {
            promise = request(body);
        }

        return { data, isLoading, error, promise, resubmit };
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
import { useState } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { instanceToPlain, plainToInstance } from 'class-transformer';

const apiUrl: string = 'https://jsonplaceholder.typicode.com/'; // api base url. fetch from env variable

export interface HttpServiceOptions {
    authHeather?: boolean;
    baseUrl?: string;
    baseApiPath?: string;
    endpoints?: HttpRequestOptions[];
    prepareData?: (requestBody: any) => {};
    skipDefaultEndpoints?: boolean;
    transformResponse?: (response: any) => {};
    transformErrorResponse?: (response: any) => {};
}

export interface HttpRequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    baseUrl?: string;
    data?: RequestData;
    headers?: HttpHeaders;
    name?: string;
    onError?: (response: any) => void | unknown;
    onSuccess?: (response: any) => void | unknown;
    prepareData?: (requestData: RequestData) => RequestData;
    transformErrorResponse?: (response: any) => AxiosResponse;
    transformResponse?: (response: any) => AxiosResponse;
}

export type HttpHeaders = {
    [key: string]: string
}

export type HttpRequest = {
    [key: string]: () => any
}

export type RequestData = {
    [key: string|number]: any
}

type Artifacts = {
    data: any,
    error: any,
    loading: () => boolean,
    promise: Promise<any>
}

const defaultApiOptions: HttpServiceOptions = {
    authHeather: true,
    baseApiPath: '',
    baseUrl: apiUrl,
    skipDefaultEndpoints: false
}

const defaultHttpRequestOptions: HttpRequestOptions = {
    method: 'GET',
    path: ''
}

class HttpService {
    baseUrl: string = '';
    basePath: string = '';

    constructor(path?: string, url?: string) {
        this.basePath = path || '';
        this.baseUrl = url || apiUrl;
    }

    request(options: HttpRequestOptions) {
        options = {
            ...defaultHttpRequestOptions,
            ...options
        }

        const baseUrl: string = options.baseUrl || this.baseUrl;
        const path: string = options.path || this.basePath;
        const requestData = options.prepareData ? options.prepareData(options.data || {}) : options.data;

        return new Promise((resolve, reject) => {
            axios.request({
                url: baseUrl + path,
                method: options.method,
                data: instanceToPlain(requestData),
            }).then((response: {data: any}) => {
                let res = response.data;
                if(typeof options.transformResponse === 'function') {
                    res = options.transformResponse(res);
                }
                if(typeof options.onSuccess === 'function') {
                    options.onSuccess(res);
                }
                resolve(res);
            }).catch(error => {
                let err = error;
                if(typeof options.transformErrorResponse === 'function') {
                    err = options.transformErrorResponse(error);
                }
                if(typeof options.onError === 'function') {
                    options.onError(err);
                }
                if (err instanceof AxiosError) {
                    reject(err as AxiosError);
                } else {
                    reject(err);
                }
            });
        });
    }

    get(url: string, options?:HttpRequestOptions) {
        options = {
            ...options,
            method: 'GET',
            path: url
        }

        return this.request(options);
    }

    post(url: string, data: RequestData, options?:HttpRequestOptions) {
        options = {
            ...options,
            data,
            method: 'POST',
            path: url
        }

        return this.request(options);
    }

    put(url: string, data: RequestData, options?:HttpRequestOptions) {
        options = {
            ...options,
            data,
            method: 'PUT',
            path: url
        }

        return this.request(options);
    }

    delete(url: string, options?:HttpRequestOptions) {
        options = {
            ...options,
            method: 'DELETE',
            path: url
        }

        return this.request(options);
    }
}

export const httpService = new HttpService();

function createApiServiceEndpoint (http: HttpService, endpointConfig: HttpRequestOptions, baseApiPath: string) {
    const options: HttpRequestOptions = {
        baseUrl: baseApiPath,
        ...endpointConfig
    }

    let isLoading = false;

    const artifacts: Artifacts = {
        data: {},
        error: {},
        loading: () => {return isLoading},
        promise: new Promise(() => {})
    }

    
    return () => {
        artifacts.promise = new Promise((resolve, reject) => {
            isLoading = true;
            http.request(options).then(response => {
                artifacts.data = response;
                resolve(response);
                isLoading = false;
            }).catch(err => {
                reject(err);
                isLoading = false;
            });
        });
        
        return artifacts;
    };
}

function createApiServiceEndpointsMap (http: HttpService, endpoints: HttpRequestOptions[], baseApiPath: string) {
    const endpointsMap: HttpRequest = {};
    endpoints.map((endpoint: HttpRequestOptions) => {
        if(endpoint.name) {
            endpointsMap[endpoint.name] = createApiServiceEndpoint(http, endpoint, baseApiPath);
        } else {
            throw Error('Endpoint name missing');
        }
    });
    return endpointsMap;
}

export function createHttpService(apiOptions: HttpServiceOptions = {}) {
    apiOptions = {
        ...defaultApiOptions,
        ...apiOptions
    };
    const http: HttpService = new HttpService(apiOptions.baseApiPath, apiOptions.baseUrl);

    const baseApiPath = http.baseUrl;

    const predefinedEndpoints  = !!apiOptions.skipDefaultEndpoints ? {} : {
        fetchData: (options?:HttpRequestOptions) => {
            const url: string = apiOptions.baseApiPath || '';
            return http.get(url, options);
        },
        getOne: (id: string|number) => {
            const url: string = apiOptions.baseApiPath + `/${id}`;
            return http.get(url);
        },
        createOne: (data: RequestData, options?:HttpRequestOptions) => {
            const url: string = apiOptions.baseApiPath || '';
            return http.post(url, data, options);
        },
        updateOne: (id: string|number, data: RequestData, options?:HttpRequestOptions) => {
            const url: string = apiOptions.baseApiPath + `/${id}`;
            return http.put(url, data, options);
        }        
    };

    const customEndpoints = apiOptions.endpoints ? createApiServiceEndpointsMap(http, apiOptions.endpoints, baseApiPath) : {};

    const endpoints = {
        ...predefinedEndpoints,
        ...customEndpoints
    }

   return endpoints;
}
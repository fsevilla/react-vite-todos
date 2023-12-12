import axios, { AxiosError, AxiosResponse } from 'axios';
import { instanceToPlain } from 'class-transformer';

const apiUrl: string = 'https://jsonplaceholder.typicode.com/';

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

export type RequestData = {
    [key: string|number]: any
}

const defaultHttpRequestOptions: HttpRequestOptions = {
    method: 'GET',
    path: ''
}

export class HttpService {
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

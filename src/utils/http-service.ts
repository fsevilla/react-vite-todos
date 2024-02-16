import axios, { AxiosError } from 'axios';
import { instanceToPlain } from 'class-transformer';
import { HttpRequestsCache, CachedHttpRequestStatus } from './http-requests-cache';

const apiUrl = '';

const httpRequestsCache = HttpRequestsCache.getInstance();

export interface HttpRequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path?: string;
    baseUrl?: string;
    body?: RequestData;
    headers?: HttpHeaders;
    name?: string;
    params?: RequestParams;
    queryParams?: RequestParams;
    invalidateCache?: boolean;
    cache?: boolean;
    cacheExpiration?: number; // time in seconds, undefined or 0 if not cached
    onError?: (response: unknown) => void | unknown;
    onSuccess?: (response: unknown) => void | unknown;
    prepareData?: (requestData: unknown) => unknown;
    transformErrorResponse?: (response: unknown) => unknown;
    transformResponse?: (response: unknown) => unknown;
}

export type HttpHeaders = {
    [key: string]: string
}

export type RequestData = {
    [key: string|number]: unknown
}

export type RequestParams = {
    [key: string]: unknown;
}

const defaultHttpRequestOptions: HttpRequestOptions = {
    method: 'GET',
    path: '',
    params: {}
}

function objectToQueryString(queryParams: RequestParams) {
    return  Object.keys(queryParams).map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(queryParams[key] + '')).join('&');
}

function replaceParamsInUrl(url: string, params: RequestParams) {
    return url.replace(/\{(\w+)\}/g, (match, key) => params![key] ? params![key] + '' : '');
}

export class HttpService {
    baseUrl = '';
    basePath = '';

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
        const requestData = options.prepareData ? options.prepareData(options.body || {}) : options.body;
        const formattedPath: string = options.params ? replaceParamsInUrl(path, options.params) : path;
        const fullPath: string = options.queryParams ? formattedPath + '?' + objectToQueryString(options.queryParams) : formattedPath;

        if(options.cache && !options.invalidateCache) {
            const cachedItem = httpRequestsCache.getCachedResponse(options.method, formattedPath, options.queryParams, requestData);
            if(cachedItem) {
                if(cachedItem.status === CachedHttpRequestStatus.RESOLVED) {
                    return new Promise((resolve) => {
                        const res = cachedItem.response;
                        if(typeof options.onSuccess === 'function') {
                            options.onSuccess(res);
                        }
                        resolve(res);
                    });
                } else if(cachedItem.status === CachedHttpRequestStatus.PENDING && cachedItem.promise) {
                    return cachedItem.promise;
                }
            }
        } else if(options.invalidateCache) {
            httpRequestsCache.clearCachedHttpRequest(options.method, formattedPath, options.queryParams, requestData);
        }

        const promise = new Promise((resolve, reject) => {
            axios.request({
                url: baseUrl + fullPath,
                method: options.method,
                data: instanceToPlain(requestData),
            }).then((response: {data: unknown}) => {
                let res = response.data;

                if(typeof options.transformResponse === 'function') {
                    res = options.transformResponse(res);
                }
                if(typeof options.onSuccess === 'function') {
                    options.onSuccess(res);
                }
                resolve(res);
                if(options.cache) {
                    httpRequestsCache.setCachedResponse(options.method, formattedPath, options.queryParams, requestData, res);
                }
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
                if(options.cache) {
                    // Remove cache to perform request again after failure
                    httpRequestsCache.clearCachedHttpRequest(options.method, formattedPath, options.queryParams, requestData);
                }
            });
        });

        if(options.cache) {
            httpRequestsCache.addHttpRequest(options.method, formattedPath, options.queryParams, requestData, options.cacheExpiration, promise);
        }

        return promise;
    }

    get(url: string, options?:HttpRequestOptions) {
        options = {
            ...options,
            method: 'GET',
            path: url
        }

        return this.request(options);
    }

    post(url: string, body: RequestData, options?:HttpRequestOptions) {
        options = {
            ...options,
            body,
            method: 'POST',
            path: url
        }

        return this.request(options);
    }

    put(url: string, body: RequestData, options?:HttpRequestOptions) {
        options = {
            ...options,
            body,
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
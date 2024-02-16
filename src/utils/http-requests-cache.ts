export enum CachedHttpRequestStatus {
    PENDING,
    RESOLVED,
    FAILED,
    EXPIRED
}

export interface CachedHttpRequest {
    status: CachedHttpRequestStatus,
    expiration: number
    responseStatus?: number,
    response?: any,
    promise?: Promise<any>
}

export const DEFAULT_CACHE_EXPIRATION = 3600;

export class HttpRequestsCache {

    private static instance: HttpRequestsCache;
    private httpRequests: Map<string, CachedHttpRequest> = new Map();

    static getInstance(): HttpRequestsCache {
        if(!HttpRequestsCache.instance) {
            HttpRequestsCache.instance = new HttpRequestsCache();
        }

        return HttpRequestsCache.instance;
    }

    private getKey(method: string, url: string, queryParams: any, body: any) {
        const serializedQueryParams = queryParams ? JSON.stringify(queryParams) : '';
        let fullUrl = queryParams ? `${method}_${url}?${serializedQueryParams}` : `${method}_${url}`;
        try {
            const serializedBody = JSON.stringify(body);
            fullUrl += `__${serializedBody}`;
        } catch(e) {}
        return fullUrl;
    }

    addHttpRequest(method: string, url: string, queryParams: any, body: any, expiration?: number, promise?: Promise<any>) {
        const cachedItem: CachedHttpRequest|undefined = this.getCachedResponse(method, url, queryParams, body);
        expiration = expiration || DEFAULT_CACHE_EXPIRATION;
        const key = this.getKey(method, url, queryParams, body);
        if(!cachedItem) {
            const newRequest = {
                status: CachedHttpRequestStatus.PENDING,
                expiration: Date.now() + expiration * 1000,
                promise
            }
            this.httpRequests.set(key, newRequest);
        }
    }

    setCachedResponse(method: string, url: string, queryParams: any, body: any, response: any) {
        const key = this.getKey(method, url, queryParams, body);
        const cachedItem: CachedHttpRequest|undefined = this.getCachedResponse(method, url, queryParams, body);
        if(cachedItem) { 
            cachedItem.status = CachedHttpRequestStatus.RESOLVED;
            cachedItem.response = response;
            delete cachedItem.promise;
            this.httpRequests.set(key, cachedItem);
        }
    }

    getCachedResponse(method: string, url: string, queryParams: any, body: any) {
        const key: string = this.getKey(method, url, queryParams, body);
        const cachedItem = this.httpRequests.get(key);
        if(cachedItem && cachedItem.expiration > Date.now()) {
            return cachedItem;
        } 
            this.httpRequests.delete(key);
            return undefined;
        
    }

    clearCachedHttpRequest(method: string, url: string, queryParams?: any, body?: any) {
        const key: string = this.getKey(method, url, queryParams, body);
        this.httpRequests.delete(key);
    }

    clearAllCachedHttpRequests() {
        this.httpRequests.clear();
    }
}

export const httpRequestsCache: HttpRequestsCache = HttpRequestsCache.getInstance();
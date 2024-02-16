import { useState } from "react"; 

const environment = {
    IS_PROD: false
}

type HandlerConfig = {
    allowDuplicateGroups?: boolean;
    asynchronous?: boolean;
    enableLogging?: boolean;
}

type HandlerGroups = {
    [key: string]: HandlerRequestsResponse
}

type HandlerRequestFn = (data?: any) => Promise<unknown>;

type HandlerRequest = Promise<unknown> | HandlerRequestFn;

type HandlerRequests = Array<HandlerRequest>;

type HandlerRequestTypes = {
    required: HandlerRequests,
    optional?: HandlerRequests
}

type HandlerRequestsConfig = {
    asynchronous?: boolean; // overrides HandlerConfig's async setting
}

export type HandlerRequestsResponse = {
    isSettled: boolean;
    results: any[]
    totalComplete: number;
    totalErrorsCount: number;
    totalOptionalErrorsCount: number;
    totalOptionalSuccessCount: number;
    totalRequests: number;
    totalRequiredErrorsCount: number;
    totalRequiredSuccessCount: number;
    totalSuccessCount: number;
}

type HandlerCallbackFn = (data: any) => any;

interface LabeledPromise {
    required: boolean,
    request: HandlerRequest
}

type RequestsGroupConfig = {
    asynchronous?: boolean;
    onSuccess?: (responses: any) => any;
    onWarning?: (responses: any) => any;
    onError?: (responses: any) => any;
    skipInitialRequest?: boolean;
}

type RequestsGroupResponse = [
    (config?: RequestsGroupConfig) => Promise<any>,
    {
        response: any,
        isLoading: boolean,
        isInitialLoad: boolean,
        isSettled: boolean,
        error: any,
        warning: any
    }
]

const defaultHandlerConfig: HandlerConfig =  {
    allowDuplicateGroups: false,
    asynchronous: true,
    enableLogging: false
}

const defaultHandlerRequestsConfig: HandlerRequestsConfig =  {
    asynchronous: true
}

export class RequestsHandlerError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'RequestsHandlerError';
      Object.setPrototypeOf(this, RequestsHandlerError.prototype);
    }
}

export class RequestsHandlerDuplicateGroupError extends RequestsHandlerError {
    constructor(message: string) {
      super(message);
      this.name = 'RequestsHandlerDuplicateGroupError';
      Object.setPrototypeOf(this, RequestsHandlerDuplicateGroupError.prototype);
    }
}

export class OptionalRequestFailure extends RequestsHandlerError {
    constructor(message: string) {
      super(message);
      this.name = 'OptionalRequestFailure';
      Object.setPrototypeOf(this, OptionalRequestFailure.prototype);
    }
}

export class RequiredRequestFailure extends RequestsHandlerError {
    constructor(message: string) {
      super(message);
      this.name = 'RequiredRequestFailure';
      Object.setPrototypeOf(this, RequiredRequestFailure.prototype);
    }
}

export class UnknownRequestsHandlerError extends RequestsHandlerError {
    constructor(message: string) {
      super(message);
      this.name = 'UnknownRequestsHandlerError';
      Object.setPrototypeOf(this, UnknownRequestsHandlerError.prototype);
    }
}

class RequestQueue {
    private queue: any[] = [];

    add(promises: any) {
        if('map' in promises === false) {
            promises = [promises];
        }
        this.queue.push(promises)
    }

    next() {
        return this.queue.shift();
    }

    list() {
        return this.queue;
    }
}

export class RequestsHandler {
    private groups: HandlerGroups = {};
    private settings: HandlerConfig = {};
    private queue: RequestQueue;
    private isStarted = false;
    public isSettled = false;
    private doOnSuccess: HandlerCallbackFn = () => {};
    private doOnFailure: HandlerCallbackFn = () => {};
    responses: any[] = [];

    constructor(config?: HandlerConfig) {
        config = config || {};
        this.settings = {
            ...defaultHandlerConfig,
            ...config
        };
        this.queue = new RequestQueue();

    }

    private log(...args: any[]) {
        if(!!environment.IS_PROD) return;
        const now = new Date().toDateString();
        const logs = [`[RequestHandler] (${now})`, ...args];
        console.log.apply(this, logs);
    }

    async handleLabeledPromises(labeledPromises: LabeledPromise[], asynchronous: boolean) {
        const results: any[] = [];
        let optionalErrors = 0;
        try {
            if (!!asynchronous) {
                const parallelPromises = labeledPromises.map(async ({ request, required }, index: number) => {
                    results.push(null);
                    try {
                        const requestPromise = typeof request === 'function' ? request() : request;
                        const result = await requestPromise;
                        results[index] = result;
                    } catch (error) {
                        if (required) {
                            throw new RequiredRequestFailure('One or many required requests failed');
                        } else {
                            optionalErrors++;
                        }
                    }
                });
                await Promise.all(parallelPromises);
            } else {
                let index = 0;
                for (const { request, required } of labeledPromises) {
                    results.push(null);
                    try {
                        const requestPromise = typeof request === 'function' ? request(results) : request;
                        const result = await requestPromise;
                        results[index] = result;
                    } catch (error) {
                        if (required) {
                            throw new RequiredRequestFailure('One or many required requests failed');
                        } else {
                            optionalErrors++;
                        }
                    }
                    index++;
                }
            }

            if(optionalErrors) {
                throw new OptionalRequestFailure('One or many optional requests failed');
            } else {
                return results;
            }
        } catch (error) {
            throw { error, results };
        }
    }

    private async handleAll() {
        let promises = this.queue.next();
        let optionalError: null | OptionalRequestFailure = null;
        const results: any[] = [];
        while(promises) {
            try {
                const isQueue = promises[0] instanceof RequestQueue;
                if(isQueue) {
                    const queuePromises = promises[0].list().map((item: LabeledPromise[])  => item[0]);
                    let responses = await this.handleLabeledPromises(queuePromises, false);
                    responses = results.length === 1 ? responses[0] : responses;
                    results.push(responses);
                } else {
                    let responses = await this.handleLabeledPromises(promises, true);
                    responses = results.length === 1 ? responses[0] : responses;
                    results.push(responses);
                }
                promises = this.queue.next();

            } catch(e) {
                if((e as {error: RequestsHandlerError}).error instanceof RequiredRequestFailure) {
                    this.doOnFailure(e);
                    return e;
                } 
                    optionalError = (e as {error: OptionalRequestFailure}).error;
                    const responses = (e as {results: any[]}).results;
                    results.push(responses);
                    promises = this.queue.next();
                
            }
        }

        if(optionalError) {
            this.doOnFailure({
                error: optionalError,
                results
            })
        } else {
            const responses = results.length === 1 ? results[0] : results;
            this.doOnSuccess(responses);
            return responses;    
        }
    }

    requests(groupName: string | null, requests: HandlerRequests | HandlerRequestTypes, config?: HandlerRequestsConfig) {
            try {
                config = config || {};
                config = {
                    ...defaultHandlerRequestsConfig,
                    ...config
                }
                const asyncRequests = typeof config.asynchronous === 'boolean' ? config.asynchronous : this.settings.asynchronous;
                
                if(groupName && this.groups[groupName] && !this.settings.allowDuplicateGroups) {
                    throw new RequestsHandlerDuplicateGroupError(`Group '${groupName} already exists'`);
                }

                const promises: LabeledPromise[] = [];

                const requiredPromises = 'map' in requests ? requests : requests.required;
                const optionalPromises = 'optional' in requests ? requests.optional! : [];

                requiredPromises.map(request => {
                    promises.push({
                        required: true,
                        request
                    })
                });

                optionalPromises.map(request => {
                    promises.push({
                        required: false,
                        request
                    })
                });

                if(asyncRequests) {
                    this.queue.add(promises);
                } else {
                    const newQueue = new RequestQueue();
                    promises.map(promise => {
                        newQueue.add([promise]);
                    });
                    this.queue.add(newQueue);
                }

                if(!this.isStarted) {
                    // Use eventloop to allow all promises to be registered
                    setTimeout(() => this.handleAll(), 0);
                    this.isStarted = true;
                }
                
            } catch(e) {
                this.log(e);
                throw e;
            }

        return this;
    }

    parallel(requests: HandlerRequests | HandlerRequestTypes) {
        this.requests(null, requests, { asynchronous: true });
        return this;
    }

    series(requests: HandlerRequests | HandlerRequestTypes) {
        this.requests(null, requests, { asynchronous: false });
        return this;
    }

    then(callback: HandlerCallbackFn) {
        this.doOnSuccess = callback;
        return this;
    }

    catch(callback: HandlerCallbackFn): void {
        this.doOnFailure = callback;
    }
}

export function RequestsGroup(requests: HandlerRequests | HandlerRequestTypes, config?: RequestsGroupConfig): RequestsGroupResponse {
    const [handlerResponses, setHandlerResponses] = useState<any>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<null|{results: HandlerRequestsResponse, error: RequiredRequestFailure}>(null);
    const [warning, setWarning] = useState<null|{results: HandlerRequestsResponse, error: OptionalRequestFailure}>(null);
    const [isSettled, setIsSettled] = useState<boolean>(false);
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

    const requestHandler = new RequestsHandler();

    const reload = (config?: RequestsGroupConfig, forceReload?: boolean) => {
        return new Promise((resolve, reject) => {
            if((!isLoading && !isSettled && !requestHandler.isSettled) || forceReload) {
                setIsLoading(true);
                const rhConfig: HandlerRequestsConfig = {
                    asynchronous: config?.asynchronous || false
                }
                requestHandler.requests(null, requests, rhConfig).then(responses => {
                    setHandlerResponses(responses);
                    setIsLoading(false);
                    setIsSettled(true);
                    if(typeof config?.onSuccess === 'function') {
                        config.onSuccess(responses);
                    }
                    resolve(responses);
                }).catch(error => {
                    if(error.error instanceof RequiredRequestFailure) {
                        setError(error);
                        if(typeof config?.onError === 'function') {
                            config.onError(error);
                        }
                    } else {
                        setWarning(error);
                        if(typeof config?.onWarning === 'function') {
                            config.onWarning(error);
                        }
                    }
                    setIsLoading(false);
                    setIsSettled(true);
                    reject(error);
                });
            } else if(isSettled && isInitialLoad) {
                setIsInitialLoad(false);
                resolve(handlerResponses);
            }
        });
    }

    if(!config?.skipInitialRequest) {
        reload(config);
    }

    return [ (config?: RequestsGroupConfig) => reload(config, true), { response: handlerResponses, isLoading, isInitialLoad, isSettled, error, warning }];
}

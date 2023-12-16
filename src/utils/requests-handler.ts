import { AxiosError } from "axios";
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
    (config?: RequestsGroupConfig) => void,
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
      this.name = "RequestsHandlerError";
      Object.setPrototypeOf(this, RequestsHandlerError.prototype);
    }
}

export class RequestsHandlerDuplicateGroupError extends RequestsHandlerError {
    constructor(message: string) {
      super(message);
      this.name = "RequestsHandlerDuplicateGroupError";
      Object.setPrototypeOf(this, RequestsHandlerDuplicateGroupError.prototype);
    }
}

export class OptionalRequestFailure extends RequestsHandlerError {
    constructor(message: string) {
      super(message);
      this.name = "OptionalRequestFailure";
      Object.setPrototypeOf(this, OptionalRequestFailure.prototype);
    }
}

export class RequiredRequestFailure extends RequestsHandlerError {
    constructor(message: string) {
      super(message);
      this.name = "RequiredRequestFailure";
      Object.setPrototypeOf(this, RequiredRequestFailure.prototype);
    }
}

export class UnknownRequestsHandlerError extends RequestsHandlerError {
    constructor(message: string) {
      super(message);
      this.name = "UnknownRequestsHandlerError";
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
    private isStarted: boolean = false;
    private hasWarnings: boolean = false;
    public isSettled: boolean = false;
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
        let firstError: Error | null = null;
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
                            throw error;
                        } else if (!firstError) {
                            firstError = (error as AxiosError);
                        }
                    }
                });
                await Promise.all(parallelPromises);
            } else {
                for (const { request, required } of labeledPromises) {
                    try {
                        const requestPromise = typeof request === 'function' ? request(results) : request;
                        const result = await requestPromise;
                        results.push(result);
                    } catch (error) {
                        if (required) {
                            throw error;
                        } else if (!firstError) {
                        firstError = (error as AxiosError);
                      }
                    }
                }
            }

            return results;
        } catch (error) {
            for (const { required, request } of labeledPromises) {
                try {
                    if (required) {
                        const requestPromise = typeof request === 'function' ? request() : request;
                        await requestPromise;
                    } else {
                        console.error('Optional promise failed:', error);
                    }
                } catch (individualError) {
                    if (required) {
                        // If required promise fails individually, throw the original error
                        throw error;
                    } else {
                    // If optional promise fails individually, log the error and continue
                    console.error('Optional promise failed individually:', individualError);
                    }
                }
            }
            return results;
        }
    }

    private async handleAll() {
        let promises = this.queue.next();
        const results: any[] = [];

        while(promises) {
            const isQueue = promises[0] instanceof RequestQueue;
            if(isQueue) {
                const queuePromises = promises[0].list().map((item: LabeledPromise[])  => item[0]);
                this.log('Will handle serial promises: ', queuePromises);
                let responses = await this.handleLabeledPromises(queuePromises, false);
                responses = results.length === 1 ? responses[0] : responses;
                results.push(responses);
            } else {
                this.log('Will handle promises in parallel: ', promises);
                let responses = await this.handleLabeledPromises(promises, true);
                responses = results.length === 1 ? responses[0] : responses;
                results.push(responses);
            }
            this.log('Settled all grouped promises: ', results);
            promises = this.queue.next();
        }

        
        this.doOnSuccess(results);
        return results;
    }

    async handleNext(responseData?: any, queue?: RequestQueue) {
            queue = queue || this.queue;
            const promises = queue.next();
            if(promises) {
                const groupResponse: HandlerRequestsResponse = {
                    isSettled: false,
                    totalRequests: promises.length,
                    totalComplete: 0,
                    totalSuccessCount: 0,
                    totalErrorsCount: 0,
                    totalRequiredSuccessCount: 0,
                    totalRequiredErrorsCount: 0,
                    totalOptionalSuccessCount: 0,
                    totalOptionalErrorsCount: 0,
                    results: []
                };


                this.log('Will handle promises in queue', promises);
                const isQueue = promises[0] instanceof RequestQueue;
                if(isQueue) {
                    console.log('These are the serial promises: ', promises);
                } else {
                    groupResponse.results.push(null);
                
                    promises.map((requestItem: LabeledPromise, index: number) => {
                        const { required, request } = requestItem;
                        let promise = request;
    
                        if(typeof request === 'function') {
                            promise = request(responseData);
                        } else {
                            this.log('Failed to handle promise', promise);
                        }
    
    
                        (promise as Promise<unknown>).then((response: any) => {
                            groupResponse.results[index] = response;
                            groupResponse.totalSuccessCount++;
                            if(required) {
                                groupResponse.totalRequiredSuccessCount++;
                            } else {
                                groupResponse.totalOptionalSuccessCount++;
                            }
                        }).catch(error => {
                            groupResponse.results[index] = error;
                            groupResponse.totalErrorsCount++;
                            if(required) {
                                groupResponse.totalRequiredErrorsCount++;
                            } else {
                                groupResponse.totalOptionalErrorsCount++;
                            }
                        }).finally(() => {
                            groupResponse.totalComplete++;
                            if(groupResponse.totalComplete === groupResponse.totalRequests) {
                                if(groupResponse.totalRequiredErrorsCount) {
                                    this.isSettled = true;
                                    this.doOnFailure({
                                        results: groupResponse,
                                        error: new RequiredRequestFailure('One or many required requests failed')
                                    });
                                } else if(groupResponse.totalOptionalErrorsCount) {
                                    this.responses.push(groupResponse);
                                    this.hasWarnings = true;
                                    this.handleNext(groupResponse);
                                } else if (groupResponse.totalRequests === groupResponse.totalSuccessCount) {
                                    this.log('Group fulfilled', this.responses);
                                    const results = groupResponse.totalRequests === 1 ? groupResponse.results[0] : groupResponse.results;
                                    this.responses.push(results);
                                    this.handleNext(results);
                                } else {
                                    this.isSettled = true;
                                    this.doOnFailure({
                                        results: groupResponse,
                                        error: new UnknownRequestsHandlerError('An unknown requests handler error occurred')
                                    });
                                }
                            }
                        });
                    });
                }
            } else {
                if(this.hasWarnings) {
                    this.isSettled = true;
                    this.doOnFailure({
                        results: this.responses,
                        error: new OptionalRequestFailure('One or many optional requests failed')
                    });
                } else {
                    this.log('Requests queue is clear');
                    const responses = this.responses.length === 1 ? this.responses[0] : this.responses;
                    this.isSettled = true;
                    this.doOnSuccess(responses);
                }
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

    const reload = (config?: RequestsGroupConfig) => {
        if(!isLoading && !isSettled && !requestHandler.isSettled) {
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
            });
        } else if(isSettled && isInitialLoad) {
            setIsInitialLoad(false);
        }
    }

    if(!config?.skipInitialRequest) {
        reload(config);
    }

    return [ reload, { response: handlerResponses, isLoading, isInitialLoad, isSettled, error, warning }];
}

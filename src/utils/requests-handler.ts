/**
 * Document the following use cases:
 * 1.  construct and handler
 * 2.  pass promises
 * 3.  pass function => promise
 * 5.  parallel and series
 * 6.  pass response in series
 * 7.  modules (groups)
 * 8.  sequential use of series or parallel
 * 9.  final then/catch
 * 10. useState/custom hooks
 */

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
    queue: any[] = [];

    add(promises: any) {
        if('map' in promises === false) {
            promises = [promises];
        }
        this.queue.push(promises)
    }

    next() {
        return this.queue.shift();
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

    private log(message:any) {
        if(!!environment.IS_PROD) return;
        const now = new Date().toDateString();
        console.log(`[RequestHandler] (${now})`, message);
    }

    handleNext(responseData?: any) {
            const promises = this.queue.next();
            if(promises) {
                this.log('Will handle promises in queue');
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
                
                promises.map((requestItem: { type: string, request: HandlerRequest }, index: number) => {
                    const { type: requestType, request } = requestItem;
                    let promise = request;

                    if(typeof request === 'function') {
                        promise = request(responseData);
                    } else {
                        console.log('This promise was not a function', promise);
                    }

                    groupResponse.results.push(null);

                    (promise as Promise<unknown>).then((response: any) => {
                        groupResponse.results[index] = response;
                        groupResponse.totalSuccessCount++;
                        if(requestType === 'required') {
                            groupResponse.totalRequiredSuccessCount++;
                        } else {
                            groupResponse.totalOptionalSuccessCount++;
                        }
                    }).catch(error => {
                        groupResponse.results[index] = error;
                        groupResponse.totalErrorsCount++;
                        if(requestType === 'required') {
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
                                this.log('Group fulfilled');
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

    requests(groupName: string|null, requests: HandlerRequests | HandlerRequestTypes, config?: HandlerRequestsConfig) {
            try {
                config = config || {};
                config = {
                    ...defaultHandlerRequestsConfig,
                    ...config
                }
                const asyncRequests = config.asynchronous || this.settings.asynchronous;
                
                if(groupName && this.groups[groupName] && !this.settings.allowDuplicateGroups) {
                    throw new RequestsHandlerDuplicateGroupError(`Group '${groupName} already exists'`);
                }

                const promises: { type: string, request: HandlerRequest }[] = [];

                const requiredPromises = 'map' in requests ? requests : requests.required;
                const optionalPromises = 'optional' in requests ? requests.optional! : [];

                requiredPromises.map(request => {
                    promises.push({
                        type: 'required',
                        request
                    })
                });

                optionalPromises.map(request => {
                    promises.push({
                        type: 'optional',
                        request
                    })
                });

                if(asyncRequests) {
                    this.queue.add(promises);
                } else {
                    promises.map(promise => {
                        this.queue.add([promise]);
                    });
                }

                if(!this.isStarted) {
                    this.isStarted = true;
                    this.handleNext();
                }
                
            } catch(e) {
                this.log(e);
                throw e;
            }

        return this;
    }

    parallel(requests: HandlerRequests | HandlerRequestTypes) {
        // const timestamp = new Date().getTime();
        // const groupName: string = `module${this.groupsCount + 1}-${timestamp}`;
        this.requests(null, requests, { asynchronous: true });
        return this;
    }

    series(requests: HandlerRequests | HandlerRequestTypes) {
        // const timestamp = new Date().getTime();
        // const groupName: string = `module${this.groupsCount + 1}-${timestamp}`;
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

// const requestHandler = new RequestsHandler();
// console.log('Is requested again', requestHandler);

export function RequestsGroup(requests: HandlerRequests | HandlerRequestTypes, config?: HandlerRequestsConfig) {
    const [handlerResponses, setHandlerResponses] = useState<any>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<null|{results: HandlerRequestsResponse, error: RequiredRequestFailure}>(null);
    const [warning, setWarning] = useState<null|{results: HandlerRequestsResponse, error: OptionalRequestFailure}>(null);
    const [isSettled, setIsSettled] = useState<boolean>(false);
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

    const requestHandler = new RequestsHandler();

    const reload = () => {
        if(!isLoading && !isSettled && !requestHandler.isSettled) {
            setIsLoading(true);
            requestHandler.requests(null, requests, config).then(responses => {
                setHandlerResponses(responses);
                setIsLoading(false);
                setIsSettled(true);
            }).catch(error => {
                if(error.error instanceof RequiredRequestFailure) {
                    setError(error);
                } else {
                    setWarning(error);
                }
                setIsLoading(false);
                setIsSettled(true);
            });
        } else if(isSettled && isInitialLoad) {
            setIsInitialLoad(false);
        }
    }

    reload();

    return { response: handlerResponses, isLoading, isInitialLoad, isSettled, error, warning, reload };
}

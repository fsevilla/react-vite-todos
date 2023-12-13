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

type HandlerRequestsResponse = {
    isComplete: boolean;
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
    private isComplete: boolean = false;
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
                    isComplete: false,
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
                                this.doOnFailure({
                                    results: groupResponse,
                                    error: new RequiredRequestFailure('One or many required requests failed')
                                });
                            } else if(groupResponse.totalOptionalErrorsCount) {
                                this.doOnFailure({
                                    results: groupResponse,
                                    error: new OptionalRequestFailure('One or many optional requests failed')
                                });
                            } else if (groupResponse.totalRequests === groupResponse.totalSuccessCount) {
                                this.log('Group fulfilled: ');
                                this.log(groupResponse.results);
                                const results = groupResponse.totalRequests === 1 ? groupResponse.results[0] : groupResponse.results;
                                this.responses.push(results);
                                this.handleNext(results);
                            } else {
                                this.doOnFailure({
                                    results: groupResponse,
                                    error: new UnknownRequestsHandlerError('An unknown requests handler error occurred')
                                });
                            }
                        }
                    });
                });
            } else {
                this.log('Requests queue is clear');
                this.doOnSuccess(this.responses);
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

/**
 * USAGE
 * 
 * smartLoader.init();

// Load jquery & jquery UI after page load event
smartLoader.onLoad('jquery',{
  scripts: ['path/to/jquery.js','path/to/jquery-ui.js'],
  async: false, // make sure jquery loads before jquery ui
  onStart: function(){
    // Code to execute when module starts loading
  },
  onComplete: function(){
    // Code to execute after both scripts have loaded
  }
});

// Load the application script after jquery
smartLoader.loadModule('app',{
  scripts: 'path/to/app.js',
  dependency: 'jquery', // starts loading after module 'jquery' has been fully loaded
  onComplete: function(a){
    // Do something with scoped var 'a' defined in app.js
  }
});

// load lightbox JS & CSS after user has interacted with the page
smartLoader.onUserReady('lightbox',{
  scripts: 'path/to/lightbox.js',
  styles: 'path/to/lightbox.css'
});

// execute a function after both 'app' & 'lightbox' modules have loaded
smartLoader.onModuleReady(['app','lightbox'],'lightboxInit',function(){
  // Execute a JS function after both modules have loaded
  // e.g. initLightbox();
});
 */


/**
 * LOADER
(function(Global){
	Global.smartLoader = {
		version : "0.1.0",
		modules : [],
		events : [],
		scope : [],
		scripts : [],
		stylesheets : [],
		modulesCount : 0,
		loadedModulesCount : 0,
		options : {
			baseElement : null, // if passed, insert script and link tags before this element
			baseUrl : null, // base folder for scripts from framework and headerFooter modules
			paths : { // set of paths (relative to baseUrl) to be used for specific modules
				"scripts" : "scripts/"
			},
			noCache : false //if true, adds a timestamp to every asset loaded
		},
		init :function(options) {
			if(this.isInit)
				return false;
			this.isInit = true; // save initialization flag
			this.getUserAgent();
			this.setOptions(options);
			if(this.options.baseUrl===null) //Set baseUrl if not passed (to current document)
				this.options.baseUrl = this.getBaseUrl();
			this.Events.init();
		},
		loadMain: function(){
			var scripts = document.getElementsByTagName("script");

			for(var i=scripts.length-1;i>=0;i--){
				var path = scripts[i].src;
				if(path.match(/smartLoader(.*)(.js)/)){
					var mainScriptPath = scripts[i].getAttribute('data-main'),
						me = this;
					if(mainScriptPath){
						if(!this.isAbsoluteUrl(mainScriptPath)){
							mainScriptPath = this.getBaseUrl(scripts[i])+'/'+mainScriptPath+'.js';
						}
						this.loadScript(mainScriptPath,function(){
							me.init.call(me);
						});
					}
					
					break;
				}
			}
		},
		setOptions :function(options,defaults) {
			if(!defaults)
				defaults = this.options;
			if (options) {
				for ( var i in options) {
					if (options.hasOwnProperty(i)) {
						if(Object.prototype.toString.call(options[i])=="[object Object]" && options[i]!==null) //IE6 detects null as [object Object]
							defaults[i] = this.setOptions(options[i],defaults[i]);
						else
							defaults[i] = options[i];
					}
				}
			}
			return defaults;
		},
		getBaseUrl :function(script) {
			if(script){
				return script.src.split("/").slice(0, -1).join('/');
			}else{
				var tags = document.getElementsByTagName("script");
				for(var i=tags.length-1;i>=0;i--){
					var path = tags[i].src;
					if(path.match(/smartLoader(.*)(.js)/)){
						console.log(tags[i]);
						console.log("Base url: "+path.split("/").slice(0, -1).join('/'));
						return path.split("/").slice(0, -1).join('/');
					}
				}
				return "";
			}
		},
		getUserAgent :function() {
			var ua = navigator.userAgent;
			this.browser = {
				"name" : "unknown",
				"version" : null
			};
			var versionString;

			if(/Firefox\//.test(ua)){
				this.browser.name = "firefox";
				versionString = "Firefox";
			}else if(/MSIE/.test(ua)){
				this.browser.name = "ie";
				versionString = "MSIE";
			}else if(/Chrome/.test(ua)){
				this.browser.name = "chrome";
				versionString = "Chrome";
			}else if(/AppleWebKit/.test(ua)){
				this.browser.name = "safari";
				versionString = "Version";
			}else if(/Opera/.test(ua)){
				this.browser.name = "opera";
				versionString = "Version";
			}else if(/Gecko/.test(ua)){
				this.browser.name = "gecko";
				versionString = "rv";
			}else{
				return;
			}

			var index = ua.indexOf(versionString);
			if (index !== -1)
				this.browser.version = parseFloat(ua.substring(index+versionString.length+1));

			return this.browser;
		},
		getLoadedFiles :function(){ //get all the files in HTML
			var scripts = document.getElementsByTagName("script");
			for(var i=0;i<scripts.length;i++){
				if(!!scripts[i].src){
					this.loadedFiles[scripts[i].src] = "loaded";
				}
			}
		},
		loadScript :function(path,callback,baseElement) {
			if(!path)
				return;
			// console.log("Loading script: "+path);

			var script = document.createElement("script");
			script.setAttribute("type","text/javascript");
			if(this.options.noCache===false)
				script.setAttribute("src",path);
			else{
				var nc = path.indexOf("?")>0?"&":"?";
				nc += "noCache="+new Date().getTime();
				script.setAttribute("src",path+nc);// Add parameter to avoid caching if specified
			}
			me = this;

			if(typeof(callback)=="function"){
				if (script.readyState){  //IE					
					script.onreadystatechange = function() {
					if (script.readyState == "loaded" || script.readyState == "complete"){
						script.onreadystatechange = null;
						// console.log("loaded script: "+path);
						callback(path);
					}
				};
				} else {  //Others
					script.onload = function(){
						// console.log("loaded script: "+path);
						callback(path);
					};
				}
			}

			this.insertElement(script,baseElement);
		},
		loadCSS :function(path,callback,baseElement) {
			if(!path)
				return;
			//Remember IE8 wont load more than 31 link tags. Use import with createStyleSheet instead
			var css = document.createElement("link");
			css.setAttribute("type","text/css");
			css.setAttribute("rel","stylesheet");
			if(this.options.noCache===false)
				css.setAttribute("href",path);
			else{
				var nc = path.indexOf("?")>0?"&":"?";
				nc += "noCache="+new Date().getTime();
				css.setAttribute("href",path+nc);// Add parameter to avoid caching if specified
			}
			me = this;
			if(typeof(callback)=="function"){
				if (css.readyState){  //IE
					css.onreadystatechange = function() {
					if (css.readyState == "loaded" || css.readyState == "complete"){
						css.onreadystatechange = null;
						// console.log("loaded css: "+path);
						callback(path);
					}
				};
				} else if(this.browser.name=="safari" || (this.browser.name=="firefox" && this.browser.version <= 4)){ //Safari or FireFox 4-
					var cssCount = document.styleSheets.length;
					var freq = 50;
					var startTime = new Date().getTime();
					var timeout = 1000; //calling timeout after a second
					var periodical = function(me){
						var isLoaded = false;
						var newCssCount = document.styleSheets.length;
						if(newCssCount > cssCount){
							var _path = me.options.noCache?path+nc:path;
								_path = me.makeAbsoluteUrl(_path);
							for (var i = newCssCount - 1; i >= cssCount; i--) {
								if(document.styleSheets[i].href == _path){
									isLoaded = true;
									break;
								}
							}
						}
						if (isLoaded) {
							// console.log("loaded css: "+path);
							callback(path);
						} else{
							if(new Date().getTime() < startTime + timeout){
								setTimeout(function(){
									periodical(me);
								}, freq);
							}
						}

					};

					setTimeout(function(){
						periodical(me);
					}, freq);

				} else {  //Others
					css.onload = function(){
						// console.log("loaded css: "+path);
						callback(path);
					};
				}
			}
			this.insertElement(css,baseElement);
		},
		insertElement :function(node,baseElement) {
			var parentNode = document.getElementsByTagName("head")[0];
			baseElement = baseElement || this.options.baseElement;
			if(baseElement){
				baseElement = typeof(baseElement)=="string"?document.getElementById(baseElement):baseElement;
				try{ parentNode = baseElement.parentNode; }catch(e){}
			}
			parentNode.insertBefore(node,baseElement);
		},
		initModule :function(moduleName) {
			//Init module on array
			if(!this.modules[moduleName]){
				this.modulesCount++;
				this.modules[moduleName] = {};
			}
			
			this.modules[moduleName] = {
				name: moduleName,
				status : this.modules[moduleName].status || null,
				dependency : this.modules[moduleName].dependency || [],
				files : this.modules[moduleName].files || {count : 0, loaded : 0}
			};
		},
		loadModule :function(moduleName,options) {
			if(typeof(moduleName)=="function" || typeof(moduleName)=="object"){
				options = moduleName;
				moduleName = options.name || "mod-"+(this.modules.length+1);
			}

			this.initModule(moduleName);

			if(typeof(options)=="function"){
				if(this.isModuleLoaded(moduleName,true)===false && this.isModuleLoaded(this.getDependencies(moduleName))){
					this.modules[moduleName].status   = "loaded";
					// console.log("Module '"+moduleName+"' loaded successfully");
					options.apply(self,this.getScopes(moduleName));
					this.setModuleReady(moduleName);
				}
			}else{
				var defaults = {
					scripts : null,
					styles : null,
					async : true,
					dependency : null,
					usePath : null,
					insertBefore : null,
					// timeout : 1000,
					onStart : null,
					onComplete : null
					// onTimeout : null
				};

				options = this.setOptions(options,defaults);

				// If module has dependency and this has not been loaded suscribes the module
				if(options.dependency!==null && this.isModuleLoaded(options.dependency)===false && this.isModuleOnQueue(moduleName)===false){
					this.onModuleReady(options.dependency,moduleName,options);
					return;
				}else if(options.dependency!==null && this.isModuleLoaded(options.dependency)===true && this.isModuleOnQueue(moduleName)===false){
					this.saveDependency(moduleName,options.dependency);
				}

				// If module has no dependency or this has been loaded
				if(this.isModuleOnQueue(moduleName)===false || (this.isModuleLoaded(this.getDependencies(moduleName))===true && this.isModuleLoaded(moduleName,true)===false)){ //validate with getDependencies instead of options.dependency for modules loaded with onModuleReady
					// console.log("Module '"+moduleName+"' is loading");					
					this.modules[moduleName].status = "loading";

					if(typeof(options.onStart)=="function"){
						// options.onStart.apply(self,this.getScopes(moduleName,true));
						options.onStart.apply(this.modules[moduleName],this.getScopes(moduleName,true));
					}

					//Save callback function
					// this.modules[moduleName].callback = options.onComplete;

					//Define path for scripts and stylesheets based on baseUrl and usePath option
					//Absolute URLs avoid using baseUrl and usePath options
					var me = this;

					var setPath = function(path){
						if(me.isAbsoluteUrl(path)===false){
							var relativePath = me.options.baseUrl;
							if(relativePath && !relativePath.match(/\/$/))
								relativePath += "/";
							if(options.usePath && me.options.paths[options.usePath]){
								relativePath += me.options.paths[options.usePath];
								if(!relativePath.match(/\/$/))
									relativePath += "/";
							}
							path = relativePath+path;
						}
						return path;
					};

					// Increment loaded files count and check if all are loaded to setModuleReady
					var _callback = function(src){
						me.modules[moduleName].files.loaded++;
						// if loaded == count => setModuleReady
						if(me.modules[moduleName].files.loaded == me.modules[moduleName].files.count){
							onComplete();
							me.setModuleReady(moduleName);
						}
					};

					var onComplete = function(){
						if(typeof(options.onComplete)=="function"){							
							// options.onComplete.apply(self,me.getScopes(moduleName));
							options.onComplete.apply(me.modules[moduleName],me.getScopes(moduleName));
						}
					};

					//Load stylesheets
					if (typeof(options.styles)=="object" && options.styles!==null) {
						var cssCount = options.styles.length;
						this.modules[moduleName].files.count += cssCount;
						for(var i=0;i<cssCount;i++){
							this.loadCSS(setPath(options.styles[i]),_callback,options.insertBefore);
						}
					} else if(typeof(options.styles)=="string"){
						this.modules[moduleName].files.count++;
						this.loadCSS(setPath(options.styles),_callback,options.insertBefore);
					}
					//Load scripts
					if (typeof(options.scripts)=="object" && options.scripts!==null) {
						var current = 0;
						var scriptsCount = options.scripts.length;
						this.modules[moduleName].files.count += scriptsCount;
						var loadScripts = function(){
							if(current<scriptsCount){
								var _path = setPath(options.scripts[current]);
								// console.log("Adding the following to scripts array: "+_path);
								me.scripts[_path]=moduleName; //Add to scripts array with module name as value
								if(options.async===false){
									me.loadScript(_path,function(){
										_callback();
										current++;
										loadScripts();
									},options.insertBefore);
								}else{
									me.loadScript(_path,_callback,options.insertBefore);
									current++;
									loadScripts();
								}
							}
						};
						loadScripts();
					} else if(typeof(options.scripts)=="string"){
						var _path = setPath(options.scripts);
						// console.log("Adding the following to scripts array: "+_path);
						this.scripts[_path] = moduleName;
						this.modules[moduleName].files.count++;
						this.loadScript(_path,_callback,options.insertBefore);
					}

					// if no files sent, set module ready
					if(options.styles===null && options.scripts===null){
						onComplete();
						this.setModuleReady(moduleName);
					}

				}
			}
		},
		isModuleLoaded :function(module,orLoading) {
			if(Object.prototype.toString.call(module)=="[object Array]"){
				return this.areModulesLoaded(module,orLoading);
			}else{
				var status = this.modules[module]?this.modules[module].status:null;
				if(status =="loaded"){
					return true;
				}else if(status =="loading" && orLoading===true){
					return true;
				}else if(module){
					return false;
				}else
					return true;
			}
		},
		areModulesLoaded :function(modules,orLoading) {
			var allLoaded = true;
			for(var i=0;i<modules.length;i++){
				if(this.isModuleLoaded(modules[i],orLoading)===false){
					allLoaded = false;
					break;
				}
			}
			return allLoaded;
		},
		isModuleOnQueue :function(module) {
			var status = this.modules[module]?this.modules[module].status:null;
			if(status=="loaded" || status=="loading" || status=="queued"){
			// if(status=="queued"){
				return true;
			}else{
				return false;
			}
		},
		isEventReady :function(e) {
			if(this.events[e]===true)
				return true;
			else
				return false;
		},
		addPath :function(name,path) {
			this.options.paths[name] = path;
		},
		onLoad :function(name,options) {
			if(this.isEventReady("load")){
				this.loadModule(name,options);
			}
			else{
				var me = this;
				this.Events.suscribe("load",function(){
					me.loadModule(name,options);
				});
			}
		},
		onUserReady :function(name,options) {
			if(this.isEventReady("userReady")){
				this.loadModule(name,options);
			}
			else{
				var me = this;
				this.Events.suscribe("userReady",function(){
					me.loadModule(name,options);
					me.Events.unsuscribe("userReady");
				});
			}
		},
		onModuleReady :function(dependency,name,options) {
			if(typeof(name)=="function" || typeof(name)=="object"){
				options = name;
				name = options.name || options;
			}

			this.saveDependency(name,dependency);

			if(this.isModuleLoaded(dependency)){
				this.loadModule(name,options);
			}else{
				var me = this;
				this.modules[name].status = "queued";
				var suscribeTo = dependency;
				if(typeof(dependency)=="string")
						dependency = [dependency];
				for(var d in dependency){
					// console.log("Suscribed module '"+name+"' to be loaded after '"+dependency[d]+"'");
					this.Events.suscribe("moduleReady:"+dependency[d],function(){
						me.loadModule(name,options);
					});
				}
			}

			//Save dependency for functions as a module. For object, saved in loadModule
			if(typeof(name)=="function" || typeof(options)=="function"){
				this.modules[name].dependency = dependency;
			}
		},
		getDependencies :function(moduleName) {
			return this.modules[moduleName].dependency;
		},
		saveDependency :function(moduleName,dependency) {
			this.initModule(moduleName);
			this.modules[moduleName].dependency = this.modules[moduleName].dependency.concat(dependency);
		},
		setModuleReady :function(name) {
			this.modules[name].status = "loaded"; //set status loaded
			this.loadedModulesCount++; //increment counter of loaded modules
			this.Events.fire("moduleReady:"+name); //trigger suscribed modules handler
		},
		setScope :function(moduleName,scope) {
			//AUTODETECTION OF MODULE FROM EXECUTING SCRIPT - TO BE REFACTORED
			if(typeof(moduleName)!="string"){
				scope = moduleName;
				moduleName = this.getModuleFromScript();
			}
			if(typeof(scope)=="function"){
				scope = scope.apply(self,this.getScopes(moduleName,true));
			}
			this.scope[moduleName] = scope || this.scope[moduleName];
		},
		getScope :function(moduleName) {
			return this.scope[moduleName];
		},
		getScopes :function(moduleName,onlyDependencies) {// Get array of scopes for each of the dependencies
			var scope = onlyDependencies?[]:[this.getScope(moduleName)];
			if(this.modules[moduleName]){
				for (var i = 0; i < this.modules[moduleName].dependency.length; i++) {
					scope.push(this.getScope(this.modules[moduleName].dependency[i]));
				}
			}
			return scope;
		},
		getModuleFromScript :function(path) {
			if(!path){
				var tags = document.getElementsByTagName("head")[0].getElementsByTagName('script');
				path = tags[tags.length-1].getAttribute('src');
			}
			return this.scripts[path];
		},
		isAbsoluteUrl :function(path,withProtocolOnly) {
			if(path.match(/(http:|https:|ftp:)/) || (path[0]=="/" && !withProtocolOnly))
				return true;
			else
				return false;
		},
		makeAbsoluteUrl :function(path) {
			if(this.isAbsoluteUrl(path))
				return path;
			var parts = path.split("/");
			var newParts = window.location.pathname.split("/");
				newParts.pop();
			for(var i=0; i<parts.length;i++){
				if(parts[i]=="..")
					newParts.pop();
				else
					newParts.push(parts[i]);
			}
			var absoluteUrl = window.location.origin+(newParts.join("/"));
			return absoluteUrl;
		},
		count :function(getLoadedOnly) {
			return getLoadedOnly?this.loadedModulesCount:this.modulesCount;
		},
		Events : {
			handlers : [],
			init :function() {
				var me = this;
				// Page load event
				var onLoad = function(data){
					Global.smartLoader.events["load"] = true;
					me.fire("load",data);
				};
				if(document.readyState=="complete"){
					onLoad();
				}else{
					this.addEvent("load",onLoad);
				}
				// User ready event
				var onUserReady = function(data){
					Global.smartLoader.events["userReady"] = true;
					me.fire("userReady",data);
				};
				var userReadyEvents = ['keydown','mousemove','mousedown'];
				this.addEvents(userReadyEvents,onUserReady);
			},
			suscribe :function(event,handler) {
				if (typeof (this.handlers[event]) == "undefined") {
					this.handlers[event] = [];
				}
				this.handlers[event].push(handler);
			},
			unsuscribe :function(event,handler) {
				if (!this.handlers[event]) {
					return;
				}
				if(handler){
					var idx = this.handlers[event].indexOf(handler);
					if (idx > -1) {
						this.handlers[event].splice(idx, 1);
					}
				}else{
					this.handlers[event]=null;
				}
			},
			fire :function(event,data) {
				var handlers = this.handlers[event];
				if (handlers) {
					for ( var i in handlers) {
						if (handlers.hasOwnProperty(i)) {
							if(typeof(handlers[i])=="function"){
								handlers[i](data);
							}
						}
					}
				}
			},
			addEvent : function(event,callback){
				var onEvent = "on"+event;
				if(typeof(window[onEvent])!="undefined"){
					if(typeof(window.addEventListener) != "undefined"){
						window.addEventListener( event, callback, false );
					}
					else if(typeof(window.attachEvent) != "undefined"){
						window.attachEvent(onEvent,callback);
					}
					else if(window[onEvent] !== null) {
						var oldEvent = window[onEvent];
						window[onEvent] = function (e){
							oldEvent(e);
							window[callback]();
						};
					}
					else{
						window[onEvent] = callback;
					}
				}else if(typeof(document[onEvent])!="undefined"){
					if(typeof(document.addEventListener) != "undefined"){
						document.addEventListener( event, callback, false );
					}
					else if(typeof(document.attachEvent) != "undefined"){
						document.attachEvent(onEvent,callback);
					}
					else if(document[onEvent] !== null) {
						var oldEvent = document[onEvent];
						document[onEvent] = function (e){
							oldEvent(e);
							document[callback]();
						};
					}
					else{
						document[onEvent] = callback;
					}
				}else{
					// console.log("Event '"+event+"' could not be added");
				}
			},
			addEvents: function(events,callback){
				for(var i=0;i<events.length;i++){
					this.addEvent(events[i],callback);
				}
			}
		}
	};

	// Initialize Loader
	Global.smartLoader.Events.addEvent("load",function(){
		Global.smartLoader.loadMain(); //calls init after loading main file
	});
})(window);

 */
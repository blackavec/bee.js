/* 
 * Copyright (C) 2015 Mahan Hazrati Sagharchi <eng.mahan.hazrati@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


(function (document, window) {
    /**
     * beeHoneycomb provides an object which contains chain method associated to framework's queue
     * @returns {object}
     */
    function beeHoneycomb() {
        return {
            xmlhttpRequest: null,
            resultType: 'text',
            queue: [],
            validMethods: ['get', 'post', 'put', 'head', 'delete', 'options', 'trace', 'connect', 'patch', 'copy', 'link', 'unlink', 'purge'],
            resultTypes: ['text', 'xml', 'json'],
            xmlhttpRequestInit: function () {
                var xmlHttp;
                if (window.XMLHttpRequest)
                {
                    /**
                     * code for IE7+, Firefox, Chrome, Opera, Safari
                     */
                    xmlHttp = new XMLHttpRequest();
                }
                else
                {
                    /**
                     * code for IE6, IE5
                     */
                    xmlHttp = new ActiveXObject('Microsoft.XMLHTTP');
                }
                this.xmlhttpRequest = xmlHttp;
                return xmlHttp;
            },
            getCountOfObject: function (obj, callback) {
                var count = 0;
                for (var k in obj) {
                    if (obj.hasOwnProperty(k)) {
                        ++count;
                    }
                }
                callback(count);
                return count;
            },
            appendToQueue: function (obj, callback) {
                this.queue.push(obj);
                if (typeof callback === 'function') {
                    callback();
                }
            },
            arraySerialize: function (obj, prefix) {
                var str = [];
                for (var p in obj) {
                    if (obj.hasOwnProperty(p)) {
                        var k = prefix ? prefix + '[' + p + ']' : p, v = obj[p];
                        str.push(typeof v == 'object' ?
                                serialize(v, k) :
                                encodeURIComponent(k) + '=' + encodeURIComponent(v));
                    }
                }
                return str.join('&');
            },
            urlUnserialize: function (s) {
                var str = decodeURIComponent(s).toString();
                var stripStr = str.split('?');
                var queryString = '';

                if (!(typeof stripStr[1] === 'undefined')) {
                    queryString = stripStr[1].toString().split('#')[0];
                }

                var queryStringArray = [];
                if (queryString) {
                    queryStringArray = queryString.split('&').map(function (kv) {
                        return kv.split('=', 2);
                    });
                }
                var queryStringObject = {};
                for (var x in queryStringArray) {
                    queryStringObject[queryStringArray[x][0]] = queryStringArray[x][1];
                }
                return queryStringObject;
            },
            urlStrip: function (s) {
                var str = decodeURIComponent(s).toString();
                var stripStr = str.split('?');
                return stripStr[0].toString();
            },
            urlQueryString: function (s) {
                var str = decodeURIComponent(s).toString();
                var stripStr = str.split('?');
                var queryString = '';
                if (!(typeof stripStr[1] === 'undefined')) {
                    queryString = stripStr[1].toString().split('#')[0];
                }
                return queryString;
            },
            urlHashString: function (s) {
                var str = decodeURIComponent(s).toString();
                var stripStr = str.split('?');
                var queryStringHash = '';
                if (!(typeof stripStr[1] === 'undefined')) {
                    queryStringHash = stripStr[1].toString().split('#')[1];
                }
                return queryStringHash;
            },
            queueSearch: function (attr) {
                // first fetch the objects that have specific type
                var queue = [];
                for (var x in this.queue) {
                    var faultCount = 0;
                    for (var y in attr) {
                        if (typeof this.queue[x][y] === 'string') {
                            if (this.queue[x][y] !== attr[y]) {
                                faultCount++;
                            }
                        } else {
                            faultCount++;
                        }
                    }
                    if (faultCount === 0) {
                        queue.push(this.queue[x]);
                    }
                }

                if (queue.length > 0) {
                    return queue[0];
                } else {
                    return false;
                }
            },
            resultData: function (type) {
                if (this.resultTypes.indexOf(type) === -1) {
                    throw 'Bee: Result data invalid type';
                }

                this.resultType = type;
                return this;
            },
            request: function (path) {
                if (typeof path !== 'string') {
                    throw 'Bee: Invalid request';
                }

                this.appendToQueue({
                    type: 'request',
                    path: path,
                    stripPath: this.urlStrip(path),
                    queryStringArray: this.urlUnserialize(path),
                    queryString: this.urlQueryString(path),
                    hashString: this.urlHashString(path)

                });
                return this;
            },
            method: function (method) {
                if (typeof method !== 'string') {
                    throw 'Bee: Invalid method';
                }

                if (this.validMethods.indexOf(method.toString().toLowerCase()) === -1) {
                    throw 'Bee: the logged method does not support by bee framework request handler';
                }

                this.appendToQueue({
                    type: 'method',
                    method: method.toString().toLowerCase()
                });
                return this;
            },
            data: function (method, data, merge) {
                if (typeof data !== 'object') {
                    throw 'Bee: Invalid request get data';
                }

                if (this.validMethods.indexOf(method.toString().toLowerCase()) === -1) {
                    throw 'Bee: the logged method does not support by bee framework request handler for request data';
                }

                this.appendToQueue({
                    type: 'reqData',
                    method: method.toString().toLowerCase(),
                    data: data,
                    merge: ((typeof merge === 'boolean') ? merge : true)
                });
                return this;
            },
            files: function (files) {
                if (typeof files !== 'object') {
                    throw 'Bee: file\'s object does not valid';
                }

                this.appendToQueue({
                    type: 'files',
                    isFile: true,
                    files: files
                });
                return this;
            },
            noAsync: function () {
                this.appendToQueue({
                    type: 'async',
                    async: false
                });
                return this;
            },
            credential: function (username, password) {
                if (typeof username !== 'string') {
                    throw 'Bee: credential username is not valid';
                }
                if (typeof password !== 'string') {
                    throw 'Bee: credential username is not valid';
                }

                this.appendToQueue({
                    type: 'credential',
                    username: username,
                    password: password
                });
                return this;
            },
            on: function (event, callback) {
                if (typeof event !== 'string') {
                    throw 'Bee: "on" event is not valid';
                }
                if (typeof callback !== 'function') {
                    throw 'Bee: "on" method is not valid';
                }

                this.appendToQueue({
                    type: 'on',
                    event: event,
                    callback: callback
                });
                return this;
            },
            /**
             * this method prepair and start the query to work 
             */
            execute: function () {
                this.xmlhttpRequestInit();
                var req = this.queueSearch({
                    type: 'request'
                });
                var reqAsync = this.queueSearch({
                    type: 'async'
                });
                var reqMethod = this.queueSearch({
                    type: 'method'
                });
                var reqGetData = this.queueSearch({
                    type: 'reqData',
                    method: 'get'
                });
                var reqPostData = this.queueSearch({
                    type: 'reqData',
                    method: 'post'
                });
                var reqCredential = this.queueSearch({
                    type: 'credential'
                });
                var reqFiles = this.queueSearch({
                    type: 'files'
                });
                var reqOnBeforeStart = this.queueSearch({
                    type: 'on',
                    event: 'beforestart'
                });
                var reqOnSuccess = this.queueSearch({
                    type: 'on',
                    event: 'success'
                });
                var reqOnCancel = this.queueSearch({
                    type: 'on',
                    event: 'cancel'
                });
                var reqOnFail = this.queueSearch({
                    type: 'on',
                    event: 'fail'
                });
                var reqOnProgress = this.queueSearch({
                    type: 'on',
                    event: 'progress'
                });

                var stripPath = req.stripPath;

                var extraQueryString = this.arraySerialize(reqGetData.data);

                var qs = [];
                if (reqGetData.merge === true) {
                    qs.push(req.queryString);
                }
                qs.push(extraQueryString);
                var queryString = qs.join('&');

                var queryString = ((queryString) ? '?' + queryString : '');
                var queryHash = ((req.hashString) ? '#' + req.hashString : '');
                var url = stripPath + queryString + queryHash;
                var method = ((reqMethod.method) ? reqMethod.method : 'get');

                this.xmlhttpRequest.open(
                        method,
                        url,
                        ((typeof reqAsync.async === 'boolean') ? reqAsync.async : true),
                        ((typeof reqCredential.username === 'string') ? reqCredential.username : ''),
                        ((typeof reqCredential.password === 'string') ? reqCredential.password : '')
                        );


                var files = ((typeof reqFiles.isFile === 'boolean') ? reqFiles.files : false);

                var formData = null;
                if (method.toString().toLowerCase() === 'post') {

                    if (files) {
                        var fd = new FormData();
                        // first post datas
                        for (var x in reqPostData.data) {
                            fd.append(x, reqPostData.data[x]);
                        }

                        // second files
                        for (var x in files) {
                            console.log(files[x].name);
                            fd.append(files[x].name, files[x]);
                        }

                        this.xmlhttpRequest.setRequestHeader('Content-type', 'multipart/form-data');
                        formData = fd;
                    } else {
//                        this.xmlhttpRequest.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                        this.xmlhttpRequest.setRequestHeader('Content-type', 'text/plain');
                        formData = this.arraySerialize(reqPostData.data);
                    }
                }

                var glob = this;
                if (reqOnFail) {
                    this.xmlhttpRequest.addEventListener("error", function (e) {
                        reqOnFail.callback(this);
                    }, false);
                }

                if (reqOnCancel) {
                    this.xmlhttpRequest.addEventListener("abort", function (e) {
                        reqOnCancel.callback(this);
                    }, false);
                }

                if (reqOnProgress) {
                    this.xmlhttpRequest.addEventListener("progress", function (e) {
                        reqOnProgress.callback(e);
                    }, false);
                }

                if (reqOnSuccess) {
                    this.xmlhttpRequest.addEventListener("load", function (e) {
                        var resultData = null;
                        
                        switch (glob.resultType) {
                            case 'text':
                                resultData = this.responseText;
                                break;
                            case 'xml':
                                resultData = this.responseXML;
                                break;
                            case 'json':
                                try {
                                    resultData = JSON.parse(this.responseText);
                                } catch (ex) {
                                    console.error('bee: json result is not correct. result=empty');
                                    resultData = {};
                                }
                                break;
                        }
                        reqOnSuccess.callback(resultData);
                    }, true);
                }

                if (reqOnBeforeStart) {
                    reqOnBeforeStart.callback();
                }

                this.xmlhttpRequest.send(formData);
            },
            bite: function () {
                this.execute();
            },
            send: function () {
                this.execute();
            },
            commit: function () {
                this.execute();
            },
            sting: function () {
                this.execute();
            },
            spread: function () {
                this.execute();
            }
        };
    }
    function beeScript() {
        return {
            script: null,
            queue: [],
            types: ['text/javascript', 'application/ecmascript', 'application/javascript', 'text/vbscript'],
            queueSearch: function (attr) {
                // first fetch the objects that have specific type
                var queue = [];
                for (var x in this.queue) {
                    var faultCount = 0;
                    for (var y in attr) {
                        if (typeof this.queue[x][y] === 'string') {
                            if (this.queue[x][y] !== attr[y]) {
                                faultCount++;
                            }
                        } else {
                            faultCount++;
                        }
                    }
                    if (faultCount === 0) {
                        queue.push(this.queue[x]);
                    }
                }

                if (queue.length > 0) {
                    return queue[0];
                } else {
                    return false;
                }
            },
            appendToQueue: function (obj, callback) {
                this.queue.push(obj);
                if (typeof callback === 'function') {
                    callback();
                }
            },
            scriptObject: function () {
                return document.createElement('script');
            },
            src: function (path) {
                if (typeof path !== 'string') {
                    throw 'Bee: Invalid src';
                }

                this.appendToQueue({
                    type: 'src',
                    src: path,
                });
                return this;
            },
            code: function (code) {
                if (typeof code !== 'function') {
                    throw 'Bee: Invalid code';
                }

                this.appendToQueue({
                    type: 'code',
                    code: code,
                });
                return this;
            },
            type: function (type) {
                if (typeof type !== 'string' || this.types.indexOf(type) === -1) {
                    throw 'Bee: Invalid type';
                }

                this.appendToQueue({
                    type: 'type',
                    value: type,
                });
                return this;
            },
            async: function () {
                if (this.queueSearch({
                    type: 'defer'
                })) {
                    throw 'Bee: Defer already declared';
                }

                this.appendToQueue({
                    type: 'async',
                    async: true,
                });
                return this;
            },
            defer: function () {
                if (this.queueSearch({
                    type: 'async'
                })) {
                    throw 'Bee: Async already declared';
                }
                this.appendToQueue({
                    type: 'defer',
                    defer: true,
                });
                return this;
            },
            charset: function (charset) {
                if (typeof charset !== 'string') {
                    throw 'Bee: Invalid language';
                }
                this.appendToQueue({
                    type: 'charset',
                    charset: charset,
                });
                return this;
            },
            on: function (event, callback) {
                if (typeof event !== 'string') {
                    throw 'Bee: "on" event is not valid';
                }
                if (typeof callback !== 'function') {
                    throw 'Bee: "on" method is not valid';
                }

                this.appendToQueue({
                    type: 'on',
                    event: event,
                    callback: callback
                });
                return this;
            },
            /**
             * start downloading 
             */
            execute: function () {
                this.script = this.scriptObject();

                var reqCode = this.queueSearch({
                    type: 'code'
                });
                var reqSrc = this.queueSearch({
                    type: 'src'
                });
                var reqType = this.queueSearch({
                    type: 'type'
                });
                var reqAsync = this.queueSearch({
                    type: 'async'
                });
                var reqDefer = this.queueSearch({
                    type: 'defer'
                });

                var reqCharset = this.queueSearch({
                    type: 'charset'
                });

                var reqOnBeforeStart = this.queueSearch({
                    type: 'on',
                    event: 'beforestart'
                });
                var reqOnLoad = this.queueSearch({
                    type: 'on',
                    event: 'load'
                });
                var reqOnError = this.queueSearch({
                    type: 'on',
                    event: 'error'
                });

                if (reqAsync) {
                    this.script.async = 1;
                }
                if (reqDefer) {
                    this.script.defer = 1;
                }

                if (reqCharset) {
                    this.script.setAttribute('charset', reqCharset.charset);
                }

                this.script.setAttribute('type', ((reqType) ? reqType.value : "text/javascript"));

                if (reqCode) {
                    this.script.innerHTML = '(' + reqCode.code.toString() + ')(document, window);';
                } else {
                    this.script.setAttribute('src', reqSrc.src);
                    if (reqOnLoad) {
                        this.script.onload = function (s) {
                            reqOnLoad.callback(this);
                        };
                    }
                    if (reqOnError) {
                        this.script.onerror = function (e) {
                            reqOnError.callback(this);
                        };
                    }

                }
                if (reqOnBeforeStart) {
                    reqOnBeforeStart.callback({});
                }
                document.getElementsByTagName('head')[0].appendChild(this.script);

                if (reqCode) {
                    if (reqOnLoad) {
                        reqOnLoad.callback({});
                    }
                }
            },
            bite: function () {
                this.execute();
            },
            send: function () {
                this.execute();
            },
            commit: function () {
                this.execute();
            },
            sting: function () {
                this.execute();
            },
            spread: function () {
                this.execute();
            }
        };
    }
    function beeLink() {
        return {
            link: null,
            queue: [],
            rels: ['alternate', 'archives', 'author', 'bookmark', 'external', 'first', 'help', 'icon', 'last', 'license', 'next', 'nofollow', 'noreferrer', 'pingback', 'prefetch', 'prev', 'search', 'sidebar', 'stylesheet', 'tag', 'up'],
            queueSearch: function (attr) {
                // first fetch the objects that have specific type
                var queue = [];
                for (var x in this.queue) {
                    var faultCount = 0;
                    for (var y in attr) {
                        if (typeof this.queue[x][y] === 'string') {
                            if (this.queue[x][y] !== attr[y]) {
                                faultCount++;
                            }
                        } else {
                            faultCount++;
                        }
                    }
                    if (faultCount === 0) {
                        queue.push(this.queue[x]);
                    }
                }

                if (queue.length > 0) {
                    return queue[0];
                } else {
                    return false;
                }
            },
            appendToQueue: function (obj, callback) {
                this.queue.push(obj);
                if (typeof callback === 'function') {
                    callback();
                }
            },
            linkObject: function () {
                return document.createElement('link');
            },
            href: function (path) {
                if (typeof path !== 'string') {
                    throw 'Bee: Invalid src';
                }

                this.appendToQueue({
                    type: 'href',
                    href: path,
                });
                return this;
            },
            hrefLang: function (value) {
                if (typeof value !== 'string') {
                    throw 'Bee: Invalid hreflang';
                }

                this.appendToQueue({
                    type: 'hreflang',
                    hreflang: value,
                });
                return this;
            },
            media: function (value) {
                if (typeof value !== 'string') {
                    throw 'Bee: Invalid media';
                }

                this.appendToQueue({
                    type: 'media',
                    value: value,
                });
                return this;
            },
            type: function (type) {
                if (typeof type !== 'string') {
                    throw 'Bee: Invalid type';
                }

                this.appendToQueue({
                    type: 'type',
                    value: type,
                });
                return this;
            },
            rel: function (rel) {
                if (typeof rel !== 'string' || this.rels.indexOf(rel) === -1) {
                    throw 'Bee: Invalid rel';
                }

                this.appendToQueue({
                    type: 'rel',
                    rel: rel,
                });
                return this;
            },
            charset: function (charset) {
                if (typeof charset !== 'string') {
                    throw 'Bee: Invalid language';
                }
                this.appendToQueue({
                    type: 'charset',
                    charset: charset,
                });
                return this;
            },
            on: function (event, callback) {
                if (typeof event !== 'string') {
                    throw 'Bee: "on" event is not valid';
                }
                if (typeof callback !== 'function') {
                    throw 'Bee: "on" method is not valid';
                }

                this.appendToQueue({
                    type: 'on',
                    event: event,
                    callback: callback
                });
                return this;
            },
            /**
             * start downloading 
             */
            execute: function () {
                this.link = this.linkObject();

                var reqHref = this.queueSearch({
                    type: 'href'
                });
                var reqHrefLang = this.queueSearch({
                    type: 'hreflang'
                });
                var reqType = this.queueSearch({
                    type: 'type'
                });
                var reqRel = this.queueSearch({
                    type: 'rel'
                });
                var reqCharset = this.queueSearch({
                    type: 'charset'
                });

                var reqOnBeforeStart = this.queueSearch({
                    type: 'on',
                    event: 'beforestart'
                });
                var reqOnLoad = this.queueSearch({
                    type: 'on',
                    event: 'load'
                });
                var reqOnError = this.queueSearch({
                    type: 'on',
                    event: 'error'
                });


                if (reqCharset) {
                    this.link.setAttribute('charset', reqCharset.charset);
                }

                this.link.setAttribute('type', ((reqType) ? reqType.value : "text/css"));


                if (reqHref) {
                    this.link.setAttribute('href', reqHref.href);
                } else {
                    throw 'Bee: href does not define';
                }
                if (reqRel) {
                    this.link.setAttribute('rel', reqRel.rel);
                } else {
                    throw 'Bee: rel does not define';
                }

                if (reqHrefLang) {
                    this.link.setAttribute('hreflang', reqHrefLang.hreflang);
                }
                if (reqOnLoad) {
                    this.link.onload = function (s) {
                        reqOnLoad.callback(this);
                    };
                }
                if (reqOnError) {
                    this.link.onerror = function (e) {
                        reqOnError.callback(this);
                    };
                }

                if (reqOnBeforeStart) {
                    reqOnBeforeStart.callback({});
                }
                document.getElementsByTagName('head')[0].appendChild(this.link);

            },
            bite: function () {
                this.execute();
            },
            send: function () {
                this.execute();
            },
            commit: function () {
                this.execute();
            },
            sting: function () {
                this.execute();
            },
            spread: function () {
                this.execute();
            }
        };
    }
    function beeStyle() {
        return {
            style: null,
            queue: [],
            queueSearch: function (attr) {
                // first fetch the objects that have specific type
                var queue = [];
                for (var x in this.queue) {
                    var faultCount = 0;
                    for (var y in attr) {
                        if (typeof this.queue[x][y] === 'string') {
                            if (this.queue[x][y] !== attr[y]) {
                                faultCount++;
                            }
                        } else {
                            faultCount++;
                        }
                    }
                    if (faultCount === 0) {
                        queue.push(this.queue[x]);
                    }
                }

                if (queue.length > 0) {
                    return queue[0];
                } else {
                    return false;
                }
            },
            appendToQueue: function (obj, callback) {
                this.queue.push(obj);
                if (typeof callback === 'function') {
                    callback();
                }
            },
            styleObject: function () {
                return document.createElement('style');
            },
            code: function (code) {
                if (typeof code !== 'string') {
                    throw 'Bee: Invalid code';
                }

                this.appendToQueue({
                    type: 'code',
                    code: code,
                });
                return this;
            },
            type: function (type) {
                if (typeof type !== 'string') {
                    throw 'Bee: Invalid type';
                }

                this.appendToQueue({
                    type: 'type',
                    value: type,
                });
                return this;
            },
            charset: function (charset) {
                if (typeof charset !== 'string') {
                    throw 'Bee: Invalid language';
                }
                this.appendToQueue({
                    type: 'charset',
                    charset: charset,
                });
                return this;
            },
            on: function (event, callback) {
                if (typeof event !== 'string') {
                    throw 'Bee: "on" event is not valid';
                }
                if (typeof callback !== 'function') {
                    throw 'Bee: "on" method is not valid';
                }

                this.appendToQueue({
                    type: 'on',
                    event: event,
                    callback: callback
                });
                return this;
            },
            /**
             * start downloading 
             */
            execute: function () {
                this.style = this.styleObject();

                var reqCode = this.queueSearch({
                    type: 'code'
                });
                var reqType = this.queueSearch({
                    type: 'type'
                });
                var reqCharset = this.queueSearch({
                    type: 'charset'
                });

                var reqOnBeforeStart = this.queueSearch({
                    type: 'on',
                    event: 'beforestart'
                });
                var reqOnLoad = this.queueSearch({
                    type: 'on',
                    event: 'load'
                });


                if (reqCharset) {
                    this.style.setAttribute('charset', reqCharset.charset);
                }

                this.style.setAttribute('type', ((reqType) ? reqType.value : "text/css"));


                if (reqCode) {
                    this.style.innerHTML = reqCode.code;
                } else {
                    throw 'Bee: code does not define';
                }

                if (reqOnBeforeStart) {
                    reqOnBeforeStart.callback({});
                }
                document.getElementsByTagName('head')[0].appendChild(this.style);
                if (reqOnLoad) {
                    reqOnLoad.callback(this);
                }
            },
            bite: function () {
                this.execute();
            },
            send: function () {
                this.execute();
            },
            commit: function () {
                this.execute();
            },
            sting: function () {
                this.execute();
            },
            spread: function () {
                this.execute();
            }
        };
    }
    var bee = {
        /**
         * This method is for initiation of the framework
         */
        init: function () {

        },
        /**
         * This method is for initiation of the framework
         */
        load: function (part) {
            var partTmp = null;
            try {
                eval('partTmp = this.' + part + '();');
            } catch (ex) {
                throw 'bee: Module does not available. please visit the documentation.';
            }
            return partTmp;
        },
        start: function (part) {
            return this.load(part);
        },
        wizz: function (part) {
            return this.load(part);
        },
        /**
         * this method creates a new instance of framework's queue
         */
        honeycomb: function () {
            return new beeHoneycomb();
        },
        /**
         * script loader
         */
        script: function () {
            return new beeScript();
        },
        /**
         * link tag loader
         */
        link: function () {
            return new beeLink();
        },
        /**
         * style loader
         */
        style: function () {
            return new beeStyle();
        }
    };
    window.bee = bee;
    bee.init();
})(document, window);
/// <reference path="jquery.d.ts" />
if (typeof Array.prototype.indexOf !== "function") {
    Array.prototype.indexOf = function (searchElement, fromIndex) {
        var from = (typeof fromIndex === "number" ? fromIndex : 0);
        for (var i = from; i < this.length; i++) {
            if (this[i] === searchElement)
                return i;
        }
        return -1;
    };
}

var tui;
(function (tui) {
    tui.undef = (function (undefined) {
        return typeof undefined;
    })();

    tui.lang = (function () {
        return (navigator.language || navigator.browserLanguage || navigator.userLanguage).toLowerCase();
    })();

    var _translate = {};

    /**
    * Register a translation engine.
    */
    function registerTranslator(lang, func) {
        _translate[lang] = func;
    }
    tui.registerTranslator = registerTranslator;

    /**
    * Multi-language support, translate source text to specified language(default use tui.lang setting)
    * @param str {string} source text
    * @param lang {string} if specified then use this parameter as objective language otherwise use tui.lang as objective language
    */
    function str(str, lang) {
        if (!lang) {
            if (!tui.lang)
                return str;
            else
                lang = tui.lang;
        }
        var func = _translate[lang];
        if (typeof func === "function") {
            return func(str);
        } else
            return str;
    }
    tui.str = str;

    /**
    * Base object, all other control extended from this base class.
    */
    var EventObject = (function () {
        function EventObject() {
            this._events = {};
        }
        EventObject.prototype.bind = function (eventName, handler, priority) {
            if (!eventName)
                return;
            if (!this._events[eventName]) {
                this._events[eventName] = [];
            }
            var handlers = this._events[eventName];
            for (var i = 0; i < handlers.length; i++) {
                if (handlers[i] === handler)
                    return;
            }
            if (priority)
                handlers.push(handler);
            else
                handlers.splice(0, 0, handler);
        };

        EventObject.prototype.unbind = function (eventName, handler) {
            if (!eventName)
                return;
            var handlers = this._events[eventName];
            if (handler) {
                for (var i = 0; i < handlers.length; i++) {
                    if (handler === handlers[i]) {
                        handlers.splice(i, 1);
                        return;
                    }
                }
            } else {
                handlers.length = 0;
            }
        };

        /**
        * Register event handler.
        * @param {string} eventName
        * @param {callback} callback Which handler to be registered
        * @param {boolean} priority If true then handler will be triggered firstly
        */
        EventObject.prototype.on = function (eventName, callback, priority) {
            if (typeof priority === "undefined") { priority = false; }
            var envs = eventName.split(/\s+/);
            for (var i = 0; i < envs.length; i++) {
                var v = envs[i];
                this.bind(v, callback, priority);
            }
        };

        /**
        * Register event handler.
        * @param eventName
        * @param callback Which handler to be registered but event only can be trigered once
        * @param priority If true then handler will be triggered firstly
        */
        EventObject.prototype.once = function (eventName, callback, priority) {
            if (typeof priority === "undefined") { priority = false; }
            callback.isOnce = true;
            this.on(eventName, callback, priority);
        };

        /**
        * Unregister event handler.
        * @param eventName
        * @param callback Which handler to be unregistered if don't specified then unregister all handler
        */
        EventObject.prototype.off = function (eventName, callback) {
            var envs = eventName.split(/\s+/);
            for (var i = 0; i < envs.length; i++) {
                var v = envs[i];
                this.unbind(v, callback);
            }
        };

        /**
        * Fire event. If some handler process return false then cancel the event channe and return false either
        * @param {string} eventName
        * @param {any[]} param
        */
        EventObject.prototype.fire = function (eventName, data) {
            // srcElement: HTMLElement, e?: JQueryEventObject, ...param: any[]
            var array = this._events[eventName];
            if (!array) {
                return;
            }
            var _data = null;
            if (data) {
                _data = data;
                _data["name"] = eventName;
            } else
                _data = { "name": eventName };
            var removeArray = [];
            for (var i = 0; i < array.length; i++) {
                var handler = array[i];
                if (handler.isOnce)
                    removeArray.push(handler);
                var val = handler.call(this, _data);
                if (typeof val === "boolean" && !val)
                    return false;
            }
            for (var i = 0; i < removeArray.length; i++) {
                this.off(eventName, removeArray[i]);
            }
        };
        return EventObject;
    })();
    tui.EventObject = EventObject;

    var _eventObject = new EventObject();
    function on(eventName, callback, priority) {
        if (typeof priority === "undefined") { priority = false; }
        _eventObject.on(eventName, callback, priority);
    }
    tui.on = on;
    function once(eventName, callback, priority) {
        if (typeof priority === "undefined") { priority = false; }
        _eventObject.once(eventName, callback, priority);
    }
    tui.once = once;
    function off(eventName, callback) {
        _eventObject.off(eventName, callback);
    }
    tui.off = off;
    function fire(eventName, data) {
        return EventObject.prototype.fire.call(_eventObject, eventName, data);
    }
    tui.fire = fire;

    function toElement(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        var el = div.firstChild;
        return div.removeChild(el);
    }
    tui.toElement = toElement;

    /**
    * Get or set a HTMLElement's text content, return Element's text content.
    * @param elem {HTMLElement or ID of the element} Objective element
    * @param text {string or other object that can be translated to string}
    */
    function elementText(elem, text) {
        if (typeof elem === "string")
            elem = document.getElementById(elem);
        if (elem) {
            if (typeof text !== "undefined") {
                elem.innerHTML = "";
                elem.appendChild(document.createTextNode(text));
                return text;
            }
            if (typeof elem.textContent !== "undefined")
                return elem.textContent;
            var buf = "";
            for (var i = 0; i < elem.childNodes.length; i++) {
                var c = elem.childNodes[i];
                if (c.nodeName.toLowerCase() === "#text") {
                    buf += c.nodeValue;
                } else
                    buf += elementText(c);
            }
            return buf;
        } else
            return null;
    }
    tui.elementText = elementText;

    /**
    * Get object position related of the offsetParent or of the window if offsetParent is null.
    * @param target Target object to obtain position info
    * @param offsetParent Relative container which the destination object will be related to.
    * @param withPage If true then computed position is related html page(body) object otherwise is related to window
    */
    function offsetToPage(target, offsetParent, withPage) {
        if (typeof withPage === "undefined") { withPage = false; }
        var body = top.document.body || top.document.getElementsByTagName("body")[0];
        if (!offsetParent || !offsetParent.nodeName)
            offsetParent = top.document.documentElement || body;
        var extraLeft = 0;
        var extraTop = 0;

        if (offsetParent.nodeName.toLowerCase() === "html") {
            if (offsetParent.scrollLeft !== 0 && offsetParent.scrollLeft === body.scrollLeft) {
                extraLeft = offsetParent.scrollLeft;
            }
            if (offsetParent.scrollTop !== 0 && offsetParent.scrollTop === body.scrollTop) {
                extraTop = offsetParent.scrollTop;
            }
        }
        if (withPage) {
            extraLeft += offsetParent.scrollLeft;
            extraTop += offsetParent.scrollTop;
        }
        var curleft = 0;
        var curtop = 0;
        function getFrame(obj) {
            var frame = null;
            while (obj) {
                if (obj.nodeName === "#document") {
                    curleft -= (obj.documentElement ? obj.documentElement.clientLeft : 0);
                    curtop -= (obj.documentElement ? obj.documentElement.clientTop : 0);
                    frame = (obj.defaultView || obj.parentWindow).frameElement || null;
                    break;
                }
                obj = obj.parentNode;
            }
            return frame;
        }
        var obj = target;
        while (obj) {
            if (obj === target) {
                curleft += (obj.offsetLeft || 0);
                curtop += (obj.offsetTop || 0);
            } else {
                curleft += ((obj.offsetLeft || 0) + (obj.clientLeft || 0) - (obj.scrollLeft || 0));
                curtop += ((obj.offsetTop || 0) + (obj.clientTop || 0) - (obj.scrollTop || 0));
            }
            if (obj === offsetParent)
                break;
            if (obj.offsetParent && $(obj).css("position") !== "fixed" && obj.offsetParent.nodeName.toLowerCase() !== "html") {
                obj = obj.offsetParent;
            } else {
                var box = obj.ownerDocument.documentElement || obj.ownerDocument.body;
                var fixed = false;
                if ($(obj).css("position") === "fixed")
                    fixed = true;
                curleft += ((box.offsetLeft || 0) + (box.clientLeft || 0) - (fixed ? 0 : (box.scrollLeft || 0)));
                curtop += ((box.offsetTop || 0) + (box.clientTop || 0) - (fixed ? 0 : (box.scrollTop || 0)));
                obj = getFrame(obj);
            }
        }
        return { x: curleft + extraLeft, y: curtop + extraTop };
    }
    tui.offsetToPage = offsetToPage;

    /**
    * Obtain hosted document's window size
    */
    function windowSize() {
        var w = 630, h = 460;
        if (document.body && document.body.offsetWidth) {
            w = document.body.offsetWidth;
            h = document.body.offsetHeight;
        }
        if (document.compatMode === 'CSS1Compat' && document.documentElement && document.documentElement.offsetWidth) {
            w = document.documentElement.offsetWidth;
            h = document.documentElement.offsetHeight;
        }
        if (window.innerWidth && window.innerHeight) {
            w = window.innerWidth;
            h = window.innerHeight;
        }
        return { width: w, height: h };
    }
    tui.windowSize = windowSize;
    ;

    /**
    * Get top window's body element
    */
    function getTopBody() {
        return top.document.body || top.document.getElementsByTagName("BODY")[0];
    }
    tui.getTopBody = getTopBody;

    /**
    * Get element's owner window
    */
    function getWindow(elem) {
        return elem.ownerDocument.defaultView || elem.ownerDocument.parentWindow || elem.ownerDocument.Script;
    }
    tui.getWindow = getWindow;

    /**
    * Deeply copy an object to an other object, but only contain properties without methods
    */
    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    tui.clone = clone;

    /**
    * Test whether the button code is indecated that the event is triggered by a left mouse button.
    */
    function isLButton(buttonCode) {
        if (tui.ieVer !== -1 && tui.ieVer < 9) {
            return (buttonCode === 1);
        } else {
            return buttonCode === 0;
        }
    }
    tui.isLButton = isLButton;

    /**
    * Prevent user press backspace key to go back to previous page
    */
    function banBackspace() {
        function ban(e) {
            var ev = e || window.event;
            var obj = ev.target || ev.srcElement;
            var t = obj.type || obj.getAttribute('type');
            var vReadOnly = obj.readOnly;
            var vDisabled = obj.disabled;
            vReadOnly = (typeof vReadOnly === tui.undef) ? false : vReadOnly;
            vDisabled = (typeof vDisabled === tui.undef) ? true : vDisabled;
            var flag1 = ev.keyCode === 8 && (t === "password" || t === "text" || t === "textarea") && (vReadOnly || vDisabled);
            var flag2 = ev.keyCode === 8 && t !== "password" && t !== "text" && t !== "textarea";
            if (flag2 || flag1)
                return false;
        }
        $(document).bind("keypress", ban);
        $(document).bind("keydown", ban);
    }
    tui.banBackspace = banBackspace;

    /**
    * Detect whether the given parent element is the real ancestry element
    * @param elem
    * @param parent
    */
    function isAncestry(elem, parent) {
        while (elem) {
            if (elem === parent)
                return true;
            else
                elem = elem.parentNode;
        }
        return false;
    }
    tui.isAncestry = isAncestry;

    /**
    * Detect whether the given child element is the real posterity element
    * @param elem
    * @param child
    */
    function isPosterity(elem, child) {
        return isAncestry(child, elem);
    }
    tui.isPosterity = isPosterity;

    /**
    * Detect whether the element is inside the document
    * @param {type} elem
    */
    function isInDoc(elem) {
        var obj = elem;
        while (obj) {
            if (obj.nodeName.toUpperCase() === "HTML")
                return true;
            obj = obj.parentElement;
        }
        return false;
    }
    tui.isInDoc = isInDoc;

    /**
    * Format a string use a set of parameters
    */
    function format(token) {
        var params = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            params[_i] = arguments[_i + 1];
        }
        var formatrg = /\{(\d+)\}/g;
        token && (typeof token === "string") && params.length && (token = token.replace(formatrg, function (str, i) {
            return params[i] === null ? "" : params[i];
        }));
        return token ? token : "";
    }
    tui.format = format;

    /**
    * Format a number that padding it with '0'
    */
    function paddingNumber(v, min, max, alignLeft) {
        if (typeof alignLeft === "undefined") { alignLeft = false; }
        var result = Math.abs(v) + "";
        while (result.length < min) {
            result = "0" + result;
        }
        if (typeof max === "number" && result.length > max) {
            if (alignLeft)
                result = result.substr(0, max);
            else
                result = result.substr(result.length - max, max);
        }
        if (v < 0)
            result = "-" + result;
        return result;
    }
    tui.paddingNumber = paddingNumber;

    /**
    * Get the parameter of the URL query string.
    * @param {String} url
    * @param {String} key Parameter name
    */
    function getParam(url, key) {
        key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regex = new RegExp("[\\?&]" + key + "=([^&#]*)"), results = regex.exec(url);
        return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
    }
    tui.getParam = getParam;

    /**
    * Get IE version
    * @return {Number}
    */
    tui.ieVer = (function () {
        var rv = -1;
        if (navigator.appName === "Microsoft Internet Explorer" || navigator.appName === "Netscape") {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) !== null)
                rv = parseFloat(RegExp.$1);
        }
        if (rv === -1 && navigator.appName === "Netscape") {
            var ua = navigator.userAgent;
            var re = new RegExp("Trident/([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) !== null)
                rv = parseFloat(RegExp.$1);
            if (rv >= 7.0)
                rv = 11.0;
        }
        return rv;
    })();

    /**
    * Get Firefox version
    * @return {Number}
    */
    tui.ffVer = (function () {
        var rv = -1;
        if (navigator.appName === "Netscape") {
            var ua = navigator.userAgent;
            var re = new RegExp("Firefox/([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) !== null)
                rv = parseFloat(RegExp.$1);
        }
        return rv;
    })();

    /**
    * Set cookie value
    * @param name
    * @param value
    * @param days valid days
    */
    function saveCookie(name, value, expires, path, domain, secure) {
        if (typeof secure === "undefined") { secure = false; }
        // set time, it's in milliseconds
        var today = new Date();
        today.setTime(today.getTime());

        /*
        if the expires variable is set, make the correct
        expires time, the current script below will set
        it for x number of days, to make it for hours,
        delete * 24, for minutes, delete * 60 * 24
        */
        if (expires) {
            expires = expires * 1000 * 60 * 60 * 24;
        }
        var expires_date = new Date(today.getTime() + (expires));
        document.cookie = name + "=" + encodeURIComponent(JSON.stringify(value)) + ((expires) ? ";expires=" + expires_date.toUTCString() : "") + ((path) ? ";path=" + path : "") + ((domain) ? ";domain=" + domain : "") + ((secure) ? ";secure" : "");
    }
    tui.saveCookie = saveCookie;

    /**
    * Get cookie value
    * @param name
    */
    function loadCookie(name) {
        var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
        if (arr !== null)
            return JSON.parse(decodeURIComponent(arr[2]));
        else
            return null;
    }
    tui.loadCookie = loadCookie;

    /**
    * Delete cookie
    * @param name
    */
    function deleteCookie(name, path, domain) {
        if (loadCookie(name))
            document.cookie = name + "=" + ((path) ? ";path=" + path : "") + ((domain) ? ";domain=" + domain : "") + ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
    }
    tui.deleteCookie = deleteCookie;

    /**
    * Save key value into local storage, if local storage doesn't usable then use local cookie instead.
    * @param {String} key
    * @param {String} value
    * @param {Boolean} sessionOnly If true data only be keeped in this session
    */
    function saveData(key, value, sessionOnly) {
        if (typeof sessionOnly === "undefined") { sessionOnly = false; }
        try  {
            var storage = (sessionOnly === true ? window.sessionStorage : window.localStorage);
            if (storage) {
                storage.setItem(key, JSON.stringify(value));
            } else
                saveCookie(key, value, 365);
        } catch (e) {
        }
    }
    tui.saveData = saveData;

    /**
    * Load value from local storage, if local storage doesn't usable then use local cookie instead.
    * @param {String} key
    * @param {Boolean} sessionOnly If true data only be keeped in this session
    */
    function loadData(key, sessionOnly) {
        if (typeof sessionOnly === "undefined") { sessionOnly = false; }
        try  {
            var storage = (sessionOnly === true ? window.sessionStorage : window.localStorage);
            if (storage)
                return JSON.parse(storage.getItem(key));
            else
                return loadCookie(key);
        } catch (e) {
            return null;
        }
    }
    tui.loadData = loadData;

    /**
    * Remove value from local storage, if local storage doesn't usable then use local cookie instead.
    * @param key
    * @param {Boolean} sessionOnly If true data only be keeped in this session
    */
    function deleteData(key, sessionOnly) {
        if (typeof sessionOnly === "undefined") { sessionOnly = false; }
        try  {
            var storage = (sessionOnly === true ? window.sessionStorage : window.localStorage);
            if (storage)
                storage.removeItem(key);
            else
                deleteCookie(key);
        } catch (e) {
        }
    }
    tui.deleteData = deleteData;
})(tui || (tui = {}));
//# sourceMappingURL=tui.core.js.map

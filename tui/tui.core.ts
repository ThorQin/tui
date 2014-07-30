/// <reference path="jquery.d.ts" />
if (typeof Array.prototype.indexOf !== "function") {
	Array.prototype.indexOf = function (searchElement: any, fromIndex?: number): number {
		var from: number = (typeof fromIndex === "number" ? fromIndex : 0);
		for (var i = from; i < this.length; i++) {
			if (this[i] === searchElement)
				return i;
		}
		return -1;
	};
}

module tui {
	export var KEY_TAB = 9;
	export var KEY_ENTER = 13;
	export var KEY_ESC = 27;
	export var KEY_SPACE = 32;
	export var KEY_LEFT = 37;
	export var KEY_UP = 38;
	export var KEY_RIGHT = 39;
	export var KEY_DOWN = 40;

	export var undef = ((undefined?): string => {
		return typeof undefined;
	})();

	export var undefVal = ((undefined?): any => {
		return undefined;
	})();

	export var lang = ((): string => {
		return (navigator.language || navigator.browserLanguage || navigator.userLanguage).toLowerCase();
	})();

	var _translate = {};

	/**
	 * Register a translation engine.
	 */
	export function registerTranslator(lang: string, dict: {}): void;
	export function registerTranslator(lang: string, func: (str: string) => string): void;
	export function registerTranslator(lang: string, translator: any): void {
		if (typeof translator === "function")
			_translate[lang] = translator;
		else if (typeof translator === "object" && translator !== null) {
			_translate[lang] = function(str: string) {
				return translator[str] || str;
			};
		}
	}

	/**
	 * Multi-language support, translate source text to specified language(default use tui.lang setting)
	 * @param str {string} source text
	 * @param lang {string} if specified then use this parameter as objective language otherwise use tui.lang as objective language
	 */
	export function str(str: string, lang?: string): string {
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

	export var uuid = (function () {
		var id = 0;
		return function () {
			var uid = 'tuid' + id++;
			return uid;
		};
	})();

	export interface EventHandler {
		(data: {}): any;
		isOnce?: boolean;
	}

	/**
	 * Base object, all other control extended from this base class.
	 */
	export class EventObject {
		private _events: Object = {};

		bind(eventName: string, handler: EventHandler, priority: boolean) {
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
		}

		unbind(eventName: string, handler: EventHandler) {
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
		}

		/**
		 * Register event handler.
		 * @param {string} eventName
		 * @param {callback} callback Which handler to be registered
		 * @param {boolean} priority If true then handler will be triggered firstly
		 */
		on(eventName: string, callback: EventHandler, priority: boolean = false): void {
			var envs = eventName.split(/\s+/);
			for (var i = 0; i < envs.length; i++) {
				var v = envs[i];
				this.bind(v, callback, priority);
			}
		}

		/**
		 * Register event handler.
		 * @param eventName
		 * @param callback Which handler to be registered but event only can be trigered once
		 * @param priority If true then handler will be triggered firstly
		 */
		once(eventName: string, callback: EventHandler, priority: boolean = false): void {
			callback.isOnce = true;
			this.on(eventName, callback, priority);
		}

		/**
		 * Unregister event handler.
		 * @param eventName
		 * @param callback Which handler to be unregistered if don't specified then unregister all handler
		 */
		off(eventName: string, callback?: EventHandler): void {
			var envs = eventName.split(/\s+/);
			for (var i = 0; i < envs.length; i++) {
				var v = envs[i];
				this.unbind(v, callback);
			}
		}

		/**
		 * Fire event. If some handler process return false then cancel the event channe and return false either
		 * @param {string} eventName
		 * @param {any[]} param
		 */
		fire(eventName: string, data?: {}): any {
			// srcElement: HTMLElement, e?: JQueryEventObject, ...param: any[]
			var array: EventHandler[] = this._events[eventName];
			if (!array) {
				return;
			}
			var _data: {} = null;
			if (data) {
				_data = data;
				_data["name"] = eventName;
			} else
				_data = { "name": eventName };
			var removeArray: EventHandler[] = [];
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
		}
	}

	var _eventObject: EventObject = new EventObject();
	export function on(eventName: string, callback: EventHandler, priority: boolean = false): void {
		_eventObject.on(eventName, callback, priority);
	}
	export function once(eventName: string, callback: EventHandler, priority: boolean = false): void {
		_eventObject.once(eventName, callback, priority);
	}
	export function off(eventName: string, callback?: EventHandler): void {
		_eventObject.off(eventName, callback);
	}
	export function fire(eventName: string, data?: {}): any {
		return EventObject.prototype.fire.call(_eventObject, eventName, data);
	}

	export function parseBoolean(string) {
		if (typeof string === tui.undef)
			return false;
		switch (String(string).toLowerCase()) {
			case "true":
			case "1":
			case "yes":
			case "y":
				return true;
			default:
				return false;
		}
	}

	export function toElement (html: string, withParent: boolean = false): Node {
		var div = document.createElement('div');
		div.innerHTML = $.trim(html);
		if (withParent)
			return div;
		var el = div.firstChild;
		return div.removeChild(el);
	}

	export function removeNode(node: Node) {
		node.parentNode && node.parentNode.removeChild(node);
	}

	/**
	 * Get or set a HTMLElement's text content, return Element's text content.
	 * @param elem {HTMLElement or ID of the element} Objective element
	 * @param text {string or other object that can be translated to string}
	 */
	export function elementText(elem, text?): string {
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
			var buf: string = "";
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

	export function relativePosition(srcObj: HTMLElement, offsetParent: HTMLElement) {
		if (!offsetParent.nodeName && !offsetParent.tagName)
			throw new Error("Offset parent must be an html element.");
		var result = { x: srcObj.offsetLeft, y: srcObj.offsetTop};
		var obj: HTMLElement = <HTMLElement>srcObj.offsetParent;
		while (obj) {
			if (obj === offsetParent)
				return result;
			result.x += ((obj.offsetLeft || 0) + (obj.clientLeft || 0) - (obj.scrollLeft || 0));
			result.y += ((obj.offsetTop || 0) + (obj.clientTop || 0) - (obj.scrollTop || 0));
			if (obj.nodeName.toLowerCase() === "body" && obj.offsetParent === null)
				obj = obj.parentElement;
			else
				obj = <HTMLElement>obj.offsetParent;
		}
		return null;
	};

	export function fixedPosition(target: HTMLElement): { x: number; y: number; } {
		var $target = $(target);
		var offset = $target.offset();
		var $doc = $(document);
		return {
			x: offset.left - $doc.scrollLeft(),
			y: offset.top - $doc.scrollTop()
		};
	}

	export function debugElementPosition(target: HTMLElement);
	export function debugElementPosition(target: string);
	export function debugElementPosition(target: any) {
		$(target).mousedown(function (e) {
			var pos = tui.fixedPosition(this);
			var anchor = document.createElement("span");
			anchor.style.backgroundColor = "#ccc";
			anchor.style.opacity = "0.5";
			anchor.style.display = "inline-block";
			anchor.style.position = "fixed";
			anchor.style.left = pos.x + "px";
			anchor.style.top = pos.y + "px";
			anchor.style.width = this.offsetWidth + "px";
			anchor.style.height = this.offsetHeight + "px";
			document.body.appendChild(anchor);
			$(anchor).mouseup(function (e) {
				document.body.removeChild(anchor);
			});
			// console.log(tui.format("x: {0}, y: {1}", pos.x, pos.y));
		});
	}

	/**
	 * Obtain hosted document's window size
	 */
	export function windowSize(): { width: number; height: number } {
		var w = 630, h = 460;
		if (document.body && document.body.offsetWidth) {
			w = document.body.offsetWidth;
			h = document.body.offsetHeight;
		}
		if (document.compatMode === 'CSS1Compat' &&
			document.documentElement &&
			document.documentElement.offsetWidth) {
			w = document.documentElement.offsetWidth;
			h = document.documentElement.offsetHeight;
		}
		if (window.innerWidth && window.innerHeight) {
			w = window.innerWidth;
			h = window.innerHeight;
		}
		return { width: w, height: h };
	};

	/**
	 * Get top window's body element
	 */
	export function getTopBody () {
		return top.document.body || top.document.getElementsByTagName("BODY")[0];
	}

	/**
	 * Get element's owner window
	 */
	export function getWindow(elem: HTMLElement): MSScriptHost {
		return elem.ownerDocument.defaultView || elem.ownerDocument.parentWindow; 
	}

	/**
	 * Deeply copy an object to an other object, but only contain properties without methods
	 */
	export function clone(obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	/**
	 * Test whether the button code is indecated that the event is triggered by a left mouse button.
	 */
	export function isLButton(buttonCode: number): boolean {
		if (tui.ieVer !== -1 && tui.ieVer < 9) {
			return (buttonCode === 1);
		} else {
			return buttonCode === 0;
		}
	}

	/**
	 * Prevent user press backspace key to go back to previous page
	 */
	export function banBackspace() : void {
		function ban(e) {
			var ev = e || window.event;
			var obj = ev.target || ev.srcElement;
			var t = obj.type || obj.getAttribute('type');
			var vReadOnly = obj.readOnly;
			var vDisabled = obj.disabled;
			vReadOnly = (typeof vReadOnly === undef) ? false : vReadOnly;
			vDisabled = (typeof vDisabled === undef) ? true : vDisabled;
			var flag1 = ev.keyCode === 8 && (t === "password" || t === "text" || t === "textarea") && (vReadOnly || vDisabled);
			var flag2 = ev.keyCode === 8 && t !== "password" && t !== "text" && t !== "textarea";
			if (flag2 || flag1)
				return false;
		}
		$(document).bind("keypress", ban);
		$(document).bind("keydown", ban);
	}

	/**
	 * Detect whether the given parent element is the real ancestry element
	 * @param elem
	 * @param parent
	 */
	export function isAncestry(elem: Node, parent: Node): boolean {
		while (elem) {
			if (elem === parent)
				return true;
			else
				elem = elem.parentNode;
		}
		return false;
	}

	/**
	 * Detect whether the given child element is the real posterity element
	 * @param elem
	 * @param child
	 */
	export function isPosterity(elem: Node, child: Node): boolean {
		return isAncestry(child, elem);
	}

	export function isFireInside(elem: Node, event: any): boolean {
		var target = event.target || event.srcElement;
		return isPosterity(elem, target);
	}

	/**
	 * Detect whether the element is inside the document
	 * @param {type} elem
	 */
	export function isInDoc(elem: HTMLElement): boolean {
		var obj: HTMLElement = elem;
		while (obj) {
			if (obj.nodeName.toUpperCase() === "HTML")
				return true;
			obj = obj.parentElement;
		}
		return false;
	}

	/**
	 * Format a string use a set of parameters
	 */
	export function format(token: string, ...params): string {
		var formatrg = /\{(\d+)\}/g;
		token && (typeof token === "string") && params.length && (token = token.replace(formatrg, function (str, i) {
			return params[i] === null ? "" : params[i];
		}));
		return token ? token : "";
	}

	/**
	 * Format a number that padding it with '0'
	 */
	export function paddingNumber(v: number, min: number, max?: number, alignLeft: boolean = false): string {
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

	/**
	 * Get the parameter of the URL query string.
	 * @param {String} url
	 * @param {String} key Parameter name
	 */
	export function getParam(url: string, key: string): string {
		key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regex = new RegExp("[\\?&]" + key + "=([^&#]*)"),
			results = regex.exec(url);
		return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	export class BackupedScrollPosition {
		private backupInfo: {obj:HTMLElement; left: number; top:number; }[] = [];
		constructor(target: HTMLElement) {
			var obj = target;
			while (obj && obj !== document.body) {
				obj = <HTMLElement>obj.parentElement;
				if (obj)
					this.backupInfo.push({obj: obj, left: obj.scrollLeft, top: obj.scrollTop});
			}
		}
		restore() {
			for (var i = 0; i < this.backupInfo.length; i++) {
				var item = this.backupInfo[i];
				item.obj.scrollLeft = item.left;
				item.obj.scrollTop = item.top;
			}
		}
	}

	export function backupScrollPosition(target: HTMLElement): BackupedScrollPosition {
		return new BackupedScrollPosition(target);
	}

	export function focusWithoutScroll(target: HTMLElement) {
		setTimeout(function () {
			if (tui.ieVer > 0) {
				//if (tui.ieVer > 8)
				//	target.setActive();
				//else {
				//	if (target !== document.activeElement)
						target.setActive();
				//}
			} else if (tui.ffVer > 0)
				target.focus();
			else {
				var backup = tui.backupScrollPosition(target);
				target.focus();
				backup.restore();
			}
		}, 0);
	}

	export function scrollToElement(elem: HTMLElement) {
		var obj = elem;
		while (obj) {
			var parent = obj.offsetParent;
			$(parent).animate({ scrollTop: $(obj).offset().top }, 200);
			obj = <HTMLElement>parent;
		}
	}

	/**
	 * Get IE version
	 * @return {Number}
	 */
	export var ieVer = (() => {
		var rv = -1; // Return value assumes failure.
		if (navigator.appName === "Microsoft Internet Explorer" ||
			navigator.appName === "Netscape") {
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
	export var ffVer = (() => {
		var rv = -1; // Return value assumes failure.
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
	export function saveCookie (name: string, value: any, expires?: number, path?: string, domain?: string, secure: boolean = false) {
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
		document.cookie = name + "=" + encodeURIComponent(JSON.stringify(value)) +
		((expires) ? ";expires=" + expires_date.toUTCString() : "") +
		((path) ? ";path=" + path : "") +
		((domain) ? ";domain=" + domain : "") +
		((secure) ? ";secure" : "");
	}


	/**
	 * Get cookie value
	 * @param name
	 */
	export function loadCookie (name: string) {
		var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
		if (arr !== null)
			return JSON.parse(decodeURIComponent(arr[2]));
		else
			return null;
	}

	/**
	 * Delete cookie
	 * @param name
	 */
	export function deleteCookie (name: string, path?: string, domain?: string) {
		if (loadCookie(name)) document.cookie = name + "=" +
			((path) ? ";path=" + path : "") +
			((domain) ? ";domain=" + domain : "") +
			";expires=Thu, 01-Jan-1970 00:00:01 GMT";
	}

	/**
	 * Save key value into local storage, if local storage doesn't usable then use local cookie instead.
	 * @param {String} key
	 * @param {String} value
	 * @param {Boolean} sessionOnly If true data only be keeped in this session
	 */
	export function saveData (key: string, value: any, sessionOnly: boolean = false): void {
		try {
			var storage = (sessionOnly === true ? window.sessionStorage : window.localStorage);
			if (storage) {
				storage.setItem(key, JSON.stringify(value));
			} else
				saveCookie(key, value, 365);
		} catch(e) {
		}
	}

	/**
	 * Load value from local storage, if local storage doesn't usable then use local cookie instead.
	 * @param {String} key
	 * @param {Boolean} sessionOnly If true data only be keeped in this session
	 */
	export function loadData (key: string, sessionOnly: boolean = false): any {
		try {
			var storage = (sessionOnly === true ? window.sessionStorage : window.localStorage);
			if (storage)
				return JSON.parse(storage.getItem(key));
			else
				return loadCookie(key);
		} catch (e) {
			return null;
		}
	}

	/**
	 * Remove value from local storage, if local storage doesn't usable then use local cookie instead.
	 * @param key
	 * @param {Boolean} sessionOnly If true data only be keeped in this session
	 */
	export function deleteData (key: string, sessionOnly: boolean = false) {
		try {
			var storage = (sessionOnly === true ? window.sessionStorage : window.localStorage);
			if (storage)
				storage.removeItem(key);
			else
				deleteCookie(key);
		} catch (e) {
		}
	}

	export function windowScrollElement(): HTMLElement {
		if (tui.ieVer > 0 || tui.ffVer > 0) {
			return window.document.documentElement;
		} else {
			return window.document.body;
		}
	}
}
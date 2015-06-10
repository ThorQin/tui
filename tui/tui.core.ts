/// <reference path="jquery.d.ts" />

// Embedded JSON2
var JSON: JSON;
if (!JSON) {
	JSON = <JSON>{};
}
(function () {
	"use strict";

	function f(n) {
		return n < 10 ? '0' + n : n;
	}

	if (typeof Date.prototype.toJSON !== 'function') {

		Date.prototype.toJSON = function (key) {

			return isFinite(this.valueOf()) ?
				this.getUTCFullYear() + '-' +
				f(this.getUTCMonth() + 1) + '-' +
				f(this.getUTCDate()) + 'T' +
				f(this.getUTCHours()) + ':' +
				f(this.getUTCMinutes()) + ':' +
				f(this.getUTCSeconds()) + 'Z' : null;
		};

		(<any>String.prototype).toJSON = (<any>Number.prototype).toJSON = (<any>Boolean.prototype).toJSON = function (key) {
			return this.valueOf();
		};
	}

	var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		gap,
		indent,
		meta = {
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"': '\\"',
			'\\': '\\\\'
		},
		rep;

	function quote(string) {
		escapable.lastIndex = 0;
		return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
			var c = meta[a];
			return typeof c === 'string' ? c :
				'\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
		}) + '"' : '"' + string + '"';
	}

	function str(key, holder) {
		var i,          // The loop counter.
			k,          // The member key.
			v,          // The member value.
			length,
			mind = gap,
			partial,
			value = holder[key];
		if (value && typeof value === 'object' &&
			typeof value.toJSON === 'function') {
			value = value.toJSON(key);
		}

		if (typeof rep === 'function') {
			value = rep.call(holder, key, value);
		}

		switch (typeof value) {
			case 'string':
				return quote(value);

			case 'number':
				return isFinite(value) ? String(value) : 'null';

			case 'boolean':
			case 'null':

				return String(value);

			case 'object':

				if (!value) {
					return 'null';
				}

				gap += indent;
				partial = [];

				if (Object.prototype.toString.apply(value) === '[object Array]') {

					length = value.length;
					for (i = 0; i < length; i += 1) {
						partial[i] = str(i, value) || 'null';
					}

					v = partial.length === 0 ? '[]' : gap ?
					'[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
					'[' + partial.join(',') + ']';
					gap = mind;
					return v;
				}

				if (rep && typeof rep === 'object') {
					length = rep.length;
					for (i = 0; i < length; i += 1) {
						if (typeof rep[i] === 'string') {
							k = rep[i];
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				} else {

					for (k in value) {
						if (Object.prototype.hasOwnProperty.call(value, k)) {
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				}

				v = partial.length === 0 ? '{}' : gap ?
				'{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
				'{' + partial.join(',') + '}';
				gap = mind;
				return v;
		}
	}

	if (typeof JSON.stringify !== 'function') {
		JSON.stringify = function (value, replacer?, space?) {

			var i;
			gap = '';
			indent = '';

			if (typeof space === 'number') {
				for (i = 0; i < space; i += 1) {
					indent += ' ';
				}

			} else if (typeof space === 'string') {
				indent = space;
			}

			rep = replacer;
			if (replacer && typeof replacer !== 'function' &&
				(typeof replacer !== 'object' ||
				typeof replacer.length !== 'number')) {
				throw new Error('JSON.stringify');
			}

			return str('', { '': value });
		};
	}

	if (typeof JSON.parse !== 'function') {
		JSON.parse = function (text, reviver) {

			var j;

			function walk(holder, key) {

				var k, v, value = holder[key];
				if (value && typeof value === 'object') {
					for (k in value) {
						if (Object.prototype.hasOwnProperty.call(value, k)) {
							v = walk(value, k);
							if (v !== undefined) {
								value[k] = v;
							} else {
								delete value[k];
							}
						}
					}
				}
				return reviver.call(holder, key, value);
			}

			text = String(text);
			cx.lastIndex = 0;
			if (cx.test(text)) {
				text = text.replace(cx, function (a) {
					return '\\u' +
						('0000' + a.charCodeAt(0).toString(16)).slice(-4);
				});
			}

			if (/^[\],:{}\s]*$/
				.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
					.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
					.replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

				j = eval('(' + text + ')');

				return typeof reviver === 'function' ?
					walk({ '': j }, '') : j;
			}
			throw new SyntaxError('JSON.parse');
		};
	}
} ());
// End of JSON2

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
	export var KEY_BACK = 8;
	export var KEY_TAB = 9;
	export var KEY_ENTER = 13;
	export var KEY_SHIFT = 16;
	export var KEY_CTRL = 17;
	export var KEY_ALT = 18;
	export var KEY_PAUSE = 19;
	export var KEY_CAPS = 20;
	export var KEY_ESC = 27;
	export var KEY_SPACE = 32;
	export var KEY_PRIOR = 33;
	export var KEY_NEXT = 34;
	export var KEY_END = 35;
	export var KEY_HOME = 36;
	export var KEY_LEFT = 37;
	export var KEY_UP = 38;
	export var KEY_RIGHT = 39;
	export var KEY_DOWN = 40;
	export var KEY_PRINT = 44;
	export var KEY_INSERT = 45;
	export var KEY_DELETE = 46;
	export var CONTROL_KEYS = {
		9: "Tab",
		13: "Enter",
		16: "Shift",
		17: "Ctrl",
		18: "Alt",
		19: "Pause",
		20: "Caps",
		27: "Escape",
		33: "Prior",
		34: "Next",
		35: "End",
		36: "Home",
		37: "Left",
		38: "Up",
		39: "Right",
		40: "Down",
		45: "Insert",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12"
	};

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
	 * Obtain hosted document's window size (exclude scrollbars if have)
	 * NOTE: this function will spend much CPU time to run, 
	 * so you SHOULD NOT try to call this function repeatedly.
	 */
	export function windowSize(): { width: number; height: number } {
		var div = document.createElement("div");
		div.style.display = "block";
		div.style.position = "fixed";
		div.style.left = "0";
		div.style.top = "0";
		div.style.right = "0";
		div.style.bottom = "0";
		div.style.visibility = "hidden";
		var parent = document.body || document.documentElement;
		parent.appendChild(div);
		var size = { width: div.offsetWidth, height: div.offsetHeight };
		parent.removeChild(div);
		return size;
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
	export function getWindow(elem: HTMLElement): any {
		return elem.ownerDocument.defaultView || (<any>elem.ownerDocument).parentWindow; 
	}

	function cloneInternal(obj, excludeProperties: any) {
		if (obj === null)
			return null;
		else if (typeof obj === undef)
			return undefined;
		else if (obj instanceof Array) {
			var newArray = [];
			for (var idx in obj) {
				if (obj.hasOwnProperty(idx) && excludeProperties.indexOf(idx) < 0) {
					newArray.push(cloneInternal(obj[idx], excludeProperties));
				}
			}
			return newArray;
		} else if (typeof obj === "number")
			return obj;
		else if (typeof obj === "string")
			return obj;
		else if (typeof obj === "boolean")
			return obj;
		else if (typeof obj === "function")
			return obj;
		else {
			var newObj = {};
			for (var idx in obj) {
				if (obj.hasOwnProperty(idx) && excludeProperties.indexOf(idx) < 0) {
					newObj[idx] = cloneInternal(obj[idx], excludeProperties);
				}
			}
			return newObj;
		}
	}

	/**
	 * Deeply copy an object to an other object, but only contain properties without methods
	 */
	export function clone(obj, excludeProperties?: any) {
		if (typeof excludeProperties === "string" && $.trim(excludeProperties).length > 0) {
			return cloneInternal(obj, [excludeProperties]);
		} else if (excludeProperties instanceof Array) {
			return cloneInternal(obj, excludeProperties);
		} else
			return JSON.parse(JSON.stringify(obj));
	}

	/**
	 * Test whether the button code is indecated that the event is triggered by a left mouse button.
	 */
	export function isLButton(e): boolean {
		var button = (typeof e.which !== "undefined") ? e.which : e.button;
		if (button == 1) {
			return true;
		} else
			return false;
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

	export function cancelDefault(event: any): boolean {
		if(event.preventDefault) {
			event.preventDefault();
		} else {
			event.returnValue = false;
		}
		return false;
	}
	
	export function cancelBubble(event: any): boolean {
		if (event && event.stopPropagation)
			event.stopPropagation(); 
		else
			window.event.cancelBubble = true;
		return false;
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

	/**
	 * Get the anchor of the URL query string.
	 * @param {String} url
	 */
	export function getAnchor(url: string): string {
		var anchor: any = location.href.match("(#.+)(?:\\?.*)?");
		if (anchor)
			anchor = anchor[1];
		return anchor;
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

	/**
	 * Load URL via AJAX request, It's a simplified version of jQuery.ajax method.
	 * 
	 */
	export function loadURL(url: string, completeCallback: (status: string, jqXHR: JQueryXHR) => any, async: boolean = true, method?: string, data?: any) {
		method = method ? method : "GET";
		$.ajax({
			"type": method,
			"url": url,
			"async": async,
			"contentType": "application/json",
			"data": (method === "GET" ? data : JSON.stringify(data)),
			"complete": function (jqXHR: JQueryXHR, status) {
				if (typeof completeCallback === "function" && completeCallback(status, jqXHR) === false) {
					return;
				}
			},
			"processData": (method === "GET" ? true : false)
		});
	}

	var _accMap = {};
	var _keyMap = {
		8: "Back",
		9: "Tab",
		13: "Enter",
		19: "Pause",
		20: "Caps",
		27: "Escape",
		32: "Space",
		33: "Prior",
		34: "Next",
		35: "End",
		36: "Home",
		37: "Left",
		38: "Up",
		39: "Right",
		40: "Down",
		45: "Insert",
		46: "Delete",
		48: "0",
		49: "1",
		50: "2",
		51: "3",
		52: "4",
		53: "5",
		54: "6",
		55: "7",
		56: "8",
		57: "9",
		65: "A",
		66: "B",
		67: "C",
		68: "D",
		69: "E",
		70: "F",
		71: "G",
		72: "H",
		73: "I",
		74: "J",
		75: "K",
		76: "L",
		77: "M",
		78: "N",
		79: "O",
		80: "P",
		81: "Q",
		82: "R",
		83: "S",
		84: "T",
		85: "U",
		86: "V",
		87: "W",
		88: "X",
		89: "Y",
		90: "Z",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		186: ";",
		187: "=",
		188: ",",
		189: "-",
		190: ".",
		191: "/",
		192: "~",
		219: "[",
		220: "\\",
		221: "]",
		222: "'"
	};
	function accelerate(e: JQueryKeyEventObject) {
		var k = _keyMap[e.keyCode];
		if (!k) {
			return;
		}
		k = k.toUpperCase();
		var key: string = (e.ctrlKey ? "CTRL" : "");
		if (e.altKey) {
			if (key.length > 0)
				key += "+";
			key += "ALT";
		}
		if (e.shiftKey) {
			if (key.length > 0)
				key += "+";
			key += "SHIFT";
		}
		if (e.metaKey) {
			if (key.length > 0)
				key += "+";
			key += "META";
		}
		if (key.length > 0)
			key += "+";
		key += k;
		var l = _accMap[key];
		if (l) {
			for (var i = 0; i < l.length; i++) {
				if (tui.fire(l[i], { name: l[i], event: e }) === false)
					return;
			}
		}
	}
	export function addAccelerate(key: string, actionId: string) {
		key = key.toUpperCase();
		var l: string[] = null;
		if (_accMap.hasOwnProperty(key))
			l = _accMap[key];
		else {
			l = [];
			_accMap[key] = l;
		}
		if (l.indexOf(actionId) < 0)
			l.push(actionId);
	}
	export function deleteAccelerate(key: string, actionId: string) {
		key = key.toUpperCase();
		if (!_accMap.hasOwnProperty(key))
			return;
		var l: string[] = _accMap[key];
		var pos = l.indexOf(actionId);
		if (pos >= 0) {
			l.splice(pos, 1);
			if (l.length <= 0)
				delete _accMap[key];
		}
	}
	$(document).keydown(accelerate);
}
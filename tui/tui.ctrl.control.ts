/// <reference path="tui.core.ts" />
module tui {
	var _maskDiv: HTMLDivElement = document.createElement("div");
	_maskDiv.className = "tui-mask";
	_maskDiv.setAttribute("unselectable", "on");
	var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
	$(_maskDiv).on(mousewheelevt, function (ev) {
		ev.stopPropagation();
		ev.preventDefault();
	});

	var _tooltip: HTMLSpanElement = document.createElement("span");
	_tooltip.className = "tui-tooltip";
	_tooltip.setAttribute("unselectable", "on");

	var _tooltipTarget: HTMLElement = null;

	/**
	 * Show a mask layer to prevent user drag or select document elements which don't want to be affected.
	 * It's very useful when user perform a dragging operation.
	 */
	export function mask() {
		document.body.appendChild(_maskDiv);
		return _maskDiv;
	}
	/**
	 * Close a mask layer
	 */
	export function unmask() {
		if (_maskDiv.parentNode)
			_maskDiv.parentNode.removeChild(_maskDiv);
		_maskDiv.innerHTML = "";
		_maskDiv.style.cursor = "";
		return _maskDiv;
	}

	export function showTooltip(target: HTMLElement, tooltip: string) {
		if (target === _tooltipTarget || target === _tooltip)
			return;
		document.body.appendChild(_tooltip);
		_tooltip.innerHTML = tooltip;
		_tooltipTarget = target;
		var pos = tui.fixedPosition(target);
		if (target.offsetWidth < 20)
			_tooltip.style.left = (pos.x + target.offsetWidth / 2 - 17) + "px";
		else
			_tooltip.style.left = pos.x + "px";
		_tooltip.style.top = pos.y + 8 + target.offsetHeight + "px";
	}

	export function closeTooltip() {
		if (_tooltip.parentNode)
			_tooltip.parentNode.removeChild(_tooltip);
		_tooltip.innerHTML = "";
		_tooltipTarget = null;
	}

	export function whetherShowTooltip(target: HTMLElement) {
		if (tui.isAncestry(target, _tooltip))
			return;
		var obj = target;
		while (obj) {
			var tooltip = obj.getAttribute("data-tooltip");
			if (tooltip) {
				showTooltip(obj, tooltip);
				return;
			} else {
				obj = obj.parentElement;
			}
		}
		if (!obj)
			closeTooltip();
	}

	export function whetherCloseTooltip(target: HTMLElement) {
		if (target !== _tooltipTarget && target !== _tooltip) {
			closeTooltip();
		}
	}

}
module tui.ctrl {
	export class Control<T> extends EventObject {

		constructor(tagName: string, className: string, el?: HTMLElement) {
			super();
			if (typeof el === "object")
				this.elem(el);
			else
				this.elem(tagName, className);
			if (this[0])
				this[0]._ctrl = this;
		}

		elem(el: HTMLElement): HTMLElement;
		elem(nodeName: string, cls: string): HTMLElement;
		elem(): HTMLElement;
		/**
		 * Construct a component
		 */
		elem(el?: any, clsName?: string): HTMLElement {
			if (el && el.nodeName || el === null) {
				this[0] = el;
				this.bindMainElementEvent();
			} else if (typeof el === "string" && typeof clsName === "string") {
				this[0] = document.createElement(el);
				this[0].className = clsName;
				this.bindMainElementEvent();
			}
			return this[0];
		}

		private bindMainElementEvent() {
			if (!this[0]) {
				return;
			}
			var self = this;
			$(this[0]).focus(() => {
				self.addClass("tui-focus");
			});
			$(this[0]).blur(() => {
				self.removeClass("tui-focus");
			});
		}

		private _exposedEvents = {};
		exposeEvents(eventNames: string[]);
		exposeEvents(eventNames: string);
		exposeEvents(eventNames: any) {
			if (this[0]) {
				if (typeof eventNames === "string")
					eventNames = (<string>eventNames).split(/\s+/);
				for (var i = 0; i < eventNames.length; i++) {
					this._exposedEvents[eventNames[i]] = true;
				}
			}
		}

		bind(eventName: string, handler: EventHandler, priority: boolean) {
			if (this._exposedEvents[eventName]) {
				$(this[0]).on(eventName, handler);
			} else
				super.bind(eventName, handler, priority);
		}

		unbind(eventName: string, handler: EventHandler) {
			if (this._exposedEvents[eventName]) {
				$(this[0]).off(eventName, handler);
			} else
				super.unbind(eventName, handler);
		}

		id(): string;
		id(val: string): T;
		id(val?: string): any {
			if (typeof val === "string") {
				if (this[0])
					this[0].id = val;
				return this;
			} else {
				if (this[0] && this[0].id)
					return this[0].id;
				else
					return null;
			}
		}

		hasAttr(attributeName: string): boolean {
			if (this[0])
				return typeof $(this[0]).attr(attributeName) === "string";
			else
				return false;
		}
		isAttrTrue(attributeName: string): boolean {
			if (this.hasAttr(attributeName)) {
				var attr = this.attr(attributeName).toLowerCase();
				return attr === "" || attr === "true" || attr === "on";
			} else
				return false;
		}
		/**
		 * Get the value of an attribute for the first element in the set of matched elements.
		 *
		 * @param attributeName The name of the attribute to get.
		 */
		attr(attributeName: string): string;
		/**
		 * Set one or more attributes for the set of matched elements.
		 *
		 * @param attributeName The name of the attribute to set.
		 * @param value A value to set for the attribute.
		 */
		attr(attributeName: string, value: string): T;
		/**
		 * Set one or more attributes for the set of matched elements.
		 *
		 * @param attributeName The name of the attribute to set.
		 * @param value A value to set for the attribute.
		 */
		attr(attributeName: string, value: number): T;
		/**
		 * Set one or more attributes for the set of matched elements.
		 *
		 * @param attributeName The name of the attribute to set.
		 * @param func A function returning the value to set. this is the current element. Receives the index position of the element in the set and the old attribute value as arguments.
		 */
		attr(attributeName: string, func: (index: number, attr: any) => any): T;
		/**
		 * Set one or more attributes for the set of matched elements.
		 *
		 * @param attributes An object of attribute-value pairs to set.
		 */
		attr(attributes: Object): T;
		attr(p1?: any, p2?: any): any {
			if (typeof p1 === "string" && typeof p2 === tui.undef) {
				if (!this[0])
					return null;
				else {
					var val = $(this[0]).attr(p1);
					if (val === null || typeof val === tui.undef)
						return null;
					else
						return val;
				}
			} else {
				if (this[0])
					$(this[0]).attr(p1, p2);
				return this;
			}
		}
		/**
		 * Remove an attribute from each element in the set of matched elements.
		 *
		 * @param attributeName An attribute to remove; as of version 1.7, it can be a space-separated list of attributes.
		 */
		removeAttr(attributeName: string): T;
		removeAttr(attributeName: string): any {
			if (this[0])
				$(this[0]).removeAttr(attributeName);
			return this;
		}
		

		/**
		 * Get the value of style properties for the first element in the set of matched elements.
		 *
		 * @param propertyName A CSS property.
		 */
		css(propertyName: string): string;
		/**
		 * Set one or more CSS properties for the set of matched elements.
		 *
		 * @param propertyName A CSS property name.
		 * @param value A value to set for the property.
		 */
		css(propertyName: string, value: string): T;
		/**
		 * Set one or more CSS properties for the set of matched elements.
		 *
		 * @param propertyName A CSS property name.
		 * @param value A value to set for the property.
		 */
		css(propertyName: string, value: number): T;
		/**
		 * Set one or more CSS properties for the set of matched elements.
		 *
		 * @param propertyName A CSS property name.
		 * @param value A value to set for the property.
		 */
		css(propertyName: string, value: string[]): T;
		/**
		 * Set one or more CSS properties for the set of matched elements.
		 *
		 * @param propertyName A CSS property name.
		 * @param value A value to set for the property.
		 */
		css(propertyName: string, value: number[]): T;
		/**
		 * Set one or more CSS properties for the set of matched elements.
		 *
		 * @param propertyName A CSS property name.
		 * @param value A function returning the value to set. this is the current element. Receives the index position of the element in the set and the old value as arguments.
		 */
		css(propertyName: string, value: (index: number, value: string) => string): T;
		/**
		 * Set one or more CSS properties for the set of matched elements.
		 *
		 * @param propertyName A CSS property name.
		 * @param value A function returning the value to set. this is the current element. Receives the index position of the element in the set and the old value as arguments.
		 */
		css(propertyName: string, value: (index: number, value: number) => number): T;
		/**
		 * Set one or more CSS properties for the set of matched elements.
		 *
		 * @param properties An object of property-value pairs to set.
		 */
		css(properties: Object): T;
		css(p1: any, p2?: any): any {
			if (typeof p1 === "string" && typeof p2 === tui.undef) {
				if (!this[0])
					return null;
				else
					return $(this[0]).css(p1);
			} else {
				if (this[0])
					$(this[0]).css(p1, p2);
				return this;
			}
		}


		hasClass(className: string): boolean {
			if (this[0])
				return $(this[0]).hasClass(className);
			else
				return false;
		}
		/**
		 * Adds the specified class(es) to each of the set of matched elements.
		 *
		 * @param className One or more space-separated classes to be added to the class attribute of each matched element.
		 */
		addClass(className: string): T;
		/**
		 * Adds the specified class(es) to each of the set of matched elements.
		 *
		 * @param function A function returning one or more space-separated class names to be added to the existing class name(s). Receives the index position of the element in the set and the existing class name(s) as arguments. Within the function, this refers to the current element in the set.
		 */
		addClass(func: (index: number, className: string) => string): T;
		addClass(param: any): any {
			if (this[0])
				$(this[0]).addClass(param);
			return this;
		}
		/**
		 * Remove a single class, multiple classes, or all classes from each element in the set of matched elements.
		 *
		 * @param className One or more space-separated classes to be removed from the class attribute of each matched element.
		 */
		removeClass(className?: string): T;
		/**
		 * Remove a single class, multiple classes, or all classes from each element in the set of matched elements.
		 *
		 * @param function A function returning one or more space-separated class names to be removed. Receives the index position of the element in the set and the old class value as arguments.
		 */
		removeClass(func: (index: number, className: string) => string): T;
		removeClass(param: any): any {
			if (this[0])
				$(this[0]).removeClass(param);
			return this;
		}
		refresh(): void {
		}

		is(attrName: string): boolean;
		is(attrName: string, val: boolean): T;
		is(attrName: string, val?: boolean): any {
			if (typeof val === "boolean") {
				if (val)
					this.attr(attrName, "true");
				else
					this.removeAttr(attrName);
				if (this[0] && tui.ieVer > 0 && tui.ieVer <= 8) {
					this[0].className = this[0].className;
				}
				return this;
			} else {
				return this.isAttrTrue(attrName);
			}
		}

		hidden(): boolean;
		hidden(val: boolean): T;
		hidden(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-hidden", val);
				if (val) {
					this.addClass("tui-hidden");
				} else
					this.removeClass("tui-hidden");
				return this;
			} else
				return this.is("data-hidden");
		}

		checked(): boolean;
		checked(val: boolean): T;
		checked(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-checked", val);
				this.fire("check", { ctrl: this, checked: val });
				return this;
			} else
				return this.is("data-checked");
		}

		actived(): boolean;
		actived(val: boolean): T;
		actived(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-actived", val);
				if (val) {
					this.addClass("tui-actived");
				} else
					this.removeClass("tui-actived");
				return this;
			} else
				return this.is("data-actived");
		}

		disabled(): boolean;
		disabled(val: boolean): T;
		disabled(val?: boolean): any {
			return this.is("data-disabled", val);
		}

		marked(): boolean;
		marked(val: boolean): T;
		marked(val?: boolean): any {
			return this.is("data-marked", val);
		}
		
		selectable(): boolean;
		selectable(val: boolean): T;
		selectable(val?: boolean): any {
			if (typeof val === "boolean") {
				if (!val)
					this.attr("unselectable", "on");
				else
					this.removeAttr("unselectable");
				return this;
			} else {
				return !this.isAttrTrue("unselectable");
			}
		}

		form(): string;
		form(txt?: string): T;
		form(txt?: string): any {
			if (typeof txt === "string") {
				this.attr("data-form", txt);
				return this;
			} else
				return this.attr("data-form");
		}

		field(): string;
		field(txt?: string): T;
		field(txt?: string): any {
			if (typeof txt === "string") {
				this.attr("data-field", txt);
				return this;
			} else
				return this.attr("data-field");
		}
		
		blur() {
			if (this[0]) {
				this[0].blur();
			}
		}
		focus() {
			if (this[0]) {
				setTimeout(() => { this[0].focus(); }, 0);
			}
		}

		focusWithoutScroll() {
			if (this[0]) {
				setTimeout(() => { tui.focusWithoutScroll(this[0]); }, 0);
			}
		}

		isHover(): boolean {
			if (this[0]) {
				return tui.isAncestry(_hoverElement, this[0]);
			} else
				return false;
		}

		isFocused(): boolean {
			if (this[0]) {
				return tui.isAncestry(document.activeElement, this[0]);
			} else
				return false;
		}

		isAncestry(ancestry: Node): boolean {
			return tui.isAncestry(this[0], ancestry);
		}

		isPosterity(posterity: Node): boolean {
			return tui.isPosterity(this[0], posterity);
		}

		autoRefresh(): boolean {
			return true;
		}
	}

	export function control<T>(param: string, constructor: { new (el?: HTMLElement, param?: any): T; }, constructParam?: any): T;
	export function control<T>(param: HTMLElement, constructor: { new (el?: HTMLElement, param?: any): T; }, constructParam?: any): T;
	export function control<T>(param: any, constructor: { new (el?: HTMLElement, param?: any): T; }, constructParam?: any): T {
		var elem = null;
		if (typeof param === "string" && param) {
			elem = document.getElementById(param);
			if (!elem)
				return null;
			if (elem._ctrl) {
				elem._ctrl.autoRefresh() && elem._ctrl.refresh();
				return elem._ctrl;
			} else if (typeof constructParam !== tui.undef){
				return new constructor(elem, constructParam);
			} else
				return new constructor(elem);
		} else if (param && param.nodeName) {
			elem = param;
			if (elem._ctrl) {
				elem._ctrl.autoRefresh() && elem._ctrl.refresh();
				return elem._ctrl;
			} else if (typeof constructParam !== tui.undef) {
				return new constructor(elem, constructParam);
			} else
				return new constructor(elem);
		} else if ((typeof param === tui.undef || param === null) && constructor) {
			if (typeof constructParam !== tui.undef) {
				return new constructor(null, constructParam);
			} else
				return new constructor();
		} else
			return null;
	}

	var initializers = {};
	export function registerInitCallback(clsName: string, constructFunc: (el: Element) => {}) {
		if (!initializers[clsName]) {
			initializers[clsName] = constructFunc;
		}
	}

	export function initCtrls(parent: Node) {
		for (var clsName in initializers) {
			if (clsName) {
				var func: (el: Element) => {} = initializers[clsName];
				$(parent).find("." + clsName).each(function (idx: number, elem: Element) {
					func(elem);
				});
			}
		}
	}


	var checkTooltipTimeout = null;
	var _hoverElement: any;
	$(window.document).mousemove(function (e: any) {
		_hoverElement = e.target || e.toElement;
		
		if (e.button === 0 && (e.which === 1 || e.which === 0)) {
			if (checkTooltipTimeout)
				clearTimeout(checkTooltipTimeout);
			checkTooltipTimeout = setTimeout(function () {
				whetherShowTooltip(_hoverElement);
			}, 20);
		}
	});
	$(window).scroll(() => { closeTooltip(); });

	$(window.document).ready(function () {
		initCtrls(document);
		tui.fire("initialized", null);
	});
}
/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	var _currentPopup: Popup = null;

	function closeAllPopup() {
		var pop = _currentPopup;
		while (pop) {
			if (pop.parent())
				pop = pop.parent();
			else {
				pop.close();
				pop = _currentPopup;
			}
		}
	}

	export class Popup extends Control<Popup> {
		static CLASS: string = "tui-popup";
		private _bindType: string;
		private _position: { x: number; y: number; } = null;
		private _bindElem = null;
		private _body = document.body || document.getElementsByTagName("BODY")[0];
		private _parent: Node = null;
		private _parentPopup: Popup = null;
		private _childPopup: Popup = null;

		constructor() {
			super();
		}

		private getParentPopup(elem: HTMLElement): Popup {
			var pop = _currentPopup;
			while (pop) {
				if (pop.isPosterity(elem))
					return pop;
				else
					pop = pop.parent();
			}
			return pop;
		}

		show(content: any, pos: { x: number; y: number });
		show(content: any, elemId: string, bindType: string);
		show(content: any, elem: HTMLElement, bindType: string);
		show(content: any, param: any, bindType?: string) {
			if (typeof param === "string")
				param = document.getElementById(param);
			var elem: HTMLElement = null;
			if (param && param.nodeName && typeof bindType === "string") {
				elem = this.elem("div", Popup.CLASS);
				this._bindElem = param;
				this._bindType = bindType;
			} else if (param && typeof param.x === "number" && typeof param.y === "number") {
				elem = this.elem("div", Popup.CLASS);
				this._position = param;
			} 
			if (elem) {
				if (this._bindElem) {
					this._parentPopup = this.getParentPopup(this._bindElem);
					if (this._parentPopup) {
						this._parentPopup.closeChild();
						this._parentPopup.child(this);
						this.parent(this._parentPopup);
						this._parent = this._parentPopup[0];
					} else {
						closeAllPopup();
						this._parent = this._body;
					}
				} else {
					closeAllPopup();
					this._parent = this._body;
				}
				this._parent.appendChild(elem);
				elem.focus();
				_currentPopup = this;
				elem.setAttribute("tabIndex", "-1");
				if (typeof content === "string") {
					elem.innerHTML = content;
				} else if (content && content.nodeName) {
					elem.appendChild(content);
				}
				tui.ctrl.initCtrls(elem);
				this.refresh();
			}
		}

		close(): void {
			this._parent.removeChild(this[0]);
			_currentPopup = this.parent();
			this.parent(null);
			if (_currentPopup)
				_currentPopup.child(null);
		}

		closeChild(): void {
			if (this._childPopup) {
				this._childPopup.close();
				this._childPopup = null;
			}
		}

		parent(pop: Popup): void;
		parent(): Popup;
		parent(pop?: Popup): Popup {
			if (typeof pop !== tui.undef) {
				this._parentPopup = pop;
			}
			return this._parentPopup;
		}

		child(pop: Popup): void;
		child(): Popup;
		child(pop?: Popup): Popup {
			if (typeof pop !== tui.undef) {
				this._childPopup = pop;
			}
			return this._childPopup;
		}

		refresh(): void {
			if (!this[0])
				return;
			var elem = this[0];
			var cw = document.documentElement.clientWidth;
			var ch = document.documentElement.clientHeight;
			var sw = elem.offsetWidth;
			var sh = elem.offsetHeight;
			var box: { x: number; y: number; w?: number; h?: number; } = { x: 0, y: 0, w: 0, h: 0 };
			var pos = { x: 0, y: 0 };
			if (this._position) {
				box = this._position;
				box.w = 0;
				box.h = 0;
			} else if (this._bindElem) {
				box = tui.offsetToPage(this._bindElem);
				box.w = this._bindElem.offsetWidth;
				box.h = this._bindElem.offsetHeight;
			}
			// lower case letter means 'next to', upper case letter means 'align to'
			var compute = {
				"l": function () {
					pos.x = box.x - sw;
					if (pos.x < 2)
						pos.x = box.x + box.w;
				}, "r": function () {
					pos.x = box.x + box.w;
					if (pos.x + sw > cw - 2)
						pos.x = box.x - sw;
				}, "t": function () {
					pos.y = box.y - sh;
					if (pos.y < 2)
						pos.y = box.y + box.h;
				}, "b": function () {
					pos.y = box.y + box.h;
					if (pos.y + sh > ch - 2)
						pos.y = box.y - sh;
				}, "L": function () {
					pos.x = box.x;
					if (pos.x + sw > cw - 2)
						pos.x = box.x + box.w - sw;
				}, "R": function () {
					pos.x = box.x + box.w - sw;
					if (pos.x < 2)
						pos.x = box.x;
				}, "T": function () {
					pos.y = box.y;
					if (pos.y + sh > ch - 2)
						pos.y = box.y + box.h - sh;
				}, "B": function () {
					pos.y = box.y + box.h - sh;
					if (pos.y < 2)
						pos.y = box.y;
				}
			};
			compute[this._bindType.substring(0, 1)](); // parse x
			compute[this._bindType.substring(1, 2)](); // parse y

			if (pos.x > cw - 2)
				pos.x = cw - 2;
			if (pos.x < 2)
				pos.x = 2;
			if (pos.y > ch - 2)
				pos.y = ch - 2;
			if (pos.y < 2)
				pos.y = 2;

			elem.style.left = pos.x + 2 + "px";
			elem.style.top = pos.y + 2 + "px";
		}
	}

	export function checkPopup() {
		setTimeout(() => {
			var obj = document.activeElement;
			while (_currentPopup) {
				if (_currentPopup.isPosterity(obj))
					return;
				else
					_currentPopup.close();
			}
		}, 30);
	}

	$(document).on("focus mousedown keydown", checkPopup);
	tui.on("#tui.check.popup", checkPopup);

	$(window).scroll(() => { closeAllPopup(); });

	/**
	 * Construct a button.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function popup(): Popup {
		return tui.ctrl.control(null, Popup);
	}
}

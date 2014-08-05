/// <reference path="tui.ctrl.control.ts" />
/// <reference path="tui.ctrl.form.ts" />
module tui.ctrl {
	export interface IButton {
		text(t?: string): string;
		fireClick(e): void;
	}

	export class Button extends Control<Button> implements IButton {
		static CLASS: string = "tui-button";
		private _data: IDataProvider = null;
		private _keyColumnKey: string;
		private _valueColumnKey: string;
		private _childrenColumnKey: string;
		private _columnKeyMap: {} = null;
		private _linkColumnKey: string;
		private _isMenu = false;

		constructor(el?: HTMLElement) {
			super("a", Button.CLASS, el);

			this.disabled(this.disabled());
			this.selectable(false);
			this.exposeEvents("mousedown mouseup mousemove mouseenter mouseleave keydown keyup");

			var self = this;

			function openMenu() {
				if (self.isMenu()) {
					var menu = tui.ctrl.menu(self._data);
					menu.show(self[0], "Lb");
					menu.on("select", function (data) {
						self.fire("select", data);
					}); 
					menu.on("close", function () {
						self.actived(false);
					});
					return;
				}
				var pop = tui.ctrl.popup();
				var list = tui.ctrl.list();
				list.consumeMouseWheelEvent(true);
				list.rowcheckable(false);
				pop.on("close", function () {
					self.actived(false);
				});
				function doSelectItem(data) {
					var item = list.activeItem();
					var link = item[self._linkColumnKey];
					if (link) {
						pop.close();
						window.location.href = link;
						return;
					}
					var action = item["action"];
					if (typeof action !== undef) {
						if (typeof action === "function") {
							action();
						}
						pop.close();
						self.focus();
						self.fireClick(data["event"]);
						return;
					}
					self.value(item[self._keyColumnKey]);
					var targetElem = self.menuBind();
					if (targetElem === null)
						self.text(item[self._valueColumnKey]);
					else {
						targetElem = document.getElementById(targetElem);
						if (targetElem) {
							if (targetElem._ctrl) {
								if (typeof targetElem._ctrl.text === "function")
									targetElem._ctrl.text(item[self._valueColumnKey]);
							} else
								targetElem.innerHTML = item[self._valueColumnKey];
						}
					}
					pop.close();
					self.focus();
					self.fireClick(data["event"]);
				}

				list.on("rowclick", (data) => {
					doSelectItem(data);
				});
				list.on("keydown", (data) => {
					if (data["event"].keyCode === 13) { // Enter
						doSelectItem(data);
					}
				});

				var testDiv = document.createElement("span");
				testDiv.className = "tui-list-test-width-cell";
				document.body.appendChild(testDiv);

				var listWidth = self[0].offsetWidth;
				for (var i = 0; i < self._data.length(); i++) {
					var item = self._data.at(i);
					testDiv.innerHTML = item[self._valueColumnKey];
					if (testDiv.offsetWidth + 40 > listWidth) {
						listWidth = testDiv.offsetWidth + 40;
					}
				}
				document.body.removeChild(testDiv);

				list[0].style.width = listWidth + "px";
				list.data(self._data);
				pop.show(list[0], self[0], "Rb");

				var items = self._data ? self._data.length() : 0;
				if (items < 1)
					items = 1;
				else if (items > 15)
					items = 15;

				list[0].style.height = items * list.lineHeight() + 4 + "px";
				list.refresh();
				pop.refresh();
				var val = self.value();
				if (val && val.length > 0) {
					list.activeRowByKey(val);
					list.scrollTo(list.activerow());
				}
				list.focus();
			}

			$(this[0]).on("mousedown", (e) => {
				if (this.disabled())
					return;
				this.actived(true);
				var self = this;
				if (this.data()) {
					setTimeout(openMenu, 50);
				} else {
					function releaseMouse(e) {
						self.actived(false);
						if (tui.isFireInside(self[0], e))
							self.fireClick(e);
						$(document).off("mouseup", releaseMouse);
					}
					$(document).on("mouseup", releaseMouse);
				}
			});
			

			$(this[0]).on("keydown", (e) => {
				if (this.disabled())
					return;
				if (e.keyCode === 32) {
					this.actived(true);
					e.preventDefault();
				}
				if (e.keyCode === 13) {
					e.preventDefault();
					if (this.data()) {
						this.actived(true);
						openMenu();
					} else {
						e.type = "click";
						setTimeout(() => {
							this.fireClick(e);
						}, 100);
					}
				}
			});

			$(this[0]).on("keyup", (e) => {
				if (this.disabled())
					return;
				if (e.keyCode === 32) {
					if (this.data()) {
						openMenu();
					} else {
						this.actived(false);
						e.type = "click";
						setTimeout(() => {
							this.fireClick(e);
						}, 50);
					}
				}
			});

			var predefined: any = this.attr("data-data");
			if (predefined) {
				predefined = eval("(" + predefined + ")");
				this.data(predefined);
			}
			predefined = this.attr("data-menu");
			if (predefined) {
				predefined = eval("(" + predefined + ")");
				this.menu(predefined);
			}
		}

		fireClick(e) {
			if (this.fire("click", { "ctrl": this[0], "event": e }) === false)
				return;
			if (tui.fire(this.id(), { "ctrl": this[0], "event": e }) === false)
				return;
			var formId = this.submitForm();
			if (formId) {
				var form = tui.ctrl.form(formId);
				form && form.submit();
			}
		}

		submitForm(): string;
		submitForm(formId: string): Button;
		submitForm(formId?: string): any {
			if (typeof formId === "string") {
				this.attr("data-submit-form", formId);
				return this;
			} else
				return this.attr("data-submit-form");
		}

		value(): any;
		value(val?: any): Button;
		value(val?: any): any {
			if (typeof val !== tui.undef) {
				this.attr("data-value", JSON.stringify(val));
				return this;
			} else {
				val = this.attr("data-value");
				if (val === null) {
					return null;
				} else {
					try {
						return eval("(" + val + ")");
					} catch (err) {
						return null;
					}
				}
			}
		}

		menuBind(val?: string): any {
			if (typeof val !== undef) {
				this.attr("data-menu-bind", val);
				return this;
			} else
				return this.attr("data-menu-bind");
		}

		private columnKey(key: string): any {
			var val = this._columnKeyMap[key];
			if (typeof val === "number" && val >= 0)
				return val;
			else
				return key;
		}

		isMenu(): boolean;
		isMenu(val: boolean): Button;
		isMenu(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-is-menu", val);
				return this;
			} else
				return this.is("data-is-menu");
		}

		menu(): tui.IDataProvider;
		menu(data: tui.IDataProvider): Button;
		menu(data: any[]): Button;
		menu(data: { data: any[]; head?: string[]; length?: number; }): Button;
		menu(data?: any): any {
			if (data) {
				this.isMenu(true);
				this.data(data);
			} else {
				if (this.isMenu())
					return this._data;
				else
					return null;
			}
		}

		data(): tui.IDataProvider;
		data(data: tui.IDataProvider): Button;
		data(data: any[]): Button;
		data(data: { data: any[]; head?: string[]; length?: number; }): Button;
		data(data?: any): any {
			if (data) {
				var self = this;
				if (data instanceof Array || data.data && data.data instanceof Array) {
					data = new ArrayProvider(data);
				}
				if (typeof data.length !== "function" ||
					typeof data.sort !== "function" ||
					typeof data.at !== "function" ||
					typeof data.columnKeyMap !== "function") {
					throw new Error("TUI Button: need a data provider.");
				}
				this._data = data;
				if (data)
					this._columnKeyMap = data.columnKeyMap();
				else
					this._columnKeyMap = {};
				this._keyColumnKey = this.columnKey("key");
				this._valueColumnKey = this.columnKey("value");
				this._childrenColumnKey = this.columnKey("children");
				this._linkColumnKey = this.columnKey("link");
				return this;
			} else
				return this._data;
		}

		text(): string;
		text(val?: string): Button;
		text(val?: string): any {
			if (typeof val !== tui.undef) {
				$(this[0]).html(val);
				return this;
			} else
				return $(this[0]).html();
		}

		html(): string;
		html(val?: string): Button;
		html(val?: string): any {
			return this.text(val);
		}

		disabled(): boolean;
		disabled(val: boolean): Button;
		disabled(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-disabled", val);
				if (val)
					this.removeAttr("tabIndex");
				else
					this.attr("tabIndex", "0");
				return this;
			} else
				return this.is("data-disabled");
		}
	}
	
	export function button(param: HTMLElement): Button;
	export function button(param: string): Button;
	export function button(): Button;
	/**
	 * Construct a button.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function button(param?: any): Button {
		return tui.ctrl.control(param, Button);
	}

	tui.ctrl.registerInitCallback(Button.CLASS, button);
}
/// <reference path="tui.ctrl.popup.ts" />
module tui.ctrl {
	export class Menu extends Popup {
		static CLASS: string = "tui-menu";
		private _data;
		private _activedItem: number;
		private _items = [];
		private _menuDiv = null;
		private _parentMenu: Menu = null;

		constructor(proc: () => IDataProvider);
		constructor(data: tui.IDataProvider);
		constructor(data: any[]);
		constructor(data: { data: any[]; head?: string[]; length?: number; });
		constructor(data?: any) {
			super();
			if (data instanceof Array || data.data && data.data instanceof Array) {
				data = new ArrayProvider(data);
			} else if (typeof data === "function" ||
				typeof data.length !== "function" ||
				typeof data.sort !== "function" ||
				typeof data.at !== "function" ||
				typeof data.columnKeyMap !== "function") {
				throw new Error("TUI Menu: need a data provider.");
			}
			this._data = data;
			var self = this;
			this.on("close", function () {
				self._items = [];
				delete self._activedItem;
			});
		}

		private fireClick(item, row) {
			if (item._showChildTimer)
				clearTimeout(item._showChildTimer);
			if (item._childMenu && (typeof row.key === undef || row.key === null)) {
				item._childMenu.show(item.firstChild, "rT");
			} else {
				this.closeAll();
				if (this.fire("select", { "ctrl": self[0], "item": row }) === false) {
					return;
				}
				if (typeof row.key !== undef && row.key !== null) {
					if (tui.fire(row.key, row) === false)
						return;
				}
				if (row.link) {
					window.location.href = row.link;
				}
			}
		}

		private bindMouseEvent(item, row) {
			var self = this;
			$(item).mousemove(function(e) {
				if (item["_menuIndex"] !== self._activedItem) {
					self.deactiveItem(self._activedItem);
					$(item).addClass("tui-actived");
					self._activedItem = item["_menuIndex"];
					if (item._childMenu) {
						item._showChildTimer = setTimeout(function () {
							item._childMenu.show(item.firstChild, "rT");
						}, 400);
					}
				}
			});
			$(item).mouseleave(function(e) {
				if (!tui.isAncestry(document.activeElement, self._menuDiv))
					return;
				if (item._showChildTimer)
					clearTimeout(item._showChildTimer);
				$(item).removeClass("tui-actived");
				delete self._activedItem;
			});
			$(item).click(function (e) {
				self.fireClick(item, row);
			});
		}

		private deactiveItem(itemIndex) {
			if (itemIndex >= 0 && itemIndex < this._items.length) {
				var item = this._items[itemIndex];
				$(item).removeClass("tui-actived");
				if (item._childMenu)
					item._childMenu.close();
				if (item._showChildTimer)
					clearTimeout(item._showChildTimer);
			}
		}

		setParentMenu(parent: Menu){
			this._parentMenu = parent;
		}

		closeAll() {
			if (this._parentMenu) {
				this._parentMenu.closeAll();
			} else
				this.close();
		}

		focus() {
			this._menuDiv.focus();
		}

		show(pos: { x: number; y: number }): void;
		show(elemId: string, bindType: string): void;
		show(elem: HTMLElement, bindType: string): void;
		show(param: any, bindType?: string): void {
			if (this.isShowing())
				return;
			if (!this._data)
				return;
			var self = this;
			var data: IDataProvider;
			if (typeof this._data === "function") {
				data = this._data();
				if (typeof data.length !== "function" ||
					typeof data.sort !== "function" ||
					typeof data.at !== "function" ||
					typeof data.columnKeyMap !== "function") {
					return;
				}
			} else
				data = this._data;
			var div = document.createElement("div");
			this._menuDiv = div;
			div.className = Menu.CLASS;
			$(div).attr("unselectable", "on");
			$(div).attr("tabIndex", "-1");
			for (var i = 0; i < data.length(); i++) {
				var row = data.at(i);
				var item = document.createElement("div");
				if (row.value === "-") {
					item.className = "tui-menu-line";
				} else {
					var innerBox = document.createElement("div");
					item.appendChild(innerBox);
					innerBox.innerHTML = row.value;
					var icon = document.createElement("i");
					icon.className = "tui-menu-icon";
					innerBox.insertBefore(icon, innerBox.firstChild);
					if (row.checked) {
						$(icon).addClass("tui-menu-icon-checked");
					} else if (row.icon) {
						$(icon).addClass(row.icon);
					}
					if (row.children) {
						$(item).addClass("tui-menu-has-children");
						var childMenu = menu(row.children);
						childMenu.on("select", function (data) {
							self.fire("select", data);
						});
						childMenu.setParentMenu(this);
						item["_childMenu"] = childMenu;
					}
					this.bindMouseEvent(item, row);
					item["_menuIndex"] = this._items.length;
					this._items.push(item);
				}
				div.appendChild(item);
			}
			
			$(div).keydown((e) => {
				var c = e.keyCode;
				if (c === tui.KEY_DOWN || c === tui.KEY_TAB) {
					if (typeof self._activedItem !== "number" &&
						self._items.length > 0) {
						self._activedItem = 0;
					} else {
						$(self._items[self._activedItem]).removeClass("tui-actived");
						self._activedItem++;
						if (self._activedItem > self._items.length - 1)
							self._activedItem = 0;
					}
					if (typeof self._activedItem === "number" &&
						self._activedItem >= 0 && self._activedItem < self._items.length)
						$(self._items[self._activedItem]).addClass("tui-actived");
					e.stopPropagation();
					e.preventDefault();
				} else if (c === tui.KEY_UP) {
					if (typeof self._activedItem !== "number" &&
						self._items.length > 0) {
						self._activedItem = self._items.length - 1;
					} else {
						$(self._items[self._activedItem]).removeClass("tui-actived");
						self._activedItem--;
						if (self._activedItem < 0)
							self._activedItem = self._items.length - 1;
					}
					if (typeof self._activedItem === "number" &&
						self._activedItem >= 0 &&
						self._activedItem < self._items.length)
						$(self._items[self._activedItem]).addClass("tui-actived");
					e.stopPropagation();
					e.preventDefault();
				} else if (c === tui.KEY_ESC) {
					self.close();
					e.stopPropagation();
					e.preventDefault();
				} else if (c === tui.KEY_LEFT) {
					if (self._parentMenu) {
						self.close();
						self._parentMenu.focus();
					}
				} else if (c === tui.KEY_RIGHT) {
					if (typeof self._activedItem === "number" &&
						self._activedItem >= 0 &&
						self._activedItem < self._items.length) {
						var item = self._items[self._activedItem];
						if (item._childMenu) {
							item._childMenu.show(item.firstChild, "rT");
						}
					}
				} else if (c === tui.KEY_ENTER) {
					if (typeof self._activedItem === "number" &&
						self._activedItem >= 0 &&
						self._activedItem < self._items.length) {
						var item = self._items[self._activedItem];
						var row = data.at(self._activedItem);
						self.fireClick(item, row);
					}
					
				}
			});
			super.show(div, param, bindType);
		}
	}

	export function menu(data: any): Menu {
		return new Menu(data);
	}
}

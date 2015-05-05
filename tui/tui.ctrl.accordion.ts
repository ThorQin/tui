/// <reference path="tui.ctrl.accordiongroup.ts" />
/// <reference path="tui.ctrl.list.ts" />
/// <reference path="tui.dataprovider.ts" />
/// <reference path="tui.ctrl.grid.ts" />
module tui.ctrl {
	/**
	 * Accordion class used to display a navigation sidebar to 
	 * let user easy jump to a particular page section to read.
	 */
	export class Accordion extends Control<Accordion> {
		static CLASS: string = "tui-accordion";

		private _caption: HTMLDivElement = null;
		private _list: List = null;
		private _initialized = false;

		static ANIMATION_DURATION: number = 200;

		constructor(el?: HTMLElement) {
			super("div", Accordion.CLASS, el);
			this[0].innerHTML = "";
			this._caption = document.createElement("div");
			this._caption.className = "tui-accordion-caption";
			this._caption.setAttribute("unselectable", "on");
			this[0].appendChild(this._caption);
			this._list = tui.ctrl.list();
			this[0].appendChild(this._list[0]);
			var predefined: any = this.attr("data-data");
			if (predefined)
				predefined = eval("(" + predefined + ")");
			$(this._caption).click(() => {
				this.expanded(!this.expanded());
			});
			$(this._caption).keydown((e) => {
				if (e.keyCode === 13) {
					this.expanded(!this.expanded());
				}
			});
			var self = this;
			this._list.on("rowclick keydown", function (data) {
				if (data["name"] === "rowclick") {
					self.value(self._list.data().at(data["index"])["key"]);
					var k = self.value();
					if (k)
						self.fire("select", { "ctrl": self[0], "key": k, "caption": self.caption() });
				} else if (data["event"].keyCode === 13) {
					self.value(self._list.activeItem().key);
					var k = self.value();
					if (k)
						self.fire("select", { "ctrl": self[0], "key": k, "caption": self.caption()  });
				}
			});
			this._list.on("rowexpand rowfold", function (data) {
				self._list.activerow(null);
				data["event"].stopPropagation();
				self.refresh();
			});
			var originFormator = this._list.columns()[0].format;
			this._list.columns()[0].format = function (data) {
				originFormator(data);
				if (typeof data.row.checked === undef)
					return;
				var contentSpan = (<HTMLElement>data.cell.firstChild);
				var checkSpan = contentSpan.childNodes[2];
				contentSpan.removeChild(checkSpan);
				if (data.row.checked) {
					$(data.cell.parentElement).addClass("tui-accordion-row-checked");
				} else
					$(data.cell.parentElement).removeClass("tui-accordion-row-checked");
			}
			var animation = this.useAnimation();
			this.useAnimation(false);
			if (predefined) {
				this.data(predefined);
				var checkedItems = this._list.checkedItems();
				if (checkedItems && checkedItems.length > 0) {
					var k = this._list.data().mapKey("key");
					this.value(checkedItems[0][k]);
					k = self.value();
					if (k)
						self.fire("select", { "ctrl": self[0], "key": k, "caption": self.caption() });
				} else {
					this.expanded(this.expanded());
				}
			} else
				this.expanded(this.expanded());
			this.useAnimation(animation);
		}


		data(): tui.IDataProvider;
		data(data: tui.IDataProvider): Accordion;
		data(data: any[]): Accordion;
		data(data: { data: any[]; head?: string[]; length?: number; }): Accordion;
		data(data?: any): any {
			if (typeof data !== undef) {
				this._list.data(data);
				this.refresh();
				return this;
			} else
				return this._list.data(data);
		}

		caption(): string;
		caption(val?: string): Accordion;
		caption(val?: string): any {
			if (typeof val === "string") {
				this.attr("data-caption", val);
				this._caption.innerHTML = val || "";
				this.refresh();
				return this;
			} else
				return this.attr("data-caption");
		}

		captionHeight(): number {
			return $(this._caption).outerHeight();
		}

		expanded(): boolean;
		expanded(val: boolean): Accordion;
		expanded(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-expanded", val);
				if (this.expanded()) {
					var groupName = this.group();
					if (groupName) {
						var self = this;
						$("." + Accordion.CLASS + "[data-group='" + groupName + "']").each(function (index, elem) {
							var ctrl = elem["_ctrl"];
							if (ctrl && ctrl !== self && typeof ctrl.expanded === "function") {
								ctrl.expanded(false);
							}
						});
					}
				}
				this.refresh();
				return this;
			} else
				return this.is("data-expanded");
		}

		maxHeight(): number;
		maxHeight(maxHeight: number): Accordion;
		maxHeight(maxHeight?: number): any {
			if (typeof maxHeight === "number") {
				this.attr("data-max-height", maxHeight);
				return this;
			} else
				return parseInt(this.attr("data-max-height"));
		}

		group(): string;
		group(val?: string): Accordion;
		group(val?: string): any {
			if (typeof val !== tui.undef) {
				this.attr("data-group", val);
				return this;
			} else
				return this.attr("data-group");
		}

		value(): string;
		value(key: string): Accordion;
		value(key?: string): any {
			if (typeof key !== undef) {
				this._list.value([key]);
				this._list.activerow(null);
				if (this._list.value().length > 0) {
					this._list.activeRowByKey(key);
					this.expanded(true);
					this._list.scrollTo(this._list.activerow());
					var groupName = this.group();
					if (groupName) {
						var self = this;
						$("." + Accordion.CLASS + "[data-group='" + groupName + "']").each(function (index, elem) {
							var ctrl = elem["_ctrl"];
							if (ctrl && ctrl !== self && typeof ctrl.value === "function") {
								ctrl.value(null);
							}
						});
					}
				}
				return this;
			} else {
				var val = this._list.value();
				if (val === null)
					return val;
				else if (val.length > 0)
					return val[0];
				else
					return null;
			}
		}

		autoRefresh(): boolean {
			return !this._initialized;
		}

		enumerate(func: (item: any) => any): void {
			if (this._list)
				this._list.enumerate(func);
		}
		
		consumeMouseWheelEvent(): boolean;
		consumeMouseWheelEvent(val: boolean): Grid;
		consumeMouseWheelEvent(val?: boolean): any {
			return this._list.consumeMouseWheelEvent(val);
		}

		useAnimation(): boolean;
		useAnimation(val: boolean): Accordion;
		useAnimation(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-anmimation", val);
				return this;
			} else
				return this.is("data-anmimation");
		}

		refresh() {
			if (!this[0] || this[0].offsetWidth === 0 || this[0].offsetHeight === 0)
				return;
			this._initialized = true;
			var captionHeight;
			if (!this.expanded()) { // Show in fold
				this._caption.setAttribute("tabIndex", "0");
				$(this._caption).removeClass("tui-expanded");
				captionHeight = this._caption.offsetHeight;
				$(this._caption).addClass("tui-expanded");
				if (this.useAnimation()) {
					$(this[0]).stop().animate({ "height": captionHeight + "px" },
						Accordion.ANIMATION_DURATION, "linear", () => {
							$(this._caption).removeClass("tui-expanded");
							this._list[0].style.display = "none";
						});
				} else {
					$(this[0]).stop();
					this[0].style.height = captionHeight + "px";
					$(this._caption).removeClass("tui-expanded");
					this._list[0].style.display = "none";
				}
			} else { // Show in expanded
				this._caption.removeAttribute("tabIndex");
				$(this._caption).addClass("tui-expanded");
				this._list[0].style.display = "";
				captionHeight = this._caption.offsetHeight;
				var maxHeight = this.maxHeight();
				var lines = 1;
				if (this._list.data())
					lines = this._list.data().length();
				if (lines < 1)
					lines = 1;
				var height = this._list.lineHeight() * lines + 4;
				if (!isNaN(maxHeight) && height > maxHeight - captionHeight) {
					height = maxHeight - captionHeight;
				}
				this._list[0].style.height = height + "px";
				this._list[0].style.width = $(this[0]).width() + "px";
				this._list.refresh();
				if (this.useAnimation()) {
					$(this[0]).stop().animate({ "height": height + captionHeight + "px" },
						Accordion.ANIMATION_DURATION, "linear", () => {
							$(this._caption).addClass("tui-expanded");
							this._list[0].style.display = "";
							this._list.focus();
						});
				} else {
					$(this[0]).stop();
					this[0].style.height = height + captionHeight + "px";
					$(this._caption).addClass("tui-expanded");
					this._list[0].style.display = "";
					this._list.focus();
				}
			}
		}
	}

	export function accordion(elem: HTMLElement): Accordion;
	export function accordion(elemId: string): Accordion;
	export function accordion(): Accordion;
	export function accordion(param?: any): Accordion {
		return tui.ctrl.control(param, Accordion);
	}
	tui.ctrl.registerInitCallback(Accordion.CLASS, accordion);
}
/// <reference path="tui.ctrl.accordiongroup.ts" />
module tui.ctrl {
	/**
	 * Accordion class used to display a navigation sidebar to 
	 * let user easy jump to a particular page section to read.
	 */
	export class Accordion extends Control<Tab> {
		static CLASS: string = "tui-accordion";

		private _caption: HTMLDivElement = null;
		private _list: List = null;
		private _folded: boolean = false;

		constructor(el?: HTMLElement) {
			super("div", Accordion.CLASS, el);
			this[0].innerHTML = "";
			this._caption = document.createElement("div");
			this._caption.className = "tui-accordion-caption";
			this[0].appendChild(this._caption);
			this._list = tui.ctrl.list();
			this[0].appendChild(this._list[0]);
			var predefined: any = this.attr("data-data");
			if (predefined)
				predefined = eval("(" + predefined + ")");
			this._folded = this.folded();
			$(this._caption).click(() => {
				this.folded(!this.folded());
			});
			var self = this;
			this._list.on("rowclick keydown", function (data) {
				if (data["name"] === "rowclick")
					self.value(self._list.data().at(data["index"])["key"]);
				else if (data["event"].keyCode === 13) {
					self.value(self._list.activeItem().key);
				}
			});
			if (predefined)
				this.data(predefined);
			else
				this.refresh();
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
				this.refresh();
				return this;
			} else
				return this.attr("data-caption");
		}

		folded(): boolean;
		folded(val: boolean): Accordion;
		folded(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-folded", val);
				if (!this.folded()) {
					var groupName = this.group();
					if (groupName) {
						var self = this;
						$("." + Accordion.CLASS + "[data-group='" + groupName + "']").each(function (index, elem) {
							var ctrl = elem["_ctrl"];
							if (ctrl && ctrl !== self && typeof ctrl.folded === "function") {
								ctrl.folded(true);
							}
						});
					}
				}
				this.refresh();
				return this;
			} else
				return this.is("data-folded");
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
				if (this._list.value().length > 0) {
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
					this.folded(false);
				}
			} else {
				this._list.value();
			}
		}

		refresh() {
			if (this[0].offsetWidth === 0 || this[0].offsetHeight === 0)
				return;
			this._caption.innerHTML = this.caption() || "";
			var captionHeight = this._caption.offsetHeight;
			if (this.folded()) {
				$(this._caption).addClass("tui-folded");
				captionHeight = this._caption.offsetHeight;
				$(this._caption).removeClass("tui-folded");
				$(this[0]).animate({ "height": captionHeight + "px" }, 50, "linear", () => {
					$(this._caption).addClass("tui-folded");
				});
			} else {
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
				$(this._caption).removeClass("tui-folded");
				$(this[0]).animate({ "height": height + captionHeight + "px" }, 50, "linear");
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
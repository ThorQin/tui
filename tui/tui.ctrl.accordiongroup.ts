/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {

	function getRealParent(monitoredParent) {
		if (monitoredParent && monitoredParent.window && monitoredParent.document ||
			monitoredParent.nodeName.toLowerCase() === "#document" ||
			monitoredParent.nodeName.toLowerCase() === "body" ||
			monitoredParent.nodeName.toLowerCase() === "html") {
			// Bind to a window
			if (monitoredParent.window && monitoredParent.document) {
				return monitoredParent;
			} else if (monitoredParent.nodeName.toLowerCase() === "#document") {
				return monitoredParent.defaultView || monitoredParent.parentWindow;
			} else {
				return getWindow(monitoredParent);
			}
		} else {
			return monitoredParent;
		}
	}

	function getRealTagetScrollElement(monitoredParent) {
		if (monitoredParent && monitoredParent.document) {
			if (tui.ieVer > 0 || tui.ffVer > 0) {
				return monitoredParent.document.documentElement;
			} else {
				return monitoredParent.document.body;
			}
		} else {
			return monitoredParent;
		}
	}
	/**
	 * AccordionGroup class used to display a foldable panel 
	 * to show a group items in this panel.
	 */
	export class AccordionGroup extends Control<AccordionGroup> {
		static CLASS: string = "tui-accordion-group";

		private _accordions: Accordion[] = [];
		private _anchors: string[] = [];
		private _monitoredParent = null;
		private _inScrolling = false;

		constructor(el?: HTMLElement) {
			super("div", AccordionGroup.CLASS, el);

			if (this.hasAttr("data-max-height"))
				this.maxHeight(this.maxHeight());

			this.bindChildEvents();
			
		}

		distance(): number
		distance(tolerance: number): AccordionGroup;
		distance(tolerance?: number): any {
			if (typeof tolerance === "number") {
				this.attr("data-distance", tolerance);
				return this;
			} else {
				var v: any = this.attr("data-distance");
				v = parseInt(this.attr("data-distance"));
				if (isNaN(v))
					return 50;
				else
					return v;
			}
		}


		maxHeight(): number;
		maxHeight(maxHeight: number): AccordionGroup;
		maxHeight(maxHeight?: number): any {
			if (typeof maxHeight === "number") {
				this.attr("data-max-height", maxHeight);
				var allCaptionHeight = 0;
				for (var i = 0; i < this[0].childNodes.length; i++) {
					var elem = this[0].childNodes[i];
					if ($(elem).hasClass("tui-accordion")) {
						var acc = accordion(elem);
						allCaptionHeight += acc.captionHeight();
					} else if (elem.tagName) {
						allCaptionHeight += $(elem).outerHeight();
					}
				}
				$(this[0]).find(".tui-accordion").each(function (idx: number, elem: any) {
					if (elem._ctrl) {
						elem._ctrl.maxHeight(maxHeight - allCaptionHeight + elem._ctrl.captionHeight());
						elem._ctrl.refresh();
					}
				});
				return this;
			} else
				return parseInt(this.attr("data-max-height"));
		}

		value(): string;
		value(key: string): AccordionGroup;
		value(key?: string): any {
			if (typeof key !== undef) {
				$(this[0]).find(".tui-accordion").each(function (idx: number, elem: any) {
					if (elem._ctrl) {
						elem._ctrl.value(key);
						if (elem._ctrl.value() !== null)
							return false;
					}
				});
			} else {
				var val = null;
				$(this[0]).find(".tui-accordion").each(function (idx: number, elem: any) {
					if (elem._ctrl) {
						val = elem._ctrl.value();
						if (val !== null)
							return false;
					}
				});
				return val;
			}
		}

		private _onScroll = (() => {
			var self = this;
			var scrollTimer = null;
			return function (e) {
				if (self._monitoredParent === null)
					return;
				if (self._inScrolling)
					return;
				
				var parent = getRealTagetScrollElement(self._monitoredParent);
				for (var i = 0; i < self._anchors.length; i++) {
					var elemId = self._anchors[i];
					var elem = document.getElementById(elemId);
					if (!elem)
						continue;
					var pos = tui.relativePosition(elem, parent);
					if (Math.abs(pos.y - parent.scrollTop - self.distance()) <= 100) {
						if (scrollTimer != null) {
							clearTimeout(scrollTimer);
							scrollTimer = null;
						}
						scrollTimer = setTimeout(function(){
								self.value("#" + elem.id);
							}, 50);
						break;
					}
				}
			};
		})();

		

		installMonitor(monitoredParent) {
			if (typeof monitoredParent === "string")
				monitoredParent = document.getElementById(monitoredParent);
			this._monitoredParent = getRealParent(monitoredParent);
			if (this._monitoredParent)
				$(this._monitoredParent).scroll(this._onScroll);
		}

		uninstallMonitor() {
			if (this._monitoredParent)
				$(this._monitoredParent).off("scroll", this._onScroll);
			this._monitoredParent = null;
		}


		keyIsLink(): boolean;
		keyIsLink(val: boolean): AccordionGroup;
		keyIsLink(val?: boolean): any {
			if (typeof val !== tui.undef) {
				this.is("data-key-is-link", !!val);
				return this;
			} else
				return this.is("data-key-is-link");
		}

		private _onSelect = (() => {
			var self = this;
			return function (data) {
				if (self.fire("select", data) !== false) {
					if (self.keyIsLink()) {
						if (data.key && data.key.slice(0,1) === "#") {
							var elemId = data.key.substr(1);
							var elem = document.getElementById(elemId);
							if (elem) {
								var parent = getRealTagetScrollElement(self._monitoredParent);
								var pos = tui.relativePosition(elem, parent);
								self._inScrolling = true;
								$(parent).stop().animate({ "scrollTop": pos.y - self.distance() }, 200, function () {
									window.location.href = data.key;
									parent.scrollTop = pos.y - self.distance();
									self._inScrolling = false;
								});
							} else {
								window.location.href = data.key;
							}
						} else {
							window.location.href = data.key;
						}
					}
				}
			};
		})();

		addAccordion(acc: Accordion) {
			this[0].appendChild(acc[0]);
			this.bindChildEvents();
		}

		clear() {
			this[0].innerHTML = "";
			this.bindChildEvents();
		}

		bindChildEvents() {
			for (var acc in this._accordions) {
				if (this._accordions.hasOwnProperty(acc))
					this._accordions[acc].off("select", this._onSelect);
			}
			this._accordions = [];
			this._anchors = [];
			var self = this;
			$(this[0]).find(".tui-accordion").each(function (idx: number, elem: any) {
				if (typeof elem._ctrl === undef)
					accordion(elem);
				if (elem._ctrl) {
					self._accordions.push(elem._ctrl);
					elem._ctrl.on("select", self._onSelect);
					if (self.keyIsLink()) {
						elem._ctrl.enumerate(function (item) {
							if (item.key && item.key.slice(0,1) === "#") {
								self._anchors.push(item.key.substr(1));
							}
						});
					}
				}
			});
		}

		refresh() {
			for (var acc in this._accordions) {
				if (this._accordions.hasOwnProperty(acc))
					this._accordions[acc].refresh();
			}
		}
	}

	export function accordionGroup(elem: HTMLElement): AccordionGroup;
	export function accordionGroup(elemId: string): AccordionGroup;
	export function accordionGroup(): AccordionGroup;
	export function accordionGroup(param?: any): AccordionGroup {
		return tui.ctrl.control(param, AccordionGroup);
	}
	tui.ctrl.registerInitCallback(AccordionGroup.CLASS, accordionGroup);
}
/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	/**
	 * AccordionGroup class used to display a foldable panel 
	 * to show a group items in this panel.
	 */
	export class AccordionGroup extends Control<Tab> {
		static CLASS: string = "tui-accordion-group";

		constructor(el?: HTMLElement) {
			super("div", AccordionGroup.CLASS, el);

			if (this.hasAttr("data-max-height"))
				this.maxHeight(this.maxHeight());
		}

		maxHeight(): number;
		maxHeight(maxHeight: number): Accordion;
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
		value(key: string): Accordion;
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
		
	}

	export function accordionGroup(elem: HTMLElement): AccordionGroup;
	export function accordionGroup(elemId: string): AccordionGroup;
	export function accordionGroup(): AccordionGroup;
	export function accordionGroup(param?: any): AccordionGroup {
		return tui.ctrl.control(param, AccordionGroup);
	}
	tui.ctrl.registerInitCallback(AccordionGroup.CLASS, accordionGroup);
}
/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	/**
	 * AccordionGroup class used to display a foldable panel 
	 * to show a group items in this panel.
	 */
	export class AccordionGroup extends Control<Tab> {
		static CLASS: string = "tui-accordion-group";

		private _caption = null;
		private _list = null;

		constructor(el?: HTMLElement) {
			super("div", AccordionGroup.CLASS, el);
			this._caption = document.createElement("div");
			this[0].innerHTML = "";
			this[0].appendChild(this._caption);
			this._list = tui.ctrl.list();
			this[0].appendChild(this._list[0]);
		}

		shrinked(): boolean;
		shrinked(val: boolean): Button;
		shrinked(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-shrinked", val);
				return this;
			} else
				return this.is("data-shrinked");
		}

		refresh() {

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
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
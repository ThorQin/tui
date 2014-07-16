/// <reference path="tui.ctrl.accordiongroup.ts" />
module tui.ctrl {
	/**
	 * Accordion class used to display a navigation sidebar to 
	 * let user easy jump to a particular page section to read.
	 */
	export class Accordion extends Control<Tab> {
		static CLASS: string = "tui-accordion";

		constructor(el?: HTMLElement) {
			super("div", Accordion.CLASS, el);
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
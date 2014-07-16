/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	/**
	 * Navbar class used to display a navigation head bar to 
	 * let user easy jump to a particular functional area in the website.
	 */
	export class Navbar extends Control<Tab> {
		static CLASS: string = "tui-navbar";

		constructor(el?: HTMLElement) {
			super("div", Navbar.CLASS, el);
		}
	}

	export function navbar(elem: HTMLElement): Navbar;
	export function navbar(elemId: string): Navbar;
	export function navbar(): Navbar;
	export function navbar(param?: any): Navbar {
		return tui.ctrl.control(param, Navbar);
	}
	tui.ctrl.registerInitCallback(Navbar.CLASS, navbar);
}
/// <reference path="tui.control.ts" />
module tui.ctrl {

	export class Grid extends Control<Grid> {
		static CLASS: string = "tui-grid";
		
		constructor(el?: HTMLElement) {
			super();
			var self = this;
			if (el)
				this.elem(el);
			else
				this.elem("div", Grid.CLASS);
			this[0]._ctrl = this;
			this.attr("tabIndex", "0");
			this[0].innerHTML = "";

			
		}

	}

	export function grid(param: HTMLElement): Grid;
	export function grid(param: string): Grid;
	export function grid(): Grid;
	/**
	 * Construct a grid.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function grid(param?: any): Grid {
		return tui.ctrl.control(param, Grid);
	}

	tui.ctrl.registerInitCallback(Grid.CLASS, grid);
}
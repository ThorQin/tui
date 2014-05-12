/// <reference path="tui.control.ts" />
module tui.ctrl {

	export class Table extends Control<Table> {
		static CLASS: string = "tui-table";

		constructor(el?: HTMLElement) {
			super();
			var self = this;
			if (el)
				this.elem(el);
			else
				this.elem("table", Table.CLASS);
			this[0]._ctrl = this;
			this.attr("tabIndex", "0");
			this[0].innerHTML = "";


		}

		resizable(): boolean;
		resizable(val: boolean): Table;
		resizable(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-resizable", val);
				this.refresh();
				return this;
			} else
				return this.is("data-resizable");
		}

		refresh() {

		}
	}

	export function table(param: HTMLElement): Table;
	export function table(param: string): Table;
	export function table(): Table;
	/**
	 * Construct a grid.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function table(param?: any): Table {
		return tui.ctrl.control(param, Table);
	}

	tui.ctrl.registerInitCallback(Table.CLASS, table);
}
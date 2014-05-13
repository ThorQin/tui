/// <reference path="tui.control.ts" />
module tui.ctrl {

	export interface GridHeader {
		key?: any;
		name?: string;
		width?: number;
		sortable?: boolean;
		format?: (cell: HTMLSpanElement, value: any, rowIndex: number, colIndex: number) => void;
	}

	export class Grid extends Control<Grid> {
		static CLASS: string = "tui-grid";
		private _tableId = tui.uuid();
		private _gridStyle: any = null;
		private _columns: GridHeader[] = null;
		private _value: IDataProvider = null;

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
			if (document.createStyleSheet) {
				this._gridStyle = document.createStyleSheet();
			} else {
				this._gridStyle = document.createElement("style");
				document.head.appendChild(this._gridStyle);
			}
		}

		columns(): GridHeader[];
		columns(val?: GridHeader[]): Table;
		columns(val?: GridHeader[]): any {
			if (val) {
				this._columns = val;
				this.refresh();
				return this;
			} else {
				if (!this._columns) {
					var valstr = this.attr("data-columns");
					this._columns = eval("(" + valstr + ")");
				}
				return this._columns;
			}
		}


		resizable(): boolean;
		resizable(val: boolean): Table;
		resizable(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-resizable", val);
				//this.createSplitters();
				this.refresh();
				return this;
			} else
				return this.is("data-resizable");
		}

		value(): IDataProvider;
		value(value: IDataProvider): Table;
		value(value?: IDataProvider): any {
			if (value) {
				this._value = value;
				return this;
			} else {
				return this._value;
			}
		}

		refresh() {

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
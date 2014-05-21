/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {

	export class Table extends Control<Table> {
		static CLASS: string = "tui-table";

		private _splitters: HTMLSpanElement[] = [];
		private _columns: { width?: number; important?: boolean; }[] = [];
		
		constructor(el?: HTMLTableElement) {
			super();
			var self = this;
			if (el)
				this.elem(el);
			else
				throw new Error("Must specify a table control");
			this.addClass(Table.CLASS);
			this[0]._ctrl = this;
			//if (tui.ieVer > 0 && tui.ieVer < 9)
			//	this.addClass("tui-table-ie8");
			//else
				this.createSplitters();
			this.refresh();
		}

		private headLine(): HTMLTableRowElement {
			var tb: HTMLTableElement = this[0];
			if (!tb)
				return null;
			return <HTMLTableRowElement>tb.rows[0];
		}

		private createSplitters() {
			var self = this;
			this._splitters.length = 0;
			var tb: HTMLTableElement = this[0];
			if (!tb)
				return;
			var headLine: HTMLTableRowElement = this.headLine();
			if (!headLine)
				return;
			
			for (var i = 0; i < this._splitters.length; i++) {
				tui.removeNode(this._splitters[i]);
			}
			if (this.resizable()) {
				for (var i = 0; i < headLine.cells.length; i++) {
					var cell = headLine.cells[i];
					var splitter: HTMLSpanElement = document.createElement("span");
					splitter["colIndex"] = i;
					splitter.className = "tui-table-splitter";
					this._columns[i] = { width: $(cell).width() };
					$(splitter).attr("unselectable", "on");
					headLine.cells[i].appendChild(splitter);
					this._splitters.push(splitter);
					$(splitter).mousedown(function (e) {
						var target: HTMLSpanElement = <HTMLSpanElement>e.target;
						var l = target.offsetLeft;
						var srcX = e.clientX;
						target.style.height = self[0].clientHeight + "px";
						target.style.bottom = "";
						$(target).addClass("tui-splitter-move");
						var mask = tui.mask();
						mask.style.cursor = "col-resize";
						
						function onDragEnd(e) {
							$(document).off("mousemove", onDrag);
							$(document).off("mouseup", onDragEnd);
							$(target).removeClass("tui-splitter-move");
							tui.unmask();
							var colIndex = target["colIndex"];
							var tmpWidth = self._columns[colIndex].width + e.clientX - srcX;
							if (tmpWidth < 0)
								tmpWidth = 0;
							self._columns[colIndex].width = tmpWidth;
							self._columns[colIndex].important = true;
							self.refresh();
							self.fire("resizecolumn", colIndex);
						}
						function onDrag(e) {
							target.style.left = l + e.clientX - srcX + "px";
						}

						$(document).mousemove(onDrag);
						$(document).mouseup(onDragEnd);
					});
				}
			}
		}

		resizable(): boolean;
		resizable(val: boolean): Table;
		resizable(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-resizable", val);
				this.createSplitters();
				this.refresh();
				return this;
			} else
				return this.is("data-resizable");
		}

		refresh() {
			if (!this.resizable())
				return;
			var tb: HTMLTableElement = this[0];
			if (!tb)
				return;
			var headLine: HTMLTableRowElement = <HTMLTableRowElement>tb.rows[0];
			if (!headLine)
				return;
			//if (tui.ieVer > 0 && tui.ieVer < 9)
			//	return;
			var cellPadding = headLine.cells.length > 0 ? $(headLine.cells[0]).outerWidth() - $(headLine.cells[0]).width() : 0;
			var defaultWidth = Math.floor(tb.offsetWidth / (headLine.cells.length > 0 ? headLine.cells.length : 1) - cellPadding);
			var totalWidth = 0;
			var computeWidth = tb.offsetWidth - cellPadding * (headLine.cells.length > 0 ? headLine.cells.length : 1);
			for (var i = 0; i < this._columns.length; i++) {
				if (typeof this._columns[i].width !== "number") {
					this._columns[i].width = defaultWidth;
					totalWidth += defaultWidth;
				} else if (!this._columns[i].important) {
					totalWidth += this._columns[i].width;
				} else {
					
					if (this._columns[i].width > computeWidth)
						this._columns[i].width = computeWidth;
					if (this._columns[i].width < 1)
						this._columns[i].width = 1;
					computeWidth -= this._columns[i].width;
				}
			}
			for (var i = 0; i < this._columns.length; i++) {
				if (!this._columns[i].important) {
					if (totalWidth === 0)
						this._columns[i].width = 0;
					else
						this._columns[i].width = Math.floor(this._columns[i].width / totalWidth * computeWidth);
					if (this._columns[i].width < 1)
						this._columns[i].width = 1;
				} else {
					this._columns[i].important = false;
				}
				if (tb.rows.length > 0) {
					var row: HTMLTableRowElement = <HTMLTableRowElement>tb.rows[0];
					$(row.cells[i]).css("width", this._columns[i].width + "px");
				}
			}
			var headLine = this.headLine();
			for (var i = 0; i < this._splitters.length; i++) {
				var splitter = this._splitters[i];
				var cell:any = headLine.cells[i];
				splitter.style.left = cell.offsetLeft + cell.offsetWidth - Math.round(splitter.offsetWidth / 2) + "px";
				splitter.style.height = headLine.offsetHeight + "px";
			}
		}
	}

	export function table(param: HTMLElement): Table;
	export function table(param: string): Table;
	/**
	 * Construct a table control.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function table(param: any): Table {
		return tui.ctrl.control(param, Table);
	}

	tui.ctrl.registerInitCallback(Table.CLASS, table);
}
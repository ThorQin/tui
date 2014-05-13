/// <reference path="tui.control.ts" />
module tui.ctrl {

	export class Table extends Control<Table> {
		static CLASS: string = "tui-table";

		private splitters: HTMLSpanElement[] = [];
		private columns: { width?: number; important?: boolean; }[] = [];
		
		constructor(el?: HTMLTableElement) {
			super();
			var self = this;
			if (el)
				this.elem(el);
			else
				throw new Error("Must specify a table control");
			this.addClass(Table.CLASS);
			this[0]._ctrl = this;
			if (tui.ieVer > 0 && tui.ieVer < 9)
				this.addClass("tui-table-ie8");
			else
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
			this.splitters.length = 0;
			var tb: HTMLTableElement = this[0];
			if (!tb)
				return;
			
			var headLine: HTMLTableRowElement = this.headLine();
			if (!headLine)
				return;
			
			for (var i = 0; i < this.splitters.length; i++) {
				tui.removeNode(this.splitters[i]);
			}
			if (this.resizable()) {
				for (var i = 0; i < headLine.cells.length; i++) {
					var cell = headLine.cells[i];
					var splitter: HTMLSpanElement = document.createElement("span");
					splitter["colIndex"] = i;
					splitter.className = "tui-table-splitter";
					this.columns[i] = { width: $(cell).width() };
					$(splitter).attr("unselectable", "on");
					if (i < headLine.cells.length - 1)
						headLine.cells[i + 1].appendChild(splitter);
					else
						headLine.cells[i].appendChild(splitter);
					$(headLine).css("position", "relative");
					this.splitters.push(splitter);
					$(splitter).mousedown(function (e) {
						var target: HTMLSpanElement = <HTMLSpanElement>e.target;
						var span = document.createElement("span");
						span.className = "tui-table-splitter-move";
						var pos = tui.offsetToPage(target);
						span.style.left = pos.x + "px";
						span.style.top = pos.y + "px";
						span.style.height = $(tb).height() + "px";
						var mask = tui.mask();
						var srcX = e.clientX;
						mask.appendChild(span);
						mask.style.cursor = "col-resize";
						function dragEnd(e) {
							$(document).off("mousemove", onDrag);
							$(document).off("mouseup", dragEnd);
							tui.unmask();
							var colIndex = target["colIndex"];
							var tmpWidth = self.columns[colIndex].width + e.clientX - srcX;
							if (tmpWidth < 0)
								tmpWidth = 0;
							self.columns[colIndex].width = tmpWidth;
							self.columns[colIndex].important = true;
							self.refresh();
							self.fire("resizecolumn", colIndex);
						}
						function onDrag(e) {
							span.style.left = pos.x + e.clientX - srcX + "px";
						}

						$(document).mousemove(onDrag);
						$(document).mouseup(dragEnd);
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
			if (tui.ieVer > 0 && tui.ieVer < 9)
				return;
			var cellPadding = headLine.cells.length > 0 ? $(headLine.cells[0]).outerWidth() - $(headLine.cells[0]).width() : 0;
			var defaultWidth = Math.floor(tb.offsetWidth / (headLine.cells.length > 0 ? headLine.cells.length : 1) - cellPadding);
			var totalWidth = 0;
			var computeWidth = tb.offsetWidth - cellPadding * (headLine.cells.length > 0 ? headLine.cells.length : 1);
			for (var i = 0; i < this.columns.length; i++) {
				if (typeof this.columns[i].width !== "number") {
					this.columns[i].width = defaultWidth;
					totalWidth += defaultWidth;
				} else if (!this.columns[i].important) {
					totalWidth += this.columns[i].width;
				} else {
					
					if (this.columns[i].width > computeWidth)
						this.columns[i].width = computeWidth;
					if (this.columns[i].width < 1)
						this.columns[i].width = 1;
					computeWidth -= this.columns[i].width;
				}
			}
			for (var i = 0; i < this.columns.length; i++) {
				if (!this.columns[i].important) {
					this.columns[i].width = Math.floor(this.columns[i].width / totalWidth * computeWidth);
					if (this.columns[i].width < 1)
						this.columns[i].width = 1;
				} else {
					this.columns[i].important = false;
				}
				if (tb.rows.length > 0) {
					var row: HTMLTableRowElement = <HTMLTableRowElement>tb.rows[0];
					$(row.cells[i]).css("width", this.columns[i].width + "px");
				}
			}
			var headLine = this.headLine();
			for (var i = 0; i < this.splitters.length; i++) {
				var splitter = this.splitters[i];
				//var left = tui.offsetToPage(<HTMLElement>headLine.cells[i], tb).x;
				//splitter.style.left = left + (<any>headLine.cells[i]).offsetWidth + "px";
				//splitter.style.height = headLine.offsetHeight + "px";
				if (i < this.splitters.length - 1)
					$(splitter).css({ "left": "-3px", "right":"auto", "height": headLine.offsetHeight + "px" });
				else
					$(splitter).css({ "right": "-3px", "left": "auto", "height": headLine.offsetHeight + "px" });
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
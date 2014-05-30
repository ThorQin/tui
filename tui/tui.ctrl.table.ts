/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {

	export class Table extends Control<Table> {
		static CLASS: string = "tui-table";

		private _splitters: HTMLSpanElement[] = [];
		private _columns: {
			name?: string;
			key?: any;
			width?: number;
			important?: boolean;
			align?: string;
			headAlign?: string;
		}[] = [];
		private _data: IDataProvider = null;
		
		constructor(el?: HTMLTableElement) {
			super("table", Grid.CLASS, el);
			var self = this;

			this.addClass(Table.CLASS);
			this._columns = [];
			var noHead = this.noHead();
			var headLine = this.headLine();
			var headKeys = [];
			if (headLine) {
				for (var i = 0; i < headLine.cells.length; i++) {
					var cell = <HTMLTableCellElement>headLine.cells[i];
					var colKey = $(cell).attr("data-key");
					if (!noHead) {
						var col: { name: string; key: any; } = {
							name: cell.innerHTML,
							key: colKey ? colKey : i
						};
						headKeys.push(colKey ? colKey : i);
						this._columns.push(col);
					} else {
						headKeys.push(i);
						this._columns.push({ name: "", key: i });
					}
				}
			} else {
				if (!this.hasAttr("data-columns")) {
					this._columns = [];
				}
			}
			var data = {
				head: headKeys,
				data: []
			}
			for (var i = noHead ? 0 : 1; i < this[0].rows.length; i++) {
				var row = this[0].rows[i];
				var rowData = [];
				for (var j = 0; j < this._columns.length; j++) {
					rowData.push(row.cells[j].innerHTML);
				}
				data.data.push(rowData);
			}
			this.data(data);
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
			if (this.noHead())
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
					if (typeof this._columns[i].width !== "number")
						this._columns[i].width = $(cell).width();
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

		noHead(): boolean;
		noHead(val: boolean): Grid;
		noHead(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-no-head", val);
				this.data(this.data());
				return this;
			} else
				return this.is("data-no-head");
		}

		columns(): GridColumn[];
		columns(val?: GridColumn[]): Grid;
		columns(val?: GridColumn[]): any {
			if (val) {
				this._columns = val;
				this.data(this.data());
				return this;
			} else {
				if (!this._columns) {
					var valstr = this.attr("data-columns");
					this._columns = eval("(" + valstr + ")");
				}
				return this._columns;
			}
		}

		/**
		 * Used for support form control
		 */
		value(): any[];
		value(data: tui.IDataProvider): Grid;
		value(data: any[]): Grid;
		value(data: { data: any[]; head?: string[]; length?: number; }): Grid;
		value(data?: any): any {
			if (data) {
				return this.data(data);
			} else {
				var result = [];
				var dt = this.data();
				for (var i = 0; i < dt.length(); i++) {
					result.push(dt.at(i));
				}
				return result;
			}
		}

		data(): tui.IDataProvider;
		data(data: tui.IDataProvider): Grid;
		data(data: any[]): Grid;
		data(data: { data: any[]; head?: string[]; length?: number; }): Grid;
		data(data?: any): any {
			if (data) {
				var self = this;
				if (data instanceof Array || data.data && data.data instanceof Array) {
					data = new ArrayProvider(data);
				}
				if (typeof data.length !== "function" ||
					typeof data.sort !== "function" ||
					typeof data.at !== "function" ||
					typeof data.columnKeyMap !== "function") {
					throw new Error("TUI Table: need a data provider.");
				}

				var tb = (<HTMLTableElement>this[0]);
				while (tb.rows.length > 0) {
					tb.deleteRow(0);
				}
				if (!this.noHead()) {
					var row: HTMLTableRowElement = <HTMLTableRowElement>tb.insertRow(-1);
					for (var j = 0; j < this._columns.length; j++) {
						var cell = row.insertCell(-1);
						cell.className = "tui-table-head";
						if (["center", "left", "right"].indexOf(this._columns[j].headAlign) >= 0)
							cell.style.textAlign = this._columns[j].headAlign;
						var contentDiv: HTMLDivElement = <HTMLDivElement>cell.appendChild(document.createElement("div"));
						contentDiv.innerHTML = this._columns[j].name;
					}
				}
				for (var i = 0; i < data.length(); i++) {
					var rowData = data.at(i);
					var row: HTMLTableRowElement = <HTMLTableRowElement>tb.insertRow(-1);
					for (var j = 0; j < this._columns.length; j++) {
						var cell = row.insertCell(-1);
						if (["center", "left", "right"].indexOf(this._columns[j].align) >= 0)
							cell.style.textAlign = this._columns[j].align;
						var contentDiv: HTMLDivElement = <HTMLDivElement>cell.appendChild(document.createElement("div"));
						var key;
						if (this._columns[j].key) {
							key = this._columns[j].key;
						} else {
							key = j;
						}
						contentDiv.innerHTML = rowData[key];
					}
				}
				this.createSplitters();
				this.refresh();
				return this;
			} else {
				return this._data;
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
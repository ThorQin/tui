/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	export class List extends Control<List> {
		static CLASS: string = "tui-list";

		private _grid: Grid;
		private _childrenColumKey: string;
		private _checkedColumnKey: string;
		private _expandColumnKey: string;
		private _levelColumnKey: string;
		private _valueColumnKey: string;
		private _columnKeyMap: {} = null;

		constructor(el?: HTMLElement) {
			super();
			var self = this;
			if (el)
				this.elem(el);
			else
				this.elem("div", Grid.CLASS);
			this._grid = grid(el);
			this[0]._ctrl = this;
			this._grid.noHead(true);
			var columns = this._grid.columns();
			if (columns === null) {
				this._grid.columns([{
					key: "value",
					format: (info: IColumnFormatInfo) => {
						var cell = info.cell.firstChild;
						var isExpanded = !!info.row[this._expandColumnKey];
						var hasCheckbox = (typeof info.row[this._checkedColumnKey] === "boolean");
						var isChecked = !!info.row[this._checkedColumnKey];
						var hasChild = !!info.row[this._childrenColumKey];
						var spaceSpan = document.createElement("span");
						spaceSpan.className = "tui-list-space";
						var foldIcon = document.createElement("span");
						foldIcon.className = "tui-list-fold";
						if (hasChild) {
							if (isExpanded) {
								$(foldIcon).addClass("tui-list-fold-expand");
								$(foldIcon).mousedown((e) => {
									this.foldRow(info.row, info.rowIndex, e);
								});
							} else {
								$(foldIcon).addClass("tui-list-fold-unexpand");
								$(foldIcon).mousedown((e) => {
									this.expandRow(info.row, info.rowIndex, e);
								});
							}
						}
						
						if (hasCheckbox) {
							var checkIcon = document.createElement("span");
							checkIcon.className = "tui-list-checkbox";
							if (isChecked) {
								$(checkIcon).addClass("tui-checked");
							}
							cell.insertBefore(checkIcon, cell.firstChild);
							$(checkIcon).mouseup((e) => {
								this.checkRow(info.row, info.rowIndex, e);
							});
						}
						cell.insertBefore(foldIcon, cell.firstChild);
						cell.insertBefore(spaceSpan, cell.firstChild);
						var singleWidth = spaceSpan.offsetWidth;
						var level = info.row[this._levelColumnKey];
						spaceSpan.style.width = singleWidth * (typeof level === "number" ? level : 0) + "px";
					}
				}]);
			}
			this._grid.on("rowclick", (data) => {
				this.fire("rowclick", data);
			});
			this._grid.on("rowdblclick", (data) => {
				this.fire("rowdblclick", data);
			});
			this._grid.on("rowmousedown", (data) => {
				this.fire("rowmousedown", data);
			});
			this._grid.on("rowmouseup", (data) => {
				this.fire("rowmouseup", data);
			});
			this._grid.on("rowcontextmenu", (data) => {
				this.fire("rowcontextmenu", data);
			});
			this._grid.on("resizecolumn", (data) => {
				this.fire("resizecolumn", data);
			});
			this._grid.on("keydown", (data) => {
				if (data["event"].keyCode === 32) {
					var activeRowIndex = self._grid.activerow();
					if (activeRowIndex >= 0) {
						data["event"].preventDefault();
						data["event"].stopPropagation();
					}
				}
				this.fire("keydown", data);
			});
			this._grid.on("keyup", (data) => {
				if (data["event"].keyCode === 32) {
					var activeRowIndex = self._grid.activerow();
					if (activeRowIndex >= 0) {
						var row = self._grid.data().at(activeRowIndex);
						row[this._checkedColumnKey] = !row[this._checkedColumnKey];
						data["event"].preventDefault();
						data["event"].stopPropagation();
						this.fire("rowcheck", { event: event, checked: row[this._checkedColumnKey], row: row, index: activeRowIndex });
						this.refresh();
					}
				}
				this.fire("keyup", data);
			});
		}

		private checkRow(row, rowIndex: number, event) {
			row[this._checkedColumnKey] = !row[this._checkedColumnKey];
			this.fire("rowcheck", { event: event, checked: row[this._checkedColumnKey], row: row, index: rowIndex });
			this.refresh();
		}

		private expandRow(row, rowIndex: number, event) {
			row[this._expandColumnKey] = true;
			this.fire("rowexpand", { event: event, row: row, index: rowIndex });
			this.trimData();
		}

		private foldRow(row, rowIndex: number, event) {
			row[this._expandColumnKey] = false;
			this.fire("rowfold", { event: event, row: row, index: rowIndex });
			this.trimData();
		}

		private columnKey(key: string): any {
			var val = this._columnKeyMap[key];
			if (typeof val === "number" && val >= 0)
				return val;
			else
				return key;
		}

		private trimData() {

		}

		select(rows?: number[]): number[] {
			return this._grid.select(rows);
		}

		activerow(rowIndex?: number): number {
			return this._grid.activerow(rowIndex);
		}

		/**
		 * Adjust column width to adapt column content
		 * @param {Number} columnIndex
		 * @param {Boolean} expandOnly only expand column width
		 */
		autofitColumn(columnIndex: number, expandOnly: boolean = false, displayedOnly: boolean = true) {
			this._grid.autofitColumn(columnIndex, expandOnly, displayedOnly);
		}

		hasHScroll(): boolean;
		hasHScroll(val: boolean): List;
		hasHScroll(val?: boolean): any {
			return this._grid.hasHScroll(val);
		}

		columns(): GridColumn[];
		columns(val?: GridColumn[]): List;
		columns(val?: GridColumn[]): any {
			return this._grid.columns(val);
		}

		rowselectable(): boolean;
		rowselectable(val: boolean): List;
		rowselectable(val?: boolean): any {
			return this._grid.rowselectable(val);
		}

		scrollTo(rowIndex: number) {
			this._grid.scrollTo(rowIndex);
		}

		data(): tui.IDataProvider;
		data(data: tui.IDataProvider): List;
		data(data?: tui.IDataProvider): any {
			var ret = this._grid.data(data);
			var data = this._grid.data();
			if (data)
				this._columnKeyMap = data.columnKeyMap();
			else
				this._columnKeyMap = {};
			this._childrenColumKey = this.columnKey("children");
			this._checkedColumnKey = this.columnKey("checked");
			this._levelColumnKey = this.columnKey("level");
			this._valueColumnKey = this.columnKey("value");
			this._expandColumnKey = this.columnKey("expand");
			this.refresh();
			return ret;
		}

		refresh() {
			if (!this._grid)
				return;
			this._grid.refresh();
		}
	}

	export function list(param: HTMLElement): List;
	export function list(param: string): List;
	export function list(): List;
	/**
	 * Construct a grid.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function list(param?: any): List {
		return tui.ctrl.control(param, List);
	}

	tui.ctrl.registerInitCallback(List.CLASS, list);
}
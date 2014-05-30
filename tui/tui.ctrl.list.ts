/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	enum TriState {
		Unchecked = 0,
		HalfChecked = 1,
		Checked = 2
	}
	export class List extends Control<List> {
		static CLASS: string = "tui-list";

		private _grid: Grid;
		private _keyColumKey: string;
		private _childrenColumKey: string;
		private _checkedColumnKey: string;
		private _expandColumnKey: string;
		private _levelColumnKey: string;
		private _valueColumnKey: string;
		private _columnKeyMap: {} = null;

		constructor(el?: HTMLElement) {
			super("div", List.CLASS, null);
			var self = this;
			this._grid = grid(el);
			this[0] = this._grid[0];
			this[0]._ctrl = this;
			this.addClass(List.CLASS);
			this._grid.noHead(true);
			var columns = this._grid.columns();
			if (columns === null) {
				this._grid.columns([{
					key: "value",
					format: (info: IColumnFormatInfo) => {
						var rowcheckable = this.rowcheckable();
						var cell = info.cell.firstChild;
						var isExpanded = !!info.row[this._expandColumnKey];
						var hasCheckbox = (typeof info.row[this._checkedColumnKey] !== tui.undef);
						var isChecked = !!info.row[this._checkedColumnKey];
						var hasChild = !!info.row[this._childrenColumKey];
						var isHalfChecked = (this.triState() && info.row[this._checkedColumnKey] === TriState.HalfChecked);
						var spaceSpan = document.createElement("span");

						spaceSpan.className = "tui-list-space";
						var foldIcon = document.createElement("span");
						foldIcon.className = "tui-list-fold";
						if (hasChild) {
							if (isExpanded) {
								$(foldIcon).addClass("tui-list-fold-expand");
								$(foldIcon).mousedown((e) => {
									this.onFoldRow(info.row, info.rowIndex, e);
								});
							} else {
								$(foldIcon).addClass("tui-list-fold-unexpand");
								$(foldIcon).mousedown((e) => {
									this.onExpandRow(info.row, info.rowIndex, e);
								});
							}
						}
						
						if (hasCheckbox && rowcheckable) {
							var checkIcon = document.createElement("span");
							checkIcon.className = "tui-list-checkbox";
							if (isChecked) {
								if (isHalfChecked)
									$(checkIcon).addClass("tui-half-checked");
								else
									$(checkIcon).addClass("tui-checked");
							}
							cell.insertBefore(checkIcon, cell.firstChild);
							$(checkIcon).mouseup((e) => {
								this.onCheckRow(info.row, info.rowIndex, e);
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
				var keyCode = data["event"].keyCode;
				if (keyCode === 32) {
					var activeRowIndex = self._grid.activerow();
					if (activeRowIndex >= 0) {
						data["event"].preventDefault();
						data["event"].stopPropagation();
					}
				} else if (keyCode === 37 /*Left*/) {
					var item = self._grid.activeItem();
					if (item) {
						var children = item[self._childrenColumKey];
						if (children && children.length > 0 && item[self._expandColumnKey]) {
							item[self._expandColumnKey] = false;
							this.formatData();
						} else {
							if (item["__parent"]) {
								self.activeItem(item["__parent"]);
								self.scrollTo(self.activerow());
								self.refresh();
							}
						}

						data["event"].preventDefault();
						data["event"].stopPropagation();
					}
				} else if (keyCode === 39 /*Right*/) {
					var item = self._grid.activeItem();
					if (item) {
						var children = item[self._childrenColumKey];
						if (children && children.length > 0 && !item[self._expandColumnKey]) {
							item[self._expandColumnKey] = true;
							this.formatData();
						}
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
						this.onCheckRow(row, activeRowIndex, data["event"]);
					}
				}
				this.fire("keyup", data);
			});

			if (!this.hasAttr("data-rowselectable"))
				this.rowselectable(true);
			if (!this.hasAttr("data-rowcheckable"))
				this.rowcheckable(true);
			if (this._grid.data()) {
				this.data(this._grid.data());
			}
		}

		private checkChildren(children: any[], checkState: TriState) {
			for (var i = 0; i < children.length; i++) {
				if (!children[i])
					continue;
				children[i][this._checkedColumnKey] = checkState;
				var myChildren = children[i][this._childrenColumKey];
				myChildren && myChildren.length > 0 && this.checkChildren(myChildren, checkState);
			}
		}

		private checkParent(parent: any) {
			var children = parent[this._childrenColumKey];
			var checkedCount: number = 0, uncheckedCount: number = 0;
			for (var i = 0; i < children.length; i++) {
				var row = children[i];
				if (!row)
					continue;
				if (row[this._checkedColumnKey] === TriState.HalfChecked) {
					uncheckedCount++;
					checkedCount++;
					break;
				} else if (!!row[this._checkedColumnKey])
					checkedCount++;
				else
					uncheckedCount++;
			}
			if (checkedCount === 0)
				parent[this._checkedColumnKey] = TriState.Unchecked;
			else if (uncheckedCount === 0)
				parent[this._checkedColumnKey] = TriState.Checked;
			else
				parent[this._checkedColumnKey] = TriState.HalfChecked;
			parent["__parent"] && this.checkParent(parent["__parent"]);
		}

		private onCheckRow(row, rowIndex: number, event) {
			if (this.triState()) {
				var checkState = row[this._checkedColumnKey];
				if (checkState === TriState.HalfChecked || !checkState)
					checkState = TriState.Checked;
				else
					checkState = TriState.Unchecked;
				row[this._checkedColumnKey] = checkState;
				var children = row[this._childrenColumKey];
				children && children.length > 0 && this.checkChildren(children, checkState);
				var parent = row["__parent"];
				parent && this.checkParent(parent);
			} else
				row[this._checkedColumnKey] = !row[this._checkedColumnKey];
			this.fire("rowcheck", { event: event, checked: row[this._checkedColumnKey], row: row, index: rowIndex });
			this.refresh();
		}

		private onExpandRow(row, rowIndex: number, event) {
			row[this._expandColumnKey] = true;
			this.fire("rowexpand", { event: event, row: row, index: rowIndex });
			this.formatData();
		}

		private onFoldRow(row, rowIndex: number, event) {
			row[this._expandColumnKey] = false;
			this.fire("rowfold", { event: event, row: row, index: rowIndex });
			this.formatData();
		}

		private columnKey(key: string): any {
			var val = this._columnKeyMap[key];
			if (typeof val === "number" && val >= 0)
				return val;
			else
				return key;
		}

		private initData(useTriState: boolean = false) {
			var self = this;
			var data: any = this._grid.data();
			if (typeof data.process === "function") {
				function checkChildren(input: any[], parentRow): TriState {
					var checkedCount: number = 0, uncheckedCount: number = 0;
					for (var i = 0; i < input.length; i++) {
						var row = input[i];
						if (!row)
							continue;
						if (useTriState) {
							if (row[self._childrenColumKey] && row[self._childrenColumKey].length > 0) {
								var state: TriState = checkChildren(row[self._childrenColumKey], row);
								row[self._checkedColumnKey] = state;
							}
							if (row[self._checkedColumnKey] === TriState.HalfChecked) {
								uncheckedCount++;
								checkedCount++;
							} else if (!!row[self._checkedColumnKey])
								checkedCount++;
							else
								uncheckedCount++;
						} else {
							if (row[self._childrenColumKey] && row[self._childrenColumKey].length > 0) {
								checkChildren(row[self._childrenColumKey], row);
							}
						}
						row["__parent"] = parentRow;
					}
					if (useTriState) {
						if (checkedCount === 0)
							return TriState.Unchecked;
						else if (uncheckedCount === 0)
							return TriState.Checked;
						else
							return TriState.HalfChecked;
					}
				}

				function processTree(input: any[]): any[] {
					checkChildren(input, null);
					return input;
				}
				data.process(processTree);
			}
		}

		private initTriState() {
			this.initData(true);
		}

		private formatData() {
			var self = this;
			var data: any = this._grid.data();
			if (typeof data.process === "function") {
				function addChildren(input: any[], output: any[], level: number) {
					for (var i = 0; i < input.length; i++) {
						var row = input[i];
						if (!row)
							continue;
						output.push(row);
						row[self._levelColumnKey] = level;
						if (!!row[self._expandColumnKey] &&
							row[self._childrenColumKey] && row[self._childrenColumKey].length > 0) {
							addChildren(row[self._childrenColumKey], output, level + 1);
						}
					}
				}

				function processTree(input: any[]): any[]{
					var output = [];
					addChildren(input, output, 0);
					return output;
				}
				data.process(processTree);
			}
			this.refresh();
		}

		select(rows?: number[]): number[] {
			return this._grid.select(rows);
		}

		activerow(rowIndex?: number): number {
			return this._grid.activerow(rowIndex);
		}

		activeItem(rowItem?: any): any {
			if (typeof rowItem !== tui.undef) {
				if (rowItem) {
					var parent = rowItem["__parent"];
					while (parent) {
						parent[this._expandColumnKey] = true;
						parent = parent["__parent"];
					}
					this.formatData();
				}
			} 
			return this._grid.activeItem(rowItem);
		}

		activeRowByKey(key: string) {
			var self = this;
			var activeRow = null;
			function checkChildren(children: any[]): boolean {
				for (var i = 0; i < children.length; i++) {
					if (!children[i])
						continue;
					if (children[i][self._keyColumKey] === key) {
						activeRow = children[i];
						return true;
					}
					var myChilren = children[i][self._childrenColumKey];
					if (myChilren && myChilren.length > 0)
						if (checkChildren(myChilren))
							return true;
				}
			}
			var data: ArrayProvider = <ArrayProvider>this._grid.data();
			if (typeof data.src === "function") {
				if (checkChildren(data.src())) {
					return this.activeItem(activeRow);
				} else
					return this.activeItem(null);
			} else
				return null;
		}

		private doCheck(keys: any[], checkState: TriState) {
			var self = this;
			var useTriState = this.triState();
			var map = {};
			if (keys) {
				for (var i = 0; i < keys.length; i++) {
					map[keys[i]] = true;
				}
			}
			function checkChildren(keys: any[], children: any[]) {
				for (var i = 0; i < children.length; i++) {
					if (!children[i])
						continue;
					if (keys === null || map[children[i][self._keyColumKey]]) {
						children[i][self._checkedColumnKey] = checkState;
					}
					var myChilren = children[i][self._childrenColumKey];
					if (myChilren && myChilren.length > 0)
						checkChildren(keys, myChilren);
				}
			}
			var data: ArrayProvider = <ArrayProvider>this._grid.data();
			if (data && typeof data.src === "function") {
				checkChildren(keys, data.src());
				if (useTriState) {
					this.initTriState();
				}
				this.refresh();
			}
		}

		checkItems(keys: any[]): List {
			this.doCheck(keys, TriState.Checked);
			return this;
		}
		checkAllItems(): List {
			this.doCheck(null, TriState.Checked);
			return this;
		}
		uncheckItems(keys: any[]): List {
			this.doCheck(keys, TriState.Unchecked);
			return this;
		}
		uncheckAllItems(): List {
			this.doCheck(null, TriState.Unchecked);
			return this;
		}
		checkedItems(): any[]{
			var self = this;
			var checkedItems = [];
			function checkChildren(children: any[]) {
				for (var i = 0; i < children.length; i++) {
					if (!children[i])
						continue;
					if (!!children[i][self._checkedColumnKey])
						checkedItems.push(children[i]);
					var myChilren = children[i][self._childrenColumKey];
					if (myChilren && myChilren.length > 0)
						checkChildren(myChilren);
				}
			}
			var data: ArrayProvider = <ArrayProvider>this._grid.data();
			if (data && typeof data.src === "function") {
				checkChildren(data.src());
			}
			return checkedItems;
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

		rowcheckable(): boolean;
		rowcheckable(val: boolean): List;
		rowcheckable(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-rowcheckable", val);
				this.refresh();
				return this;
			} else
				return this.is("data-rowcheckable");
		}

		consumeMouseWheelEvent(): boolean;
		consumeMouseWheelEvent(val: boolean): Grid;
		consumeMouseWheelEvent(val?: boolean): any {
			return this._grid.consumeMouseWheelEvent(val);
		}

		triState(): boolean;
		triState(val: boolean): List;
		triState(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-tri-state", val);
				this.refresh();
				return this;
			} else
				return this.is("data-tri-state");
		}


		scrollTo(rowIndex: number) {
			this._grid.scrollTo(rowIndex);
		}

		/**
		 * Return binded data provider
		 */
		data(): tui.IDataProvider;
		data(data: tui.IDataProvider): List;
		data(data?: tui.IDataProvider): any {
			var ret = this._grid.data(data);
			if (data) {
				var data = this._grid.data();
				if (data)
					this._columnKeyMap = data.columnKeyMap();
				else
					this._columnKeyMap = {};
				this._keyColumKey = this.columnKey("key");
				this._childrenColumKey = this.columnKey("children");
				this._checkedColumnKey = this.columnKey("checked");
				this._levelColumnKey = this.columnKey("level");
				this._valueColumnKey = this.columnKey("value");
				this._expandColumnKey = this.columnKey("expand");
				if (this.triState())
					this.initTriState();
				else
					this.initData();
				this.formatData();
			}
			return ret;
		}

		lineHeight() {
			if (!this._grid)
				return 0;
			return this._grid.lineHeight();
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
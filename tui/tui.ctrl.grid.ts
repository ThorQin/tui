/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {

	export interface IColumnFormatInfo {
		cell: HTMLSpanElement;	// Drawing cell
		value: any;				// Cell content either is HTML node or text content
		row: any;				// Row data
		col: GridColumn;		// Column definition
		colKey: any;			// Via this key can either get or set row value
		rowIndex: number;		// Drawing row, if row index is -1 means this line a head line
		colIndex: number;		// Column index
		isRowActived: boolean;	// Indicate whether the current row are selected.
		grid: Grid;
	}

	export interface GridColumn {
		key?: any;				// Column key
		name?: any;				// Column name
		width?: number;			// Column width
		fixed?: boolean;		// Whether the column is fixed width
		sort?: any;				// Can be a comare function or true means this column can be sort
		align?: string;			// "left","center","right"
		headAlign?: string;		// "left","center","right"

		// Format field is a only field that can not be provided by 
		// grid 'data-columns' attribute
		format?: (info: IColumnFormatInfo) => void;
	}

	export class Grid extends Control<Grid> {
		static CLASS: string = "tui-grid";
		private _tableId = tui.uuid();
		private _gridStyle: any = null;
		// Grid data related
		private _columns: GridColumn[] = null;
		private _emptyColumns: GridColumn[] = [];
		private _data: tui.IDataProvider = null;
		private _emptyData: tui.IDataProvider = new tui.ArrayProvider([]);
		private _sortColumn: number;
		private _sortDesc: boolean;

		// Some computed sizes
		private _contentHeight: number; // <line height> * <total lines>
		private _contentWidth: number; // Sum( <all columns> )
		private _lineHeight: number;
		private _headHeight: number;
		private _boxHeight: number;
		private _boxWidth: number;
		private _borderWidth: number;

		// Elements of this grid
		private _headline: HTMLDivElement;
		private _hscroll: Scrollbar;
		private _vscroll: Scrollbar;
		private _space: HTMLSpanElement;
		private _splitters: HTMLSpanElement[] = [];

		// Scrolling related
		private _scrollTop = 0;
		private _scrollLeft = 0;
		private _bufferedLines: HTMLDivElement[] = [];
		private _bufferedBegin = 0;
		private _bufferedEnd = 0;	// _bufferedEnd = _bufferedBegin + buffered count
		private _dispLines = 0;		// How many lines can be displayed in grid viewable area

		// Drawing related flags
		private _selectrows: number[] = [];
		private _activerow: number = null;
		//private _columnKeyMap: {} = null;
		private _noRefresh = false;
		private _initialized = false;
		//private _initInterval = null;
		
		// Following variables are very useful when grid switch to edit mode 
		// because grid cell need spend more time to draw.
		private _drawingTimer = null;
		private _delayDrawing = true;

		constructor(el?: HTMLElement) {
			super("div", Grid.CLASS, el);
			var self = this;

			this.attr("tabIndex", "0");
			this[0].innerHTML = "";
			if (document.createStyleSheet) {
				this._gridStyle = document.createStyleSheet();
			} else {
				this._gridStyle = document.createElement("style");
				document.head.appendChild(this._gridStyle);
			}
			this._headline = document.createElement("div");
			this._headline.className = "tui-grid-head";
			this[0].appendChild(this._headline);
			this._hscroll = tui.ctrl.scrollbar();
			this._hscroll.direction("horizontal");
			this[0].appendChild(this._hscroll[0]);
			this._vscroll = tui.ctrl.scrollbar();
			this._vscroll.direction("vertical");
			this[0].appendChild(this._vscroll[0]);
			this._space = document.createElement("span");
			this._space.className = "tui-scroll-space";
			this[0].appendChild(this._space);
			var scrollTimeDelay = (tui.ieVer > 8 ? 100 : 50);
			this._vscroll.on("scroll", function (data) {
				if (!self._delayDrawing) {
					self._scrollTop = data["value"];
					self.drawLines();
				} else {
					var diff = Math.abs(data["value"] - self._scrollTop);
					self._scrollTop = data["value"];
					if (diff < 3 * self._lineHeight && self._drawingTimer === null) {
						self.drawLines();
					} else {
						self.drawLines(true);
						clearTimeout(self._drawingTimer);
						self._drawingTimer = setTimeout(function () {
							self.clearBufferLines();
							self.drawLines();
							self._drawingTimer = null;
						}, scrollTimeDelay);
					}
				}
			});
			this._hscroll.on("scroll", function (data) {
				self._scrollLeft = data["value"];
				self.drawLines();
			});
			var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
			$(this[0]).on(mousewheelevt, function (ev) {
				var e = <any>ev.originalEvent;
				var delta = e.detail ? e.detail * (-120) : e.wheelDelta;
				var step = Math.round(self._vscroll.page() / 2);
				//delta returns +120 when wheel is scrolled up, -120 when scrolled down
				var scrollSize = step > self._vscroll.step() ? step : self._vscroll.step();
				if (delta <= -120) {
					if (self._vscroll.value() < self._vscroll.total()) {
						self._vscroll.value(self._vscroll.value() + scrollSize);
						self._scrollTop = self._vscroll.value();
						self.drawLines();
						ev.stopPropagation();
						ev.preventDefault();
					} else if (self.consumeMouseWheelEvent()) {
						ev.stopPropagation();
						ev.preventDefault();
					}
				} else {
					if (self._vscroll.value() > 0) {
						self._vscroll.value(self._vscroll.value() - scrollSize);
						self._scrollTop = self._vscroll.value();
						self.drawLines();
						ev.stopPropagation();
						ev.preventDefault();
					} else if (self.consumeMouseWheelEvent()) {
						ev.stopPropagation();
						ev.preventDefault();
					}
				}
			});
			$(this[0]).mousedown(function (e) {
				tui.focusWithoutScroll(self[0]);
				e.preventDefault();
			});
			$(this[0]).keyup(function (e) {
				self.fire("keyup", {event:e});
			});
			$(this[0]).keydown(function (e) {
				if (self.fire("keydown", {event:e}) === false)
					return;
				var data = self.myData();
				var k = e.keyCode;
				// 37:left 38:up 39:right 40:down
				if ([33, 34, 37, 38, 39, 40].indexOf(k) >= 0) {
					if (k === 37) {
						!self._hscroll.hidden() && self._hscroll.value(self._hscroll.value() - self._hscroll.step());
						self._scrollLeft = self._hscroll.value();
						self.drawLines();
					} else if (k === 38) {
						if (!self.rowselectable() || data.length() <= 0) {
							!self._vscroll.hidden() && self._vscroll.value(self._vscroll.value() - self._vscroll.step());
							self._scrollTop = self._vscroll.value();
							self.drawLines();
						} else {
							if (self._activerow === null) {
								self.activerow(0);
								self.scrollTo(self._activerow);
							} else {
								if (self._activerow > 0)
									self.activerow(self._activerow - 1);
								self.scrollTo(self._activerow);
							}
						}
					} else if (k === 39) {
						!self._hscroll.hidden() && self._hscroll.value(self._hscroll.value() + self._hscroll.step());
						self._scrollLeft = self._hscroll.value();
						self.drawLines();
					} else if (k === 40) {
						if (!self.rowselectable() || data.length() <= 0) {
							!self._vscroll.hidden() && self._vscroll.value(self._vscroll.value() + self._vscroll.step());
							self._scrollTop = self._vscroll.value();
							self.drawLines();
						} else {
							if (self._activerow === null) {
								self.activerow(0);
								self.scrollTo(self._activerow);
							} else {
								if (self._activerow < data.length() - 1)
									self.activerow(self._activerow + 1);
								self.scrollTo(self._activerow);
							}
						}
					} else if (k === 33) {
						if (!self.rowselectable() || data.length() <= 0) {
							!self._vscroll.hidden() && self._vscroll.value(self._vscroll.value() - self._vscroll.page());
							self._scrollTop = self._vscroll.value();
							self.drawLines();
						} else {
							if (self._activerow === null) {
								self.activerow(0);
								self.scrollTo(self._activerow);
							} else {
								if (self._activerow > 0)
									self.activerow(self._activerow - self._dispLines);
								self.scrollTo(self._activerow);
							}
						}
					} else if (k === 34) {
						if (!self.rowselectable() || data.length() <= 0) {
							!self._vscroll.hidden() && self._vscroll.value(self._vscroll.value() + self._vscroll.page());
							self._scrollTop = self._vscroll.value();
							self.drawLines();
						} else {
							if (self._activerow === null) {
								self.activerow(self._dispLines);
								self.scrollTo(self._activerow);
							} else {
								if (self._activerow < data.length() - 1)
									self.activerow(self._activerow + self._dispLines);
								self.scrollTo(self._activerow);
							}
						}
					}
					e.preventDefault();
					e.stopPropagation();
					if (tui.ieVer > 0)
						self[0].setActive();
				} else if (k === tui.KEY_TAB) {
					if ((e.target || e.srcElement) === self[0]) {
						var rowIndex;
						if (self.rowselectable()) {
							rowIndex = self.activerow();
						} else {
							rowIndex = self._bufferedBegin;
						}
						if (self.editRow(rowIndex))
							e.preventDefault();
					}
				}
			});

			if (this.hasAttr("data-delay-drawing"))
				this._delayDrawing = this.is("data-delay-drawing");

			var predefined: any = this.attr("data-data");
			if (predefined)
				predefined = eval("(" + predefined + ")");
			if (predefined)
				this.data(predefined);
			else
				this.refresh();
			//if (!this._initialized) {
			//	this._initInterval = setInterval(() => {
			//		self.refresh();
			//		if (self._initialized) {
			//			clearInterval(self._initInterval);
			//			self._initInterval = null;
			//		}
			//	}, 100);
			//}
		}

		//release() {
		//	if (this._initInterval)
		//		clearInterval(this._initInterval);
		//}

		// Make sure not access null object
		private myData(): tui.IDataProvider {
			return this._data || this._emptyData;
		}

		private myColumns() {
			return this.columns() || this._emptyColumns;
		}

		private headHeight() {
			if (!this.noHead())
				return this._headHeight;
			else
				return 0;
		}

		private static colSize(size, def: number): number {
			if (typeof size === "number" && !isNaN(size)) {
				if (size < 0)
					return 0;
				else
					return Math.round(size);
			} else
				return def;
		}

		private computeVScroll(mark: { isHScrollComputed: boolean; }) {
			var hScrollbarHeight = this._hscroll.hidden() ? 0 : this._hscroll[0].offsetHeight;
			var contentHeight = this._contentHeight;
			var innerHeight = this._boxHeight - hScrollbarHeight;
			var totalHeight = contentHeight + this.headHeight();
			this._dispLines = Math.ceil((innerHeight - this.headHeight()) / this._lineHeight);
			var vHidden = this._vscroll.hidden();
			if (totalHeight > innerHeight) {
				this._vscroll.hidden(false);
				this._vscroll[0].style.bottom = hScrollbarHeight + "px";
				this._vscroll.total(totalHeight - innerHeight)
					.value(this._scrollTop)
					.step(this._lineHeight)
					.page(innerHeight / totalHeight * (totalHeight - innerHeight));
			} else {
				this._vscroll.hidden(true);
				this._vscroll.total(0);
			}
			this._scrollTop = this._vscroll.value();
			if (vHidden !== this._vscroll.hidden()) {
				this.computeHScroll(mark);
				this.computeColumns();
			}
		}

		private computeHScroll(mark: { isHScrollComputed: boolean; }) {
			mark.isHScrollComputed = true;
			var columns = this.myColumns();
			var vScrollbarWidth = this._vscroll.hidden() ? 0 : this._vscroll[0].offsetWidth;
			var innerWidth = this._boxWidth - vScrollbarWidth;
			var hHidden = this._hscroll.hidden();
			if (this.hasHScroll()) {
				this._contentWidth = 0;
				var cols = (columns.length < 1 ? 1 : columns.length);
				var defaultWidth = Math.floor((innerWidth - this._borderWidth * cols) / cols);
				for (var i = 0; i < columns.length; i++) {
					this._contentWidth += Grid.colSize(
						columns[i].width, defaultWidth) + this._borderWidth;
				}
				if (this._contentWidth > innerWidth) {
					this._hscroll.hidden(false);
					this._hscroll[0].style.right = vScrollbarWidth + "px";
					this._hscroll.total(this._contentWidth - innerWidth)
						.value(this._scrollLeft).step(10)
						.page(innerWidth / this._contentWidth * (this._contentWidth - innerWidth));
				} else {
					this._hscroll.hidden(true);
					this._hscroll.total(0);
				}
			} else {
				this._contentWidth = innerWidth;
				this._hscroll.hidden(true);
				this._hscroll.total(0);
			}
			this._scrollLeft = this._hscroll.value();
			if (hHidden !== this._hscroll.hidden())
				this.computeVScroll(mark);
		}

		private computeScroll() {
			this._boxWidth = this[0].clientWidth;
			this._boxHeight = this[0].clientHeight;
			var cell = document.createElement("span");
			cell.className = "tui-grid-cell";
			var line = document.createElement("span");
			line.className = "tui-grid-line";
			line.appendChild(cell);
			cell.innerHTML = "a";
			this[0].appendChild(line);
			this._lineHeight = $(line).outerHeight();//line.offsetHeight;
			this._borderWidth = $(cell).outerWidth() - $(cell).width();
			cell.className = "tui-grid-head-cell";
			line.className = "tui-grid-head";
			this._headHeight = line.offsetHeight;
			this[0].removeChild(line);
			this._contentHeight = this._lineHeight * this.myData().length();
			var mark = { isHScrollComputed:false };
			this._hscroll.hidden(true);
			this._vscroll.hidden(true);
			this.computeVScroll(mark);
			if (!mark.isHScrollComputed) {
				this.computeHScroll(mark);
				this.computeColumns();
			}
			if (!this._hscroll.hidden() && !this._vscroll.hidden()) {
				this._space.style.display = "";
			} else
				this._space.style.display = "none";
		}

		// Do not need call this function standalone, 
		// it's always to be called by computeScroll function
		private computeColumns() {
			var columns = this.myColumns();
			var vScrollbarWidth = this._vscroll.hidden() ? 0 : this._vscroll[0].offsetWidth;
			var innerWidth = this._boxWidth - vScrollbarWidth;
			var cols = (columns.length < 1 ? 1 : columns.length);
			var defaultWidth = Math.floor((innerWidth - this._borderWidth * cols) / cols);
			if (this.hasHScroll()) {
				if (defaultWidth < 100)
					defaultWidth = 100;
				for (var i = 0; i < columns.length; i++) {
					delete columns[i]["_important"];
					columns[i].width = Grid.colSize(columns[i].width, defaultWidth);
				}
			} else {
				var totalNoBorderWidth = this._contentWidth - this._borderWidth * cols;
				totalNoBorderWidth += (vScrollbarWidth === 0 ? 1 : 0);
				var totalNoFixedWidth = totalNoBorderWidth;
				var totalNeedComputed = 0;
				var totalNeedComputedCount = 0;
				var totalImportantWidth = 0;
				var important: number[] = [];
				// Exclude all fixed columns
				for (var i = 0; i < columns.length; i++) {
					if (columns[i]["fixed"]) {
						if (typeof columns[i].width !== "number" || isNaN(columns[i].width))
							columns[i].width = defaultWidth;
						totalNoFixedWidth -= columns[i].width;
					}
				}
				if (totalNoFixedWidth < 0)
					totalNoFixedWidth = 0;
				var totalNoImportantWidth = totalNoFixedWidth;

				for (var i = 0; i < columns.length; i++) {
					if (typeof columns[i].width !== "number" || isNaN(columns[i].width))
						columns[i].width = defaultWidth;
					else if (columns[i].width < 0)
						columns[i].width = 0;
					if (columns[i]["fixed"]) {
						// Ignore
					} else if (columns[i]["_important"]) {
						important.push(i);
						delete columns[i]["_important"];
						columns[i].width = Math.round(columns[i].width);
						if (columns[i].width > totalNoFixedWidth) {
							columns[i].width = totalNoFixedWidth;
						}
						totalImportantWidth += columns[i].width;
						totalNoImportantWidth -= columns[i].width;
					} else {
						totalNeedComputed += Math.round(columns[i].width);
						totalNeedComputedCount++;
					}
				}
				if (totalNeedComputedCount > 0 && totalNeedComputed === 0) {
					for (var i = 0; i < columns.length; i++) {
						if (important.indexOf(i) < 0 && !columns[i]["fixed"]) {
							columns[i].width = Math.floor(totalNoImportantWidth / totalNeedComputedCount);
						}
					}
				} else {
					for (var i = 0; i < columns.length; i++) {
						if (important.indexOf(i) < 0 && !columns[i]["fixed"]) {
							if (totalNeedComputed === 0)
								columns[i].width = 0; // To avoid divide by zero
							else
								columns[i].width = Math.floor(Math.round(columns[i].width) / totalNeedComputed * totalNoImportantWidth);
						}
					}
				}
				var total = 0;
				for (var i = 0; i < columns.length; i++) {
					total += columns[i].width;
				}
				if (total < totalNoBorderWidth && columns.length > 0) {
					for (var i = 0; i < columns.length; i++) {
						if (!columns[i].fixed) {
							columns[i].width += totalNoBorderWidth - total;
							break;
						}
					}
				}
			}
			var cssText = "";
			for (var i = 0; i < columns.length; i++) {
				var wd = columns[i].width;
				cssText += (".tui-grid-" + this._tableId + "-" + i + "{width:" + wd + "px}");
			}
			if (document.createStyleSheet) // IE
				this._gridStyle.cssText = cssText;
			else
				this._gridStyle.innerHTML = cssText;
		}

		private bindSplitter(cell: HTMLSpanElement, col: GridColumn, colIndex: number) {
			var self = this;
			var splitter = document.createElement("span");
			splitter.className = "tui-grid-splitter";
			splitter.setAttribute("unselectable", "on");
			$(splitter).mousedown(function (e) {
				var l = splitter.offsetLeft;
				var srcX = e.clientX;
				splitter.style.height = self[0].clientHeight + "px";
				splitter.style.bottom = "";
				$(splitter).addClass("tui-splitter-move");
				var mask = tui.mask();
				mask.style.cursor = "col-resize";
				function onDragEnd(e) {
					$(document).off("mousemove", onDrag);
					$(document).off("mouseup", onDragEnd);
					tui.unmask();
					splitter.style.bottom = "0";
					splitter.style.height = "";
					$(splitter).removeClass("tui-splitter-move");
					col.width = col.width + e.clientX - srcX;
					col["_important"] = true;
					var currentTime = today().getTime();
					if (col["_lastClickTime"]) {
						if (currentTime - col["_lastClickTime"] < 500) {
							self.autofitColumn(colIndex, false, true);
							self.fire("resizecolumn", { col: colIndex });
							return;
						}
					}
					col["_lastClickTime"] = currentTime;
					self.refresh();
					self.fire("resizecolumn", { col: colIndex });
				}
				function onDrag(e) {
					splitter.style.left = l + e.clientX - srcX + "px";
				}
				$(document).on("mousemove", onDrag);
				$(document).on("mouseup", onDragEnd);
			});
			this._splitters.push(splitter);
			return splitter;
		}

		private bindSort(cell: HTMLSpanElement, col: GridColumn, colIndex: number) {
			var self = this;
			if (col.sort) {
				$(cell).addClass("tui-grid-sortable");
				$(cell).mousedown(function (event) {
					if (!tui.isLButton(event.button))
						return;
					if (self._sortColumn !== colIndex)
						self.sort(colIndex);
					else if (!self._sortDesc)
						self.sort(colIndex, true);
					else
						self.sort(null);
				});
			}
			if (self._sortColumn === colIndex) {
				if (self._sortDesc)
					$(cell).addClass("tui-grid-cell-sort-desc");
				else
					$(cell).addClass("tui-grid-cell-sort-asc");
			}
		}

		private moveSplitter() {
			for (var i = 0; i < this._splitters.length; i++) {
				var splitter = this._splitters[i];
				var cell = <HTMLSpanElement>this._headline.childNodes[i];//*2];
				splitter.style.left = cell.offsetLeft + cell.offsetWidth - Math.round(splitter.offsetWidth / 2) + "px";
			}
		}

		private drawCell(cell: HTMLSpanElement, contentSpan: HTMLSpanElement, col: GridColumn, colKey: any, value: any, row: any, rowIndex: number, colIndex: number) {
			if (rowIndex >= 0) {
				if (["center", "left", "right"].indexOf(col.align) >= 0)
					cell.style.textAlign = col.align;
			} else {
				if (["center", "left", "right"].indexOf(col.headAlign) >= 0)
					cell.style.textAlign = col.headAlign;
			}
			if (value === null || typeof value === undef) {
				contentSpan.innerHTML = "";
			} else if (typeof value === "object" && value.nodeName) {
				contentSpan.innerHTML = "";
				contentSpan.appendChild(value);
			} else {
				contentSpan.innerHTML = value;
			}
			if (typeof col.format === "function") {
				col.format.call(this, {
					cell: cell,
					value: value,
					row: row,
					col: col,
					colKey: colKey,
					rowIndex: rowIndex,
					colIndex: colIndex,
					isRowActived: rowIndex === this._activerow,
					grid: this
				});
			}
			if (this._sortColumn === colIndex)
				$(cell).addClass("tui-grid-sort-cell");
			else
				$(cell).removeClass("tui-grid-sort-cell");
		}

		private drawHead() {
			if (this.noHead()) {
				$(this._headline).addClass("tui-hidden");
				return;
			}
			$(this._headline).removeClass("tui-hidden");
			var columns = this.myColumns();
			this._headline.innerHTML = "";
			this._splitters.length = 0;
			for (var i = 0; i < columns.length; i++) {
				var col = columns[i];
				var key = null;
				if (typeof col.key !== tui.undef && col.key !== null) {
					key = this.myData().mapKey(col.key)
					if (typeof key === tui.undef)
						key = col.key;
				}
				var cell = document.createElement("span");
				cell.setAttribute("unselectable", "on");
				cell.className = "tui-grid-head-cell tui-grid-" + this._tableId + "-" + i;
				this._headline.appendChild(cell);
				var contentSpan = document.createElement("span");
				contentSpan.className = "tui-grid-cell-content";
				cell.appendChild(contentSpan);
				this.drawCell(cell, contentSpan, col, key, col.name, null, -1, i);
				this.bindSort(cell, col, i);
				if (this.resizable()) {
					var splitter = this.bindSplitter(cell, col, i);
					if (typeof columns[i].fixed === "boolean" && columns[i].fixed)
						$(splitter).addClass("tui-hidden");
				}
			}
			for (var i = 0; i < this._splitters.length; i++) {
				var splitter = this._splitters[i];
				this._headline.appendChild(splitter);
			}
			this.moveSplitter();
		}

		private isRowSelected(rowIndex: number): boolean {
			return this._selectrows.indexOf(rowIndex) >= 0;
		}

		private drawLine(line: HTMLDivElement, index: number, empty: boolean) {
			var columns = this.myColumns();
			
			if (line.childNodes.length !== columns.length) {
				line.innerHTML = "";
				var rowSel = this.rowselectable();
				for (var i = 0; i < columns.length; i++) {
					var cell = document.createElement("span");
					//if (rowSel)
					//	cell.setAttribute("unselectable", "on");
					cell.className = "tui-grid-cell tui-grid-" + this._tableId + "-" + i;
					line.appendChild(cell);
				}
			}
			if (empty) {
				return;
			}
			
			var self = this;
			var data = this.myData();
			var rowData = data.at(index);
			for (var i = 0; i < line.childNodes.length; i++) {
				var cell = <HTMLSpanElement>line.childNodes[i];
				cell.innerHTML = "";
				var contentSpan = document.createElement("span");
				contentSpan.className = "tui-grid-cell-content";
				cell.appendChild(contentSpan);
				var col = columns[i];
				var key = null;
				if (typeof col.key !== tui.undef)
					key = data.mapKey(col.key);
				var value = (key !== null && rowData ? rowData[key] : "");
				this.drawCell(cell, contentSpan, col, key, value, rowData, index, i);
			}
			var jqLine = $(line);
			jqLine.on("contextmenu", function (e) {
				var index = line["_rowIndex"];
				self.fire("rowcontextmenu", {"event": e, "index": index, "row": line });
			});
			//if (self.rowdraggable()) {
			//	jqLine.attr("draggable", "true");
			//	line.ondragstart = function () {
			//		//alert("dragstart");
			//	};

			//}
			jqLine.mousedown(function (e) {
				var index = line["_rowIndex"];
				if (self.rowselectable()) {
					self.activerow(index);
					self.scrollTo(index);
				}
				//if (self.rowdraggable() && line.dragDrop) {
				//	line.dragDrop();
				//}
				self.fire("rowmousedown", { "event": e, "index": index, "row": line });
			});
			jqLine.mouseup( function (e) {
				var index = line["_rowIndex"];
				self.fire("rowmouseup", { "event": e, "index": index, "row": line });
			});
			jqLine.on("click", function (e) {
				var index = line["_rowIndex"];
				self.fire("rowclick", { "event": e, "index": index, "row": line });
			});
			jqLine.on("dblclick", function (e) {
				var index = line["_rowIndex"];
				self.fire("rowdblclick", { "event": e, "index": index, "row": line });
			});
		}

		private moveLine(line: HTMLDivElement, index: number, base: number) {
			line.style.top = (base + index * this._lineHeight) + "px";
			line.style.left = -this._scrollLeft + "px";
		}

		private drawLines(empty: boolean = false) {
			this._headline.style.left = -this._scrollLeft + "px";
			var base = this.headHeight() - this._scrollTop % this._lineHeight;
			var begin = Math.floor(this._scrollTop / this._lineHeight);
			var newBuffer = [];
			var data = this.myData();
			for (var i = begin; i < begin + this._dispLines + 1 && i < data.length(); i++) {
				if (i >= this._bufferedBegin && i < this._bufferedEnd) {
					// Is buffered.
					var line = this._bufferedLines[i - this._bufferedBegin];
					this.moveLine(line, i - begin, base);
					newBuffer.push(line);
				} else {
					var line = document.createElement("div");
					line.className = "tui-grid-line";
					//this[0].insertBefore(line, this._headline);
					this[0].appendChild(line);
					newBuffer.push(line);
					line["_rowIndex"] = i;
					this.drawLine(line, i, empty);
					this.moveLine(line, i - begin, base);
				}
				if (this.isRowSelected(i)) {
					$(line).addClass("tui-grid-line-selected");
				} else
					$(line).removeClass("tui-grid-line-selected");
			}
			var end = i;
			for (var i = this._bufferedBegin; i < this._bufferedEnd; i++) {
				if (i < begin || i >= end)
					this[0].removeChild(this._bufferedLines[i - this._bufferedBegin]);
			}
			this._bufferedLines = newBuffer;
			this._bufferedBegin = begin;
			this._bufferedEnd = end;
		}

		private clearBufferLines() {
			if (!this[0])
				return;
			for (var i = 0; i < this._bufferedLines.length; i++) {
				var l = this._bufferedLines[i];
				this[0].removeChild(l);
			}
			this._bufferedLines = [];
			this._bufferedEnd = this._bufferedBegin = 0;
		}

		lineHeight() {
			if (typeof this._lineHeight !== undef)
				return this._lineHeight;
			else {
				var grid = document.createElement("div");
				grid.className = this[0].className;
				var line = document.createElement("div");
				line.className = "tui-grid-line";
				grid.appendChild(line);
				document.body.appendChild(grid);
				var lineHeight = line.offsetHeight;
				document.body.removeChild(grid);
				return lineHeight;
			}
		}

		select(rows?: number[]): number[]{
			if (rows && typeof rows.length === "number" && rows.length >= 0) {
				this._selectrows.length = 0;
				for (var i = 0; i < rows.length; i++) {
					this._selectrows.push(rows[i]);
				}
				// Clear buffer cause row click event cannot be raised, 
				// so never do this when we only want to change row selection status.
				this.drawLines();
			}
			return this._selectrows;
		}

		activerow(rowIndex?: number): number {
			if (typeof rowIndex === "number" || rowIndex === null) {
				if (rowIndex < 0)
					rowIndex = 0;
				if (rowIndex >= this.myData().length())
					rowIndex = this.myData().length() - 1;
				this._activerow = rowIndex;
				if (rowIndex === null)
					this.select([]);
				else
					this.select([rowIndex]);
			}
			return this._activerow;
		}

		activeItem(rowItem?: any): any {
			var data = this.myData();
			if (typeof rowItem !== tui.undef) {
				if (rowItem === null) {
					this.activerow(null);
				} else {
					for (var i = 0; i < data.length(); i++) {
						if (data.at(i) === rowItem) {
							this.activerow(i);
							break;
						}
					}
				}
			} 
			if (this._activerow !== null) {
				return data.at(this._activerow);
			} else
				return null;
		}

		/**
		 * Sort by specifed column
		 * @param {Number} colIndex
		 * @param {Boolean} desc
		 */
		sort(colIndex: number, desc: boolean = false) {
			var columns = this.myColumns();
			if (colIndex === null) {
				this._sortColumn = null;
				this.myData().sort(null, desc);
				this._sortDesc = false;
			} else if (typeof colIndex === "number" &&
				!isNaN(colIndex) &&
				colIndex >= 0 &&
				colIndex < columns.length &&
				columns[colIndex].sort) {
				this._sortColumn = colIndex;
				this._sortDesc = desc;
				if (typeof columns[colIndex].sort === "function")
					this.myData().sort(columns[colIndex].key, this._sortDesc, columns[colIndex].sort);
				else
					this.myData().sort(columns[colIndex].key, this._sortDesc);
			}
			this._sortDesc = !!desc;
			this._scrollTop = 0;
			this.activerow(null);
			this._initialized = false;
			this.refresh();
			return { colIndex: this._sortColumn, desc: this._sortDesc };
		}

		/**
		 * Adjust column width to adapt column content
		 * @param {Number} columnIndex
		 * @param {Boolean} expandOnly Only expand column width
		 * @param {Boolean} displayedOnly Only compute displayed lines, 
		 *		if this parameter is false then grid will compute all lines 
		 *		regardless of whether it is visible
		 */
		autofitColumn(columnIndex: number, expandOnly: boolean = false, displayedOnly: boolean = true) {
			if (typeof (columnIndex) !== "number")
				return;
			var columns = this.myColumns();
			if (columnIndex < 0 && columnIndex >= columns.length)
				return;
			var col = columns[columnIndex];
			var maxWidth = 0;
			if (expandOnly)
				maxWidth = col.width || 0;
			var cell = document.createElement("span");
			cell.className = "tui-grid-cell";
			cell.style.position = "absolute";
			cell.style.visibility = "hidden";
			cell.style.width = "auto";
			document.body.appendChild(cell);
			var data = this.myData();
			var key = null;
			if (typeof col.key !== tui.undef && col.key !== null) {
				key = data.mapKey(col.key)
				if (typeof key === tui.undef)
					key = col.key;
			}
			
			var begin = displayedOnly ? this._bufferedBegin : 0;
			var end = displayedOnly ? this._bufferedEnd : data.length();
			for (var i = begin; i < end; i++) {
				var rowData = data.at(i);
				var v = rowData[key];
				if (typeof v === "object" && v.nodeName) {
					cell.innerHTML = "";
					cell.appendChild(v);
				} else {
					cell.innerHTML = v;
				}
				if (typeof col.format === "function")
					col.format({
						cell: cell,
						value: v,
						row: rowData,
						col: col,
						colKey: key,
						rowIndex: i,
						colIndex: columnIndex,
						isRowActived: i === this._activerow,
						grid: this
					});
				if (maxWidth < cell.offsetWidth - this._borderWidth)
					maxWidth = cell.offsetWidth - this._borderWidth;
			}
			document.body.removeChild(cell);
			col.width = maxWidth;
			col["_important"] = true;
			this._initialized = false;
			this.refresh();
		}

		delayDrawing(): boolean;
		delayDrawing(val: boolean): Grid;
		delayDrawing(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-delay-drawing", val);
				this._delayDrawing = val;
				return this;
			} else
				return this._delayDrawing;
		}

		hasHScroll(): boolean;
		hasHScroll(val: boolean): Grid;
		hasHScroll(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-has-hscroll", val);
				this._initialized = false;
				this.refresh();
				return this;
			} else
				return this.is("data-has-hscroll");
		}

		noHead(): boolean;
		noHead(val: boolean): Grid;
		noHead(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-no-head", val);
				this._initialized = false;
				this.refresh();
				return this;
			} else
				return this.is("data-no-head");
		}

		columns(): GridColumn[];
		columns(val?: GridColumn[]): Grid;
		columns(val?: GridColumn[]): any {
			if (val) {
				this._columns = val;
				this._initialized = false;
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

		rowselectable(): boolean;
		rowselectable(val: boolean): Grid;
		rowselectable(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-rowselectable", val);
				this._initialized = false;
				this.refresh();
				return this;
			} else
				return this.is("data-rowselectable");
		}

		rowdraggable(): boolean;
		rowdraggable(val: boolean): Grid;
		rowdraggable(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-rowdraggable", val);
				return this;
			} else
				return this.is("data-rowdraggable");
		}

		scrollTo(rowIndex: number) {
			if (typeof rowIndex !== "number" || isNaN(rowIndex) || rowIndex < 0 || rowIndex >= this.myData().length())
				return;
			var v = this._vscroll.value();
			if (v > rowIndex * this._lineHeight) {
				this._vscroll.value(rowIndex * this._lineHeight);
				this._scrollTop = this._vscroll.value();
				this.drawLines();
			} else {
				var h = (rowIndex - this._dispLines + 1) * this._lineHeight;
				var diff = (this._boxHeight - this.headHeight() - this._hscroll[0].offsetHeight - this._dispLines * this._lineHeight);
				if (v < h - diff) {
					this._vscroll.value(h - diff);
					this._scrollTop = this._vscroll.value();
					this.drawLines();
				}
			}
		}

		editCell(rowIndex: number, colIndex: number): boolean {
			if (typeof rowIndex !== "number" ||
				rowIndex < 0 || rowIndex >= this.myData().length())
				return false;
			if (typeof colIndex !== "number" ||
				colIndex < 0 || colIndex >= this.columns().length)
				return false;
			if (this.rowselectable()) {
				this.activerow(rowIndex);
			}
			this.scrollTo(rowIndex);
			var line = this._bufferedLines[rowIndex - this._bufferedBegin];
			var cell = line.childNodes[colIndex];
			if (cell.childNodes[1] && cell.childNodes[1]["_ctrl"]) {
				cell.childNodes[1]["_ctrl"].focus();
				return true;
			} else if (cell.childNodes[0] && cell.childNodes[0].childNodes[0] && cell.childNodes[0].childNodes[0]["_ctrl"]) {
				cell.childNodes[0].childNodes[0]["_ctrl"].focus();
				return true;
			} else
				return false;
		}

		editRow(rowIndex: number): boolean {
			if (typeof rowIndex !== "number" ||
				rowIndex < 0 || rowIndex >= this.myData().length())
				return false;
			for (var i = 0; i < this._columns.length; i++) {
				if (this.editCell(rowIndex, i))
					return true;
			}
			return false;
		}

		resizable(): boolean;
		resizable(val: boolean): Grid;
		resizable(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-resizable", val);
				this._initialized = false;
				this.refresh();
				return this;
			} else
				return this.is("data-resizable");
		}

		/**
		 * Used for support form control
		 */
		value(): any[];
		value(data: tui.IDataProvider): Grid;
		value(data: any[]): Grid;
		value(data: { data: any[]; head?: string[]; length?: number; }): Grid;
		value(data?: any): any {
			if (data === null) {
				return this.data([]);
			} else if (data) {
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
					this._initialized = false;
					this.refresh();
					throw new Error("TUI Grid: need a data provider.");
				}
				this._data && this._data.onupdate && this._data.onupdate(null);
				this._data = data;
				typeof this._data.onupdate === "function" && this._data.onupdate((updateInfo) => {
					var b = updateInfo.begin;
					var e = b + updateInfo.data.length;
					this._initialized = false;
					self.refresh();
				});
				this._initialized = false;
				this.refresh();
				return this;
			} else {
				return this.myData();
			}
		}

		consumeMouseWheelEvent(): boolean;
		consumeMouseWheelEvent(val: boolean): Grid;
		consumeMouseWheelEvent(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-consume-mwe", val);
				return this;
			} else
				return this.is("data-consume-mwe");
		}

		noRefresh(): boolean;
		noRefresh(val: boolean): Grid;
		noRefresh(val?: boolean): any {
			if (typeof val === "boolean") {
				this._noRefresh = val;
				return this;
			} else
				return this._noRefresh;
		}
		refreshHead() {
			this.drawHead();
		}
		refresh() {
			if (this._noRefresh)
				return;
			if (!this[0] || this[0].parentElement === null)
				return;
			if (this[0].offsetWidth === 0 || this[0].offsetHeight === 0)
				return;
			this._initialized = true;
			this.computeScroll();
			this.clearBufferLines();
//			this._columnKeyMap = this.myData().columnKeyMap();
			this.drawHead();
			this.drawLines();
		}

		autoRefresh(): boolean {
			return !this._initialized;
		}


		/// Following static methods are used for cell formatting.
		static menu(itemMenu: any, func: (item: string, data: any) => {}, menuPos: string = "Rb") {
			return function (data) {
				if (data.rowIndex < 0)
					return;
				var tb = data.grid;
				var array = data.grid.data().src();
				data.cell.firstChild.innerHTML = "";
				var btnMenu = tui.ctrl.button();
				btnMenu.addClass("tui-grid-menu-button");
				btnMenu.text("<i class='fa fa-bars'></i>");
				if (typeof itemMenu === "function")
					btnMenu.menu(itemMenu(data));
				else
					btnMenu.menu(itemMenu);
				btnMenu.menuPos(menuPos);
				data.cell.firstChild.appendChild(btnMenu[0]);
				btnMenu.on("select", function (d: any) {
					func && func(d.item, data);
				});
				$(btnMenu[0]).mousedown(function (e) {
					data.grid.editCell(data.rowIndex, data.colIndex);
					e.stopPropagation();
					tui.fire("#tui.check.popup");
				});
				$(btnMenu[0]).keydown(function (e) {
					handleKeyDownEvent(e, data, "button");
				});
			};
		}
		static button(text: string, func: (data: any) => {}) {
			return function (data) {
				if (data.rowIndex < 0)
					return;
				var tb = data.grid;
				var array = data.grid.data().src();
				data.cell.firstChild.innerHTML = "";
				var btnMenu = tui.ctrl.button();
				btnMenu.text(text);
				data.cell.firstChild.appendChild(btnMenu[0]);
				btnMenu.on("click", function () {
					func && func(data);
				});
				$(btnMenu[0]).mousedown(function (e) {
					data.grid.editCell(data.rowIndex, data.colIndex);
					e.stopPropagation();
					tui.fire("#tui.check.popup");
				});
				$(btnMenu[0]).keydown(function (e) {
					handleKeyDownEvent(e, data, "button");
				});
			};
		}
		static checkbox(withHeader: boolean = true): (data: IColumnFormatInfo)=>void {
			return function (data: IColumnFormatInfo) {
				if (data.rowIndex < 0) {
					if (withHeader) {
						var headCheck = tui.ctrl.checkbox();
						(<HTMLElement>data.cell.firstChild).innerHTML = "";
						data.cell.firstChild.appendChild(headCheck[0]);
						data.cell.style.textAlign = "center";

						var dataSet = data.grid.data();
						var totalLen = dataSet.length();
						var checkedCount = 0;
						var uncheckCount = 0;
						for (var i = 0; i < totalLen; i++) {
							if (dataSet.at(i)[data.colKey])
								checkedCount++;
							else
								uncheckCount++;
						}
						if (totalLen === uncheckCount) {
							headCheck.checked(false);
							headCheck.triState(false);
						} else if (totalLen === checkedCount) {
							headCheck.checked(true);
							headCheck.triState(false);
						} else
							headCheck.triState(true);
						headCheck.on("click", function () {
							if (typeof data.colKey !== tui.undef) {

								for (var i = 0; i < totalLen; i++) {
									dataSet.at(i)[data.colKey] = headCheck.checked();
								}
							}
							data.value = headCheck.checked();
							data.grid.refresh();
						});
					}
					return;
				} else {
					(<HTMLElement>data.cell.firstChild).innerHTML = "";
					var chk = tui.ctrl.checkbox();
					data.cell.firstChild.appendChild(chk[0]);
					data.cell.style.textAlign = "center";
					chk.checked(data.value);
					chk.on("click", function () {
						if (typeof data.colKey !== tui.undef)
							data.row[data.colKey] = chk.checked();
						data.value = chk.checked();
						data.grid.refreshHead();
					});
					$(chk[0]).keydown(function (e) {
						handleKeyDownEvent(e, data, "checkbox");
					});
				}
			};
		} // end of chechBox

		static textEditor(listData?): (data: IColumnFormatInfo) => void {
			return createInputFormatter("text", listData);
		}

		static selector(listData): (data: IColumnFormatInfo) => void {
			return createInputFormatter("select", listData);
		} // end of selector

		static fileSelector(address: string, accept: string): (data: IColumnFormatInfo) => void {
			return createInputFormatter("file", address, accept);
		} // end of fileSelector

		static calendarSelector(): (data: IColumnFormatInfo) => void {
			return createInputFormatter("calendar");
		} // end of calendarSelector

		static customSelector(func: (data: any) => any, icon: string = "fa-ellipsis-h"): (data: IColumnFormatInfo) => void {
			return createInputFormatter("custom-select", func, icon);
		} // end of calendarSelector
	}

	function handleKeyDownEvent(e, data, type) {
		var k = e.keyCode;
		var col: any, row: any;
		if (k === tui.KEY_DOWN) {
			if (data.rowIndex < data.grid.data().length() - 1)
				data.grid.editCell(data.rowIndex + 1, data.colIndex);
			e.stopPropagation();
		} else if (k === tui.KEY_UP) {
			if (data.rowIndex > 0)
				data.grid.editCell(data.rowIndex - 1, data.colIndex);
			e.stopPropagation();
		} else if (k === tui.KEY_LEFT) {
			if (type !== "text" || e.ctrlKey) {
				col = data.colIndex - 1;
				while (col >= 0) {
					if (data.grid.editCell(data.rowIndex, col--))
						break;
				}
			}
			e.stopPropagation();
		} else if (k === tui.KEY_RIGHT) {
			if (type !== "text" || e.ctrlKey) {
				col = data.colIndex + 1;
				while (col < data.grid.columns().length) {
					if (data.grid.editCell(data.rowIndex, col++))
						break;
				}
			}
			e.stopPropagation();
		} else if (k === tui.KEY_TAB && e.shiftKey) {
			col = data.colIndex;
			row = data.rowIndex;
			while (row >= 0 && col >= 0) {
				col--;
				if (col < 0) {
					col = data.grid.columns().length - 1;
					row--;
				}
				if (data.grid.editCell(row, col))
					break;
			}
			e.preventDefault();
			e.stopPropagation();
		} else if (k === tui.KEY_TAB) {
			col = data.colIndex;
			row = data.rowIndex;
			while (row < data.grid.data().length() && col < data.grid.columns().length) {
				col++;
				if (col >= data.grid.columns().length) {
					col = 0;
					row++;
				}
				if (data.grid.editCell(row, col))
					break;
			}
			e.preventDefault();
			e.stopPropagation();
		} else {
			if (type === "text") {
				data.grid.editCell(data.rowIndex, data.colIndex);
				//setTimeout(function () { data.grid[0].scrollTop = 0; }, 0);
			}
		}
	}

	function createInputFormatter(type: string, param1?: any, param2?: any): (data: IColumnFormatInfo) => void {
		return function (data: IColumnFormatInfo) {
			if (data.rowIndex < 0 /*|| !data.isRowActived*/) {
				return;
			}
			var editor = tui.ctrl.input(null, type);
			editor.useLabelClick(false);
			editor.addClass("tui-grid-editor");
			editor.on("select change", function () {
				if (typeof data.colKey !== tui.undef)
					data.row[data.colKey] = editor.value();
				data.value = editor.value();
			});

			if (type === "text") {
				if (param1)
					editor.data(param1);
			} else if (type === "select") {
				editor.data(param1);
			} else if (type === "custom-select") {
				editor.on("btnclick", param1);
				editor.icon(param2);
			} else if (type === "calendar") {

			} else if (type === "file") {
				editor.uploadUrl(param1);
				editor.accept(param2);
			}

			$(editor[0]).mousedown(function (e) {
				data.grid.editCell(data.rowIndex, data.colIndex);
				e.stopPropagation();
				tui.fire("#tui.check.popup");
			});
			$(editor[0]).keydown(function (e) {
				handleKeyDownEvent(e, data, type);
			});

			editor[0].style.width = $(data.cell).innerWidth() - 1 + "px";
			editor[0].style.height = $(data.cell).innerHeight() + "px";
			data.cell.appendChild(editor[0]);
			editor.value(data.value);
		};
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
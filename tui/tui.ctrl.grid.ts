/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {

	export interface IColumnFormatInfo {
		cell: HTMLSpanElement;	// Drawing cell
		value: any;				// Cell content either is HTML node or text content
		rowIndex: number;		// Drawing row, if row index is -1 means this line a head line
		colIndex: number;		// Column index
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
		private _columnKeyMap: {} = null;

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

			this._vscroll.on("scroll", function (data) {
				self._scrollTop = data["value"];
				self.drawLines();
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
					}
				} else {
					if (self._vscroll.value() > 0) {
						self._vscroll.value(self._vscroll.value() - scrollSize);
						self._scrollTop = self._vscroll.value();
						self.drawLines();
						ev.stopPropagation();
						ev.preventDefault();
					}
				}
			});
			$(this[0]).mousedown(function (e) {
				tui.focusWithoutScroll(self[0]);
				e.preventDefault();
			});
			$(this[0]).keydown(function (e) {
				if (self.fire("keydown", {event:e}) === false)
					return;
				var data = self.myData();
				var k = e.keyCode;
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
				}
			});
			
			this.refresh();
		}

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
			this._lineHeight = line.offsetHeight;
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
				var totalNoImportantWidth = totalNoBorderWidth;
				var totalNeedComputed = 0;
				var important = null;
				for (var i = 0; i < columns.length; i++) {
					if (typeof columns[i].width !== "number" ||
						isNaN(columns[i].width))
						columns[i].width = defaultWidth;
					else if (columns[i].width < 0)
						columns[i].width = 0;
					if (columns[i]["_important"]) {
						important = i;
						delete columns[i]["_important"];
						columns[i].width = Math.round(columns[i].width);
						if (columns[i].width > totalNoBorderWidth) {
							columns[i].width = totalNoBorderWidth;
						}
						totalNoImportantWidth -= columns[i].width;
					} else
						totalNeedComputed += Math.round(columns[i].width);
				}
				for (var i = 0; i < columns.length; i++) {
					if (i !== important) {
						if (totalNeedComputed === 0)
							columns[i].width = 0;
						else
							columns[i].width = Math.floor(Math.round(columns[i].width) / totalNeedComputed * totalNoImportantWidth);
					}
				}
				var total = 0;
				for (var i = 0; i < columns.length; i++) {
					total += columns[i].width;
				}
				if (total < totalNoBorderWidth && columns.length > 0)
					columns[columns.length - 1].width += totalNoBorderWidth - total;
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
			this._headline.appendChild(splitter);
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
				var cell = <HTMLSpanElement>this._headline.childNodes[i*2];
				splitter.style.left = cell.offsetLeft + cell.offsetWidth - Math.round(splitter.offsetWidth / 2) + "px";
			}
		}

		private drawCell(cell: HTMLSpanElement, contentSpan: HTMLSpanElement, col: GridColumn, value: any, rowIndex: number, colIndex: number) {
			if (["center", "left", "right"].indexOf(col.headAlign) >= 0)
				cell.style.textAlign = col.headAlign;
			if (typeof value === "object" && value.nodeName) {
				contentSpan.innerHTML = "";
				contentSpan.appendChild(value);
			} else {
				contentSpan.innerHTML = value;
			}
			if (typeof col.format === "function") {
				col.format({
					cell: cell,
					value: value,
					rowIndex: rowIndex,
					colIndex: colIndex
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
				var cell = document.createElement("span");
				cell.setAttribute("unselectable", "on");
				cell.className = "tui-grid-head-cell tui-grid-" + this._tableId + "-" + i;
				this._headline.appendChild(cell);
				var contentSpan = document.createElement("span");
				contentSpan.className = "tui-grid-cell-content";
				cell.appendChild(contentSpan);
				this.drawCell(cell, contentSpan, col, col.name, -1, i);
				this.bindSort(cell, col, i);
				if (this.resizable()) {
					var splitter = this.bindSplitter(cell, col, i);
					if (typeof columns[i].fixed === "boolean" && columns[i].fixed)
						$(splitter).addClass("tui-hidden");
				}
			}
			this.moveSplitter();
		}

		private isRowSelected(rowIndex: number): boolean {
			return this._selectrows.indexOf(rowIndex) >= 0;
		}

		private drawLine(line: HTMLDivElement, index: number, bindEvent: boolean = false) {
			var self = this;
			var columns = this.myColumns();
			var data = this.myData();
			var lineData = data.at(index);
			if (line.childNodes.length !== columns.length) {
				line.innerHTML = "";
				for (var i = 0; i < columns.length; i++) {
					var cell = document.createElement("span");
					if (this.rowselectable())
						cell.setAttribute("unselectable", "on");
					cell.className = "tui-grid-cell tui-grid-" + this._tableId + "-" + i;
					var contentSpan = document.createElement("span");
					contentSpan.className = "tui-grid-cell-content";
					cell.appendChild(contentSpan);
					line.appendChild(cell);
				}
			}
			for (var i = 0; i < line.childNodes.length; i++) {
				var cell = <HTMLSpanElement>line.childNodes[i];
				var col = columns[i];
				var key = null;
				if (typeof col.key !== tui.undef && col.key !== null) {
					key = this._columnKeyMap[col.key]
					if (typeof key === tui.undef)
						key = col.key;
				}
				var value = (key !== null && lineData ? lineData[key] : " ");
				this.drawCell(cell, <HTMLSpanElement>cell.firstChild, col, value, index, i);
			}
			if (this.isRowSelected(index)) {
				$(line).addClass("tui-grid-line-selected");
			} else
				$(line).removeClass("tui-grid-line-selected");

			if (!bindEvent)
				return;
			$(line).on("contextmenu", function (e) {
				var index = line["_rowIndex"];
				self.fire("rowcontextmenu", {"event": e, "index": index, "line": line });
			});
			$(line).mousedown(function (e) {
				var index = line["_rowIndex"];
				if (self.rowselectable())
					self.activerow(index);
				self.fire("rowmousedown", { "event": e, "index": index, "line": line });
			});
			$(line).mouseup( function (e) {
				var index = line["_rowIndex"];
				self.fire("rowmouseup", { "event": e, "index": index, "line": line });
			});
			$(line).click(function (e) {
				var index = line["_rowIndex"];
				self.fire("rowclick", { "event": e, "index": index, "line": line });
			});
			$(line).dblclick(function (e) {
				var index = line["_rowIndex"];
				self.fire("rowdblclick", { "event": e, "index": index, "line": line });
			});
		}

		private moveLine(line: HTMLDivElement, index: number, base: number) {
			line.style.top = (base + index * this._lineHeight) + "px";
			line.style.left = -this._scrollLeft + "px";
		}

		private drawLines() {
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
					this[0].insertBefore(line, this._headline);
					newBuffer.push(line);
					line["_rowIndex"] = i;
					this.drawLine(line, i, true);
					this.moveLine(line, i - begin, base);
				}
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

		select(rows?: number[]): number[]{
			if (rows && typeof rows.length === "number" && rows.length >= 0) {
				this._selectrows.length = 0;
				for (var i = 0; i < rows.length; i++) {
					this._selectrows.push(rows[i]);
				}
				this.clearBufferLines();
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
				this.select([rowIndex]);
			}
			return this._activerow;
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
			this.refresh();
			return { colIndex: this._sortColumn, desc: this._sortDesc };
		}

		/**
		 * Adjust column width to adapt column content
		 * @param {Number} columnIndex
		 * @param {Boolean} expandOnly only expand column width
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
			var key = columnIndex;
			if (typeof col.key === "string" && col.key ||
				typeof col.key === "number" && !isNaN(col.key))
				key = col.key;
			var data = this.myData();
			var begin = displayedOnly ? this._bufferedBegin : 0;
			var end = displayedOnly ? this._bufferedEnd : data.length();
			for (var i = begin; i < end; i++) {
				var v = data.at(i)[key];
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
						rowIndex: i,
						colIndex: columnIndex
					});
				if (maxWidth < cell.offsetWidth - this._borderWidth)
					maxWidth = cell.offsetWidth - this._borderWidth;
			}
			document.body.removeChild(cell);
			col.width = maxWidth;
			col["_important"] = true;
			this.refresh();
		}

		hasHScroll(): boolean;
		hasHScroll(val: boolean): Table;
		hasHScroll(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-has-hscroll", val);
				this.refresh();
				return this;
			} else
				return this.is("data-has-hscroll");
		}

		noHead(): boolean;
		noHead(val: boolean): Table;
		noHead(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-no-head", val);
				this.refresh();
				return this;
			} else
				return this.is("data-no-head");
		}

		columns(): GridColumn[];
		columns(val?: GridColumn[]): Table;
		columns(val?: GridColumn[]): any {
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

		rowselectable(): boolean;
		rowselectable(val: boolean): Table;
		rowselectable(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-rowselectable", val);
				this.refresh();
				return this;
			} else
				return this.is("data-rowselectable");
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

		data(): tui.IDataProvider;
		data(data: tui.IDataProvider): Table;
		data(data?: tui.IDataProvider): any {
			if (data) {
				var self = this;
				this._data && this._data.onupdate && this._data.onupdate(null);
				this._data = data;
				this._data.onupdate((updateInfo) => {
					var b = updateInfo.begin;
					var e = b + updateInfo.data.length;
					self.refresh();
					//if (b >= self._bufferedBegin && b <= self._bufferedEnd ||
					//	e >= self._bufferedBegin && e <= self._bufferedEnd) {
					//	self.refresh();
					//}
				});
				this.refresh();
				return this;
			} else {
				return this._data;
			}
		}

		refresh() {
			if (!this[0])
				return;
			this.computeScroll();
			this.clearBufferLines();
			this._columnKeyMap = this.myData().columnKeyMap();
			this.drawHead();
			this.drawLines();
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
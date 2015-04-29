/// <reference path="tui.ctrl.control.ts" />
/// <reference path="tui.time.ts" />
module tui.ctrl {

	function formatNumber (v, maxValue) {
		if (v < 0)
			v = 0;
		if (v > maxValue)
			v = maxValue;
		if (v < 10)
			return "0" + v;
		else
			return v + "";
	}

	export class PrimitiveCalendar extends Control<Calendar> {
		static CLASS: string = "tui-month-calendar";
		private static _month = tui.months;
		private _tb: HTMLTableElement;
		private _time: Date = tui.today();
		private _yearCell: HTMLTableCellElement;
		private _prevYear: HTMLTableCellElement;
		private _nextYear: HTMLTableCellElement;
		

		private setText(line: number, column: number, content: string) {
			var cell: HTMLTableCellElement = ((<any>this._tb.rows[line]).cells[column]);
			if (tui.ieVer > 0 && tui.ieVer < 9) {
				cell.innerText = content;
			} else
				cell.innerHTML = content;
		}

		constructor(el?: HTMLElement) {
			super("div", PrimitiveCalendar.CLASS, el);
			var self = this;
			this.attr("tabIndex", "0");
			this.selectable(false);
			this[0].innerHTML = "";
			this._tb = this[0].appendChild(document.createElement("table"));
			this._tb.cellPadding = "0";
			this._tb.cellSpacing = "0";
			this._tb.border = "0";
			var yearLine: HTMLTableRowElement = <HTMLTableRowElement>this._tb.insertRow(-1);
			yearLine.className = "tui-year-bar";
			this._prevYear = <HTMLTableCellElement>yearLine.insertCell(-1);
			this._prevYear.className = "tui-prev-year-btn";
			this._yearCell = <HTMLTableCellElement>yearLine.insertCell(-1);
			this._yearCell.colSpan = 2;
			this._nextYear = <HTMLTableCellElement>yearLine.insertCell(-1);
			this._nextYear.className = "tui-next-year-btn";
			var month = 1;
			for (var i = 0; i < 3; i++) {
				var line: HTMLTableRowElement = <HTMLTableRowElement>this._tb.insertRow(-1);
				for (var j = 0; j < 4; j++) {
					var cell: HTMLTableCellElement = <HTMLTableCellElement>line.insertCell(-1);
					cell.className = "tui-month";
					cell["month"] = month;
					this.setText(i + 1, j, tui.str(PrimitiveCalendar._month[month - 1]));
					month++;
				}
			}

			$(this[0]).on("mousedown", (e) => {
				if (tui.ffVer > 0)
					this.focus();
				if ((<Node>e.target).nodeName.toLowerCase() !== "td")
					return;
				var cell = <HTMLTableCellElement>e.target;
				if ($(cell).hasClass("tui-prev-year-btn")) {
					this.prevYear();
				} else if ($(cell).hasClass("tui-next-year-btn")) {
					this.nextYear();
				} else if (typeof cell["month"] === "number") {
					var m = cell["month"];
					var y = this.year();
					var d = this.day();
					var newDate = new Date(y, m - 1, 1);
					if (d > tui.totalDaysOfMonth(newDate))
						d = tui.totalDaysOfMonth(newDate);
					this.onPicked(y, m, d);
				}
			});
			$(this[0]).on("click", (e: JQueryEventObject) => {
				if ((<Node>e.target).nodeName.toLowerCase() !== "td")
					return;
				var cell = <HTMLTableCellElement>e.target;
				if (typeof cell["month"] === "number")
					self.fire("picked", { "ctrl": this[0], "event": e, "time": this.time() });
			});
			$(this[0]).on("dblclick", (e: JQueryEventObject) => {
				if ((<Node>e.target).nodeName.toLowerCase() !== "td")
					return;
				var cell = <HTMLTableCellElement>e.target;
				if (typeof cell["month"] === "number")
					self.fire("dblpicked", { "ctrl": this[0], "event": e, "time": this.time() });
			});
			$(this[0]).on("keydown", (e) => {
				var k = e.keyCode;
				if ([13, 33, 34, 37, 38, 39, 40].indexOf(k) >= 0) {
					if (k === 37) {
						var tm = tui.dateAdd(this._time, -1, "M");
						self.time(tm);
					} else if (k === 38) {
						var tm = tui.dateAdd(this._time, -4, "M");
						self.time(tm);
					} else if (k === 39) {
						var tm = tui.dateAdd(this._time, 1, "M");
						self.time(tm);
					} else if (k === 40) {
						var tm = tui.dateAdd(this._time, 4, "M");
						self.time(tm);
					} else if (k === 33) {
						this.prevYear();
					} else if (k === 34) {
						this.nextYear();
					} 
					self.fire("picked", { "ctrl": this[0], "event": e, "time": this.time() });
					return e.preventDefault();
				}
			});
			// Set initial value
			var val = this.attr("data-value");
			if (val === null)
				this.update();
			else {
				var dateVal = tui.parseDate(val);
				if (dateVal == null)
					this.update();
				else
					this.time(dateVal);
			}
		}
		
		year(): number;
		year(val: number): Calendar; 
		year(val?: number): any {
			if (typeof val === "number") {
				if (this._time.getFullYear() !== val) {
					this._time.setFullYear(val);
					this.update();
					this.fire("change", { "ctrl": this[0], "time": this.time() });
				}
				return this;
			} else
				return this._time.getFullYear();
		}
		day(): number;
		day(val: number): Calendar; 
		day(val?: number): any {
			if (typeof val === "number") {
				if (this._time.getDate() !== val) {
					this._time.setDate(val);
					this.update();
					this.fire("change", { "ctrl": this[0], "time": this.time() });
				}
				return this;
			} else
				return this._time.getDate();
		}
		month(): number;
		month(val: number): Calendar; 
		month(val?: number): any {
			if (typeof val === "number") {
				if (this._time.getMonth() !== val - 1) {
					this._time.setMonth(val - 1);
					this.update();
					this.fire("change", { "ctrl": this[0], "time": this.time() });
				}
				return this;
			} else
				return this._time.getMonth() + 1;
		}
		time(t: Date): Calendar;
		time(): Date;
		time(t?: Date): any {
			if (t instanceof Date && t) {
				var changed = false;
				if (Math.floor(this._time.getTime() / 1000) !== Math.floor(t.getTime() / 1000))
					changed = true;
				this._time = t;
				this.update();
				changed && this.fire("change", { "ctrl": this[0], "time": this.time() });
				return this;
			} else {
				return new Date(this._time.getFullYear(), this._time.getMonth(), this._time.getDate());
			}
		}
		value(t: Date): Calendar;
		value(): Date;
		value(t?: Date): any {
			if (t === null) {
				this.time(tui.today());
				return this;
			}
			return this.time(t);
		}
		prevYear() {
			var y = this.year(), m = this.month(), d = this.day();
			y--;
			var newDate = new Date(y, m - 1, 1);
			if (d > tui.totalDaysOfMonth(newDate))
				d = tui.totalDaysOfMonth(newDate);
			this.onPicked(y, m, d);
		}
		nextYear() {
			var y = this.year(), m = this.month(), d = this.day();
			y++;
			var newDate = new Date(y, m - 1, 1);
			if (d > tui.totalDaysOfMonth(newDate))
				d = tui.totalDaysOfMonth(newDate);
			this.onPicked(y, m, d);
		}
		
		private onPicked(y, m, d) {
			var newDate = new Date(y, m - 1, d);
			this.time(newDate);
		}
		private firstDay(date) {
			var y = date.getFullYear();
			var m = date.getMonth();
			return new Date(y, m, 1);
		}
		private update() {
			var today = tui.today();
			this._yearCell.innerHTML = this.year() + '';
			var month = 1;
			for (var i = 0; i < 3; i++) {
				for (var j = 0; j < 4; j++) {
					var cell: HTMLTableCellElement = <HTMLTableCellElement>(<HTMLTableRowElement>this._tb.rows[i + 1]).cells[j];
					cell.className = "tui-month";
					if (month === this.month())
						$(cell).addClass("tui-actived");
					if (this.year() === today.getFullYear() && month === (today.getMonth() + 1)) {
						$(cell).addClass("tui-today");
					}
					month++;
				}
			}
		}
		
		refresh() {
			this.update();
		}
	}

	export function primitiveCalendar(param: HTMLElement): PrimitiveCalendar;
	export function primitiveCalendar(param: string): PrimitiveCalendar;
	export function primitiveCalendar(): PrimitiveCalendar;
	/**
	 * Construct a calendar.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function primitiveCalendar(param?: any): PrimitiveCalendar {
		return tui.ctrl.control(param, PrimitiveCalendar);
	}

	tui.ctrl.registerInitCallback(PrimitiveCalendar.CLASS, primitiveCalendar);
}
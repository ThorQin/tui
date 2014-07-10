/// <reference path="tui.ctrl.control.ts" />
/// <reference path="tui.time.ts" />
module tui.ctrl {

	export class Calendar extends Control<Calendar> {
		static CLASS: string = "tui-calendar";
		private static _week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		private _tb: HTMLTableElement;
		private _time: Date = tui.today();
		private _yearCell: HTMLTableCellElement;
		private _prevMonth: HTMLTableCellElement;
		private _nextMonth: HTMLTableCellElement;
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
			super("div", Calendar.CLASS, el);
			var self = this;
			this.attr("tabIndex", "0");
			this.selectable(false);
			this[0].innerHTML = "";
			this._tb = this[0].appendChild(document.createElement("table"));
			this._tb.cellPadding = "0";
			this._tb.cellSpacing = "0";
			this._tb.border = "0";
			var yearLine: HTMLTableRowElement = <HTMLTableRowElement>this._tb.insertRow(-1);
			this._prevMonth = <HTMLTableCellElement>yearLine.insertCell(-1);
			this._prevMonth.className = "tui-prev-month-btn";
			this._prevYear = <HTMLTableCellElement>yearLine.insertCell(-1);
			this._prevYear.className = "tui-prev-year-btn";
			this._yearCell = <HTMLTableCellElement>yearLine.insertCell(-1);
			this._yearCell.colSpan = 3;
			this._nextYear = <HTMLTableCellElement>yearLine.insertCell(-1);
			this._nextYear.className = "tui-next-year-btn";
			this._nextMonth = <HTMLTableCellElement>yearLine.insertCell(-1);
			this._nextMonth.className = "tui-next-month-btn";
			for (var i = 0; i < 7; i++) {
				var line: HTMLTableRowElement = <HTMLTableRowElement>this._tb.insertRow(-1);
				for (var j = 0; j < 7; j++) {
					var cell: HTMLTableCellElement = <HTMLTableCellElement>line.insertCell(-1);
					if (i === 0) {
						cell.className = "tui-week";
						this.setText(i + 1, j, tui.str(Calendar._week[j]));
					}
				}
			}
			$(this[0]).on("mousedown", (e) => {
				if (tui.ffVer > 0)
					this.focus();
				if ((<Node>e.target).nodeName.toLowerCase() !== "td")
					return;
				var cell = <HTMLTableCellElement>e.target;
				if ($(cell).hasClass("tui-prev-month-btn")) {
					this.prevMonth();
				} else if ($(cell).hasClass("tui-prev-year-btn")) {
					this.prevYear();
				} else if ($(cell).hasClass("tui-next-year-btn")) {
					this.nextYear();
				} else if ($(cell).hasClass("tui-next-month-btn")) {
					this.nextMonth();
				} else if (typeof cell["offsetMonth"] === "number") {
					var d = parseInt(cell.innerHTML, 10);
					var offset: number = cell["offsetMonth"];
					if (offset < 0) {
						var y = this.year();
						var m = this.month();
						if (m === 1) {
							y--;
							m = 12;
						} else {
							m--;
						}
						this.onPicked(y, m, d);
					} else if (offset > 0) {
						var y = this.year();
						var m = this.month();
						if (m === 12) {
							y++;
							m = 1;
						} else {
							m++;
						}
						this.onPicked(y, m, d);
					} else if (offset === 0) {
						this.onPicked(this.year(), this.month(), d);
					}
				}
			});
			$(this[0]).on("click", (e: JQueryEventObject) => {
				if ((<Node>e.target).nodeName.toLowerCase() !== "td")
					return;
				var cell = <HTMLTableCellElement>e.target;
				if (typeof cell["offsetMonth"] === "number")
					self.fire("picked", { "ctrl": this[0], "event": e, "time": this._time });
			});
			$(this[0]).on("dblclick", (e: JQueryEventObject) => {
				if ((<Node>e.target).nodeName.toLowerCase() !== "td")
					return;
				var cell = <HTMLTableCellElement>e.target;
				if (typeof cell["offsetMonth"] === "number")
					self.fire("dblpicked", { "ctrl": this[0], "event": e, "time": this._time });
			});
			$(this[0]).on("keydown", (e) => {
				var k = e.keyCode;
				if ([13, 33, 34, 37, 38, 39, 40].indexOf(k) >= 0) {
					if (k === 37) {
						var tm = tui.dateAdd(this._time, -1);
						self.time(tm);
					} else if (k === 38) {
						var tm = tui.dateAdd(this._time, -7);
						self.time(tm);
					} else if (k === 39) {
						var tm = tui.dateAdd(this._time, 1);
						self.time(tm);
					} else if (k === 40) {
						var tm = tui.dateAdd(this._time, 7);
						self.time(tm);
					} else if (k === 33) {
						this.prevMonth();
					} else if (k === 34) {
						this.nextMonth();
					} else if (k === 13) {
						self.fire("picked", { "ctrl": this[0], "event": e, "time": this._time });
					}
					return e.preventDefault();
				}
			});
			this.update();
		}
		
		year(): number {
			return this._time.getFullYear();
		}
		day(): number {
			return this._time.getDate();
		}
		month(): number {
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
				changed && this.fire("change", { "ctrl": this[0], "time": this._time });
				return this;
			} else
				return this._time;
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
		prevMonth() {
			var y = this.year(), m = this.month(), d = this.day();
			if (m === 1) {
				y--;
				m = 12;
			} else {
				m--;
			}
			var newDate = new Date(y, m - 1, 1);
			if (d > tui.totalDaysOfMonth(newDate))
				d = tui.totalDaysOfMonth(newDate);
			this.onPicked(y, m, d);
		}
		nextMonth() {
			var y = this.year(), m = this.month(), d = this.day();
			if (m === 12) {
				y++;
				m = 1;
			} else {
				m++;
			}
			var newDate = new Date(y, m - 1, 1);
			if (d > tui.totalDaysOfMonth(newDate))
				d = tui.totalDaysOfMonth(newDate);
			this.onPicked(y, m, d);
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
			var firstWeek = this.firstDay(this._time).getDay();
			var daysOfMonth = tui.totalDaysOfMonth(this._time);
			var day = 0;
			this._yearCell.innerHTML = this.year() + " - " + this.month();
			for (var i = 0; i < 6; i++) {
				for (var j = 0; j < 7; j++) {
					var cell: HTMLTableCellElement = <HTMLTableCellElement>(<HTMLTableRowElement>this._tb.rows[i + 2]).cells[j];
					cell.className = "";
					if (day === 0) {
						if (j === firstWeek) {
							day = 1;
							(<HTMLTableCellElement>cell).innerHTML = day + "";
							(<any>cell).offsetMonth = 0;
						} else {
							var preMonthDay = new Date(this.firstDay(this._time).valueOf() - ((firstWeek - j) * 1000 * 24 * 60 * 60));
							(<HTMLTableCellElement>cell).innerHTML = preMonthDay.getDate() + "";
							(<any>cell).offsetMonth = -1;
							$(cell).addClass("tui-prev-month");
						}
					} else {
						day++;
						if (day <= daysOfMonth) {
							cell.innerHTML = day + "";
							(<any>cell).offsetMonth = 0;
						} else {
							cell.innerHTML = (day - daysOfMonth) + "";
							(<any>cell).offsetMonth = 1;
							$(cell).addClass("tui-next-month");
						}
					}
					if (day === this.day())
						$(cell).addClass("tui-actived");
					if (j === 0 || j === 6)
						$(cell).addClass("tui-weekend");
					if (this.year() === today.getFullYear() && this.month() === (today.getMonth() + 1) && day === today.getDate()) {
						$(cell).addClass("tui-today");
					}
				}
			}
		}
	}

	export function calendar(param: HTMLElement): Calendar;
	export function calendar(param: string): Calendar;
	export function calendar(): Calendar;
	/**
	 * Construct a calendar.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function calendar(param?: any): Calendar {
		return tui.ctrl.control(param, Calendar);
	}

	tui.ctrl.registerInitCallback(Calendar.CLASS, calendar);
}
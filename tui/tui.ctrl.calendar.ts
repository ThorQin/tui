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
		private _timeDiv: HTMLElement;
		private _hourBox: any;
		private _minuteBox: any;
		private _secondBox: any;

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
			
			function elem(n: string): any {
				return document.createElement(n);
			}
			
			var timeDiv = elem("div");
			this._timeDiv = timeDiv;
			timeDiv.className = "tui-calendar-timebar";
			timeDiv.style.display = "none";
			var hourBox = elem("input");
			this._hourBox = hourBox;
			hourBox.type = "text";
			hourBox.className = "tui-calendar-timebox";
			hourBox._maxValue = 23;
			hourBox.maxLength = 2;
			hourBox._type = "hour";
			var minuteBox = elem("input");
			this._minuteBox = minuteBox;
			minuteBox.type = "text";
			minuteBox.className = "tui-calendar-timebox";
			minuteBox._maxValue = 59;
			minuteBox.maxLength = 2;
			minuteBox._type = "minute";
			var secondBox = elem("input");
			this._secondBox = secondBox;
			secondBox.type = "text";
			secondBox.className = "tui-calendar-timebox";
			secondBox._maxValue = 59;
			secondBox.maxLength = 2;
			secondBox._type = "second";
			function timeDown(e) {
				var o: any = e.srcElement || e.target;
				tui.cancelBubble(e);
				var maxValue = o._maxValue;
				var type = o._type;
				var k = e.keyCode;
				if (k === 37) { // l
					if (o === minuteBox)
						hourBox.focus();
					else if (o === secondBox)
						minuteBox.focus();
				} else if (k === 39) { // r
					if (o === minuteBox)
						secondBox.focus();
					else if (o === hourBox)
						minuteBox.focus();
				} else if (k === 38) { // t
					var v = parseInt(o.value);
					v++;
					if (v > maxValue)
						v = 0;
					o.value = formatNumber(v,maxValue);
					if (type === "hour")
						self.hours(parseInt(o.value));
					else if (type === "minute")
						self.minutes(parseInt(o.value));
					else
						self.seconds(parseInt(o.value));
					o.select();
				} else if (k === 40) { // b
					var v = parseInt(o.value);
					v--;
					if (v < 0)
						v = maxValue;
					o.value = formatNumber(v,maxValue);
					o.select();
					if (type === "hour")
						self.hours(parseInt(o.value));
					else if (type === "minute")
						self.minutes(parseInt(o.value));
					else
						self.seconds(parseInt(o.value));
					o.select();
				} else if (k >= 48 && k <= 57) {
					var v = k - 48;
					var now = tui.today().getTime();
					if (o._lastInputTime && (now - o._lastInputTime) < 1000 )
						o.value = formatNumber(parseInt(o.value.substr(1,1)) * 10 + v,maxValue);
					else
						o.value = formatNumber(v,maxValue);
					o._lastInputTime = now;
					o.select();
					if (type === "hour")
						self.hours(parseInt(o.value));
					else if (type === "minute")
						self.minutes(parseInt(o.value));
					else
						self.seconds(parseInt(o.value));
					o.select();
				} else if (k == 13) 
					self.fire("picked", { "ctrl": self[0], "event": e, "time": self.time() });
				if (k !== 9)
					return tui.cancelDefault(e);
			}
			function selectText(e) {
				var o = e.srcElement || e.target;
				setTimeout(function (){
					o.select();
				},0);
			}
			$(hourBox).on("keydown", timeDown);
			$(minuteBox).on("keydown", timeDown);
			$(secondBox).on("keydown", timeDown);
			$(hourBox).on("focus mousedown mouseup", selectText);
			$(minuteBox).on("focus mousedown mouseup", selectText);
			$(secondBox).on("focus mousedown mouseup", selectText);
			$(hourBox).on("contextmenu", tui.cancelDefault);
			$(minuteBox).on("contextmenu", tui.cancelDefault);
			$(secondBox).on("contextmenu", tui.cancelDefault);

			function createText(t) {
				var txt = elem("span");
				txt.style.verticalAlign = "middle";
				txt.style.margin = "2px";
				txt.innerHTML = t;
				return txt;
			}
			var label = createText(tui.str("Choose Time"));
			timeDiv.appendChild(label);
			timeDiv.appendChild(hourBox);
			timeDiv.appendChild(createText(":"));
			timeDiv.appendChild(minuteBox);
			timeDiv.appendChild(createText(":"));
			timeDiv.appendChild(secondBox);
			var u = createText("<a class='tui-calendar-update'></a>");
			$(u).mousedown(function (e) {
				var now = tui.today();
				var newTime = new Date(self.year(), self.month() - 1, self.day(),
					now.getHours(), now.getMinutes(), now.getSeconds());
				self.time(newTime);
				return tui.cancelBubble(e);
			});
			timeDiv.appendChild(u);
			this[0].appendChild(timeDiv);
			
			
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
					self.fire("picked", { "ctrl": this[0], "event": e, "time": this.time() });
			});
			$(this[0]).on("dblclick", (e: JQueryEventObject) => {
				if ((<Node>e.target).nodeName.toLowerCase() !== "td")
					return;
				var cell = <HTMLTableCellElement>e.target;
				if (typeof cell["offsetMonth"] === "number")
					self.fire("dblpicked", { "ctrl": this[0], "event": e, "time": this.time() });
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
		hours(): number;
		hours(val: number): Calendar; 
		hours(val?: number): any {
			if (typeof val === "number") {
				if (this._time.getHours() !== val) {
					this._time.setHours(val);
					this.update();
					this.fire("change", { "ctrl": this[0], "time": this.time() });
				}
				return this;
			} else
				return this._time.getHours();
		}
		minutes(): number;
		minutes(val: number): Calendar; 
		minutes(val?: number): any {
			if (typeof val === "number") {
				if (this._time.getMinutes() !== val) {
					this._time.setMinutes(val);
					this.update();
					this.fire("change", { "ctrl": this[0], "time": this.time() });
				}
				return this;
			} else
				return this._time.getMinutes();
		}
		seconds(): number;
		seconds(val: number): Calendar; 
		seconds(val?: number): any {
			if (typeof val === "number") {
				if (this._time.getSeconds() !== val) {
					this._time.setSeconds(val);
					this.update();
					this.fire("change", { "ctrl": this[0], "time": this.time() });
				}
				return this;
			} else
				return this._time.getSeconds();
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
				if (this.timepart()) {
					return new Date(this._time.getTime());
				} else
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
		
		timepart(): boolean;
		timepart(val: boolean): Input;
		timepart(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-timepart", val);
				this.refresh();
				return this;
			} else
				return this.is("data-timepart");
		}

		
		private onPicked(y, m, d) {
			var newDate = new Date(y, m - 1, d, this.hours(), this.minutes(), this.seconds());
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
			if (this.timepart()) {
				this._timeDiv.style.display = "";
				this._hourBox.value = formatNumber(this.hours(),23);
				this._minuteBox.value = formatNumber(this.minutes(),59);
				this._secondBox.value = formatNumber(this.seconds(),59);
			} else {
				this._timeDiv.style.display = "none";
			}
		}
		
		refresh() {
			this.update();
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
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var tui;
(function (tui) {
    /// <reference path="tui.control.ts" />
    /// <reference path="tui.time.ts" />
    (function (_ctrl) {
        var Calendar = (function (_super) {
            __extends(Calendar, _super);
            function Calendar(el) {
                var _this = this;
                _super.call(this);
                this._time = tui.today();
                var self = this;
                if (el)
                    this.elem(el);
                else
                    this.elem("div", Calendar.CLASS);
                this[0]._ctrl = this;
                this.attr("tabIndex", "0");
                this.selectable(false);
                this[0].innerHTML = "";
                this._tb = this[0].appendChild(document.createElement("table"));
                this._tb.cellPadding = "0";
                this._tb.cellSpacing = "0";
                this._tb.border = "0";
                var yearLine = this._tb.insertRow(-1);
                this._prevMonth = yearLine.insertCell(-1);
                this._prevMonth.className = "tui-prev-month-btn";
                this._prevYear = yearLine.insertCell(-1);
                this._prevYear.className = "tui-prev-year-btn";
                this._yearCell = yearLine.insertCell(-1);
                this._yearCell.colSpan = 3;
                this._nextYear = yearLine.insertCell(-1);
                this._nextYear.className = "tui-next-year-btn";
                this._nextMonth = yearLine.insertCell(-1);
                this._nextMonth.className = "tui-next-month-btn";
                for (var i = 0; i < 7; i++) {
                    var line = this._tb.insertRow(-1);
                    for (var j = 0; j < 7; j++) {
                        var cell = line.insertCell(-1);
                        if (i === 0) {
                            cell.className = "tui-week";
                            this.setText(i + 1, j, tui.str(Calendar._week[j]));
                        }
                    }
                }
                $(this[0]).on("mousedown", function (e) {
                    if (tui.ffVer > 0)
                        _this.focus();
                    if (e.target.nodeName.toLowerCase() !== "td")
                        return;
                    var cell = e.target;
                    if ($(cell).hasClass("tui-prev-month-btn")) {
                        _this.prevMonth();
                    } else if ($(cell).hasClass("tui-prev-year-btn")) {
                        _this.prevYear();
                    } else if ($(cell).hasClass("tui-next-year-btn")) {
                        _this.nextYear();
                    } else if ($(cell).hasClass("tui-next-month-btn")) {
                        _this.nextMonth();
                    } else if (typeof cell["offsetMonth"] === "number") {
                        var d = parseInt(cell.innerHTML, 10);
                        var offset = cell["offsetMonth"];
                        if (offset < 0) {
                            var y = _this.year();
                            var m = _this.month();
                            if (m === 1) {
                                y--;
                                m = 12;
                            } else {
                                m--;
                            }
                            _this.onPicked(y, m, d);
                        } else if (offset > 0) {
                            var y = _this.year();
                            var m = _this.month();
                            if (m === 12) {
                                y++;
                                m = 1;
                            } else {
                                m++;
                            }
                            _this.onPicked(y, m, d);
                        } else if (offset === 0) {
                            _this.onPicked(_this.year(), _this.month(), d);
                        }
                    }
                });
                $(this[0]).on("click", function (e) {
                    if (e.target.nodeName.toLowerCase() !== "td")
                        return;
                    var cell = e.target;
                    if (typeof cell["offsetMonth"] === "number")
                        self.fire("picked", { "ctrl": _this[0], "event": e, "time": _this._time });
                });
                $(this[0]).on("dblclick", function (e) {
                    if (e.target.nodeName.toLowerCase() !== "td")
                        return;
                    var cell = e.target;
                    if (typeof cell["offsetMonth"] === "number")
                        self.fire("dblpicked", { "ctrl": _this[0], "event": e, "time": _this._time });
                });
                $(this[0]).on("keydown", function (e) {
                    var k = e.keyCode;
                    if ([13, 33, 34, 37, 38, 39, 40].indexOf(k) >= 0) {
                        if (k === 37) {
                            var tm = tui.dateAdd(_this._time, -1);
                            self.time(tm);
                        } else if (k === 38) {
                            var tm = tui.dateAdd(_this._time, -7);
                            self.time(tm);
                        } else if (k === 39) {
                            var tm = tui.dateAdd(_this._time, 1);
                            self.time(tm);
                        } else if (k === 40) {
                            var tm = tui.dateAdd(_this._time, 7);
                            self.time(tm);
                        } else if (k === 33) {
                            _this.prevMonth();
                        } else if (k === 34) {
                            _this.nextMonth();
                        } else if (k === 13) {
                            self.fire("picked", { "ctrl": _this[0], "event": e, "time": _this._time });
                        }
                        return e.preventDefault();
                    }
                });
                this.update();
            }
            Calendar.prototype.setText = function (line, column, content) {
                var cell = (this._tb.rows[line].cells[column]);
                if (tui.ieVer > 0 && tui.ieVer < 9) {
                    cell.innerText = content;
                } else
                    cell.innerHTML = content;
            };

            Calendar.prototype.year = function () {
                return this._time.getFullYear();
            };
            Calendar.prototype.day = function () {
                return this._time.getDate();
            };
            Calendar.prototype.month = function () {
                return this._time.getMonth() + 1;
            };

            Calendar.prototype.time = function (t) {
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
            };
            Calendar.prototype.prevMonth = function () {
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
            };
            Calendar.prototype.nextMonth = function () {
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
            };
            Calendar.prototype.prevYear = function () {
                var y = this.year(), m = this.month(), d = this.day();
                y--;
                var newDate = new Date(y, m - 1, 1);
                if (d > tui.totalDaysOfMonth(newDate))
                    d = tui.totalDaysOfMonth(newDate);
                this.onPicked(y, m, d);
            };
            Calendar.prototype.nextYear = function () {
                var y = this.year(), m = this.month(), d = this.day();
                y++;
                var newDate = new Date(y, m - 1, 1);
                if (d > tui.totalDaysOfMonth(newDate))
                    d = tui.totalDaysOfMonth(newDate);
                this.onPicked(y, m, d);
            };
            Calendar.prototype.onPicked = function (y, m, d) {
                var newDate = new Date(y, m - 1, d);
                this.time(newDate);
            };
            Calendar.prototype.firstDay = function (date) {
                var y = date.getFullYear();
                var m = date.getMonth();
                return new Date(y, m, 1);
            };
            Calendar.prototype.update = function () {
                var today = tui.today();
                var firstWeek = this.firstDay(this._time).getDay();
                var daysOfMonth = tui.totalDaysOfMonth(this._time);
                var day = 0;
                this._yearCell.innerHTML = this.year() + " - " + this.month();
                for (var i = 0; i < 6; i++) {
                    for (var j = 0; j < 7; j++) {
                        var cell = this._tb.rows[i + 2].cells[j];
                        cell.className = "";
                        if (day === 0) {
                            if (j === firstWeek) {
                                day = 1;
                                cell.innerHTML = day + "";
                                cell.offsetMonth = 0;
                            } else {
                                var preMonthDay = new Date(this.firstDay(this._time).valueOf() - ((firstWeek - j) * 1000 * 24 * 60 * 60));
                                cell.innerHTML = preMonthDay.getDate() + "";
                                cell.offsetMonth = -1;
                                $(cell).addClass("tui-prev-month");
                            }
                        } else {
                            day++;
                            if (day <= daysOfMonth) {
                                cell.innerHTML = day + "";
                                cell.offsetMonth = 0;
                            } else {
                                cell.innerHTML = (day - daysOfMonth) + "";
                                cell.offsetMonth = 1;
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
            };
            Calendar.CLASS = "tui-calendar";
            Calendar._week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            return Calendar;
        })(_ctrl.Control);
        _ctrl.Calendar = Calendar;

        /**
        * Construct a calendar.
        * @param el {HTMLElement or element id or construct info}
        */
        function calendar(param) {
            return tui.ctrl.control(param, Calendar);
        }
        _ctrl.calendar = calendar;

        tui.ctrl.registerInitCallback(Calendar.CLASS, calendar);
    })(tui.ctrl || (tui.ctrl = {}));
    var ctrl = tui.ctrl;
})(tui || (tui = {}));
//# sourceMappingURL=tui.calendar.js.map

/// <reference path="tui.core.ts" />
module tui {

	var shortWeeks = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	var weeks = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	/**
	 * Get today
	 */
	export function today(): Date {
		return new Date();
	}

	/**
	 * Input seconds and get a time description
	 * @param seconds Tims distance of seconds
	 * @param lang Display language
	 */
	export function timespan(seconds: number, lang?: string): string {
		var desc = ["day", "hour", "minute", "second"];
		var val = [];
		var beg = "", end = "";
		var d = Math.floor(seconds / 86400);
		val.push(d);
		seconds = seconds % 86400;
		var h = Math.floor(seconds / 3600);
		val.push(h);
		seconds = seconds % 3600;
		var m = Math.floor(seconds / 60);
		val.push(m);
		val.push(seconds % 60);
		var i = 0, j = 3;
		while (i < 4) {
			if (val[i] > 0) {
				beg.length && (beg += " ");
				beg += val[i] + " " + tui.str(val[i] > 1 ? desc[i] + "s" : desc[i], lang);
				break;
			}
			i++;
		}
		while (i < j) {
			if (val[j] > 0) {
				end.length && (end += " ");
				end += val[j] + " " + tui.str(val[j] > 1 ? desc[j] + "s" : desc[j], lang);
				break;
			}
			j--;
		}
		i++;
		while (i < j) {
			beg.length && (beg += " ");
			beg += val[i] + " " + tui.str(val[i] > 1 ? desc[i] + "s" : desc[i], lang);
			i++;
		}
		return beg + (beg.length ? " " : "") + end;
	}

	/**
	 * Get the distance of dt2 compare to dt1 (dt2 - dt1) return in specified unit (d: day, h: hours, m: minutes, s: seconds, ms: milliseconds)
	 * @param dt1 
	 * @param dt2
	 * @param unit "d", "h", "m", "s" or "ms"
	 */
	export function dateDiff(dt1: Date, dt2: Date, unit: string = "d"): number {
		var d1 = dt1.getTime();
		var d2 = dt2.getTime();
		var diff = d2 - d1;
		var symbol = diff < 0 ? -1 : 1;
		diff = Math.abs(diff);
		unit = unit.toLocaleLowerCase();
		if (unit === "d") {
			return Math.floor(diff / 86400000) * symbol;
		} else if (unit === "h") {
			return Math.floor(diff / 3600000) * symbol;
		} else if (unit === "m") {
			return Math.floor(diff / 60000) * symbol;
		} else if (unit === "s") {
			return Math.floor(diff / 1000) * symbol;
		} else if (unit === "ms") {
			return diff * symbol;
		} else
			return NaN;
	}

	/**
	 * Get new date of dt add specified unit of values.
	 * @param dt The day of the target
	 * @param val Increased value
	 * @param unit "d", "h", "m", "s" or "ms"
	 */
	export function dateAdd(dt: Date, val: number, unit: string = "d"): Date {
		var d = dt.getTime();
		if (unit === "d") {
			return new Date(d + val * 86400000);
		} else if (unit === "h") {
			return new Date(d + val * 3600000);
		} else if (unit === "m") {
			return new Date(d + val * 60000);
		} else if (unit === "s") {
			return new Date(d + val * 1000);
		} else if (unit === "ms") {
			return new Date(d + val);
		} else
			return null;
	}

	/**
	 * Get day in year
	 * @param dt The day of the target
	 */
	export function dayOfYear(dt: Date): number {
		var y = dt.getFullYear();
		var d1 = new Date(y, 0, 1);
		return dateDiff(d1, dt, "d");
	}

	/**
	 * Get total days of month
	 * @param dt The day of the target
	 */
	export function totalDaysOfMonth(dt: Date): number {
		var y = dt.getFullYear();
		var m = dt.getMonth();
		var d1 = new Date(y, m, 1);
		if (m === 11) {
			y++;
			m = 0;
		} else {
			m++;
		}
		var d2 = new Date(y, m, 1);
		return dateDiff(d1, d2, "d");
	}

	/**
	 * Parse string get date instance (format: yyyy-MM-dd hh:mm:ss or ISO8601 format)
	 * @param {String} dtStr Data string
	 */
	export function parseDate(dtStr: string): Date {
		var now = new Date(dtStr);
		if (!isNaN(now.getTime()))
			return now;
		now = new Date();
		var year: number = now.getFullYear();
		var month: number = now.getMonth();
		var day: number = now.getDate();
		var hour: number = 0;
		var minute: number = 0;
		var second: number = 0;
		var millisecond: number = 0;
		var tz: number = new Date().getTimezoneOffset();
		var pyear = "(\\d{4})";
		var pmonth = "(1[0-2]|0?[1-9])";
		var pday = "(0?[1-9]|[12][0-9]|3[01])";
		var phour = "(0?[0-9]|1[0-9]|2[0-3])";
		var pminute = "([0-5]?[0-9])";
		var psecond = "([0-5]?[0-9])";
		var pmillisecond = "([0-9]+)";
		var ptz = "((?:\\+|-)(?:1[0-2]|0[0-9])(?:[0-5][0-9])?)";
		var isUTC = false;

		var regex = "^" + pyear + "-" + pmonth + "-" + pday + "(?:\\s+" + phour + "(?::" + pminute + "(?::" + psecond + ")?)?)?$";
		var matches = new RegExp(regex, "g").exec(dtStr);
		if (matches === null) {
			regex = "^" + pyear + "-" + pmonth + "-" + pday + "(?:T" + phour + ":" + pminute + ":" + psecond + "(?:\\." + pmillisecond + ")?Z)?$";
			matches = new RegExp(regex, "g").exec(dtStr);
			if (matches)
				isUTC = true;
		}
		if (matches === null) {
			regex = "^" + pyear + "-" + pmonth + "-" + pday + "(?:T" + phour + ":" + pminute + ":" + psecond + "(?:\\." + pmillisecond + ")?(?:" + ptz + ")?)?$";
			matches = new RegExp(regex, "g").exec(dtStr);
		}
		if (matches instanceof Array) {
			if (typeof matches[1] === "string" && matches[1].length > 0)
				year = parseInt(matches[1], 10);
			if (typeof matches[2] === "string" && matches[2].length > 0)
				month = parseInt(matches[2], 10) - 1;
			if (typeof matches[3] === "string" && matches[3].length > 0)
				day = parseInt(matches[3], 10);
			if (typeof matches[4] === "string" && matches[4].length > 0)
				hour = parseInt(matches[4], 10);
			if (typeof matches[5] === "string" && matches[5].length > 0)
				minute = parseInt(matches[5], 10);
			if (typeof matches[6] === "string" && matches[6].length > 0)
				second = parseInt(matches[6], 10);
			if (typeof matches[7] === "string" && matches[7].length > 0)
				millisecond = parseInt(matches[7], 10);
			if (typeof matches[8] === "string" && matches[8].length > 0) {
				tz = parseInt(matches[8].substr(1, 2), 10) * 60;
				if (matches[8].length >= 5)
					tz += parseInt(matches[8].substr(3, 2), 10);
				if (matches[8].substr(0, 1) === "+")
					tz = -tz;
			}
			if (isUTC)
				return new Date(Date.UTC(year, month, day, hour, minute, second, millisecond));
			else {
				return new Date(Date.UTC(year, month, day, hour, minute, second, millisecond) + tz * 60 * 1000);
			}
		} else
			return null;
	}

	/**
	 * Convert date to string and output can be formated to ISO8601, RFC2822, RFC3339 or other customized format
	 * @param dt {Date} Date object to be convert
	 * @param dateFmt {String} which format should be apply, default use ISO8601 standard format
	 */
	export function formatDate(dt: Date, dateFmt: string = "yyyy-MM-ddTHH:mm:sszzz"): string {
		var rule = {
			"y+": dt.getFullYear(),
			"M+": dt.getMonth() + 1,
			"d+": dt.getDate(),
			"D+": dayOfYear(dt),
			"h+": ((h: number): number => {
				if (h === 0)
					return h + 12;
				else if (h >= 1 && h <= 12)
					return h;
				else if (h >= 13 && h <= 23)
					return h - 12;
			})(dt.getHours()),
			"H+": dt.getHours(),
			"m+": dt.getMinutes(),
			"s+": dt.getSeconds(),
			"q+": Math.floor((dt.getMonth() + 3) / 3), //quarter
			"S+": dt.getMilliseconds(),
			"E+": dt.getDay(),
			"a": ((h: number): string => {
				if (h >= 0 && h <= 11)
					return "am";
				else
					return "pm";
			})(dt.getHours()),
			"A": ((h: number): string => {
				if (h >= 0 && h <= 11)
					return "AM";
				else
					return "PM";
			})(dt.getHours()),
			"z+": dt.getTimezoneOffset()
		};
		var regex = "";
		for (var k in rule) {
			if (regex.length > 0)
				regex += "|";
			regex += k;
		}
		var regexp = new RegExp(regex, "g");
		return dateFmt.replace(regexp, (str: string, pos: number, source: string): string => {
			for (var k in rule) {
				if (str.match(k) !== null) {
					if (k === "y+") {
						return paddingNumber(rule[k], str.length, str.length);
					} else if (k === "a" || k === "A") {
						return rule[k];
					} else if (k === "z+") {
						var z: string = "";
						if (rule[k] >= 0) {
							z += "-";
						} else {
							z += "+";
						}
						if (str.length < 2)
							z += Math.abs(Math.floor(rule[k] / 60));
						else
							z += paddingNumber(Math.abs(Math.floor(rule[k] / 60)), 2);
						if (str.length === 3)
							z += paddingNumber(Math.abs(Math.floor(rule[k] % 60)), 2);
						else if (str.length > 3)
							z += (":" + paddingNumber(Math.abs(Math.floor(rule[k] % 60)), 2));
						return z;
					} else if (k === "E+") {
						if (str.length < 3)
							return paddingNumber(rule[k], str.length);
						else if (str.length === 3)
							return shortWeeks[rule[k]];
						else
							return weeks[rule[k]];
					} else if (k === "M+") {
						if (str.length < 3)
							return paddingNumber(rule[k], str.length);
						else if (str.length === 3)
							return shortMonths[rule[k] - 1];
						else
							return months[rule[k] - 1];
					} else if (k === "S+") {
						return paddingNumber(rule[k], str.length, str.length, true);
					} else {
						return paddingNumber(rule[k], str.length);
					}
				}
			}
			return str;
		});
	}
}
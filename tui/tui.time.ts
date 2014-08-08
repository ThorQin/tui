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

	

	function parseDateInternal(dtStr: string, format: string): Date {
		if (!dtStr || !format)
			return null;
		var mapping = {};
		var gcount = 0;
		var isUTC = false;

		var values = {};
		function matchEnum(v: string, key: string, enumArray: string[]): boolean {
			var m = dtStr.match(new RegExp("^" + enumArray.join("|"), "i"));
			if (m === null)
				return false;
			v = m[0].toLowerCase();
			v = v.substr(0, 1).toUpperCase() + v.substr(1);
			values[key] = enumArray.indexOf(v);
			dtStr = dtStr.substr(v.length);
			return true;
		}
		function matchNumber(v: string, key?: string, min?: number, max?: number): boolean {
			var len = v.length;
			var m = dtStr.match("^[0-9]{1," + len + "}");
			if (m === null)
				return false;
			v = m[0];
			var num = parseInt(v);
			if (num < min || num > max)
				return false;
			key && (values[key] = num);
			dtStr = dtStr.substr(v.length);
			return true;
		}
		var rule = {
			"y+": function (v: string): boolean {
				if (!matchNumber(v, "year"))
					return false;
				if (values["year"] < 100)
					values["year"] += 1900;
				return true;
			},
			"M+": function (v: string): boolean {
				var len = v.length;
				if (len < 3) {
					if (!matchNumber(v, "month", 1, 12))
						return false;
					values["month"] -= 1;
					return true;
				} else if (len === 3) {
					return matchEnum(v, "month", shortMonths);
				} else {
					return matchEnum(v, "month", months);
				}
			},
			"d+": function (v: string): boolean {
				return matchNumber(v, "date", 1, 31);
			},
			"D+": matchNumber,
			"h+": function (v: string): boolean {
				return matchNumber(v, "12hour", 1, 12);
			},
			"H+": function (v: string): boolean {
				return matchNumber(v, "hour", 0, 24);
			},
			"m+": function (v: string): boolean {
				return matchNumber(v, "minute", 0, 59);
			},
			"s+": function (v: string): boolean {
				return matchNumber(v, "second", 0, 59);
			},
			"[qQ]+": function (v: string): boolean {
				return matchNumber(v, null, 1, 4);
			}, //quarter
			"S+": function (v: string): boolean {
				return matchNumber(v, "millisecond", 0, 999);
			},
			"E+": function (v: string): boolean {
				var len = v.length;
				if (len < 3) {
					if (!matchNumber(v, null, 0, 6))
						return false;
					return true;
				} else if (len === 3) {
					return matchEnum(v, null, shortWeeks);
				} else {
					return matchEnum(v, null, weeks);
				}
			},
			"a|A": function matchNumber(v: string): boolean {
				var len = v.length;
				var m = dtStr.match(/^(am|pm)/i);
				if (m === null)
					return false;
				v = m[0];
				values["ampm"] = v.toLowerCase();
				dtStr = dtStr.substr(v.length);
				return true;
			},
			"z+": function (v: string): boolean {
				var len = v.length;
				var m: string[];
				if (len <= 2)
					m = dtStr.match(/^([\-+][0-9]{2})/i);
				else if (len === 3)
					m = dtStr.match(/^([\-+][0-9]{2})([0-9]{2})/i);
				else
					m = dtStr.match(/^([\-+][0-9]{2}):([0-9]{2})/i);
				if (m === null)
					return false;
				v = m[0];
				var tz = parseInt(m[1]);
				if (Math.abs(tz) < -11 || Math.abs(tz) > 11)
					return false;
				tz *= 60;
				if (typeof m[2] !== undef) {
					if (tz > 0)
						tz += parseInt(m[2]);
					else
						tz -= parseInt(m[2]);
				}
				values["tz"] = -tz;
				dtStr = dtStr.substr(v.length);
				return true;
			},
			"Z": function (v: string): boolean {
				if (dtStr.substr(0, 1) !== "Z")
					return false;
				isUTC = true;
				dtStr = dtStr.substr(1);
				return true;
			},
			"\"[^\"]*\"|'[^']*'": function (v: string): boolean {
				v = v.substr(1, v.length - 2);
				if (dtStr.substr(0, v.length).toLowerCase() !== v.toLowerCase())
					return false;
				dtStr = dtStr.substr(v.length);
				return true;
			},
			"[^yMmdDhHsSqEaAzZ'\"]+": function (v: string): boolean {
				v = v.replace(/(.)/g, '\\$1');
				var m: string[] = dtStr.match(new RegExp("^" + v));
				if (m === null)
					return false;
				v = m[0];
				dtStr = dtStr.substr(v.length);
				return true;
			}
		};
		var regex = "";
		for (var k in rule) {
			if (!rule.hasOwnProperty(k))
				continue;
			if (regex.length > 0)
				regex += "|";
			regex += "(^" + k + ")";
			mapping[k] = ++gcount;
		}

		var result: string[];
		while ((result = format.match(regex)) !== null) {
			for (var k in mapping) {
				var v = result[mapping[k]];
				if (typeof v !== undef) {
					if (rule[k](v) === false)
						return null;
					break;
				}
			}
			format = format.substr(result[0].length);
		}
		if (format.length > 0 || dtStr.length > 0)
			return null;
		var parseCount = 0;
		for (var k in values) {
			if (!values.hasOwnProperty(k))
				continue;
			parseCount++;
		}
		if (parseCount <= 0)
			return null;
		var now = new Date();
		var year = values.hasOwnProperty("year") ? values["year"] : (isUTC ? now.getUTCFullYear() : now.getFullYear());
		var month = values.hasOwnProperty("month") ? values["month"] : (isUTC ? now.getUTCMonth() : now.getMonth());
		var date = values.hasOwnProperty("date") ? values["date"] : (isUTC ? now.getUTCDate() : now.getDate());
		var ampm = values.hasOwnProperty("ampm") ? values["ampm"] : "am";
		var hour;
		if (values.hasOwnProperty("hour"))
			hour = values["hour"];
		else if (values.hasOwnProperty("12hour")) {
			var h12 = values["12hour"];
			if (ampm === "am") {
				if (h12 >= 1 && h12 <= 11) {
					hour = h12;
				} else if (h12 === 12) {
					hour = h12 - 12;
				} else
					return null;
			} else {
				if (h12 === 12)
					hour = h12;
				else if (h12 >= 1 && h12 <= 11)
					hour = h12 + 12;
				else
					return null;
			}
		} else
			hour = 0;
		var minute = values.hasOwnProperty("minute") ? values["minute"] : 0;
		var second = values.hasOwnProperty("second") ? values["second"] : 0;
		var millisecond = values.hasOwnProperty("millisecond") ? values["millisecond"] : 0;
		var tz = values.hasOwnProperty("tz") ? values["tz"] : now.getTimezoneOffset();
		now.setUTCFullYear(year);
		now.setUTCMonth(month);
		now.setUTCDate(date);
		now.setUTCHours(hour);
		now.setUTCMinutes(minute);
		now.setUTCSeconds(second);
		now.setUTCMilliseconds(millisecond);
		if (!isUTC) {
			now.setTime(now.getTime() + tz * 60 * 1000);
		}
		return now;
	}

	/**
	 * Parse string get date instance (
	 * try to parse format: 
	 *		yyyy-MM-dd HH:mm:ss，
	 *		yyyy-MM-dd, 
	 *		dd MMM yyyy, 
	 *		MMM dd, yyyy,
	 *		ISO8601 format)
	 * @param {String} dtStr Data string
	 */
	export function parseDate(dtStr: string, format?: string): Date {
		if (typeof format === "string")
			return parseDateInternal(dtStr, format);
		else if (typeof format === undef) {
			var dt = new Date(dtStr);
			if (!isNaN(dt.getTime()))
				return dt;
			dt = parseDateInternal(dtStr, "yyyy-MM-dd");
			if (dt !== null)
				return dt;
			dt = parseDateInternal(dtStr, "yyyy-MM-dd HH:mm:ss");
			if (dt !== null)
				return dt;
			dt = parseDateInternal(dtStr, "MMM dd, yyyy HH:mm:ss");
			if (dt !== null)
				return dt;
			dt = parseDateInternal(dtStr, "MMM dd, yyyy");
			if (dt !== null)
				return dt;
			dt = parseDateInternal(dtStr, "dd MMM yyyy HH:mm:ss");
			if (dt !== null)
				return dt;
			dt = parseDateInternal(dtStr, "dd MMM yyyy");
			if (dt !== null)
				return dt;
		} 
		return null;
	}

	/**
	 * Convert date to string and output can be formated to ISO8601, RFC2822, RFC3339 or other customized format
	 * @param dt {Date} Date object to be convert
	 * @param dateFmt {String} which format should be apply, default use ISO8601 standard format
	 */
	export function formatDate(dt: Date, dateFmt: string = "yyyy-MM-ddTHH:mm:sszzz"): string {
		var isUTC: boolean = (dateFmt.indexOf("Z") >= 0 ? true : false);
		var fullYear = isUTC ? dt.getUTCFullYear() : dt.getFullYear();
		var month = isUTC ? dt.getUTCMonth() : dt.getMonth();
		var date = isUTC ? dt.getUTCDate() : dt.getDate();
		var hours = isUTC ? dt.getUTCHours() : dt.getHours();
		var minutes = isUTC ? dt.getUTCMinutes() : dt.getMinutes();
		var seconds = isUTC ? dt.getUTCSeconds() : dt.getSeconds();
		var milliseconds = isUTC ? dt.getUTCMilliseconds() : dt.getMilliseconds();
		var day = isUTC ? dt.getUTCDay() : dt.getDay();

		var rule = {
			"y+": fullYear,
			"M+": month + 1,
			"d+": date,
			"D+": dayOfYear(dt) + 1,
			"h+": (function (h: number): number {
				if (h === 0)
					return h + 12;
				else if (h >= 1 && h <= 12)
					return h;
				else if (h >= 13 && h <= 23)
					return h - 12;
			})(hours),
			"H+": hours,
			"m+": minutes,
			"s+": seconds,
			"q+": Math.floor((month + 3) / 3), //quarter
			"S+": milliseconds,
			"E+": day,
			"a": (function (h: number): string {
				if (h >= 0 && h <= 11)
					return "am";
				else
					return "pm";
			})(isUTC ? dt.getUTCHours() : dt.getHours()),
			"A": (function (h: number): string {
				if (h >= 0 && h <= 11)
					return "AM";
				else
					return "PM";
			})(hours),
			"z+": dt.getTimezoneOffset()
		};
		var regex = "";
		for (var k in rule) {
			if (!rule.hasOwnProperty(k))
				continue;
			if (regex.length > 0)
				regex += "|";
			regex += k;
		}
		var regexp = new RegExp(regex, "g");
		return dateFmt.replace(regexp, function (str: string, pos: number, source: string): string {
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
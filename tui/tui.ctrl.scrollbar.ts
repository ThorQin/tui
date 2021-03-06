﻿/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {

	export class Scrollbar extends Control<Scrollbar> {
		static CLASS: string = "tui-scrollbar";
		private _btnThumb: HTMLSpanElement = null;
		private _btnHead: HTMLSpanElement = null;
		private _btnFoot: HTMLSpanElement = null;
		constructor(el?: HTMLElement) {
			super("span", Scrollbar.CLASS, el);
			var self = this;

			this.attr("unselectable", "on");
			this[0].innerHTML = "";
			this._btnHead = document.createElement("span");
			this._btnHead.className = "tui-scroll-head";
			this[0].appendChild(this._btnHead);
			this._btnThumb = document.createElement("span");
			this._btnThumb.className = "tui-scroll-thumb";
			$(this._btnThumb).attr("unselectable", "on");
			this[0].appendChild(this._btnThumb);
			this._btnFoot = document.createElement("span");
			this._btnFoot.className = "tui-scroll-foot";
			this[0].appendChild(this._btnFoot);

			var scrollTimer = null;
			var scrollInterval = null;
			var moveParam: {
				pos: number;
				step: number;
				isIncrease: boolean;
				isPage: boolean;
			} = null;

			function stopMove() {
				if (scrollTimer) {
					clearTimeout(scrollTimer);
					scrollTimer = null;
				}
				if (scrollInterval) {
					clearInterval(scrollInterval);
					scrollInterval = null;
				}
			}

			function moveThumb() {
				var val = self.value();
				var total = self.total();
				var achieve = false;
				moveParam.pos = Math.round(moveParam.pos);
				moveParam.step = Math.round(moveParam.step);
				if (val === moveParam.pos)
					return;
				if (!moveParam.isIncrease) {
					val -= moveParam.step;
					if (val - (moveParam.isPage? moveParam.step / 2:0) <= moveParam.pos || val <= 0) {
						achieve = true;
						if (val < 0)
							val = 0;
						stopMove();
					}
					self.value(val);
				} else {
					val += moveParam.step;
					if (val + (moveParam.isPage ? moveParam.step / 2 : 0) >= moveParam.pos || val >= total) {
						achieve = true;
						if (val > total)
							val = total;
						stopMove();
					}
					self.value(val);
				}
				self.fire("scroll", { value: self.value(), type:"mousedown" });
				return achieve;
			}

			function releaseButton(e) {
				stopMove();
				$(self._btnHead).removeClass("tui-actived");
				$(self._btnFoot).removeClass("tui-actived");
				$(tui.unmask()).off("mouseup", releaseButton);
				$(document).off("mouseup", releaseButton);
			};

			$(this[0]).mousedown((e) => {
				tui.fire("#tui.check.popup");
				// Should check which target object was triggered.
				if (!tui.isLButton(e)) {
					return;
				}
				var obj = e.target;
				if (obj !== self[0]) {
					e.stopPropagation();
					e.preventDefault();
					return;
				}
				if (this.total() <= 0)
					return;
				var dir = self.direction();
				var pos: number, thumbLen: number;

				if (dir === "vertical") {
					pos = (typeof e.offsetY === "number" ? e.offsetY : e["originalEvent"].layerY);
					thumbLen = this._btnThumb.offsetHeight;
				} else {
					pos = (typeof e.offsetX === "number" ? e.offsetX : e["originalEvent"].layerX);
					thumbLen = this._btnThumb.offsetWidth;
				}
				var v = this.posToValue(pos - thumbLen / 2);
				moveParam = { pos: v, step: self.page(), isIncrease: v > self.value(), isPage: true };
				if (!moveThumb()) {
					scrollTimer = setTimeout(function () {
						scrollTimer = null;
						scrollInterval = setInterval(moveThumb, 20);
					}, 300);
					$(tui.mask()).on("mouseup", releaseButton);
					$(document).on("mouseup", releaseButton);
				}
				e.stopPropagation();
				e.preventDefault();
				return false;
			});

			$(this._btnHead).mousedown(function (e) {
				if (!tui.isLButton(e))
					return;
				if (self.total() <= 0)
					return;
				$(self._btnHead).addClass("tui-actived");
				moveParam = { pos: 0, step: self.step(), isIncrease: false, isPage: false };
				if (!moveThumb()) {
					scrollTimer = setTimeout(function () {
						scrollTimer = null;
						scrollInterval = setInterval(moveThumb, 20);
					}, 300);
					$(tui.mask()).on("mouseup", releaseButton);
					$(document).on("mouseup", releaseButton);
				}
			});

			$(this._btnFoot).mousedown(function (e) {
				if (!tui.isLButton(e))
					return;
				if (self.total() <= 0)
					return;
				$(self._btnFoot).addClass("tui-actived");
				moveParam = { pos: self.total(), step: self.step(), isIncrease: true, isPage: false };
				if (!moveThumb()) {
					scrollTimer = setTimeout(function () {
						scrollTimer = null;
						scrollInterval = setInterval(moveThumb, 20);
					}, 300);
					$(tui.mask()).on("mouseup", releaseButton);
					$(document).on("mouseup", releaseButton);
				}
			});

			var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
			$(this[0]).on(mousewheelevt, function (e: any) {
				var ev = e.originalEvent;
				var delta = ev.detail ? ev.detail * (-120) : ev.wheelDelta;
				//delta returns +120 when wheel is scrolled up, -120 when scrolled down
				var scrollSize = (Math.round(self.page() / 2) > self.step() ? Math.round(self.page() / 2) : self.step());
				var oldValue = self.value();
				if (delta <= -120) {
					self.value(self.value() + scrollSize);
				} else {
					self.value(self.value() - scrollSize);
				}
				if (oldValue !== self.value())
					self.fire("scroll", { value: self.value(), type: "mousewheel"});
				e.stopPropagation();
				e.preventDefault();
			});

			var beginX = 0, beginY = 0, beginLeft = 0, beginTop = 0;
			function dragThumb(e) {
				var diff = 0;
				var oldValue = self.value();
				var pos;
				if (self.direction() === "vertical") {
					diff = e.clientY - beginY;
					pos = beginTop + diff;
				} else {
					diff = e.clientX - beginX;
					pos = beginLeft + diff;
				}
				self.value(self.posToValue(pos));
				if (oldValue !== self.value()) {
					self.fire("scroll", { value: self.value(), type: "drag" });
				}
			}

			function dragEnd(e) {
				$(tui.unmask()).off("mousemove", dragThumb);
				$(document).off("mouseup", dragEnd);
				$(self._btnThumb).removeClass("tui-actived");
				self.fire("dragend", { value: self.value() });
			}

			$(this._btnThumb).mousedown(function (e) {
				if (!tui.isLButton(e))
					return;
				beginX = e.clientX;
				beginY = e.clientY;
				beginLeft = self._btnThumb.offsetLeft;
				beginTop = self._btnThumb.offsetTop;
				$(self._btnThumb).addClass("tui-actived");
				$(tui.mask()).on("mousemove", dragThumb);
				$(document).on("mouseup", dragEnd);
				self.fire("dragbegin", { value: self.value() });
			});

			this.refresh();
		}

		total(): number;
		total(val?: number): Scrollbar;
		total(val?: number): any {
			if (typeof val === "number") {
				if (val < 0)
					val = 0;
				val = Math.round(val);
				this.attr("data-total", val);
				if (this.value() > val)
					this.value(val);
				else
					this.refresh();
				return this;
			} else {
				var val = parseInt(this.attr("data-total"), 10);
				if (val === null || isNaN(val))
					return 0;
				else
					return val;
			}
		}

		value(): number;
		value(val?: number): Scrollbar;
		value(val?: number): any {
			if (typeof val === "number") {
				val = Math.round(val);
				if (val < 0)
					val = 0;
				if (val > this.total())
					val = this.total();
				this.attr("data-value", val);
				this.refresh();
				return this;
			} else {
				var val = parseInt(this.attr("data-value"), 10);
				if (val === null || isNaN(val))
					return 0;
				else
					return val;
			}
		}

		step(): number;
		step(val?: number): Scrollbar;
		step(val?: number): any {
			if (typeof val === "number") {
				val = Math.round(val);
				if (val < 1)
					val = 1;
				if (val > this.total())
					val = this.total();
				this.attr("data-step", val);
				if (val > this.page())
					this.page(val);
				else
					this.refresh();
				return this;
			} else {
				var val = parseInt(this.attr("data-step"), 10);
				if (val === null || isNaN(val))
					return this.total() > 0 ? 1 : 0;
				else
					return val;
			}
		}

		page(): number;
		page(val?: number): Scrollbar;
		page(val?: number): any {
			if (typeof val === "number") {
				val = Math.round(val);
				if (val < 1)
					val = 1;
				if (val > this.total())
					val = this.total();
				this.attr("data-page", val);
				if (val < this.step())
					this.step(val);
				else
					this.refresh();
				return this;
			} else {
				var val = parseInt(this.attr("data-page"), 10);
				if (val === null || isNaN(val))
					return this.total() > 0 ? 1 : 0;
				else
					return val;
			}
		}

		direction(): string;
		direction(val?: string): Scrollbar;
		direction(val?: string): any {
			if (typeof val === "string") {
				if (["horizontal", "vertical"].indexOf(val) >= 0) {
					this.attr("data-direction", val);
					this.refresh();
				}
				return this;
			} else {
				var dir = this.attr("data-direction");
				if (dir === null)
					return "vertical";
				else
					return dir;
			}
		}

		private logicLenToRealLen(logicLen: number): number {
			var len = 0;
			var total = this.total();
			if (total <= 0)
				return 0;
			if (this.direction() === "vertical") {
				len = this[0].clientHeight - this._btnHead.offsetHeight - this._btnFoot.offsetHeight - this._btnThumb.offsetHeight;
			} else {
				len = this[0].clientWidth - this._btnHead.offsetWidth - this._btnFoot.offsetWidth - this._btnThumb.offsetWidth;
			}
			return logicLen / total * len;
		}

		private posToValue(pos) {
			var total: number = this.total();
			if (total <= 0) {
				return 0;
			}
			var len = 0;
			var val = 0;
			if (this.direction() === "vertical") {
				len = this[0].clientHeight - this._btnHead.offsetHeight - this._btnFoot.offsetHeight - this._btnThumb.offsetHeight;
				val = (pos - this._btnHead.offsetHeight) / len * total;
			} else {
				len = this[0].clientWidth - this._btnHead.offsetWidth - this._btnFoot.offsetWidth - this._btnThumb.offsetWidth;
				val = (pos - this._btnHead.offsetWidth) / len * total;
			}
			val = Math.round(val);
			return val;
		}

		private valueToPos(value): { pos: number; thumbLen: number; } {
			var total = this.total();
			var step = this.step();
			var page = this.page();
			var vertical: boolean = (this.direction() === "vertical");
			var minSize = (vertical ? this._btnHead.offsetHeight : this._btnHead.offsetWidth);
			if (total <= 0) {
				return { pos: 0, thumbLen: 0 };
			}
			var len = (vertical ?
				this[0].clientHeight - this._btnHead.offsetHeight - this._btnFoot.offsetHeight :
				this[0].clientWidth - this._btnHead.offsetWidth - this._btnFoot.offsetWidth);
			var thumbLen = Math.round(page / total * len);
			if (thumbLen < minSize)
				thumbLen = minSize;
			if (thumbLen > len - 10)
				thumbLen = len - 10;
			var scale = (value / total);
			if (scale < 0)
				scale = 0;
			if (scale > 1)
				scale = 1;
			var pos = minSize + Math.round(scale * (len - thumbLen)) - 1;
			return {
				"pos": pos, "thumbLen": thumbLen
			};
		}

		refresh() {
			var pos = this.valueToPos(this.value());
			var vertical: boolean = (this.direction() === "vertical");
			if (vertical) {
				this._btnThumb.style.height = (pos.thumbLen > 0 ? pos.thumbLen : 0) + "px";
				this._btnThumb.style.top = pos.pos + "px";
				this._btnThumb.style.left = "";
				this._btnThumb.style.width = "";
			} else {
				this._btnThumb.style.width = (pos.thumbLen > 0 ? pos.thumbLen : 0) + "px";
				this._btnThumb.style.left = pos.pos + "px";
				this._btnThumb.style.top = "";
				this._btnThumb.style.height = "";
			}
		}
	}

	export function scrollbar(param: HTMLElement): Scrollbar;
	export function scrollbar(param: string): Scrollbar;
	export function scrollbar(): Scrollbar;
	/**
	 * Construct a scrollbar.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function scrollbar(param?: any): Scrollbar {
		return tui.ctrl.control(param, Scrollbar);
	}

	tui.ctrl.registerInitCallback(Scrollbar.CLASS, scrollbar);
}
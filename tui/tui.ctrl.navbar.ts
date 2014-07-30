/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	/**
	 * Navbar class used to display a navigation head bar to 
	 * let user easy jump to a particular functional area in the website.
	 */
	export class Navbar extends Control<Navbar> {
		static CLASS: string = "tui-navbar";
		private _float: boolean = false;
		constructor(el?: HTMLElement) {
			super("div", Navbar.CLASS, el);
			this[1] = document.createElement("div");
			this.installMonitor();
			this._onScroll(null);
		}

		private _onScroll = (() => {
			var self = this;
			return function (e) {
				var pos;
				if (self._float === false) {
					pos = tui.fixedPosition(self[0]);
					self[0].style.left = "";
				} else {
					pos = tui.fixedPosition(self[1]);
					self[0].style.left = (-tui.windowScrollElement().scrollLeft) + "px";
				}
				if (pos.y < self.top() && self._float === false) {
					self._float = true;
					self[1].style.height = self[0].offsetHeight + "px";
					self[0].style.position = "fixed";
					self[0].style.left = (-tui.windowScrollElement().scrollLeft) + "px";
					self[0].style.right = "0px";
					self[0].style.top = self.top() + "px";
					document.body.insertBefore(self[1], self[0]);
				} else if (pos.y >= self.top() && self._float === true) {
					self._float = false;
					self[0].style.position = "";
					self[0].style.top = "";
					self[0].style.left = "";
					self[1].style.height = "";
					tui.removeNode(self[1]);
				}
			};
		})();

		installMonitor() {
			$(window).scroll(this._onScroll);
		}

		uninstallMonitor() {
			$(window).off("scroll", this._onScroll);
		}

		top(): number;
		top(val: number): Navbar;
		top(val?: number): any {
			if (typeof val === "string") {
				this.attr("data-top", val);
				return this;
			} else {
				val = parseInt(this.attr("data-top"));
				if (isNaN(val))
					return 0;
				else
					return val;
			}
		}
	}

	export function navbar(elem: HTMLElement): Navbar;
	export function navbar(elemId: string): Navbar;
	export function navbar(): Navbar;
	export function navbar(param?: any): Navbar {
		return tui.ctrl.control(param, Navbar);
	}
	tui.ctrl.registerInitCallback(Navbar.CLASS, navbar);
}
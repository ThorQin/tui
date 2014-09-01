/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	export class Tips extends Control<Tips> {
		static CLASS: string = "tui-tips";

		private _closeButton = null;

		constructor(el?: HTMLElement) {
			super("div", Tips.CLASS, el);
			var btn = document.createElement("span");
			this._closeButton = btn;
			btn.className = "tui-tips-close";
			this[0].appendChild(btn);
			$(btn).click((e) => {
				this.close();
			});
		}

		useVisible(): boolean;
		useVisible(val: boolean): Tips;
		useVisible(val?: boolean): any {
			if (typeof val !== tui.undef) {
				this.is("data-use-visible", !!val);
				return this;
			} else
				return this.is("data-use-visible");
		}

		autoCloseTime(): number;
		autoCloseTime(val: number): Tips;
		autoCloseTime(val?: number): any {
			if (typeof val === "number") {
				if (isNaN(val) || val <= 0)
					this.removeAttr("data-auto-close-time");
				else
					this.attr("data-auto-close-time", Math.floor(val));
				return this;
			} else {
				val = parseInt(this.attr("data-auto-close-time"));
				if (isNaN(val))
					return null
				else if (val <= 0)
					return null;
				else
					return val;
			}
		}

		show();
		show(msg: string);
		show(msg?: string) {
			if (typeof msg !== undef) {
				tui.removeNode(this._closeButton);
				this[0].innerHTML = msg;
				this[0].appendChild(this._closeButton);
			}
			this.removeClass("tui-invisible");
			this.removeClass("tui-hidden");
			this[0].style.opacity = "0";
			$(this[0]).animate({ opacity: 1 }, 100, () => {
				var autoClose = this.autoCloseTime();
				if (autoClose !== null) {
					setTimeout(() => { this.close(); }, autoClose);
				}
			});
		}

		close() {
			this.fire("close", { ctrl: this[0] });
			$(this[0]).animate({ opacity: 0 }, 300, () => {
				if (this.useVisible())
					this.addClass("tui-invisible");
				else
					this.addClass("tui-hidden");
			});
		}
	}
	export function tips(elem: HTMLElement): Tips;
	export function tips(elemId: string): Tips;
	export function tips(): Tips;
	/**
	 * Construct a tips.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function tips(param?: any): Tips {
		return tui.ctrl.control(param, Tips);
	}

	tui.ctrl.registerInitCallback(Tips.CLASS, tips);
}
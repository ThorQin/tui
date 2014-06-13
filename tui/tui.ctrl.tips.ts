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
		useVisible(val: boolean): Form;
		useVisible(val?: boolean): any {
			if (typeof val !== tui.undef) {
				this.is("data-use-visible", !!val);
				return this;
			} else
				return this.is("data-use-visible");
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
		}

		close() {
			this.fire("close", {ctrl:this[0]});
			if (this.useVisible())
				this.addClass("tui-invisible");
			else
				this.addClass("tui-hidden");
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
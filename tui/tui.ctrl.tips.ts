/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	export class Tips extends Control<Tips> {
		static CLASS: string = "tui-tips";

		constructor(el?: HTMLElement) {
			super("div", Tips.CLASS, el);
			var btn = document.createElement("span");
			btn.className = "tui-tips-close";
			this[0].appendChild(btn);
			$(btn).click((e) => {
				this.close();
			});
		}

		show();
		show(msg: string);
		show(msg?: string) {
			this.removeClass("tui-hidden");
		}

		close() {
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
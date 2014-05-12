/// <reference path="tui.button.ts" />
module tui.ctrl {
	export class Checkbox extends Control<Checkbox> implements IButton {
		static CLASS: string = "tui-checkbox";

		constructor(el?: HTMLElement) {
			super();
			if (el)
				this.elem(el);
			else
				this.elem("a", Checkbox.CLASS);
			this[0]._ctrl = this;
			this.attr("tabIndex", "0");
			this.exposeEvents("mousedown mouseup mousemove mouseenter mouseleave");
			$(this[0]).on("click", (e) => {
				this.fire("click", { "ctrl": this[0], "event": e });
				tui.fire(this.id(), { "ctrl": this[0], "event": e });
			});
			$(this[0]).on("mousedown", (e) => {
				if (tui.ffVer > 0)
					this.focus();
			});
			$(this[0]).on("mouseup", (e) => {
				this.checked(!this.checked());
			});
			$(this[0]).on("keydown", (e) => {
				var isButton = this[0].nodeName.toLowerCase() === "button";
				if (e.keyCode === 32) {
					this.actived(true);
					if (!isButton)
						e.preventDefault();
				}
				this.fire("keydown", { "ctrl": this[0], "event": e });
				if (e.keyCode === 13 && !isButton) {
					e.preventDefault();
					e.type = "click";
					this.fire("click", { "ctrl": this[0], "event": e });
					tui.fire(this.id(), { "ctrl": this[0], "event": e });
				}
			});

			$(this[0]).on("keyup", (e) => {
				var isButton = this[0].nodeName.toLowerCase() === "button";
				if (e.keyCode === 32) {
					this.actived(false);
					this.checked(!this.checked());
				}
				this.fire("keyup", { "ctrl": this[0], "event": e });
				if (e.keyCode === 32 && !isButton) {
					e.type = "click";
					this.fire("click", { "ctrl": this[0], "event": e });
					tui.fire(this.id(), { "ctrl": this[0], "event": e });
				}
			});
		}

		text(t?: string): string {
			if (this[0])
				return tui.elementText(this[0], t);
			return null;
		}
	}

	export function checkbox(param: HTMLElement): Checkbox;
	export function checkbox(param: string): Checkbox;
	export function checkbox(): Checkbox;
	/**
	 * Construct a button.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function checkbox(param?: any): Checkbox {
		return tui.ctrl.control(param, Checkbox);
	}
	tui.ctrl.registerInitCallback(Checkbox.CLASS, checkbox);
}
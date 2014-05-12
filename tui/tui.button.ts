/// <reference path="tui.control.ts" />
module tui.ctrl {
	export interface IButton {
		text(t?: string): string;
	}

	export class Button extends Control<Button> implements IButton {
		static CLASS: string = "tui-button";

		constructor(el?: HTMLElement) {
			super();
			if (el)
				this.elem(el);
			else
				this.elem("a", Button.CLASS);
			this[0]._ctrl = this;
			this.attr("tabIndex", "0");
			this.selectable(false);
			this.exposeEvents("mousedown mouseup mousemove mouseenter mouseleave");

			$(this[0]).on("click", (e) => {
				this.fire("click", { "ctrl": this[0], "event": e });
				tui.fire(this.id(), { "ctrl": this[0], "event": e });
			});

			$(this[0]).on("mousedown", (e) => {
				this.actived(true);
				var self = this;
				function releaseMouse(e) {
					self.actived(false);
					$(document).off("mouseup", releaseMouse);
				}
				$(document).on("mouseup", releaseMouse);
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
	
	export function button(param: HTMLElement): Button;
	export function button(param: string): Button;
	export function button(): Button;
	/**
	 * Construct a button.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function button(param?: any): Button {
		return tui.ctrl.control(param, Button);
	}

	tui.ctrl.registerInitCallback(Button.CLASS, button);
}
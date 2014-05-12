/// <reference path="tui.button.ts" />
module tui.ctrl {
	export class Radiobox extends Control<Radiobox> implements IButton {
		static CLASS: string = "tui-radiobox";

		constructor(el?: HTMLElement) {
			super();
			if (el)
				this.elem(el);
			else
				this.elem("a", Radiobox.CLASS);
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
				this.checked(true);
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
					this.checked(true);
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

		checked(): boolean;
		checked(val: boolean): Radiobox;
		checked(val?: boolean): any {
			if (typeof val === tui.undef) {
				return super.checked();
			} else {
				val = (!!val);
				if (val) {
					var groupName = this.attr("data-group");
					$("." + Radiobox.CLASS + "[data-group=" + groupName + "]").each(function () {
						$(this).removeAttr("data-checked");
						this.className = this.className;
					});
				}
				super.checked(val);
				return this;
			}	
		}
	}

	export function radiobox(param: HTMLElement): Radiobox;
	export function radiobox(param: string): Radiobox;
	export function radiobox(): Radiobox;
	/**
	 * Construct a button.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function radiobox(param?: any): Radiobox {
		return tui.ctrl.control(param, Radiobox);
	}
	tui.ctrl.registerInitCallback(Radiobox.CLASS, radiobox);
}
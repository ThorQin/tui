/// <reference path="tui.ctrl.button.ts" />
/// <reference path="tui.ctrl.checkbox.ts" />
module tui.ctrl {
	export class Radiobox extends Control<Radiobox> implements IButton {
		static CLASS: string = "tui-radiobox";

		constructor(el?: HTMLElement) {
			super("a", Radiobox.CLASS, el);

			this.disabled(this.disabled());
			this.exposeEvents("mousedown mouseup mousemove mouseenter mouseleave");

			$(this[0]).on("click", (e) => {
				if (this.disabled())
					return;
				this.fire("click", { "ctrl": this[0], "event": e });
				tui.fire(this.id(), { "ctrl": this[0], "event": e });
			});
			$(this[0]).on("mousedown", (e) => {
				if (this.disabled())
					return;
				if (tui.ffVer > 0)
					this.focus();
			});
			$(this[0]).on("mouseup", (e) => {
				if (this.disabled())
					return;
				this.checked(true);
			});
			$(this[0]).on("keydown", (e) => {
				if (this.disabled())
					return;
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
					this.checked(true);
					this.fire("click", { "ctrl": this[0], "event": e });
					tui.fire(this.id(), { "ctrl": this[0], "event": e });
				}
			});

			$(this[0]).on("keyup", (e) => {
				if (this.disabled())
					return;
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

		text(): string;
		text(val?: string): Radiobox;
		text(val?: string): any {
			if (typeof val !== tui.undef) {
				$(this[0]).html(val);
				return this;
			} else
				return $(this[0]).html();
		}

		checked(): boolean;
		checked(val: boolean): Radiobox;
		checked(val?: boolean): any {
			if (typeof val === tui.undef) {
				return super.checked();
			} else {
				val = (!!val);
				if (val) {
					var groupName = this.group();
					if (groupName) {
						$("." + Radiobox.CLASS + "[data-group='" + groupName + "']").each(function (index, elem) {
							var ctrl = elem["_ctrl"];
							if (ctrl && typeof ctrl.checked === "function") {
								ctrl.checked(false);
							}
						});
					}
				}
				super.checked(val);
				this.unNotifyGroup();
				return this;
			}	
		}

		group(): string;
		group(val?: string): Radiobox;
		group(val?: string): any {
			if (typeof val !== tui.undef) {
				this.attr("data-group", val);
				return this;
			} else
				return this.attr("data-group");
		}

		value(): any;
		value(val?: any): Radiobox;
		value(val?: any): any {
			if (typeof val !== tui.undef) {
				this.attr("data-value", JSON.stringify(val));
				return this;
			} else {
				val = this.attr("data-value");
				return JSON.parse(val);
			}
		}

		private unNotifyGroup() {
			var groupName = this.group();
			if (groupName) {
				$("." + Radiobox.CLASS + "[data-group='" + groupName + "']").each(function (index, elem) {
					var ctrl = elem["_ctrl"];
					if (ctrl && typeof ctrl.notify === "function") {
						ctrl.notify(null);
					}
				});
			}
		}

		notify(message: string): void {
			if (typeof message === "string") {
				this.attr("data-tooltip", message);
				this.addClass("tui-notify");
			} else if (message === null) {
				this.attr("data-tooltip", "");
				this.removeAttr("data-tooltip");
				this.removeClass("tui-notify");
			}
		}

		disabled(): boolean;
		disabled(val: boolean): Radiobox;
		disabled(val?: boolean): any {
			var result = this.is("data-disabled", val);
			if (typeof val === "boolean") {
				if (val)
					this.removeAttr("tabIndex");
				else
					this.attr("tabIndex", "0");
			}
			return result;
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
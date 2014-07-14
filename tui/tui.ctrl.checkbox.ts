/// <reference path="tui.ctrl.button.ts" />
module tui.ctrl {
	export class Checkbox extends Control<Checkbox> implements IButton {
		static CLASS: string = "tui-checkbox";

		constructor(el?: HTMLElement) {
			super("a", Checkbox.CLASS, el);

			this.disabled(this.disabled());
			this.selectable(false);
			this.exposeEvents("mouseup mousedown mousemove mouseenter mouseleave keyup keydown");

			$(this[0]).on("mousedown", (e) => {
				if (this.disabled())
					return;
				this.actived(true);
				var self = this;
				function releaseMouse(e) {
					self.actived(false);
					if (tui.isFireInside(self[0], e)) {
						self.checked(!self.checked());
						e.type = "click";
						self.fireClick(e);
					}
					$(document).off("mouseup", releaseMouse);
				}
				$(document).on("mouseup", releaseMouse);
			});

			$(this[0]).on("keydown", (e) => {
				if (this.disabled())
					return;
				if (e.keyCode === 32) {
					this.actived(true);
					e.preventDefault();
				}
				if (e.keyCode === 13) {
					e.preventDefault();
					e.type = "click";
					this.checked(!this.checked());
					setTimeout(() => {
						this.fireClick(e);
					}, 100);
				}
			});

			$(this[0]).on("keyup", (e) => {
				if (this.disabled())
					return;
				if (e.keyCode === 32) {
					this.actived(false);
					this.checked(!this.checked());
					e.type = "click";
					setTimeout(() => {
						this.fireClick(e);
					}, 50);
				}
			});
		}

		fireClick(e) {
			if (this.fire("click", { "ctrl": this[0], "event": e }) === false)
				return;
			if (tui.fire(this.id(), { "ctrl": this[0], "event": e }) === false)
				return;
			var formId = this.submitForm();
			if (formId) {
				var form = tui.ctrl.form(formId);
				form && form.submit();
			}
		}


		checked(): boolean;
		checked(val: boolean): Checkbox;
		checked(val?: boolean): any {
			if (typeof val === tui.undef) {
				return super.checked();
			} else {
				super.checked(!!val);
				this.unNotifyGroup();
				return this;
			}
		}

		triState(): boolean;
		triState(val: boolean): Checkbox;
		triState(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-tri-state", val);
			} else
				return this.is("data-tri-state");
		}

		text(): string;
		text(val?: string): Checkbox;
		text(val?: string): any {
			if (typeof val !== tui.undef) {
				$(this[0]).html(val);
				return this;
			} else
				return $(this[0]).html();
		}

		group(): string;
		group(val?: string): Checkbox;
		group(val?: string): any {
			if (typeof val !== tui.undef) {
				this.attr("data-group", val);
				return this;
			} else
				return this.attr("data-group");
		}

		value(): any;
		value(val?: any): Checkbox;
		value(val?: any): any {
			if (typeof val !== tui.undef) {
				this.attr("data-value", JSON.stringify(val));
				return this;
			} else {
				val = this.attr("data-value");
				if (val === null) {
					return null;
				} else {
					try {
						return eval("(" + val + ")");
					} catch (err) {
						return null;
					}
				}
			}
		}

		private unNotifyGroup() {
			var groupName = this.group();
			if (groupName) {
				$("." + Checkbox.CLASS + "[data-group='" + groupName + "']").each(function (index, elem) {
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
		disabled(val: boolean): Checkbox;
		disabled(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-disabled", val);
				if (val)
					this.removeAttr("tabIndex");
				else
					this.attr("tabIndex", "0");
				return this;
			} else
				return this.is("data-disabled");
		}

		submitForm(): string;
		submitForm(formId: string): Button;
		submitForm(formId?: string): any {
			if (typeof formId === "string") {
				this.attr("data-submit-form", formId);
				return this;
			} else
				return this.attr("data-submit-form");
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
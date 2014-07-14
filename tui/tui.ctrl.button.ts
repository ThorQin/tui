/// <reference path="tui.ctrl.control.ts" />
/// <reference path="tui.ctrl.form.ts" />
module tui.ctrl {
	export interface IButton {
		text(t?: string): string;
		fireClick(e): void;
	}

	export class Button extends Control<Button> implements IButton {
		static CLASS: string = "tui-button";

		constructor(el?: HTMLElement) {
			super("a", Button.CLASS, el);

			this.disabled(this.disabled());
			this.selectable(false);
			this.exposeEvents("mousedown mouseup mousemove mouseenter mouseleave keydown keyup");
			$(this[0]).on("mousedown", (e) => {
				if (this.disabled())
					return;
				this.actived(true);
				var self = this;
				function releaseMouse(e) {
					self.actived(false);
					if (tui.isFireInside(self[0], e))
						self.fireClick(e);
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

		submitForm(): string;
		submitForm(formId: string): Button;
		submitForm(formId?: string): any {
			if (typeof formId === "string") {
				this.attr("data-submit-form", formId);
				return this;
			} else
				return this.attr("data-submit-form");
		}

		text(t?: string): string {
			if (this[0])
				return tui.elementText(this[0], t);
			return null;
		}

		html(): string;
		html(t: string): Button;
		html(t?: string): any {
			if (this[0]) {
				if (typeof t !== undef) {
					$(this[0]).html(t);
					return this;
				} else
					return $(this[0]).html();
			}
			return null;
		}

		disabled(): boolean;
		disabled(val: boolean): Button;
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
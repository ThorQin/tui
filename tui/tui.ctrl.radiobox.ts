/// <reference path="tui.ctrl.button.ts" />
/// <reference path="tui.ctrl.checkbox.ts" />
module tui.ctrl {
	export class Radiobox extends Control<Radiobox> implements IButton {
		static CLASS: string = "tui-radiobox";

		constructor(el?: HTMLElement) {
			super("a", Radiobox.CLASS, el);

			this.disabled(this.disabled());
			this.selectable(false);
			this.exposeEvents("mouseup mousedown mousemove mouseenter mouseleave keyup keydown");

			$(this[0]).on("mousedown", (e) => {
				if (this.disabled())
					return;
				this[0].focus();
				this.actived(true);
				var self = this;
				function releaseMouse(e) {
					self.actived(false);
					if (tui.isFireInside(self[0], e)) {
						self.checked(true);
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
					this.checked(true);
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
					this.checked(true);
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
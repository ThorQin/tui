/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	export class Paginator extends Control<Paginator> {
		static CLASS: string = "tui-paginator";

		constructor(el?: HTMLElement) {
			super("div", Paginator.CLASS, el);

			if (!this.hasAttr("data-max-buttons"))
				this.maxButtons(3);
			if (!this.hasAttr("data-value"))
				this.value(1);
			if (!this.hasAttr("data-page-size"))
				this.pageSize(10);
			if (!this.hasAttr("data-total-size"))
				this.totalSize(0);

			this.refresh();
		}

		value(): number;
		value(val: number): Paginator;
		value(val?: number): any {
			if (typeof val !== tui.undef) {
				if (typeof val === "number") {
					if (val > this.totalPages())
						val = this.totalPages();
					if (val < 1)
						val = 1;
					this.attr("data-value", val);
				}
				return this;
			} else
				return Math.round(parseInt(this.attr("data-value")));
		}

		totalPages(): number {
			var total = Math.ceil(this.totalSize() / this.pageSize());
			if (total < 1)
				total = 1;
			return total;
		}

		pageSize(): number;
		pageSize(val: number): Paginator;
		pageSize(val?: number): any {
			if (typeof val !== tui.undef) {
				if (typeof val === "number") {
					if (val <= 0)
						val = 1;
					this.attr("data-page-size", val);
				}
				return this;
			} else
				return Math.round(parseInt(this.attr("data-page-size")));
		}

		totalSize(): number;
		totalSize(val: number): Paginator;
		totalSize(val?: number): any {
			if (typeof val !== tui.undef) {
				if (typeof val === "number") {
					this.attr("data-total-size", val);
				}
				return this;
			} else
				return Math.round(parseInt(this.attr("data-total-size")));
		}

		submitForm(): string;
		submitForm(formId: string): Paginator;
		submitForm(formId?: string): any {
			if (typeof formId === "string") {
				this.attr("data-submit-form", formId);
				return this;
			} else
				return this.attr("data-submit-form");
		}

		maxButtons(): number;
		maxButtons(val: number): Paginator;
		maxButtons(val?: number): any {
			if (typeof val !== tui.undef) {
				if (typeof val === "number") {
					if (val <= 0)
						val = 1;
					this.attr("data-max-buttons", val);
				}
				return this;
			} else
				return Math.round(parseInt(this.attr("data-max-buttons")));
		}

		private changeValue(val: number) {
			this.value(val);
			this.refresh();
			if (this.fire("change", { ctrl: this[0], value: this.value() }) === false)
				return;
			var formId = this.submitForm();
			if (formId) {
				var form = tui.ctrl.form(formId);
				form && form.submit();
			}
		}

		refresh() {
			if (!this[0])
				return;
			var self = this;
			this[0].innerHTML = "";
			// Add Previous Button
			var previous = button();
			previous.text(str("Previous"));
			this[0].appendChild(previous[0]);
			if (this.value() === 1) {
				previous.disabled(true);
			} else {
				previous.on("click", function () {
					self.changeValue(self.value() - 1);
				});
			}
			var maxButtons = this.maxButtons();
			var totalPages = this.totalPages();

			var fromIndex = this.value() - Math.floor(maxButtons / 2) + (maxButtons % 2 === 0 ? 1 : 0);
			if (fromIndex <= 1) {
				fromIndex = 1;
			}
			var toIndex = (fromIndex === 1 ? fromIndex + maxButtons : fromIndex + maxButtons - 1);
			if (toIndex >= totalPages) {
				toIndex = totalPages;
				fromIndex = toIndex - maxButtons;
				if (fromIndex < 1) {
					fromIndex = 1;
				}
			}

			if (fromIndex > 1) {
				var btn = button();
				btn.html(1 + (fromIndex > 2 ? " <i class='fa fa-ellipsis-h'></i>" : ""));
				this[0].appendChild(btn[0]);
				btn.on("click", function () {
					self.changeValue(1);
				});
			}
			for (var i = fromIndex; i <= toIndex; i++) {
				var btn = button();
				btn.text(i + "");
				btn.on("click", function () {
					self.changeValue(parseInt(this.text()));
				});
				this[0].appendChild(btn[0]);
				if (i === this.value())
					btn.addClass("tui-primary");
			}
			if (toIndex < totalPages) {
				var btn = button();
				btn.html((toIndex < totalPages - 1 ? "<i class='fa fa-ellipsis-h'></i> " : "") + totalPages);
				this[0].appendChild(btn[0]);
				btn.on("click", function () {
					self.changeValue(totalPages);
				});
			}

			// Add Next Button
			var next = button();
			next.text(str("Next"));
			this[0].appendChild(next[0]);
			if (this.value() === this.totalPages()) {
				next.disabled(true);
			} else {
				next.on("click", function () {
					self.changeValue(self.value() + 1);
				});
			}
		}
	}


	export function paginator(elem: HTMLElement): Paginator;
	export function paginator(elemId: string): Paginator;
	export function paginator(): Paginator;
	export function paginator(param?: any): Paginator {
		return tui.ctrl.control(param, Paginator);
	}
	tui.ctrl.registerInitCallback(Paginator.CLASS, paginator);
}
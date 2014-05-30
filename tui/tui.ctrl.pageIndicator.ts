/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	export class PageIndicator extends Control<PageIndicator> {
		static CLASS: string = "tui-form";


		constructor(el?: HTMLElement) {
			super("div", Form.CLASS, el);

			this.refresh();
		}

		value(): number;
		value(val: number): PageIndicator;
		value(val?: number): any {
			if (typeof val !== tui.undef) {
				if (typeof val === "number") {
					this.attr("data-value", val);
				}
				return this;
			} else
				return Math.round(parseInt(this.attr("data-value")));
		}

		totalPages(): number {
			return Math.ceil(this.totalSize() / this.pageSize());
		}

		pageSize(): number;
		pageSize(val: number): PageIndicator;
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
		totalSize(val: number): PageIndicator;
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
		submitForm(formId: string): Button;
		submitForm(formId?: string): any {
			if (typeof formId === "string") {
				this.attr("data-submit-form", formId);
				return this;
			} else
				return this.attr("data-submit-form");
		}

		refresh() {
			if (!this[0])
				return;
		}
	}


	export function pageIndicator(elem: HTMLElement): PageIndicator;
	export function pageIndicator(elemId: string): PageIndicator;
	export function pageIndicator(): PageIndicator;
	export function pageIndicator(param?: any): PageIndicator {
		return tui.ctrl.control(param, PageIndicator);
	}
	tui.ctrl.registerInitCallback(PageIndicator.CLASS, pageIndicator);
}
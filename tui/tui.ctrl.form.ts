/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	export class Form extends Control<Form> {
		static CLASS: string = "tui-form";
		constructor(el?: HTMLElement) {
			super();
			if (el)
				this.elem(el);
			else
				this.elem("span", Form.CLASS);
			this[0]._ctrl = this;
		}

		action(): string;
		action(url?: string): Input;
		action(url?: string): any {
			if (typeof url === "string") {
				this.attr("data-action", url);
				return this;
			} else
				return this.attr("data-action");
		}

		method(): string;
		method(val?: string): Input;
		method(val?: string): any {
			if (typeof val === "string") {
				this.attr("data-method", val);
				return this;
			} else
				return this.attr("data-method");
		}

		/**
		 * Set target to a control which has the 'data' method,
		 * if target is a grid or a list then set result to it directly,
		 * if target is a form then the form will dispatch data to each form field controls.
		 * if you want manually process result data, you can set target to null, 
		 * and listen to 'complete' event to do what you want.
		 */
		target(): string;
		target(val?: string): Input;
		target(val?: string): any {
			if (typeof val === "string") {
				this.attr("data-target", val);
				return this;
			} else
				return this.attr("data-target");
		}

		// Combine value to parent form
		value(): any;
		// Dispatch parent form's value to child form field controls.
		value(val: any): Form;
		value(val?: any): any {
			return this.data(val);
		}

		// Extract data from form field controls
		data(): any;
		// Dispatch data to form field controls
		data(val: any): Form;
		data(val?: any): any {

		}

		submit() {

		}
	}




	export function form(elem: HTMLElement): Form;
	export function form(elemId: string): Form;
	export function form(): Form;
	export function form(param?: any): Form {
		return tui.ctrl.control(param, Form);
	}
	tui.ctrl.registerInitCallback(Form.CLASS, form);
}
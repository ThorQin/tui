﻿/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	export class Form extends Control<Form> {
		static CLASS: string = "tui-form";
		static METHODS: string[] = ["GET", "POST", "PUT", "DELETE"];
		static STATUS: string[] = [
			"success", "notmodified", "error", "timeout", "abort", "parsererror"
		];
		constructor(el?: HTMLElement) {
			super("span", Form.CLASS, el);

			if (!this.hasAttr("data-method")) {
				this.method("POST");
			}
			if (!this.hasAttr("data-timeout")) {
				this.timeout(60000);
			}
			if (!this.hasAttr("data-target-property")) {
				this.targetProperty("value");
			}
			if (!this.hasAttr("data-show-error")) {
				this.isShowError(true);
			}

			var self = this;
			if (this.isAutoSubmit()) {
				tui.on("initialized", () => {
					self.submit();
				});
			}
		}

		isAutoSubmit(): boolean;
		isAutoSubmit(val: boolean): Form;
		isAutoSubmit(val?: boolean): any {
			if (typeof val !== tui.undef) {
				this.is("data-auto-submit", !!val);
				return this;
			} else
				return this.is("data-auto-submit");
		}

		isShowError(): boolean;
		isShowError(val: boolean): Form;
		isShowError(val?: boolean): any {
			if (typeof val !== tui.undef) {
				this.is("data-show-error", !!val);
				return this;
			} else
				return this.is("data-show-error");
		}

		action(): string;
		action(url?: string): Form;
		action(url?: string): any {
			if (typeof url === "string") {
				this.attr("data-action", url);
				return this;
			} else
				return this.attr("data-action");
		}

		method(): string;
		method(val?: string): Form;
		method(val?: string): any {
			if (typeof val === "string" && Form.METHODS.indexOf(val.toUpperCase()) >= 0) {
				this.attr("data-method", val.toUpperCase());
				return this;
			} else
				return this.attr("data-method").toUpperCase();
		}

		/**
		 * In milliseconds
		 */
		timeout(): number;
		timeout(val?: number): Form;
		timeout(val?: number): any {
			if (typeof val === "number") {
				this.attr("data-timeout", Math.round(val) + "");
				return this;
			} else
				return parseInt(this.attr("data-timeout"), 10);
		}

		/**
		 * Set target to a control which has the 'data' method,
		 * if target is a grid or a list then set result to it directly,
		 * if target is a form then the form will dispatch data to each form field controls.
		 * if you want manually process result data, you can set target to null, 
		 * and listen to 'complete' event to do what you want.
		 */
		target(): string;
		target(val?: string): Form;
		target(val?: string): any {
			if (typeof val === "string") {
				this.attr("data-target", val);
				return this;
			} else
				return this.attr("data-target");
		}

		targetProperty(): string;
		targetProperty(val?: string): Form;
		targetProperty(val?: string): any {
			if (typeof val === "string") {
				this.attr("data-target-property", val);
				return this;
			} else
				return this.attr("data-target-property");
		}

		validate(): boolean {
			var id = this.id();
			if (!id) {
				return false;
			}
			var valid = true;
			$("[data-ajax-form='" + id + "']").each(function (index, elem) {
				if (typeof this._ctrl.validate === "function")
					if (!this._ctrl.validate())
						valid = false;
			});
			return valid;
		}

		// Extract data from form field controls
		value(): any;
		// Dispatch data to form field controls
		value(val: any): Form;
		value(val?: any): any {
			if (typeof val !== tui.undef) {
				// Dispatch data to other controls
				var id = this.id();
				if (!id)
					return this;
				$("[data-ajax-form='" + id + "']").each(function (index, elem) {
					var field;
					if (this._ctrl) {
						field = this._ctrl.ajaxField();
						if (!field) {
							return;
						} else if (field === "*") {
							if (typeof this._ctrl.value === "function")
								this._ctrl.value(val);
						} else {
							if (typeof this._ctrl.value === "function" &&
								typeof val[field] !== tui.undef) {
								this._ctrl.value(val[field]);
							}
						}
					} else {
						field = $(elem).attr("data-ajax-field");
						if (!field) {
							return;
						} else if (field === "*") {
							$(elem).attr("data-value", JSON.stringify(val));
						} else {
							if (typeof val[field] !== tui.undef) {
								$(elem).attr("data-value", JSON.stringify(val[field]));
							}
						}
					}
				});
				return this;
			} else {
				var result: any = {};
				// Collect all fields from other controls
				var id = this.id();
				if (!id) {
					return null;
				}
				$("[data-ajax-form='" + id + "']").each(function (index, elem) {
					var field ;
					var val;
					if (this._ctrl) {
						field = this._ctrl.ajaxField();
						if (!field)
							return;
						if (this._ctrl.value)
							val = this._ctrl.value();
						else
							return;
					} else {
						field = $(elem).attr("data-ajax-field");
						if (typeof field !== "string")
							return;
						val = $(elem).attr("data-value");
						if (typeof val !== "string")
							return;
						try {
							val = JSON.parse(val);
						} catch (e) {
						}
					}
					if (field === "*")
						result = val;
					else if (result)
						result[field] = val;
				});
				return result;
			}
		}



		submit() {
			if (!this.validate())
				return;
			var action = this.action();
			if (!action)
				return;
			var id = this.id();
			if (!id)
				return;
			var data = this.value();
			if (this.fire("submit", { id: this.id(), data: data }) === false)
				return;
			var self = this;
			$.ajax({
				"type": this.method(),
				"timeout": this.timeout(),
				"url": action,
				"contentType": "application/json",
				"data": (this.method() === "GET" ? data : JSON.stringify(data)),
				"complete": function (jqXHR: JQueryXHR, status) {
					if (status === "success") {
						if (self.fire("success", { jqXHR: jqXHR, status: status }) === false) {
							return;
						}
					} else {
						if (self.fire("error", { jqXHR: jqXHR, status: status }) === false) {
							return;
						}
					}
					if (self.fire("complete", { jqXHR: jqXHR, status: status }) === false) {
						return;
					}
					if (status === "success") {
						var target: any = self.target();
						var property: string = self.targetProperty();
						if (target) {
							target = document.getElementById(target);
							if (target && target["_ctrl"]) {
								var ctrl = target["_ctrl"];
								if (typeof ctrl[property] === "function") {
									ctrl[property](jqXHR["responseJSON"]);
								}
							} else if (target) {
								if (typeof target[property] === "function") {
									target[property](jqXHR.responseText);
								} else {
									target[property] = jqXHR.responseText;
								}
							}
						}
					} else {
						if (self.isShowError())
							tui.errbox(tui.str(status) + " (" + jqXHR.status + ")", tui.str("Failed"));
					}
				},
				"processData": (this.method() === "GET" ? true : false)
			});
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
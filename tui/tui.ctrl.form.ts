/// <reference path="tui.ctrl.formagent.ts" />
module tui.ctrl {
	export class Form extends Control<Form> {
		static CLASS: string = "tui-form";
		static METHODS: string[] = ["GET", "POST", "PUT", "DELETE"];
		static STATUS: string[] = [
			"success", "notmodified", "error", "timeout", "abort", "parsererror"
		];
		private static ignoreErrors: number[] = null;
		private static defaultErrorProc: (data:{ jqXHR: any; status: string; }) => {} = null;

		private _immediateValue: any;

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

			if (this.id() === null)
				this.id(tui.uuid());

			// Initialize child SPAN to FormAgent control
			for (var i = 0; i < this[0].childNodes.length; i++) {
				if ((<string>this[0].childNodes[i].nodeName).toLowerCase() === "span") {
					var agent = tui.ctrl.formAgent(this[0].childNodes[i]);
					agent.form(this.id());
				}
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

		waiting(): string;
		waiting(msg?: string): Form;
		waiting(msg?: string): any {
			if (typeof msg === "string") {
				this.attr("data-waiting", msg);
				return this;
			} else
				return this.attr("data-waiting");
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

		targetRedirect(): string;
		targetRedirect(val?: string): Form;
		targetRedirect(val?: string): any {
			if (typeof val === "string") {
				this.attr("data-target-redirect", val);
				return this;
			} else
				return this.attr("data-target-redirect");
		}

		submitForm(): string;
		submitForm(val?: string): Form;
		submitForm(val?: string): any {
			if (typeof val === "string") {
				this.attr("data-submit-form", val);
				return this;
			} else
				return this.attr("data-submit-form");
		}

		validate(): boolean {
			var id = this.id();
			if (!id) {
				return true;
			}
			var valid = true;
			$("[data-form='" + id + "']").each(function (index, elem) {
				if (typeof this._ctrl.validate === "function")
					if (!this._ctrl.validate())
						valid = false;
			});
			return valid;
		}

		immediateValue(): any;
		immediateValue(val: any): Form;
		immediateValue(val?: any): any {
			if (typeof val !== tui.undef) {
				this._immediateValue = val;
				return this;
			} else
				return this._immediateValue;
		}

		// Extract data from form field controls
		value(): any;
		// Dispatch data to form field controls
		value(val: any): Form;
		value(val?: any): any {
			if (typeof val !== tui.undef) {
				// Dispatch data to other controls
				var id = this.id();
				id && $("[data-form='" + id + "']").each(function (index, elem) {
					var field;
					if (this._ctrl) {
						field = this._ctrl.field();
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
						field = $(elem).attr("data-field");
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
				id && $("[data-form='" + id + "']").each(function (index, elem) {
					var field ;
					var val;
					if (this._ctrl) {
						field = this._ctrl.field();
						if (!field)
							return;
						if (this._ctrl.value)
							val = this._ctrl.value();
						else
							return;
					} else {
						field = $(elem).attr("data-field");
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

		clear() {
			this._immediateValue = tui.undefVal;
			var id = this.id();
			id && $("[data-form='" + id + "']").each(function (index, elem: any) {
				if (elem._ctrl) {
					if (typeof elem._ctrl.value === "function")
						elem._ctrl.value(null);
				} else {
					$(elem).attr("data-value", "");
					$(elem).removeAttr("data-value");
				}
			});
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
			var data = this.immediateValue();
			if (typeof data === tui.undef)
				data = this.value();
			if (this.fire("submit", { id: this.id(), data: data }) === false)
				return;
			var self = this;
			var waitDlg: Dialog = null;
			if (this.waiting()) {
				waitDlg = tui.waitbox(str(this.waiting()));
			}
			$.ajax({
				"type": this.method(),
				"timeout": this.timeout(),
				"url": action,
				"contentType": "application/json",
				"data": (this.method() === "GET" ? data : JSON.stringify(data)),
				"complete": function (jqXHR: JQueryXHR, status) {
					waitDlg && waitDlg.close();
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
						var targetRedirect: string = self.targetRedirect();
						if (targetRedirect) {
							window.location.assign(targetRedirect);
							return;
						}
						var target: any = self.target();
						var property: string = self.targetProperty();
						if (target) {
							var respJson = /^\s*application\/json\s*(;.+)?/i.test(jqXHR.getResponseHeader("content-type"));
							var respVal = (respJson ? jqXHR["responseJSON"] : jqXHR.responseText);
							target = document.getElementById(target);
							if (target && target["_ctrl"]) {
								var ctrl = target["_ctrl"];
								if (typeof ctrl[property] === "function") {
									ctrl[property](respVal);
								}
							} else if (target) {
								if (typeof target[property] === "function") {
									target[property](respVal);
								} else {
									target[property] = respVal;
								}
							}
						}
						var targetSubmitForm: string = self.submitForm();
						if (targetSubmitForm) {
							var form = tui.ctrl.form(targetSubmitForm);
							form && form.submit();
						}
					} else {
						if (typeof Form.defaultErrorProc === "function") {
							if (Form.defaultErrorProc({ jqXHR: jqXHR, status: status }) === false)
								return;
						}
						if (self.isShowError() && !(Form.ignoreErrors && Form.ignoreErrors.indexOf(jqXHR.status) >= 0)) {
							tui.errbox(tui.str(status) + " (" + jqXHR.status + ")", tui.str("Failed"));
						}
					}
				},
				"processData": (this.method() === "GET" ? true : false)
			});
		}

		static ignoreError(errorCodeList: number[]) {
			Form.ignoreErrors = errorCodeList;
		}
		
		static defaultError(proc: (data:{ jqXHR: any; status: string; }) => {}) {
			Form.defaultErrorProc = proc;
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
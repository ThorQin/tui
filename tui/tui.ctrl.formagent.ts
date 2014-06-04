﻿/// <reference path="tui.ctrl.form.ts" />
module tui.ctrl {
	export class FormAgent extends Control<FormAgent> {
		static CLASS: string = "tui-form-agent";
		constructor(el?: HTMLElement) {
			super("span", FormAgent.CLASS, el);

			var parent = this[0].parentElement;
			while (parent) {
				if ($(parent).hasClass("tui-form")) {
					this.ajaxForm($(parent).attr("id"));
					break;
				}
			}
		}

		validate(): boolean {
			var param = { valid: true };
			if (this.fire("validate", param) === false)
				return param.valid;
			var target = this.target();
			var isGroup = this.isGroup();
			if (!target)
				return true;
			if (isGroup) {
				var validator = this.groupValidator();
				if (!validator)
					return true;
				var controls = $("." + Radiobox.CLASS + "[data-group='" + target + "'],." + Checkbox.CLASS + "[data-group='" + target + "']");
				var values: string[] = [];
				controls.each(function (index, elem) {
					if (tui.parseBoolean($(elem).attr("data-checked")))
						values.push($(elem).attr("data-value"));
				});
				var valid = true;
				for (var k in validator) {
					if (k && validator.hasOwnProperty(k)) {
						if (k.substr(0, 5) === "*max:") {
							var imax = parseFloat(k.substr(5));
							if (isNaN(imax))
								throw new Error("Invalid validator: '*max:...' must follow a number");
							var ival = values.length;
							if (ival > imax) {
								valid = false;
							}
						} else if (k.substr(0, 5) === "*min:") {
							var imin = parseFloat(k.substr(5));
							if (isNaN(imin))
								throw new Error("Invalid validator: '*min:...' must follow a number");
							var ival = values.length;
							if (ival < imin) {
								valid = false;
							}
						} else {
							valid = values.indexOf(k) >= 0;
						}
						if (!valid) {
							controls.each(function (index, elem) {
								var ctrl = elem["_ctrl"];
								if (ctrl && typeof ctrl.notify === "function")
									ctrl.notify(validator[k]);
							});
							break;
						}
					}
				}
				return valid;
			} else {
				var elem = document.getElementById(target);
				if (elem && elem["_ctrl"]) {
					var ctrl = elem["_ctrl"];
					if (typeof ctrl.validate === "function") {
						return ctrl.validate();
					}
				}
				return true;
			}
		}

		target(): string;
		target(val?: string): FormAgent;
		target(val?: string): any {
			if (typeof val !== tui.undef) {
				this.attr("data-target", val);
				return this;
			} else
				return this.attr("data-target");
		}

		targetProperty(): string;
		targetProperty(val?: string): FormAgent;
		targetProperty(val?: string): any {
			if (typeof val !== tui.undef) {
				this.attr("data-target-property", val);
				return this;
			} else
				return this.attr("data-target-property");
		}

		/**
		 * Difference with input's validator, this field only affect to checkbox(radiobox) group,
		 * rules contained: which item(s) should be checked, min items, max items.
		 * Only support these predefined rules: *min, *max.
		 */ 
		groupValidator(): string[];
		groupValidator(val?: string[]): FormAgent;
		groupValidator(val?: string[]): any {
			if (typeof val === "object" && val) {
				this.attr("data-group-validator", JSON.stringify(val));
				return this;
			} else if (val === null) {
				this.removeAttr("data-group-validator");
				return this;
			} else {
				var strval = this.attr("data-group-validator");
				if (strval === null) {
					return null;
				} else {
					try {
						val = eval("(" + strval + ")");
						if (typeof val !== "object")
							return null;
						else
							return val;
					} catch (err) {
						return null;
					}
				}
			}
		}

		isGroup(): boolean;
		isGroup(val: boolean): FormAgent;
		isGroup(val?: boolean): any {
			if (typeof val !== tui.undef) {
				this.is("data-is-group", !!val);
				return this;
			} else
				return this.is("data-is-group");
		}

		// Extract data from target control(s)
		value(): any;
		// Dispatch data to target control(s)
		value(val: any): Form;
		value(val?: any): any {
			var target = this.target();
			var isGroup = this.isGroup();
			if (typeof val !== tui.undef) {
				var param = { value: val };
				if (this.fire("setvalue", param) === false)
					return this;
				if (!target)
					return this;
				if (isGroup) {
					var controls = $("." + Radiobox.CLASS + "[data-group='" + target + "'],." + Checkbox.CLASS + "[data-group='" + target + "']");
					var values: string[];
					if (val && typeof val.length === "number")
						values = val;
					else
						values = [val];

					controls.each(function (index, elem) {
						var ctrl = elem["_ctrl"];
						if (values.indexOf(ctrl.value()) >= 0) {
							ctrl.checked(true);
						} else
							ctrl.checked(false);
					});
				} else {
					var elem = document.getElementById(target);
					if (elem && elem["_ctrl"]) {
						var ctrl = elem["_ctrl"];
						if (typeof ctrl.value === "function") {
							ctrl.value(val);
						}
					}
				}
				return this;
			} else {
				if (!target)
					return null;
				var param = { value: null };
				if (this.fire("getvalue", param) === false)
					return param.value;
				if (isGroup) {
					var controls = $("." + Radiobox.CLASS + "[data-group='" + target + "']");
					var values: string[] = [];
					if (controls.length > 0) {
						controls.each(function (index, elem) {
							if (tui.parseBoolean($(elem).attr("data-checked")))
								values.push($(elem).attr("data-value"));
						});
						if (values.length > 0)
							return values[0];
						else
							return null;
					} else {
						controls = $("." + Checkbox.CLASS + "[data-group='" + target + "']");
						controls.each(function (index, elem) {
							if (tui.parseBoolean($(elem).attr("data-checked")))
								values.push($(elem).attr("data-value"));
						});
						return values;
					}
				} else {
					var elem = document.getElementById(target);
					if (elem && elem["_ctrl"]) {
						var ctrl = elem["_ctrl"];
						if (typeof ctrl.value === "function") {
							return ctrl.value();
						}
					}
					return null;
				}
			}
		}
	}

	export function formAgent(elem: HTMLElement): FormAgent;
	export function formAgent(elemId: string): FormAgent;
	export function formAgent(): FormAgent;
	export function formAgent(param?: any): FormAgent {
		return tui.ctrl.control(param, FormAgent);
	}
	tui.ctrl.registerInitCallback(FormAgent.CLASS, formAgent);
}
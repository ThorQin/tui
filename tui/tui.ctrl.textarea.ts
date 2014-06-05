/// <reference path="tui.ctrl.input.ts" /> 
module tui.ctrl {
	export class TextArea extends Control<TextArea> {
		static CLASS: string = "tui-textarea";

		private _textbox: HTMLTextAreaElement;
		private _label: HTMLLabelElement;
		private _notify: HTMLDivElement;
		private _invalid: boolean = false;
		private _message: string = "";

		constructor(el?: HTMLElement) {
			super("div", TextArea.CLASS, el);
			var self = this;

			this._label = document.createElement("label");
			this._notify = document.createElement("div");
			this[0].innerHTML = "";
			this[0].appendChild(this._label);
			this[0].appendChild(this._notify);
			this.createTextbox();

			$(this._label).on("mousedown", () => {
				if (!this.disabled())
					setTimeout(() => { this._textbox.focus(); }, 0);
			});
			this.value(this.value());
			//this.refresh();
		}

		private createTextbox() {
			var self = this;
			if (this._textbox) {
				this[0].removeChild(this._textbox);
			}
			this._textbox = document.createElement("textarea");
			
			// Should put textbox before notify
			this[0].insertBefore(this._textbox, this._notify);
			// Bind events ...
			$(this._textbox).on("focus", () => {
				$(this[0]).addClass("tui-focus");
			});
			$(this._textbox).on("blur", () => {
				$(this[0]).removeClass("tui-focus");
			});
			$(this._textbox).on("propertychange", (e: any) => {
				if (e.originalEvent.propertyName !== 'value')
					return;
				setTimeout(() => {
					if (this.text() !== this._textbox.value) {
						this.text(this._textbox.value);
						self.fire("change", { "ctrl": this[0], "event": e, "text": this.text() });
						this.refresh();
					}
				}, 0);
			});
			$(this._textbox).on("change", (e: any) => {
				if (this.text() !== this._textbox.value) {
					this.text(this._textbox.value);
					this.fire("change", { "ctrl": this[0], "event": e, "text": this.text() });
					this.refresh();
				}
			});
			$(this._textbox).on("input", (e: any) => {
				setTimeout(() => {
					if (this.text() !== this._textbox.value) {
						this.text(this._textbox.value);
						self.fire("change", { "ctrl": self[0], "event": e, "text": self.text() });
						this.refresh();
					}
				}, 0);
			});
		}

		validator(): {};
		validator(val?: {}): TextArea;
		validator(val?: {}): any {
			if (typeof val === "object" && val) {
				this.attr("data-validator", JSON.stringify(val));
				this._invalid = false;
				this.refresh();
				return this;
			} else if (val === null) {
				this.removeAttr("data-validator");
				this._invalid = false;
				this.refresh();
				return this;
			} else {
				val = this.attr("data-validator");
				if (val === null) {
					return null;
				} else {
					try {
						val = eval("(" + <string>val + ")");
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

		validate(txt?: string): boolean {
			var finalText = typeof txt === "string" ? txt : this.text();
			if (finalText === null)
				finalText = "";
			this._invalid = false;
			var validator = this.validator();
			if (validator) {
				for (var k in validator) {
					if (k && validator.hasOwnProperty(k)) {
						if (k === "*password") {
							if (!/[a-z]/.test(finalText) ||
								!/[A-Z]/.test(finalText) ||
								!/[0-9]/.test(finalText) ||
								!/[\~\`\!\@\#\$\%\^\&\*\(\)\_\-\+\=\\\]\[\{\}\:\;\"\'\/\?\,\.\<\>\|]/.test(finalText) ||
								finalText.length < 6) {
								this._invalid = true;
							}
						} else if (k.substr(0, 5) === "*max:") {
							var imax = parseFloat(k.substr(5));
							if (isNaN(imax))
								throw new Error("Invalid validator: '*max:...' must follow a number");
							var ival = parseFloat(finalText);
							if (isNaN(ival) || ival > imax) {
								this._invalid = true;
							}
						} else if (k.substr(0, 4) === "*min:") {
							var imin = parseFloat(k.substr(5));
							if (isNaN(imin))
								throw new Error("Invalid validator: '*min:...' must follow a number");
							var ival = parseFloat(finalText);
							if (isNaN(ival) || ival < imin) {
								this._invalid = true;
							}
						} else {
							var regexp;
							if (k.substr(0, 1) === "*") {
								var v = Input.VALIDATORS[k];
								if (v)
									regexp = new RegExp(v);
								else
									throw new Error("Invalid validator: " + k + " is not a valid validator");
							} else {
								regexp = new RegExp(k);
							}
							this._invalid = !regexp.test(finalText);
						}
						if (this._invalid) {
							this._message = validator[k];
							break;
						}
					}
				}
			}
			if (this._invalid && !this._message) {
				this._message = tui.str("Invalid input.");
			}
			this.refresh();
			return !this._invalid;
		}

		text(): string;
		text(txt?: string): TextArea;
		text(txt?: string): any {
			if (typeof txt !== tui.undef) {
				this.attr("data-text", txt);
				this.attr("data-value", txt);
				this._invalid = false;
				this.refresh();
				return this;
			} else
				return this.attr("data-text");
		}

		readonly(): boolean;
		readonly(val: boolean): Input;
		readonly(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-readonly", val);
				this.refresh();
				return this;
			} else
				return this.is("data-readonly");
		}

		value(): any;
		value(val?: any): TextArea;
		value(val?: any): any {
			if (typeof val !== tui.undef) {
				this.attr("data-text", val);
				this.attr("data-value", val);
				this._invalid = false;
				this.refresh();
				return this;
			} else {
				val = this.attr("data-value");
				return val;
			}
		}

		autoResize(): boolean;
		autoResize(val?: boolean): TextArea;
		autoResize(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-auto-resize", val);
				this.refresh();
				return this;
			} else
				return this.is("data-auto-resize");
		}

		placeholder(): string;
		placeholder(txt?: string): TextArea;
		placeholder(txt?: string): any {
			if (typeof txt === "string") {
				this.attr("data-placeholder", txt);
				this.refresh();
				return this;
			} else
				return this.attr("data-placeholder");
		}
		refresh() {
			var placeholder = this.placeholder();
			if (placeholder === null)
				placeholder = "";
			var text = this.text();
			if (text === null)
				text = "";
			var withBtn = false;
			
			if (this._textbox.value !== text)
				this._textbox.value = text;
			if (this.readonly())
				this._textbox.readOnly = true;
			else
				this._textbox.readOnly = false;
			this._textbox.style.display = "";
			this._label.style.display = "none";
			this._textbox.style.width = "";
			this._textbox.style.width = ($(this[0]).innerWidth() - ($(this._textbox).outerWidth() - $(this._textbox).width())) + "px";

			//this._textbox.scrollHeight

			this._textbox.style.height = "";
			var maxHeight = parseInt($(this[0]).css("max-height"), 10);
			if (this._textbox.scrollHeight < maxHeight || isNaN(maxHeight)) {
				this._textbox.style.overflow = "hidden";
				$(this[0]).css("height", this._textbox.scrollHeight + "px");
			} else {
				this._textbox.style.overflow = "auto";
				$(this[0]).css("height", maxHeight + "px");
			}

			this._textbox.style.height = ($(this[0]).innerHeight() - ($(this._textbox).outerHeight() - $(this._textbox).height())) + "px"
			//this._textbox.style.lineHeight = this._textbox.style.height;

			this._label.style.width = this._textbox.style.width;
			
			if (placeholder && !text) {
				this._label.innerHTML = placeholder;
				this._label.style.display = "";
				$(this._label).addClass("tui-placeholder");
				this._label.style.lineHeight = $(this._label).height() + "px";
			} else {
				$(this._label).removeClass("tui-placeholder");
			}
			if (this._invalid) {
				$(this._notify).attr("data-tooltip", this._message);
				$(this._notify).css({
					"display": "",
					"right": "0px"
				});
				$(this._notify).css({
					"line-height": this._notify.offsetHeight + "px"
				});
			} else {
				$(this._notify).css("display", "none");
			}
		}
	}
	export function textarea(elem: HTMLElement): TextArea;
	export function textarea(elemId: string): TextArea;
	export function textarea(): TextArea;
	/**
	 * Construct a button.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function textarea(param?: any): TextArea {
		return tui.ctrl.control(param, TextArea);
	}

	tui.ctrl.registerInitCallback(TextArea.CLASS, textarea);
}
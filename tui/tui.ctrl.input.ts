/// <reference path="tui.core.ts" />
/// <reference path="tui.upload.ts" />
/// <reference path="tui.ctrl.popup.ts" />
/// <reference path="tui.ctrl.calendar.ts" />
/// <reference path="tui.ctrl.list.ts" />
/// <reference path="tui.ctrl.form.ts" />
module tui.ctrl {
	function validText(t) {
		if (typeof t === tui.undef || t === null) {
			return "";
		} else {
			return t + "";
		}
	}
	function getKeys(items: any[]) {
		var keys: string[] = [];
		for (var i = 0; i < items.length; i++) {
			var key = items[i]["key"];
			if (typeof key !== tui.undef)
				keys.push(key);
		}
		return keys;
	}
	export class Input extends Control<Input> {
		static CLASS: string = "tui-input";
		static VALIDATORS = {
			"*email": "^\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*$",
			"*chinese": "^[\\u4e00-\\u9fa5]+$",
			"*url": "^http://([\\w-]+\\.)+[\\w-]+(/[\\w-./?%&=]*)?$",
			"*digital": "^\\d+$",
			"*integer": "^[+\\-]?\\d+$",
			"*float": "^[+\\-]?\\d*\\.\\d+$",
			"*currency": "^-?\\d{1,3}(,\\d{3})*\\.\\d{2,3}$",
			"*date": "^[0-9]{4}-1[0-2]|0?[1-9]-0?[1-9]|[12][0-9]|3[01]$",
			"*any": "\\S+"
		};

		private static _supportType = [
			"text", "password", "select", "multi-select",
			"calendar", "file", "custom-select", "custom-text"];
		private _textbox: HTMLInputElement;
		private _button: HTMLSpanElement;
		private _label: HTMLLabelElement;
		private _notify: HTMLDivElement;
		private _fileId: string = null;
		private _binding: UploadBinding = null;
		private _invalid: boolean = false;
		private _message: string = "";
		private _data: IDataProvider = null;
		private _keyColumKey: string;
		private _valueColumnKey: string;
		private _childrenColumKey: string;
		private _columnKeyMap: {} = null;
		// Whether has been initialized.
		private _initialized = false;

		constructor(el?: HTMLElement, type?: string) {
			super("span", Input.CLASS, el === null ? undefined: el);
			var self = this;

			this._button = document.createElement("span");
			this._label = document.createElement("label");
			this._notify = document.createElement("div");
			this[0].innerHTML = "";
			this[0].appendChild(this._label);
			this[0].appendChild(this._button);
			this[0].appendChild(this._notify);

			if (typeof type !== tui.undef)
				this.type(type);
			else
				this.type(this.type());

			//this.createTextbox();

			var openPopup = (e) => {
				if (this.type() === "calendar") {
					var pop = tui.ctrl.popup();
					var calendar = tui.ctrl.calendar();
					calendar.time(self.value());
					calendar.on("picked", (e) => {
						if (self.readonly()) {
							pop.close();
							self.focus();
							return false;
						}
						self.value(e["time"]);
						pop.close();
						self.focus();
						if (self.fire("select", { ctrl: self[0], type: self.type(), time: e["time"] }) === false)
							return;
						self.doSubmit();
					});
					var calbox = document.createElement("div");
					calbox.appendChild(calendar[0]);
					var todayLink = document.createElement("a");
					todayLink.innerHTML = "<i class='fa fa-clock-o'></i> " + tui.str("Today") + ": " + tui.formatDate(tui.today(), "yyyy-MM-dd");
					todayLink.href = "javascript:void(0)";
					$(todayLink).click(function (e) {
						if (self.readonly()) {
							pop.close();
							self.focus();
							return false;
						}
						self.value(tui.today());
						pop.close();
						self.focus();
						if (self.fire("select", { ctrl: self[0], type: self.type(), time: e["time"] }) === false)
							return;
						self.doSubmit();
					});
					var todayLine = document.createElement("div");
					todayLine.appendChild(todayLink);
					todayLine.className = "tui-input-select-bar";
					calbox.appendChild(todayLine);
					pop.show(calbox, self[0], "Rb");
					calendar.focus();
				} else if (this.type() === "select") {
					var pop = tui.ctrl.popup();
					var list = tui.ctrl.list();
					list.consumeMouseWheelEvent(true);
					list.rowcheckable(false);
					list.on("rowclick", (data) => {
						if (self.readonly()) {
							pop.close();
							self.focus();
							return false;
						}
						self.selectValue([list.activeItem()]);
						pop.close();
						self.focus();
						if (self.fire("select", { ctrl: self[0], type: self.type(), item: list.activeItem() }) === false)
							return;
						self.doSubmit();
					});
					list.on("keydown", (data) => {
						if (data["event"].keyCode === 13) { // Enter
							if (self.readonly()) {
								pop.close();
								self.focus();
								return false;
							}
							self.selectValue([list.activeItem()]);
							pop.close();
							self.focus();
							if (self.fire("select", { ctrl: self[0], type: self.type(), item: list.activeItem() }) === false)
								return;
							self.doSubmit();
						}
					});
					list[0].style.width = self[0].offsetWidth + "px";
					list.data(self._data);
					pop.show(list[0], self[0], "Rb");

					var items = self._data ? self._data.length() : 0;
					if (items < 1)
						items = 1;
					else if (items > 6)
						items = 6;

					list[0].style.height = items * list.lineHeight() + 4 + "px";
					list.refresh();
					pop.refresh();
					var val = this.selectValue();
					if (val && val.length > 0) {
						list.activeRowByKey(val[0].key);
						list.scrollTo(list.activerow());
					}
					list.focus();
				} else if (this.type() === "multi-select") {
					var pop = tui.ctrl.popup();
					var list = tui.ctrl.list();
					list.consumeMouseWheelEvent(true);

					var calbox = document.createElement("div");
					calbox.appendChild(list[0]);

					list[0].style.width = self[0].offsetWidth + "px";
					list.data(self._data);
					list.uncheckAllItems();
					var keys = getKeys(this.selectValue());
					list.checkItems(keys);
					calbox.appendChild(list[0]);
					var bar = document.createElement("div");
					bar.className = "tui-input-select-bar";
					calbox.appendChild(bar);
					var okLink = document.createElement("a");
					okLink.innerHTML = "<i class='fa fa-check'></i> " + tui.str("Accept");
					okLink.href = "javascript:void(0)";
					$(okLink).click(function (e) {
						if (self.readonly()) {
							pop.close();
							self.focus();
							return false;
						}
						self.selectValue(list.checkedItems());
						pop.close();
						self.focus();
						if (self.fire("select", { ctrl: self[0], type: self.type(), checkedItems: list.checkedItems() }) === false)
							return;
						self.doSubmit();
					});
					list.on("keydown", (data) => {
						if (data["event"].keyCode === 13) { // Enter
							if (self.readonly()) {
								pop.close();
								self.focus();
								return false;
							}
							self.selectValue(list.checkedItems());
							pop.close();
							self.focus();
							if (self.fire("select", { ctrl: self[0], type: self.type(), checkedItems: list.checkedItems() }) === false)
								return;
							self.doSubmit();
						}
					});
					bar.appendChild(okLink);

					pop.show(calbox, self[0], "Rb");

					var items = self._data ? self._data.length() : 0;
					if (items < 1)
						items = 1;
					else if (items > 6)
						items = 6;

					list[0].style.height = items * list.lineHeight() + 4 + "px";
					list.refresh();
					pop.refresh();
					list.focus();
				} else if (this.type() === "file") {
					// Don't need do anything
				} else {
					this.fire("btnclick", { "ctrl": this[0], "event": e });
				}
			};
			$(this._button).on("click", openPopup);

			$(this._label).on("mousedown", (e) => {
				if (!this.useLabelClick())
					return;
				if (!this.disabled() && (this.type() === "text" || this.type() === "password" || this.type() === "custom-text"))
					setTimeout(() => { this._textbox.focus(); }, 0);
				else if (this.type() === "select" || this.type() === "multi-select" || this.type() === "calendar") {
					openPopup(e);
				} else if (this.type() === "file") {

				}
			});

			$(this[0]).on("keydown", (e) => {
				if (e.keyCode !== 32)
					return;
				if (this.type() === "select" || this.type() === "multi-select" || this.type() === "calendar") {
					e.preventDefault();
					e.stopPropagation();
				}
			});
			$(this[0]).on("keyup", (e) => {
				if (e.keyCode !== 32)
					return;
				if (this.type() === "select" || this.type() === "multi-select" || this.type() === "calendar") {
					openPopup(e);
					e.preventDefault();
					e.stopPropagation();
				}
			});

			if (this.type() === "select" || this.type() === "multi-select") {
				var predefined: any = this.attr("data-data");
				if (predefined)
					predefined = eval("(" + predefined + ")");
				if (predefined)
					this.data(predefined);
			}
			if (!this.hasAttr("data-label-click"))
				this.useLabelClick(true);
			this.value(this.value());
			//this.refresh();
		}

		private doSubmit() {
			var formId = this.submitForm();
			if (formId) {
				var form = tui.ctrl.form(formId);
				form && form.submit();
			}
		}

		private createTextbox() {
			var self = this;
			var type: string = this.type();
			if (this._textbox) {
				this[0].removeChild(this._textbox);
			}
			this._textbox = document.createElement("input");
			if (type === "password") {
				this._textbox.type = "password";
			} else {
				this._textbox.type = "text";
			}
			// Should put textbox before button
			this[0].insertBefore(this._textbox, this._button);
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
			$(this._textbox).keydown((e: any) => {
				if (e.keyCode === 13) {
					this.doSubmit();
				}
			});
		}

		private makeFileUpload() {
			if (this._binding)
				return;
			this._binding = tui.bindUpload(this._button, {
				action: this.uploadUrl(),
				name: 'file',
				autoSubmit: true,
				accept: this.accept(),
				responseType: "json"
			});
			this._binding.on("change", (data: {}) => {
				this.focus();
				var result = this.validate(data["file"]);
				if (!result) {
					this.value(null);
					this._invalid = true;
					this.refresh();
				}
				return result;
			});
			this._binding.on("complete", (data: {}) => {
				data["ctrl"] = this[0];
				if (this.fire("complete", data) === false)
					return;
				var response = data["response"];
				if (response) {
					response.file = data["file"];
					this.value(response);
					if (this.fire("select", { ctrl: this[0], type: this.type(), file: response }) === false)
						return;
				} else {
					tui.errbox(str("Upload failed!"), str("Error"));
				}
			});
		}

		private unmakeFileUpload() {
			if (this._binding) {
				this._binding.uninstallBind();
				this._binding = null;
			}
		}

		private formatSelectText(val: any[]): string {
			var text = "";
			for (var i = 0; i < val.length; i++) {
				if (text.length > 0)
					text += "; ";
				text += validText(val[this._valueColumnKey]);
			}
			return text;
		}

		private formatSelectTextByData(val: { key: any; value: string; }[]): string {
			var self = this;
			var map = {};
			function buildMap(children: any[]): void {
				for (var i = 0; i < children.length; i++) {
					if (!children[i])
						continue;
					var k = children[i][self._keyColumKey];
					map[k] = children[i][self._valueColumnKey];
					var myChildren = children[i][self._childrenColumKey];
					if (myChildren && myChildren.length > 0) {
						buildMap(myChildren);
					}
				}
			}
			var data:any = this._data;
			data && typeof data.src === "function" && buildMap(data.src());
			var text = "";
			for (var i = 0; i < val.length; i++) {
				if (text.length > 0)
					text += "; ";
				var t = map[val[i][self._keyColumKey]];
				if (typeof t === tui.undef)
					t = validText(val[i][self._valueColumnKey]);
				else
					t = validText(t);
				text += t;
			}
			return text;
		}

		private columnKey(key: string): any {
			var val = this._columnKeyMap[key];
			if (typeof val === "number" && val >= 0)
				return val;
			else if (typeof val === "string")
				return val;
			else
				return key;
		}

		private onlyKeyValue(value: any[]) {
			var result: any[] = [];
			for (var i = 0; i < value.length; i++) {
				if (typeof value[i][this._keyColumKey] !== tui.undef) {
					var item: { key: any; value?: any; } = { key: value[i][this._keyColumKey] };
					if (typeof value[i][this._valueColumnKey] !== tui.undef)
						item.value = value[i][this._valueColumnKey];
					result.push(item);
				}
			}
			return JSON.stringify(result);
		}

		useLabelClick(): boolean;
		useLabelClick(val: boolean): Input;
		useLabelClick(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-label-click", val);
				return this;
			} else
				return this.is("data-label-click");
		}

		fileId(): string {
			return this._fileId;
		}

		type(): string;
		type(txt?: string): Input;
		type(txt?: string): any {
			var type: string;
			if (typeof txt === "string") {
				txt = txt.toLowerCase();
				if (Input._supportType.indexOf(txt) >= 0) {
					this.attr("data-type", txt);
				} else
					this.attr("data-type", "text");
				type = this.type();
				if (type === "text" || type === "password" || type === "custom-text") {
					this.removeAttr("tabIndex");
				} else {
					this.attr("tabIndex", "0");
				}
				this.createTextbox();
				this.refresh();
				return this;
			} else {
				type = this.attr("data-type");
				if (!type)
					return "text";
				else
					type = type.toLowerCase()
				if (Input._supportType.indexOf(type) >= 0) {
					return type;
				} else
					return "text";
			}
		}

		validator(): {};
		validator(val?: {}): Input;
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
						} else if (k.substr(0, 8) === "*maxlen:") {
							var imaxLen = parseFloat(k.substr(8));
							if (isNaN(imaxLen))
								throw new Error("Invalid validator: '*maxlen:...' must follow a number");
							var ival = finalText.length;
							if (ival > imaxLen) {
								this._invalid = true;
							}
						} else if (k.substr(0, 8) === "*minlen:") {
							var iminLen = parseFloat(k.substr(8));
							if (isNaN(iminLen))
								throw new Error("Invalid validator: '*iminLen:...' must follow a number");
							var ival = finalText.length;
							if (ival < iminLen) {
								this._invalid = true;
							}
						} else if (k.substr(0,5) === "*max:") {
							var imax = parseFloat(k.substr(5));
							if (isNaN(imax))
								throw new Error("Invalid validator: '*max:...' must follow a number");
							var ival = parseFloat(finalText);
							if (isNaN(ival) || ival > imax) {
								this._invalid = true;
							}
						} else if (k.substr(0, 5) === "*min:") {
							var imin = parseFloat(k.substr(5));
							if (isNaN(imin))
								throw new Error("Invalid validator: '*min:...' must follow a number");
							var ival = parseFloat(finalText);
							if (isNaN(ival) || ival < imin) {
								this._invalid = true;
							}
						} else if (k.substr(0, 6) === "*same:") {
							var other = k.substr(6);
							other = input(other);
							if (other) {
								var otherText = other.text();
								if (otherText === null)
									otherText = "";
								if (finalText !== otherText)
									this._invalid = true;
							} else {
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

		uploadUrl(): string;
		uploadUrl(url?: string): Input;
		uploadUrl(url?: string): any {
			if (typeof url === "string") {
				this.attr("data-upload-url", url);
				this.unmakeFileUpload();
				this.refresh();
				return this;
			} else
				return this.attr("data-upload-url");
		}

		text(): string;
		text(txt?: string): Input;
		text(txt?: string): any {
			var type = this.type();
			if (typeof txt === "string") {
				if (type === "text" || type === "password" || type === "custom-text") {
					this.attr("data-text", txt);
					this.attr("data-value", txt);
					this._invalid = false;
					this.refresh();
				}
				return this;
			} else
				return this.attr("data-text");
		}

		accept(): string;
		accept(txt?: string): Input;
		accept(txt?: string): any {
			var type = this.type();
			if (typeof txt === "string") {
				this.attr("data-accept", txt);
				this.unmakeFileUpload();
				this.refresh();
				return this;
			} else
				return this.attr("data-accept");
		}

		data(): tui.IDataProvider;
		data(data: tui.IDataProvider): Input;
		data(data: any[]): Input;
		data(data: { data: any[]; head?: string[]; length?: number; }): Input;
		data(data?: any): any {
			if (data) {
				var self = this;
				if (data instanceof Array || data.data && data.data instanceof Array) {
					data = new ArrayProvider(data);
				}
				if (typeof data.length !== "function" ||
					typeof data.sort !== "function" ||
					typeof data.at !== "function" ||
					typeof data.columnKeyMap !== "function") {
					throw new Error("TUI Input: need a data provider.");
				}
				this._data = data;
				if (data)
					this._columnKeyMap = data.columnKeyMap();
				else
					this._columnKeyMap = {};
				this._keyColumKey = this.columnKey("key");
				this._valueColumnKey = this.columnKey("value");
				this._childrenColumKey = this.columnKey("children");
				return this;
			} else
				return this._data;
		}


		valueHasText(): boolean;
		valueHasText(val: boolean): Input;
		valueHasText(val?: boolean): any {
			if (typeof val === "boolean") {
				this.is("data-value-has-text", val);
				return this;
			} else
				return this.is("data-value-has-text");
		}

		private valueToSelect(val: any): any {
			if (this.valueHasText()) {
				return val;
			} else {
				if (this.type() === "select") {
					val = [val];
				}
				var newval = [];
				if (val && val.length > 0) {
					for (var i = 0; i < val.length; i++) {
						newval.push({ key: val[i] });
					}
				}
				return newval;
			}
		}

		private selectToValue(val: any): any {
			if (this.valueHasText()) {
				return val;
			} else {
				if (this.type() === "select") {
					if (val && val.length > 0)
						return val[0].key;
					else
						return null;
				} else {
					var newval = [];
					if (val && val.length > 0) {
						for (var i = 0; i < val.length; i++) {
							newval.push(val[i].key);
						}
					}
					return newval;
				}
			}
		}

		selectValue(): any;
		selectValue(val?: any): Input;
		selectValue(val?: any): any {
			var type = this.type();
			if (typeof val !== tui.undef) {
				if (type === "select" || type === "multi-select") {
					if (val && typeof val.length === "number") {
						this.attr("data-value", this.onlyKeyValue(val));
						this.attr("data-text", this.formatSelectTextByData(val));
						this._invalid = false;
					} else if (val === null) {
						this.attr("data-value", "[]");
						this.attr("data-text", "");
						this._invalid = false;
					}
					this.refresh();
				}
				return this;
			} else {
				val = this.attr("data-value");
				if (type === "select" || type === "multi-select") {
					if (val === null) {
						return [];
					}
					return eval("(" + val + ")");
				} else
					return null;
			}
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
		value(val?: any): Input;
		value(val?: any): any {
			var type = this.type();
			if (typeof val !== tui.undef) {
				if (val == null) {
					this.removeAttr("data-value");
					this.attr("data-text", "");
					this._invalid = false;
					this.refresh();
				} else if (type === "calendar") {
					if (typeof val === "string") {
						try {
							val = tui.parseDate(val);
						} catch (e) {
							val = null;
						}
					}
					if (val instanceof Date) {
						this.attr("data-value", formatDate(val, "yyyy-MM-dd"));
						this.attr("data-text", formatDate(val, tui.str("yyyy-MM-dd")));
						this._invalid = false;
					}
					this.refresh();
				} else if (type === "file") {
					if (val === null) {
						this.attr("data-value", JSON.stringify(val));
						this.attr("data-text", "");
						this._invalid = false;
						this.refresh();
					} else if (val.file && val.fileId) {
						this.attr("data-value", JSON.stringify(val));
						this.attr("data-text", val.file);
						this._invalid = false;
						this.refresh();
					}
				} else if (type === "text" || type === "password" || type === "custom-text") {
					this.attr("data-text", val);
					this.attr("data-value", val);
					this._invalid = false;
					this.refresh();
				} else if (type === "select" || type === "multi-select") {
					this.selectValue(this.valueToSelect(val));
				}
				return this;
			} else {
				val = this.attr("data-value");
				if (type === "calendar") {
					if (val === null)
						return null;
					return val;
				} else if (type === "file") {
					if (val === null)
						return null;
					return eval("(" + val + ")");
				} else if (type === "select" || type === "multi-select") {
					return this.selectToValue(this.selectValue());
				} else
					return val;
			}
		}

		textAlign(): string;
		textAlign(align?: string): Input;
		textAlign(align?: string): any {
			if (typeof align === "string") {
				if (align === "left" || align === "center" || align === "right") {
					this.attr("data-text-algin", align);
					this.refresh();
				}
				return this;
			} else {
				align = this.attr("data-text-algin");
				if (align === null)
					align = "left";
				return align;
			}
		}

		icon(): string;
		icon(txt?: string): Input;
		icon(txt?: string): any {
			if (typeof txt === "string") {
				this.attr("data-icon", txt);
				this.refresh();
				return this;
			} else
				return this.attr("data-icon");
		}

		placeholder(): string;
		placeholder(txt?: string): Input;
		placeholder(txt?: string): any {
			if (typeof txt === "string") {
				this.attr("data-placeholder", txt);
				this.refresh();
				return this;
			} else
				return this.attr("data-placeholder");
		}

		getSelectRow(): any {
			if (this.type() === "select") {
				var list = tui.ctrl.list();
				list.data(this._data);
				list.activeRowByKey(this.value());
				return list.activeItem();
			} else if (this.type() === "multi-select") {
				var list = tui.ctrl.list();
				list.data(this._data);
				list.checkItems(this.value());
				return list.checkedItems();
			} else
				return null;
		}

		getSelectRowColumn(columnKey: any) {
			if (this._data == null)
				return null;
			var row = this.getSelectRow();
			if (this.type() === "select") {
				return row[this._data.mapKey(columnKey)];
			} else if (this.type() === "multi-select") {
				var result = [];
				var k = this._data.mapKey(columnKey);
				for (var i = 0; i < row.length; i++) {
					result.push(row[i][k]);
				}
				return result;
			} else
				return null;
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

		autoRefresh(): boolean {
			return !this._initialized;
		}

		refresh() {
			if (!this[0] || this[0].offsetWidth === 0 || this[0].offsetHeight === 0)
				return;
			this._initialized = true;

			var type = this.type().toLowerCase();
			if (type === "file" && !this.readonly()) {
				this.makeFileUpload();
			} else
				this.unmakeFileUpload();
			var placeholder = this.placeholder();
			if (placeholder === null)
				placeholder = "";
			var text = this.text();
			if (text === null)
				text = "";

			// BUTTON
			var hasBtn = false;
			if (type !== "text" && type !== "password") {
				if ($(this[0]).width() < this._button.offsetWidth) {
					hasBtn = false;
				} else {
					hasBtn = true;
				}
			} else {
				hasBtn = false;
			}
			if (hasBtn) {
				this._button.style.height = "";
				this._button.style.height = ($(this[0]).innerHeight() - ($(this._button).outerHeight() - $(this._button).height())) + "px"
				this._button.style.lineHeight = this._button.style.height;
				this._button.style.display = "";
			} else {
				this._button.style.display = "none";
			}

			// BUTTON ICON
			if (this.icon()) {
				$(this._button).addClass(this.icon());
			} else
				this._button.className = "";

			var align = this.textAlign();
			// SHOW LABEL
			var hasLabel = false;
			var hasTextbox = false;
			if (type === "text" || type === "password" || type === "custom-text") {
				hasTextbox = true;
				if (!text) {
					hasLabel = true;
				} else
					hasLabel = false;
			} else {
				hasLabel = true;
				hasTextbox = false;
			}
			if (hasLabel) {
				if (placeholder && !text) {
					this._label.innerHTML = placeholder;
					$(this._label).addClass("tui-placeholder");
				} else {
					this._label.innerHTML = text;
					$(this._label).removeClass("tui-placeholder");
				}
				this._label.style.textAlign = align;
				this._label.style.display = "";
				if (hasBtn) {
					this._label.style.width = "";
					this._label.style.width = ($(this[0]).innerWidth() - ($(this._label).outerWidth() - $(this._label).width()) - $(this._button).outerWidth()) + "px";
				} else {
					this._label.style.width = "";
					this._label.style.width = ($(this[0]).innerWidth() - ($(this._label).outerWidth() - $(this._label).width())) + "px";
				}
				this._label.style.height = "";
				this._label.style.height = ($(this[0]).innerHeight() - ($(this._label).outerHeight() - $(this._label).height())) + "px";
				this._label.style.lineHeight = this._label.style.height;
			} else {
				this._label.style.display = "none";
			}

			// TEXTBOX
			if (hasTextbox) {
				if (this.readonly())
					this._textbox.readOnly = true;
				else
					this._textbox.readOnly = false;
				if (this._textbox.value !== text)
					this._textbox.value = text;
				this.removeAttr("tabIndex");
				this._textbox.style.textAlign = align;
				this._textbox.style.display = "";
				if (hasBtn) {
					this._textbox.style.width = "";
					this._textbox.style.width = ($(this[0]).innerWidth() - ($(this._textbox).outerWidth() - $(this._textbox).width()) - $(this._button).outerWidth()) + "px";
				} else {
					this._textbox.style.width = "";
					this._textbox.style.width = ($(this[0]).innerWidth() - ($(this._textbox).outerWidth() - $(this._textbox).width())) + "px";
				}
				this._textbox.style.height = "";
				this._textbox.style.height = ($(this[0]).innerHeight() - ($(this._textbox).outerHeight() - $(this._textbox).height())) + "px";
				this._textbox.style.lineHeight = this._textbox.style.height;
			} else {
				this._textbox.style.display = "none";
			}

			/// INVALID NOTIFY MESSAGE
			if (this._invalid) {
				$(this._notify).attr("data-tooltip", this._message);
				$(this._notify).css({
					"display": "",
					"right": (hasBtn ? this._button.offsetWidth : 0) + "px"
				});
				$(this._notify).css({
					"line-height": this._notify.offsetHeight + "px"
				});
			} else {
				$(this._notify).css("display", "none");
			}
		}
	}

	export function input(elem: HTMLElement): Input;
	export function input(elemId: string): Input;
	export function input(nouse: void, type: string): Input;
	export function input(): Input;
	/**
	 * Construct a button.
	 * @param el {HTMLElement or element id or construct info}
	 */
	export function input(param?: any, type?: string): Input {
		return tui.ctrl.control(param, Input, type);
	}

	tui.ctrl.registerInitCallback(Input.CLASS, input);
}
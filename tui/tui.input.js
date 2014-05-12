var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var tui;
(function (tui) {
    /// <reference path="tui.core.ts" />
    /// <reference path="tui.popup.ts" />
    /// <reference path="tui.upload.ts" />
    /// <reference path="tui.calendar.ts" />
    (function (_ctrl) {
        var Input = (function (_super) {
            __extends(Input, _super);
            function Input(el, type) {
                var _this = this;
                _super.call(this);
                this._fileId = null;
                this._binding = null;
                this._invalid = false;
                this._message = "";
                var self = this;
                if (el)
                    this.elem(el);
                else
                    this.elem("span", Input.CLASS);
                this[0]._ctrl = this;

                if (typeof type !== tui.undef)
                    this.type(type);

                this._button = document.createElement("span");
                this._label = document.createElement("label");
                this._notify = document.createElement("div");
                this[0].innerHTML = "";
                this[0].appendChild(this._label);
                this[0].appendChild(this._button);
                this[0].appendChild(this._notify);

                this.createTextbox();

                $(this[0]).on("focus", function () {
                    $(_this[0]).addClass("tui-focus");
                });
                $(this[0]).on("blur", function () {
                    $(_this[0]).removeClass("tui-focus");
                });

                $(this._button).on("click", function (e) {
                    if (_this.type() === "calendar") {
                        var pop = tui.ctrl.popup();
                        var calendar = tui.ctrl.calendar();
                        calendar.time(self.value());
                        calendar.focus();
                        calendar.on("picked", function (e) {
                            self.value(e["time"]);
                            pop.close();
                        });
                        pop.show(calendar[0], _this._button, "Rb");
                    } else if (_this.type() === "select" || _this.type() === "multi-select") {
                        // TODO: MODIFY
                    } else if (_this.type() === "file") {
                        // Don't need do anything
                    } else {
                        _this.fire("btnclick", { "ctrl": _this[0], "event": e });
                    }
                });

                $(this._label).on("mousedown", function () {
                    if (!_this.disabled() && (_this.type() === "text" || _this.type() === "password" || _this.type() === "custom-text"))
                        setTimeout(function () {
                            _this._textbox.focus();
                        }, 0);
                });
                this.refresh();
            }
            Input.prototype.createTextbox = function () {
                var _this = this;
                var self = this;
                var type = this.type();
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
                $(this._textbox).on("focus", function () {
                    $(_this[0]).addClass("tui-focus");
                });
                $(this._textbox).on("blur", function () {
                    $(_this[0]).removeClass("tui-focus");
                });
                $(this._textbox).on("propertychange", function (e) {
                    if (e.originalEvent.propertyName !== 'value')
                        return;
                    setTimeout(function () {
                        if (_this.text() !== _this._textbox.value) {
                            _this.text(_this._textbox.value);
                            self.fire("change", { "ctrl": _this[0], "event": e, "text": _this.text() });
                            _this.refresh();
                        }
                    }, 0);
                });
                $(this._textbox).on("change", function (e) {
                    if (_this.text() !== _this._textbox.value) {
                        _this.text(_this._textbox.value);
                        _this.fire("change", { "ctrl": _this[0], "event": e, "text": _this.text() });
                        _this.refresh();
                    }
                });
                $(this._textbox).on("input", function (e) {
                    setTimeout(function () {
                        if (_this.text() !== _this._textbox.value) {
                            _this.text(_this._textbox.value);
                            self.fire("change", { "ctrl": self[0], "event": e, "text": self.text() });
                            _this.refresh();
                        }
                    }, 0);
                });
            };

            Input.prototype.makeFileUpload = function () {
                var _this = this;
                if (this._binding)
                    return;
                this._binding = tui.bindUpload(this._button, {
                    action: this.uploadUrl(),
                    name: 'file',
                    autoSubmit: true,
                    accept: this.accept(),
                    responseType: "json"
                });
                this._binding.on("submit", function (data) {
                    return _this.validate(data["file"]);
                });
                this._binding.on("complete", function (data) {
                    var response = data["response"];
                    if (response) {
                        response.file = data["file"];
                        _this.value(response);
                    }
                    data["ctrl"] = _this[0];
                    _this.fire("complete", data);
                });
            };

            Input.prototype.unmakeFileUpload = function () {
                if (this._binding) {
                    this._binding.uninstallBind();
                    this._binding = null;
                }
            };

            Input.prototype.fileId = function () {
                return this._fileId;
            };

            Input.prototype.type = function (txt) {
                var type;
                if (typeof txt === "string") {
                    type = this.type();
                    if (type === txt) {
                        this.refresh();
                        return this;
                    }
                    txt = txt.toLowerCase();
                    if (Input._supportType.indexOf(txt) >= 0) {
                        this.attr("data-type", txt);
                        this.createTextbox();
                        this.refresh();
                    }
                    return this;
                } else {
                    type = this.attr("data-type").toLowerCase();
                    if (Input._supportType.indexOf(type) >= 0) {
                        return type;
                    } else
                        return "text";
                }
            };

            Input.prototype.validator = function (val) {
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
                        try  {
                            val = eval("(" + val + ")");
                            if (typeof val !== "object")
                                return null;
                            else
                                return val;
                        } catch (err) {
                            return null;
                        }
                    }
                }
            };

            Input.prototype.validate = function (txt) {
                var finalText = typeof txt === "string" ? txt : this.text();
                if (finalText === null)
                    finalText = "";
                this._invalid = false;
                var validator = this.validator();
                if (validator) {
                    for (var k in validator) {
                        if (k && validator.hasOwnProperty(k)) {
                            if (k === "*password") {
                                if (!/[a-z]/.test(finalText) || !/[A-Z]/.test(finalText) || !/[0-9]/.test(finalText) || !/[~`!@#$%^&*()_\-+=\\\]\[{}:;"'/?,.<>|]/.test(finalText) || finalText.length < 6) {
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
            };

            Input.prototype.uploadUrl = function (url) {
                if (typeof url === "string") {
                    this.attr("data-upload-url", url);
                    this.refresh();
                    return this;
                } else
                    return this.attr("data-upload-url");
            };

            Input.prototype.text = function (txt) {
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
            };

            Input.prototype.accept = function (txt) {
                var type = this.type();
                if (typeof txt === "string") {
                    this.attr("data-accept", txt);
                    this.refresh();
                    return this;
                } else
                    return this.attr("data-accept");
            };

            Input.prototype.value = function (val) {
                var type = this.type();
                if (typeof val !== tui.undef) {
                    if (type === "calendar") {
                        if (val instanceof Date) {
                            this.attr("data-value", tui.formatDate(val));
                            this.attr("data-text", tui.formatDate(val, tui.str("yyyy-MM-dd")));
                            this._invalid = false;
                            this.refresh();
                        }
                    } else if (type === "file") {
                        if (val.file && val.fileId) {
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
                    }
                    return this;
                } else {
                    val = this.attr("data-value");
                    if (type === "calendar") {
                        return tui.parseDate(val);
                    } else if (type === "file") {
                        return eval("(" + val + ")");
                    } else
                        return val;
                }
            };

            Input.prototype.icon = function (txt) {
                if (typeof txt === "string") {
                    this.attr("data-icon", txt);
                    this.refresh();
                    return this;
                } else
                    return this.attr("data-icon");
            };

            Input.prototype.placeholder = function (txt) {
                if (typeof txt === "string") {
                    this.attr("data-placeholder", txt);
                    this.refresh();
                    return this;
                } else
                    return this.attr("data-placeholder");
            };

            Input.prototype.refresh = function () {
                var type = this.type().toLowerCase();
                if (type === "file") {
                    this.makeFileUpload();
                } else
                    this.unmakeFileUpload();
                var placeholder = this.placeholder();
                if (placeholder === null)
                    placeholder = "";
                var text = this.text();
                if (text === null)
                    text = "";
                var withBtn = false;
                if (type !== "text" && type !== "password") {
                    withBtn = true;
                    this._button.style.height = "";
                    this._button.style.height = ($(this[0]).innerHeight() - ($(this._button).outerHeight() - $(this._button).height())) + "px";
                    this._button.style.lineHeight = this._button.style.height;
                    this._button.style.display = "";
                } else {
                    this._button.style.display = "none";
                }
                if (this.icon()) {
                    $(this._button).addClass(this.icon());
                } else
                    this._button.className = "";
                if (type === "text" || type === "password" || type === "custom-text") {
                    if (this._textbox.value !== text)
                        this._textbox.value = text;
                    this.removeAttr("tabIndex");
                    this._textbox.style.display = "";
                    this._label.style.display = "none";
                    if (withBtn) {
                        this._button.style.display = "";
                        this._textbox.style.width = "";
                        this._textbox.style.width = ($(this[0]).innerWidth() - ($(this._textbox).outerWidth() - $(this._textbox).width()) - $(this._button).outerWidth()) + "px";
                    } else {
                        this._button.style.display = "none";
                        this._textbox.style.width = "";
                        this._textbox.style.width = ($(this[0]).innerWidth() - ($(this._textbox).outerWidth() - $(this._textbox).width())) + "px";
                    }
                    this._textbox.style.height = "";
                    this._textbox.style.height = ($(this[0]).innerHeight() - ($(this._textbox).outerHeight() - $(this._textbox).height())) + "px";
                    this._textbox.style.lineHeight = this._textbox.style.height;
                    this._label.style.width = this._textbox.style.width;
                } else {
                    this._label.innerHTML = text;
                    this._textbox.style.display = "none";
                    this._label.style.display = "";
                    this._label.style.right = "";
                    this.attr("tabIndex", "0");
                    this._label.style.lineHeight = $(this._label).height() + "px";
                }
                if (placeholder && !text) {
                    this._label.innerHTML = placeholder;
                    this._label.style.display = "";
                    $(this._label).addClass("tui-placeholder");
                    this._label.style.lineHeight = $(this._label).height() + "px";
                } else {
                    $(this._label).removeClass("tui-placeholder");
                }
                if (this._invalid) {
                    if (tui.ieVer > 0 && tui.ieVer < 9)
                        $(this._notify).attr("title", this._message);
                    else
                        $(this._notify).attr("data-warning", this._message);
                    $(this._notify).css({
                        "display": "",
                        "right": (withBtn ? this._button.offsetWidth : 0) + "px"
                    });
                    $(this._notify).css({
                        "line-height": this._notify.offsetHeight + "px"
                    });
                } else {
                    $(this._notify).css("display", "none");
                }
            };
            Input.CLASS = "tui-input";
            Input.VALIDATORS = {
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

            Input._supportType = [
                "text", "password", "select", "multi-select",
                "calendar", "file", "custom-select", "custom-text"];
            return Input;
        })(_ctrl.Control);
        _ctrl.Input = Input;

        /**
        * Construct a button.
        * @param el {HTMLElement or element id or construct info}
        */
        function input(param, type) {
            return tui.ctrl.control(param, Input, type);
        }
        _ctrl.input = input;

        tui.ctrl.registerInitCallback(Input.CLASS, input);
    })(tui.ctrl || (tui.ctrl = {}));
    var ctrl = tui.ctrl;
})(tui || (tui = {}));
//# sourceMappingURL=tui.input.js.map

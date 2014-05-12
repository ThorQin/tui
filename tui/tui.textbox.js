var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var tui;
(function (tui) {
    /// <reference path="tui.core.ts" />
    (function (ctrl) {
        var Input = (function (_super) {
            __extends(Input, _super);
            function Input(el) {
                _super.call(this);
                var self = this;
                if (el)
                    this.elem(el);
                else
                    this.elem("span", Input.CLASS);
                this[0]._ctrl = this;
                this.attr("tabIndex", "0");
                this.selectable(false);
                this._textbox = document.createElement("input");
                this[0].innerHTML = "";
                this[0].appendChild(this._textbox);
            }
            Input.prototype.type = function (txt) {
                if (typeof txt === "string") {
                    if (["text", "password", "single-select", "multi-select", "date", "file"].indexOf(txt) >= 0) {
                        this.attr("data-type", txt);
                        this.refresh();
                    }
                    return this;
                } else
                    return this.attr("data-type");
            };

            Input.prototype.text = function (txt) {
                if (typeof txt === "string") {
                    this.attr("data-text", txt);
                    this.refresh();
                    return this;
                } else
                    return this.attr("data-text");
            };

            Input.prototype.format = function (txt) {
                if (typeof txt === "string") {
                    this.attr("data-format", txt);
                    this.refresh();
                    return this;
                } else
                    return this.attr("data-format");
            };

            Input.prototype.placeholder = function (txt) {
                if (typeof txt === "string") {
                    this.attr("data-placeholder", txt);
                    this.refresh();
                    return this;
                } else
                    return this.attr("data-placeholder");
            };
            Input.CLASS = "tui-input";
            return Input;
        })(ctrl.Control);
        ctrl.Input = Input;

        /**
        * Construct a button.
        * @param el {HTMLElement or element id or construct info}
        */
        function input(param) {
            return tui.ctrl.control(param, Input);
        }
        ctrl.input = input;

        tui.ctrl.registerInitCallback(Input.CLASS, input);
    })(tui.ctrl || (tui.ctrl = {}));
    var ctrl = tui.ctrl;
})(tui || (tui = {}));
//# sourceMappingURL=tui.textbox.js.map

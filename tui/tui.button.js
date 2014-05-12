var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var tui;
(function (tui) {
    /// <reference path="tui.control.ts" />
    (function (_ctrl) {
        var Button = (function (_super) {
            __extends(Button, _super);
            function Button(el) {
                var _this = this;
                _super.call(this);
                if (el)
                    this.elem(el);
                else
                    this.elem("a", Button.CLASS);
                this[0]._ctrl = this;
                this.attr("tabIndex", "0");
                this.selectable(false);
                this.exposeEvents("mousedown mouseup mousemove mouseenter mouseleave");

                $(this[0]).on("click", function (e) {
                    _this.fire("click", { "ctrl": _this[0], "event": e });
                    tui.fire(_this.id(), { "ctrl": _this[0], "event": e });
                });

                $(this[0]).on("mousedown", function (e) {
                    _this.actived(true);
                    var self = _this;
                    function releaseMouse(e) {
                        self.actived(false);
                        $(document).off("mouseup", releaseMouse);
                    }
                    $(document).on("mouseup", releaseMouse);
                });

                $(this[0]).on("keydown", function (e) {
                    var isButton = _this[0].nodeName.toLowerCase() === "button";
                    if (e.keyCode === 32) {
                        _this.actived(true);
                        if (!isButton)
                            e.preventDefault();
                    }
                    _this.fire("keydown", { "ctrl": _this[0], "event": e });
                    if (e.keyCode === 13 && !isButton) {
                        e.preventDefault();
                        e.type = "click";
                        _this.fire("click", { "ctrl": _this[0], "event": e });
                        tui.fire(_this.id(), { "ctrl": _this[0], "event": e });
                    }
                });

                $(this[0]).on("keyup", function (e) {
                    var isButton = _this[0].nodeName.toLowerCase() === "button";
                    if (e.keyCode === 32) {
                        _this.actived(false);
                    }
                    _this.fire("keyup", { "ctrl": _this[0], "event": e });
                    if (e.keyCode === 32 && !isButton) {
                        e.type = "click";
                        _this.fire("click", { "ctrl": _this[0], "event": e });
                        tui.fire(_this.id(), { "ctrl": _this[0], "event": e });
                    }
                });
            }
            Button.prototype.text = function (t) {
                if (this[0])
                    return tui.elementText(this[0], t);
                return null;
            };
            Button.CLASS = "tui-button";
            return Button;
        })(_ctrl.Control);
        _ctrl.Button = Button;

        /**
        * Construct a button.
        * @param el {HTMLElement or element id or construct info}
        */
        function button(param) {
            return tui.ctrl.control(param, Button);
        }
        _ctrl.button = button;

        tui.ctrl.registerInitCallback(Button.CLASS, button);
    })(tui.ctrl || (tui.ctrl = {}));
    var ctrl = tui.ctrl;
})(tui || (tui = {}));
//# sourceMappingURL=tui.button.js.map

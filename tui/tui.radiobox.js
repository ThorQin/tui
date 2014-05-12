var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var tui;
(function (tui) {
    /// <reference path="tui.button.ts" />
    (function (_ctrl) {
        var Radiobox = (function (_super) {
            __extends(Radiobox, _super);
            function Radiobox(el) {
                var _this = this;
                _super.call(this);
                if (el)
                    this.elem(el);
                else
                    this.elem("a", Radiobox.CLASS);
                this[0]._ctrl = this;
                this.attr("tabIndex", "0");
                this.exposeEvents("mousedown mouseup mousemove mouseenter mouseleave");

                $(this[0]).on("click", function (e) {
                    _this.fire("click", { "ctrl": _this[0], "event": e });
                    tui.fire(_this.id(), { "ctrl": _this[0], "event": e });
                });
                $(this[0]).on("mousedown", function (e) {
                    if (tui.ffVer > 0)
                        _this.focus();
                });
                $(this[0]).on("mouseup", function (e) {
                    _this.checked(true);
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
                        _this.checked(true);
                    }
                    _this.fire("keyup", { "ctrl": _this[0], "event": e });
                    if (e.keyCode === 32 && !isButton) {
                        e.type = "click";
                        _this.fire("click", { "ctrl": _this[0], "event": e });
                        tui.fire(_this.id(), { "ctrl": _this[0], "event": e });
                    }
                });
            }
            Radiobox.prototype.text = function (t) {
                if (this[0])
                    return tui.elementText(this[0], t);
                return null;
            };

            Radiobox.prototype.checked = function (val) {
                if (typeof val === tui.undef) {
                    return _super.prototype.checked.call(this);
                } else {
                    val = (!!val);
                    if (val) {
                        var groupName = this.attr("data-group");
                        $("." + Radiobox.CLASS + "[data-group=" + groupName + "]").each(function () {
                            $(this).removeAttr("data-checked");
                            this.className = this.className;
                        });
                    }
                    _super.prototype.checked.call(this, val);
                    return this;
                }
            };
            Radiobox.CLASS = "tui-radiobox";
            return Radiobox;
        })(_ctrl.Control);
        _ctrl.Radiobox = Radiobox;

        /**
        * Construct a button.
        * @param el {HTMLElement or element id or construct info}
        */
        function radiobox(param) {
            return tui.ctrl.control(param, Radiobox);
        }
        _ctrl.radiobox = radiobox;
        tui.ctrl.registerInitCallback(Radiobox.CLASS, radiobox);
    })(tui.ctrl || (tui.ctrl = {}));
    var ctrl = tui.ctrl;
})(tui || (tui = {}));
//# sourceMappingURL=tui.radiobox.js.map

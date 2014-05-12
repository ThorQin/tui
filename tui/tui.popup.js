var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var tui;
(function (tui) {
    /// <reference path="tui.control.ts" />
    (function (ctrl) {
        var _currentPopup = null;

        function closeAllPopup() {
            var pop = _currentPopup;
            while (pop) {
                if (pop.parent())
                    pop = pop.parent();
                else {
                    pop.close();
                    pop = _currentPopup;
                }
            }
        }

        var Popup = (function (_super) {
            __extends(Popup, _super);
            function Popup() {
                _super.call(this);
                this._position = null;
                this._bindElem = null;
                this._body = document.body || document.getElementsByTagName("BODY")[0];
                this._parent = null;
                this._parentPopup = null;
                this._childPopup = null;
            }
            Popup.prototype.getParentPopup = function (elem) {
                var pop = _currentPopup;
                while (pop) {
                    if (pop.isPosterity(elem))
                        return pop;
                    else
                        pop = pop.parent();
                }
                return pop;
            };

            Popup.prototype.show = function (content, param, bindType) {
                if (typeof param === "string")
                    param = document.getElementById(param);
                var elem = null;
                if (param && param.nodeName && typeof bindType === "string") {
                    elem = this.elem("div", Popup.CLASS);
                    this._bindElem = param;
                    this._bindType = bindType;
                } else if (param && typeof param.x === "number" && typeof param.y === "number") {
                    elem = this.elem("div", Popup.CLASS);
                    this._position = param;
                }
                if (elem) {
                    if (this._bindElem) {
                        this._parentPopup = this.getParentPopup(this._bindElem);
                        if (this._parentPopup) {
                            this._parentPopup.closeChild();
                            this._parentPopup.child(this);
                            this.parent(this._parentPopup);
                            this._parent = this._parentPopup[0];
                        } else {
                            closeAllPopup();
                            this._parent = this._body;
                        }
                    } else {
                        closeAllPopup();
                        this._parent = this._body;
                    }
                    this._parent.appendChild(elem);
                    elem.focus();
                    _currentPopup = this;
                    elem.setAttribute("tabIndex", "-1");
                    if (typeof content === "string") {
                        elem.innerHTML = content;
                    } else if (content && content.nodeName) {
                        elem.appendChild(content);
                    }
                    tui.ctrl.initCtrls(elem);
                    this.refresh();
                }
            };

            Popup.prototype.close = function () {
                this._parent.removeChild(this[0]);
                _currentPopup = this.parent();
                this.parent(null);
                if (_currentPopup)
                    _currentPopup.child(null);
            };

            Popup.prototype.closeChild = function () {
                if (this._childPopup) {
                    this._childPopup.close();
                    this._childPopup = null;
                }
            };

            Popup.prototype.parent = function (pop) {
                if (typeof pop !== tui.undef) {
                    this._parentPopup = pop;
                }
                return this._parentPopup;
            };

            Popup.prototype.child = function (pop) {
                if (typeof pop !== tui.undef) {
                    this._childPopup = pop;
                }
                return this._childPopup;
            };

            Popup.prototype.refresh = function () {
                if (!this[0])
                    return;
                var elem = this[0];
                var cw = document.documentElement.clientWidth;
                var ch = document.documentElement.clientHeight;
                var sw = elem.offsetWidth;
                var sh = elem.offsetHeight;
                var box = { x: 0, y: 0, w: 0, h: 0 };
                var pos = { x: 0, y: 0 };
                if (this._position) {
                    box = this._position;
                    box.w = 0;
                    box.h = 0;
                } else if (this._bindElem) {
                    box = tui.offsetToPage(this._bindElem);
                    box.w = this._bindElem.offsetWidth;
                    box.h = this._bindElem.offsetHeight;
                }

                // lower case letter means 'next to', upper case letter means 'align to'
                var compute = {
                    "l": function () {
                        pos.x = box.x - sw;
                        if (pos.x < 2)
                            pos.x = box.x + box.w;
                    }, "r": function () {
                        pos.x = box.x + box.w;
                        if (pos.x + sw > cw - 2)
                            pos.x = box.x - sw;
                    }, "t": function () {
                        pos.y = box.y - sh;
                        if (pos.y < 2)
                            pos.y = box.y + box.h;
                    }, "b": function () {
                        pos.y = box.y + box.h;
                        if (pos.y + sh > ch - 2)
                            pos.y = box.y - sh;
                    }, "L": function () {
                        pos.x = box.x;
                        if (pos.x + sw > cw - 2)
                            pos.x = box.x + box.w - sw;
                    }, "R": function () {
                        pos.x = box.x + box.w - sw;
                        if (pos.x < 2)
                            pos.x = box.x;
                    }, "T": function () {
                        pos.y = box.y;
                        if (pos.y + sh > ch - 2)
                            pos.y = box.y + box.h - sh;
                    }, "B": function () {
                        pos.y = box.y + box.h - sh;
                        if (pos.y < 2)
                            pos.y = box.y;
                    }
                };
                compute[this._bindType.substring(0, 1)](); // parse x
                compute[this._bindType.substring(1, 2)](); // parse y

                if (pos.x > cw - 2)
                    pos.x = cw - 2;
                if (pos.x < 2)
                    pos.x = 2;
                if (pos.y > ch - 2)
                    pos.y = ch - 2;
                if (pos.y < 2)
                    pos.y = 2;

                elem.style.left = pos.x + 2 + "px";
                elem.style.top = pos.y + 2 + "px";
            };
            Popup.CLASS = "tui-popup";
            return Popup;
        })(ctrl.Control);
        ctrl.Popup = Popup;

        function checkPopup() {
            setTimeout(function () {
                var obj = document.activeElement;
                while (_currentPopup) {
                    if (_currentPopup.isPosterity(obj))
                        return;
                    else
                        _currentPopup.close();
                }
            }, 30);
        }
        ctrl.checkPopup = checkPopup;

        $(document).on("focus mousedown keydown", checkPopup);
        tui.on("#tui.check.popup", checkPopup);

        $(window).scroll(function () {
            closeAllPopup();
        });

        /**
        * Construct a button.
        * @param el {HTMLElement or element id or construct info}
        */
        function popup() {
            return tui.ctrl.control(null, Popup);
        }
        ctrl.popup = popup;
    })(tui.ctrl || (tui.ctrl = {}));
    var ctrl = tui.ctrl;
})(tui || (tui = {}));
//# sourceMappingURL=tui.popup.js.map

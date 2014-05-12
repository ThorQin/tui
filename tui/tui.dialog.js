var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="tui.control.ts" />
var tui;
(function (tui) {
    (function (ctrl) {
        var _dialogStack = [];
        var _mask = document.createElement("div");
        _mask.className = "tui-dialog-mask";
        _mask.setAttribute("unselectable", "on");

        function reorder() {
            if (_mask.parentNode !== null) {
                _mask.parentNode.removeChild(_mask);
            }
            if (_dialogStack.length > 0) {
                document.body.insertBefore(_mask, _dialogStack[_dialogStack.length - 1].elem());
            } else {
            }
        }

        function push(dlg) {
            _dialogStack.push(dlg);
            document.body.appendChild(dlg.elem());
            reorder();
        }

        function remove(dlg) {
            var index = _dialogStack.indexOf(dlg);
            if (index >= 0) {
                _dialogStack.splice(index, 1);
            }
            document.body.removeChild(dlg.elem());
            reorder();
        }

        function getParent(dlg) {
            var index = _dialogStack.indexOf(dlg);
            if (index > 0) {
                _dialogStack[index - 1];
            } else
                return null;
        }

        var Dialog = (function (_super) {
            __extends(Dialog, _super);
            function Dialog() {
                _super.call(this);
                this._resourceElement = null;
                this._isMoved = false;
                this._isInitialize = true;
                this._titleText = null;
                this._noRefresh = false;
                this._useEsc = true;
            }
            Dialog.prototype.showContent = function (content, title, buttons) {
                if (this[0])
                    return this;
                this._resourceElement = null;
                return this.showElement(tui.toElement(content), title, buttons);
            };

            Dialog.prototype.showResource = function (elemId, title, buttons) {
                if (this[0])
                    return this;
                var elem = document.getElementById(elemId);
                if (!elem) {
                    throw new Error("Resource id not found: " + elemId);
                }
                this._resourceElement = elem;
                return this.showElement(elem, title, buttons);
            };

            Dialog.prototype.showElement = function (elem, title, buttons) {
                var _this = this;
                if (this[0])
                    return this;

                // Temporary inhibit refresh to prevent unexpected calculation
                this._noRefresh = true;
                this.elem("div", Dialog.CLASS);
                this.attr("tabIndex", "-1");
                this._titleDiv = document.createElement("div");
                this._titleDiv.className = "tui-dlg-title-bar";
                this._titleDiv.setAttribute("unselectable", "on");
                this._titleDiv.onselectstart = function () {
                    return false;
                };
                this[0].appendChild(this._titleDiv);
                this._closeIcon = document.createElement("span");
                this._closeIcon.className = "tui-dlg-close";
                this._titleDiv.appendChild(this._closeIcon);
                this._contentDiv = document.createElement("div");
                this[0].appendChild(this._contentDiv);
                this._buttonDiv = document.createElement("div");
                this._buttonDiv.className = "tui-dlg-btn-bar";
                this[0].appendChild(this._buttonDiv);
                var tt = "";
                if (typeof title === "string") {
                    tt = title;
                } else {
                    if (elem.title) {
                        tt = elem.title;
                    }
                }
                this.title(tt);
                this._contentDiv.appendChild(elem);
                $(elem).removeClass("tui-hidden");
                var self = this;
                if (buttons && typeof buttons.length === "number") {
                    for (var i = 0; i < buttons.length; i++) {
                        this.insertButton(buttons[i]);
                    }
                } else {
                    this.insertButton({
                        name: tui.str("Ok"),
                        func: function (data) {
                            self.close();
                        }
                    });
                }

                // Add to document
                push(this);

                // Convert all child elements into tui controls
                tui.ctrl.initCtrls(elem);
                this._isInitialize = true;
                this._isMoved = false;

                $(this._closeIcon).on("click", function () {
                    _this.close();
                });

                $(this._titleDiv).on("mousedown", function (e) {
                    if (e.target === _this._closeIcon)
                        return;
                    var dialogX = _this[0].offsetLeft;
                    var dialogY = _this[0].offsetTop;
                    var beginX = e.clientX;
                    var beginY = e.clientY;
                    var winSize = { width: _mask.offsetWidth, height: _mask.offsetHeight };
                    tui.mask();
                    function onMoveEnd(e) {
                        tui.unmask();
                        $(document).off("mousemove", onMove);
                        $(document).off("mouseup", onMoveEnd);
                    }
                    function onMove(e) {
                        var l = dialogX + e.clientX - beginX;
                        var t = dialogY + e.clientY - beginY;
                        if (l > winSize.width - self[0].offsetWidth)
                            l = winSize.width - self[0].offsetWidth;
                        if (l < 0)
                            l = 0;
                        if (t > winSize.height - self[0].offsetHeight)
                            t = winSize.height - self[0].offsetHeight;
                        if (t < 0)
                            t = 0;
                        self[0].style.left = l + "px";
                        self[0].style.top = t + "px";
                        self._isMoved = true;
                    }
                    $(document).on("mousemove", onMove);
                    $(document).on("mouseup", onMoveEnd);
                });

                // After initialization finished preform refresh now.
                this._noRefresh = false;
                this.refresh();
                this[0].focus();
                this.fire("open");
                return this;
            };

            Dialog.prototype.insertButton = function (btn, index) {
                if (!this[0])
                    return null;
                var button = tui.ctrl.button();
                button.text(btn.name);
                btn.id && button.id(btn.id);
                btn.cls && button.addClass(btn.cls);
                btn.func && button.on("click", btn.func);
                if (typeof index === "number" && !isNaN(index)) {
                    var refButton = this._buttonDiv.childNodes[index];
                    if (refButton)
                        this._buttonDiv.insertBefore(button.elem(), refButton);
                    else
                        this._buttonDiv.appendChild(button.elem());
                } else {
                    this._buttonDiv.appendChild(button.elem());
                }
                this.refresh();
                return button;
            };

            Dialog.prototype.removeButton = function (btn) {
                if (!this[0])
                    return;
                var refButton;
                if (typeof btn === "number") {
                    refButton = this._buttonDiv.childNodes[btn];
                } else if (btn instanceof ctrl.Button) {
                    refButton = btn.elem();
                }
                this._buttonDiv.removeChild(refButton);
            };

            Dialog.prototype.button = function (index) {
                if (!this[0])
                    return null;
                var refButton = this._buttonDiv.childNodes[index];
                if (refButton) {
                    return tui.ctrl.button(refButton);
                } else
                    return null;
            };

            Dialog.prototype.removeAllButtons = function () {
                if (!this[0])
                    return;
                this._buttonDiv.innerHTML = "";
            };

            Dialog.prototype.useesc = function (val) {
                if (typeof val === "boolean") {
                    this._useEsc = val;
                    this.title(this.title());
                } else {
                    return this._useEsc;
                }
            };

            Dialog.prototype.title = function (t) {
                if (typeof t === "string") {
                    if (!this[0])
                        return this;
                    if (this._closeIcon.parentNode)
                        this._closeIcon.parentNode.removeChild(this._closeIcon);
                    this._titleDiv.innerHTML = t;
                    if (this._useEsc)
                        this._titleDiv.appendChild(this._closeIcon);
                    this._titleText = t;
                    this.refresh();
                    return this;
                } else {
                    if (!this[0])
                        return null;
                    return this._titleText;
                }
            };

            Dialog.prototype.close = function () {
                if (!this[0])
                    return;
                remove(this);
                this.elem(null);
                this._titleDiv = null;
                this._contentDiv = null;
                this._buttonDiv = null;
                this._closeIcon = null;
                this._titleText = null;
                if (this._resourceElement) {
                    $(this._resourceElement).addClass("tui-hidden");
                    document.body.appendChild(this._resourceElement);
                    this._resourceElement = null;
                }
                this.fire("close");
            };

            Dialog.prototype.refresh = function () {
                if (!this[0])
                    return;
                if (this._noRefresh)
                    return;

                // Change position
                var winSize = { width: _mask.offsetWidth, height: _mask.offsetHeight };

                var box = {
                    left: this[0].offsetLeft,
                    top: this[0].offsetTop,
                    width: this[0].offsetWidth,
                    height: this[0].offsetHeight
                };
                if (this._isInitialize) {
                    var parent = getParent(this);
                    var centX, centY;
                    if (parent) {
                        var e = parent.elem();
                        centX = e.offsetLeft + e.offsetWidth / 2;
                        centY = e.offsetTop + e.offsetHeight / 2;
                        this._isMoved = true;
                    } else {
                        centX = winSize.width / 2;
                        centY = winSize.height / 2;
                        this._isMoved = false;
                    }
                    box.left = centX - box.width / 2;
                    box.top = centY - box.height / 2;
                    this._isInitialize = false;
                } else {
                    if (!this._isMoved) {
                        box.left = (winSize.width - box.width) / 2;
                        box.top = (winSize.height - box.height) / 2;
                    }
                }
                if (box.left + box.width > winSize.width)
                    box.left = winSize.width - box.width;
                if (box.top + box.height > winSize.height)
                    box.top = winSize.height - box.height;
                if (box.left < 0)
                    box.left = 0;
                if (box.top < 0)
                    box.top = 0;
                this[0].style.left = box.left + "px";
                this[0].style.top = box.top + "px";
            };
            Dialog.CLASS = "tui-dialog";
            return Dialog;
        })(ctrl.Control);
        ctrl.Dialog = Dialog;

        /**
        * Construct a button.
        * @param el {HTMLElement or element id or construct info}
        */
        function dialog() {
            return tui.ctrl.control(null, Dialog);
        }
        ctrl.dialog = dialog;

        $(document).on("keydown", function (e) {
            var k = e.keyCode;
            if (_dialogStack.length <= 0)
                return;
            var dlg = _dialogStack[_dialogStack.length - 1];
            if (k === 27) {
                dlg.useesc() && dlg.close();
            } else if (k === 9) {
                setTimeout(function () {
                    if (!dlg.isPosterity(document.activeElement)) {
                        dlg.focus();
                    }
                }, 0);
            }
        });

        $(window).resize(function () {
            for (var i = 0; i < _dialogStack.length; i++) {
                _dialogStack[i].refresh();
            }
        });
    })(tui.ctrl || (tui.ctrl = {}));
    var ctrl = tui.ctrl;

    function msgbox(message, title) {
        var dlg = tui.ctrl.dialog();
        var wrap = document.createElement("div");
        wrap.className = "tui-dlg-msg";
        wrap.innerHTML = message;
        dlg.showElement(wrap, title);
        return dlg;
    }
    tui.msgbox = msgbox;

    function infobox(message, title) {
        var dlg = tui.ctrl.dialog();
        var wrap = document.createElement("div");
        wrap.className = "tui-dlg-warp tui-dlg-info";
        wrap.innerHTML = message;
        dlg.showElement(wrap, title);
        return dlg;
    }
    tui.infobox = infobox;

    function errbox(message, title) {
        var dlg = tui.ctrl.dialog();
        var wrap = document.createElement("div");
        wrap.className = "tui-dlg-warp tui-dlg-err";
        wrap.innerHTML = message;
        dlg.showElement(wrap, title);
        return dlg;
    }
    tui.errbox = errbox;

    function warnbox(message, title) {
        var dlg = tui.ctrl.dialog();
        var wrap = document.createElement("div");
        wrap.className = "tui-dlg-warp tui-dlg-warn";
        wrap.innerHTML = message;
        dlg.showElement(wrap, title);
        return dlg;
    }
    tui.warnbox = warnbox;

    function askbox(message, title, callback) {
        var dlg = tui.ctrl.dialog();
        var wrap = document.createElement("div");
        wrap.className = "tui-dlg-warp tui-dlg-ask";
        wrap.innerHTML = message;
        var result = false;
        dlg.showElement(wrap, title, [
            {
                name: tui.str("Ok"), func: function () {
                    result = true;
                    dlg.close();
                }, cls: "tui-primary"
            }, {
                name: tui.str("Cancel"), func: function () {
                    dlg.close();
                }
            }
        ]);
        dlg.on("close", function () {
            if (typeof callback === "function")
                callback(result);
        });
        return dlg;
    }
    tui.askbox = askbox;

    function waitbox(message) {
        var dlg = tui.ctrl.dialog();
        var wrap = document.createElement("div");
        wrap.className = "tui-dlg-warp tui-dlg-wait";
        wrap.innerHTML = message;
        dlg.showElement(wrap, null, []);
        dlg.useesc(false);
        return dlg;
    }
    tui.waitbox = waitbox;
})(tui || (tui = {}));
//# sourceMappingURL=tui.dialog.js.map

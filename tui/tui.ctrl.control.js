var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="tui.core.ts" />
var tui;
(function (tui) {
    var _maskDiv = document.createElement("div");
    _maskDiv.className = "tui-mask";
    _maskDiv.setAttribute("unselectable", "on");

    /**
    * Show a mask layer to prevent user drag or select document elements which don't want to be affected.
    * It's very useful when user perform a dragging operation.
    */
    function mask() {
        document.body.appendChild(_maskDiv);
        return _maskDiv;
    }
    tui.mask = mask;

    /**
    * Close a mask layer
    */
    function unmask() {
        if (_maskDiv.parentNode)
            _maskDiv.parentNode.removeChild(_maskDiv);
        _maskDiv.innerHTML = "";
        _maskDiv.style.cursor = "";
        return _maskDiv;
    }
    tui.unmask = unmask;
})(tui || (tui = {}));
var tui;
(function (tui) {
    (function (ctrl) {
        var Control = (function (_super) {
            __extends(Control, _super);
            function Control() {
                _super.apply(this, arguments);
                this._exposedEvents = {};
            }
            /**
            * Construct a component
            */
            Control.prototype.elem = function (el, clsName) {
                if (el && el.nodeName || el === null) {
                    this[0] = el;
                } else if (typeof el === "string" && typeof clsName === "string") {
                    this[0] = document.createElement(el);
                    this[0].className = clsName;
                }
                return this[0];
            };

            Control.prototype.exposeEvents = function (eventNames) {
                if (this[0]) {
                    if (typeof eventNames === "string")
                        eventNames = eventNames.split(/\s+/);
                    for (var i = 0; i < eventNames.length; i++) {
                        this._exposedEvents[eventNames[i]] = true;
                    }
                }
            };

            Control.prototype.bind = function (eventName, handler, priority) {
                if (this._exposedEvents[eventName]) {
                    $(this[0]).on(eventName, handler);
                } else
                    _super.prototype.bind.call(this, eventName, handler, priority);
            };

            Control.prototype.unbind = function (eventName, handler) {
                if (this._exposedEvents[eventName]) {
                    $(this[0]).off(eventName, handler);
                } else
                    _super.prototype.unbind.call(this, eventName, handler);
            };

            Control.prototype.id = function (val) {
                if (typeof val === "string") {
                    if (this[0])
                        this[0].id = val;
                    return this;
                } else {
                    if (this[0] && this[0].id)
                        return this[0].id;
                    else
                        return null;
                }
            };

            Control.prototype.hasAttr = function (attributeName) {
                if (this[0])
                    return typeof $(this[0]).attr(attributeName) === "string";
                else
                    return false;
            };
            Control.prototype.isAttrTrue = function (attributeName) {
                if (this.hasAttr(attributeName)) {
                    var attr = this.attr(attributeName).toLowerCase();
                    return attr === "" || attr === "true" || attr === "on";
                } else
                    return false;
            };

            Control.prototype.attr = function (p1, p2) {
                if (typeof p1 === "string" && typeof p2 === tui.undef) {
                    if (!this[0])
                        return null;
                    else {
                        var val = $(this[0]).attr(p1);
                        if (val === null || typeof val === tui.undef)
                            return null;
                        else
                            return val;
                    }
                } else {
                    if (this[0])
                        $(this[0]).attr(p1, p2);
                    return this;
                }
            };

            Control.prototype.removeAttr = function (attributeName) {
                if (this[0])
                    $(this[0]).removeAttr(attributeName);
                return this;
            };

            Control.prototype.css = function (p1, p2) {
                if (typeof p1 === "string" && typeof p2 === tui.undef) {
                    if (!this[0])
                        return null;
                    else
                        return $(this[0]).css(p1);
                } else {
                    if (this[0])
                        $(this[0]).css(p1, p2);
                    return this;
                }
            };

            Control.prototype.hasClass = function (className) {
                if (this[0])
                    return $(this[0]).hasClass(className);
                else
                    return false;
            };

            Control.prototype.addClass = function (param) {
                if (this[0])
                    $(this[0]).addClass(param);
                return this;
            };

            Control.prototype.removeClass = function (param) {
                if (this[0])
                    $(this[0]).removeClass(param);
                return this;
            };
            Control.prototype.refresh = function () {
            };

            Control.prototype.is = function (attrName, val) {
                if (typeof val === "boolean") {
                    if (val)
                        this.attr(attrName, "true");
                    else
                        this.removeAttr(attrName);
                    if (this[0] && tui.ieVer > 0 && tui.ieVer <= 8) {
                        this[0].className = this[0].className;
                    }
                    return this;
                } else {
                    return this.isAttrTrue(attrName);
                }
            };

            Control.prototype.hidden = function (val) {
                if (typeof val === "boolean") {
                    this.is("data-hidden", val);
                    if (val) {
                        this.addClass("tui-hidden");
                    } else
                        this.removeClass("tui-hidden");
                    return this;
                } else
                    return this.is("data-hidden");
            };

            Control.prototype.checked = function (val) {
                return this.is("data-checked", val);
            };

            Control.prototype.actived = function (val) {
                if (typeof val === "boolean") {
                    this.is("data-actived", val);
                    if (val) {
                        this.addClass("tui-actived");
                    } else
                        this.removeClass("tui-actived");
                    return this;
                } else
                    return this.is("data-actived");
            };

            Control.prototype.disabled = function (val) {
                return this.is("data-disabled", val);
            };

            Control.prototype.marked = function (val) {
                return this.is("data-marked", val);
            };

            Control.prototype.selectable = function (val) {
                if (typeof val === "boolean") {
                    if (!val)
                        this.attr("unselectable", "on");
                    else
                        this.removeAttr("unselectable");
                    return this;
                } else {
                    return !this.isAttrTrue("unselectable");
                }
            };

            Control.prototype.blur = function () {
                var el = this.elem();
                if (el) {
                    el.blur();
                }
            };
            Control.prototype.focus = function () {
                var el = this.elem();
                if (el) {
                    setTimeout(function () {
                        el.focus();
                    }, 0);
                }
            };

            Control.prototype.isHover = function () {
                if (this[0]) {
                    return tui.isAncestry(_hoverElement, this[0]);
                } else
                    return false;
            };

            Control.prototype.isFocused = function () {
                if (this[0]) {
                    return tui.isAncestry(document.activeElement, this[0]);
                } else
                    return false;
            };

            Control.prototype.isAncestry = function (ancestry) {
                return tui.isAncestry(this[0], ancestry);
            };

            Control.prototype.isPosterity = function (posterity) {
                return tui.isPosterity(this[0], posterity);
            };
            return Control;
        })(tui.EventObject);
        ctrl.Control = Control;

        function control(param, constructor, constructParam) {
            var elem = null;
            if (typeof param === "string" && param) {
                elem = document.getElementById(param);
                if (!elem)
                    return null;
                if (elem._ctrl) {
                    elem._ctrl.refresh();
                    return elem._ctrl;
                } else if (typeof constructParam !== tui.undef) {
                    return new constructor(elem, constructParam);
                } else
                    return new constructor(elem);
            } else if (param && param.nodeName) {
                elem = param;
                if (elem._ctrl) {
                    elem._ctrl.refresh();
                    return elem._ctrl;
                } else if (typeof constructParam !== tui.undef) {
                    return new constructor(elem, constructParam);
                } else
                    return new constructor(elem);
            } else if ((typeof param === tui.undef || param === null) && constructor) {
                if (typeof constructParam !== tui.undef) {
                    return new constructor(null, constructParam);
                } else
                    return new constructor();
            } else
                return null;
        }
        ctrl.control = control;

        var initializers = {};
        function registerInitCallback(clsName, constructFunc) {
            if (!initializers[clsName]) {
                initializers[clsName] = constructFunc;
            }
        }
        ctrl.registerInitCallback = registerInitCallback;

        function initCtrls(parent) {
            for (var clsName in initializers) {
                if (clsName) {
                    var func = initializers[clsName];
                    $(parent).find("." + clsName).each(function (idx, elem) {
                        func(elem);
                    });
                }
            }
        }
        ctrl.initCtrls = initCtrls;

        var _hoverElement;
        $(window.document).mousemove(function (e) {
            _hoverElement = e.target || e.toElement;
        });

        $(window.document).ready(function () {
            initCtrls(document);
        });
    })(tui.ctrl || (tui.ctrl = {}));
    var ctrl = tui.ctrl;
})(tui || (tui = {}));
//# sourceMappingURL=tui.ctrl.control.js.map

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
        var Scrollbar = (function (_super) {
            __extends(Scrollbar, _super);
            function Scrollbar(el) {
                var _this = this;
                _super.call(this);
                this._btnThumb = null;
                this._btnHead = null;
                this._btnFoot = null;
                var self = this;
                if (el)
                    this.elem(el);
                else
                    this.elem("span", Scrollbar.CLASS);
                this.attr("unselectable", "on");
                this[0]._ctrl = this;
                this[0].innerHTML = "";
                this._btnHead = document.createElement("span");
                this._btnHead.className = "tui-scroll-head";
                this[0].appendChild(this._btnHead);
                this._btnThumb = document.createElement("span");
                this._btnThumb.className = "tui-scroll-thumb";
                $(this._btnThumb).attr("unselectable", "on");
                this[0].appendChild(this._btnThumb);
                this._btnFoot = document.createElement("span");
                this._btnFoot.className = "tui-scroll-foot";
                this[0].appendChild(this._btnFoot);

                var scrollTimer = null;
                var scrollInterval = null;
                var moveParam = null;

                function stopMove() {
                    if (scrollTimer) {
                        clearTimeout(scrollTimer);
                        scrollTimer = null;
                    }
                    if (scrollInterval) {
                        clearInterval(scrollInterval);
                        scrollInterval = null;
                    }
                }

                function moveThumb() {
                    var val = self.value();
                    var total = self.total();
                    var achieve = false;
                    moveParam.pos = Math.round(moveParam.pos);
                    moveParam.step = Math.round(moveParam.step);
                    if (val === moveParam.pos)
                        return;
                    if (moveParam.op === "-") {
                        val -= moveParam.step;
                        if (val <= moveParam.pos || val <= 0) {
                            achieve = true;
                            if (val < 0)
                                val = 0;
                            stopMove();
                        }
                        self.value(val);
                    } else {
                        val += moveParam.step;
                        if (val >= moveParam.pos || val >= total) {
                            achieve = true;
                            if (val > total)
                                val = total;
                            stopMove();
                        }
                        self.value(val);
                    }
                    self.fire("scroll", { value: self.value(), type: "mousedown" });
                    return achieve;
                }

                function releaseButton(e) {
                    stopMove();
                    $(self._btnHead).removeClass("tui-actived");
                    $(self._btnFoot).removeClass("tui-actived");
                    $(tui.unmask()).off("mouseup", releaseButton);
                }
                ;

                $(this[0]).mousedown(function (e) {
                    tui.fire("#tui.check.popup");

                    // Should check which target object was triggered.
                    if (!tui.isLButton(e.button)) {
                        return;
                    }
                    var obj = e.target;
                    if (obj !== self[0]) {
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                    if (_this.total() <= 0)
                        return;
                    var pos = (self.direction() === "vertical" ? e.offsetY : e.offsetX);
                    var v = self.calculateValue(pos) - self.page() / 2;
                    moveParam = { pos: v, step: self.page(), op: (v < self.value() ? "-" : "+") };
                    if (!moveThumb()) {
                        scrollTimer = setTimeout(function () {
                            scrollTimer = null;
                            scrollInterval = setInterval(moveThumb, 20);
                        }, 300);
                        $(tui.mask()).on("mouseup", releaseButton);
                    }
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                });

                $(this._btnHead).mousedown(function (e) {
                    if (!tui.isLButton(e.button))
                        return;
                    if (self.total() <= 0)
                        return;
                    $(self._btnHead).addClass("tui-actived");
                    moveParam = { pos: 0, step: self.step(), op: "-" };
                    if (!moveThumb()) {
                        scrollTimer = setTimeout(function () {
                            scrollTimer = null;
                            scrollInterval = setInterval(moveThumb, 20);
                        }, 300);
                        $(tui.mask()).on("mouseup", releaseButton);
                    }
                });

                $(this._btnFoot).mousedown(function (e) {
                    if (!tui.isLButton(e.button))
                        return;
                    if (self.total() <= 0)
                        return;
                    $(self._btnFoot).addClass("tui-actived");
                    moveParam = { pos: self.total(), step: self.step(), op: "+" };
                    if (!moveThumb()) {
                        scrollTimer = setTimeout(function () {
                            scrollTimer = null;
                            scrollInterval = setInterval(moveThumb, 20);
                        }, 300);
                        $(tui.mask()).on("mouseup", releaseButton);
                    }
                });

                var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
                $(this[0]).on(mousewheelevt, function (e) {
                    var ev = e.originalEvent;
                    var delta = ev.detail ? ev.detail * (-120) : ev.wheelDelta;

                    //delta returns +120 when wheel is scrolled up, -120 when scrolled down
                    var scrollSize = (Math.round(self.page() / 2) > self.step() ? Math.round(self.page() / 2) : self.step());
                    var oldValue = self.value();
                    if (delta <= -120) {
                        self.value(self.value() + scrollSize);
                    } else {
                        self.value(self.value() - scrollSize);
                    }
                    if (oldValue !== self.value())
                        self.fire("scroll", { value: self.value(), type: "mousewheel" });
                    e.stopPropagation();
                    e.preventDefault();
                });

                var beginX = 0, beginY = 0, beginLeft = 0, beginTop = 0;
                function dragThumb(e) {
                    var diff = 0;
                    var oldValue = self.value();
                    var pos;
                    if (self.direction() === "vertical") {
                        diff = e.clientY - beginY;
                        pos = beginTop + diff;
                    } else {
                        diff = e.clientX - beginX;
                        pos = beginLeft + diff;
                    }
                    self.value(self.calculateValue(pos));
                    if (oldValue !== self.value())
                        self.fire("scroll", { value: self.value(), type: "drag" });
                }

                function dragEnd(e) {
                    $(document).off("mousemove", dragThumb);
                    $(document).off("mouseup", dragEnd);
                    tui.unmask();
                    $(self._btnThumb).removeClass("tui-actived");
                    self.fire("dragend", { value: self.value() });
                }

                $(this._btnThumb).mousedown(function (e) {
                    if (!tui.isLButton(e.button))
                        return;
                    beginX = e.clientX;
                    beginY = e.clientY;
                    beginLeft = self._btnThumb.offsetLeft;
                    beginTop = self._btnThumb.offsetTop;
                    $(self._btnThumb).addClass("tui-actived");
                    tui.mask();
                    $(document).on("mousemove", dragThumb);
                    $(document).on("mouseup", dragEnd);
                    self.fire("dragbegin", { value: self.value() });
                });

                this.refresh();
            }
            Scrollbar.prototype.total = function (val) {
                if (typeof val === "number") {
                    if (val < 0)
                        val = 0;
                    val = Math.round(val);
                    this.attr("data-total", val);
                    if (this.value() > val)
                        this.value(val);
                    else
                        this.refresh();
                    return this;
                } else {
                    var val = parseInt(this.attr("data-total"));
                    if (val === null || isNaN(val))
                        return 0;
                    else
                        return val;
                }
            };

            Scrollbar.prototype.value = function (val) {
                if (typeof val === "number") {
                    val = Math.round(val);
                    if (val < 0)
                        val = 0;
                    if (val > this.total())
                        val = this.total();
                    this.attr("data-value", val);
                    this.refresh();
                    return this;
                } else {
                    var val = parseInt(this.attr("data-value"));
                    if (val === null || isNaN(val))
                        return 0;
                    else
                        return val;
                }
            };

            Scrollbar.prototype.step = function (val) {
                if (typeof val === "number") {
                    val = Math.round(val);
                    if (val < 1)
                        val = 1;
                    if (val > this.total())
                        val = this.total();
                    this.attr("data-step", val);
                    if (val > this.page())
                        this.page(val);
                    else
                        this.refresh();
                    return this;
                } else {
                    var val = parseInt(this.attr("data-step"));
                    if (val === null || isNaN(val))
                        return this.total() > 0 ? 1 : 0;
                    else
                        return val;
                }
            };

            Scrollbar.prototype.page = function (val) {
                if (typeof val === "number") {
                    val = Math.round(val);
                    if (val < 1)
                        val = 1;
                    if (val > this.total())
                        val = this.total();
                    this.attr("data-page", val);
                    if (val < this.step())
                        this.step(val);
                    else
                        this.refresh();
                    return this;
                } else {
                    var val = parseInt(this.attr("data-page"));
                    if (val === null || isNaN(val))
                        return this.total() > 0 ? 1 : 0;
                    else
                        return val;
                }
            };

            Scrollbar.prototype.direction = function (val) {
                if (typeof val === "string") {
                    if (["horizontal", "vertical"].indexOf(val) >= 0) {
                        this.attr("data-direction", val);
                        this.refresh();
                    }
                    return this;
                } else {
                    var dir = this.attr("data-direction");
                    if (dir === null)
                        return "vertical";
                    else
                        return dir;
                }
            };

            Scrollbar.prototype.calculateValue = function (pos) {
                var total = this.total();
                if (total <= 0) {
                    return 0;
                }
                var len = 0;
                var val = 0;
                if (this.direction() === "vertical") {
                    len = this[0].clientHeight - this._btnHead.offsetHeight - this._btnFoot.offsetHeight - this._btnThumb.offsetHeight;
                    val = (pos - this._btnHead.offsetHeight) / len * total;
                } else {
                    len = this[0].clientWidth - this._btnHead.offsetWidth - this._btnFoot.offsetWidth - this._btnThumb.offsetWidth;
                    val = (pos - this._btnHead.offsetWidth) / len * total;
                }
                val = Math.round(val);
                if (val < 0)
                    val = 0;
                if (val > total)
                    val = total;
                return val;
            };

            Scrollbar.prototype.refresh = function () {
                var val = this.value();
                var total = this.total();
                var step = this.step();
                var page = this.page();
                var vertical = (this.direction() === "vertical");
                if (total <= 0) {
                    this._btnThumb.style.display = "none";
                    return;
                } else
                    this._btnThumb.style.display = "";
                var minSize = (vertical ? this._btnHead.offsetHeight : this._btnHead.offsetWidth);
                var len = (vertical ? this[0].clientHeight - this._btnHead.offsetHeight - this._btnFoot.offsetHeight : this[0].clientWidth - this._btnHead.offsetWidth - this._btnFoot.offsetWidth);
                var thumbLen = Math.round(page / total * len);
                if (thumbLen < minSize)
                    thumbLen = minSize;
                if (thumbLen > len - 10)
                    thumbLen = len - 10;
                var scale = (val / total);
                if (scale < 0)
                    scale = 0;
                if (scale > 1)
                    scale = 1;
                var pos = minSize + Math.round(scale * (len - thumbLen)) - 1;
                if (vertical) {
                    this._btnThumb.style.height = (thumbLen > 0 ? thumbLen : 0) + "px";
                    this._btnThumb.style.top = pos + "px";
                } else {
                    this._btnThumb.style.width = (thumbLen > 0 ? thumbLen : 0) + "px";
                    this._btnThumb.style.left = pos + "px";
                }
            };
            Scrollbar.CLASS = "tui-scrollbar";
            return Scrollbar;
        })(ctrl.Control);
        ctrl.Scrollbar = Scrollbar;

        /**
        * Construct a scrollbar.
        * @param el {HTMLElement or element id or construct info}
        */
        function scrollbar(param) {
            return tui.ctrl.control(param, Scrollbar);
        }
        ctrl.scrollbar = scrollbar;

        tui.ctrl.registerInitCallback(Scrollbar.CLASS, scrollbar);
    })(tui.ctrl || (tui.ctrl = {}));
    var ctrl = tui.ctrl;
})(tui || (tui = {}));
//# sourceMappingURL=tui.scrollbar.js.map

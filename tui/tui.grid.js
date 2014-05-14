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
        var Grid = (function (_super) {
            __extends(Grid, _super);
            function Grid(el) {
                _super.call(this);
                this._tableId = tui.uuid();
                this._gridStyle = null;
                this._columns = null;
                this._data = null;
                // Scrolling relatived
                this._scrollTop = 0;
                this._scrollLeft = 0;
                this._bufferedLines = [];
                this._bufferedBegin = 0;
                this._bufferedEnd = 0;
                this._dispLines = 0;
                var self = this;
                if (el)
                    this.elem(el);
                else
                    this.elem("div", Grid.CLASS);
                this[0]._ctrl = this;
                this.attr("tabIndex", "0");
                this[0].innerHTML = "";
                if (document.createStyleSheet) {
                    this._gridStyle = document.createStyleSheet();
                } else {
                    this._gridStyle = document.createElement("style");
                    document.head.appendChild(this._gridStyle);
                }
                this._headline = document.createElement("div");
                this._headline.className = "tui-grid-head";
                this[0].appendChild(this._headline);
                this._hscroll = tui.ctrl.scrollbar();
                this._hscroll.direction("horizontal");
                this[0].appendChild(this._hscroll[0]);
                this._vscroll = tui.ctrl.scrollbar();
                this._vscroll.direction("vertical");
                this[0].appendChild(this._vscroll[0]);
                this._space = document.createElement("span");
                this._space.className = "tui-scroll-space";
                this[0].appendChild(this._space);
                this.refresh();
            }
            Grid.prototype.headHeight = function () {
                if (this.hasHead())
                    return this._headHeight;
                else
                    return 0;
            };

            Grid.colSize = function (size, def) {
                if (typeof size === "number" && !isNaN(size)) {
                    if (size < 0)
                        return 0;
                    else
                        return Math.round(size);
                } else
                    return def;
            };

            Grid.prototype.computeVScroll = function (mark) {
                var hScrollbarHeight = this._hscroll.hidden() ? 0 : this._hscroll[0].offsetHeight;
                var contentHeight = this._contentHeight;
                var innerHeight = this._boxHeight - hScrollbarHeight;
                var totalHeight = contentHeight + this.headHeight();
                this._dispLines = Math.ceil((innerHeight - this.headHeight()) / this._lineHeight);
                var vHidden = this._vscroll.hidden();
                if (totalHeight > innerHeight) {
                    this._vscroll[0].style.bottom = hScrollbarHeight + "px";
                    this._vscroll.total(totalHeight - innerHeight).value(this._scrollTop).step(this._lineHeight).page(innerHeight / totalHeight * (totalHeight - innerHeight));
                    this._vscroll.hidden(false);
                } else {
                    this._vscroll.hidden(true);
                    this._vscroll.total(0);
                }
                this._scrollTop = this._vscroll.value();
                if (vHidden !== this._vscroll.hidden()) {
                    this.computeHScroll(mark);
                    this.computeColumns();
                }
            };

            Grid.prototype.computeHScroll = function (mark) {
                mark.isHScrollComputed = true;
                var vScrollbarWidth = this._vscroll.hidden() ? 0 : this._vscroll[0].offsetWidth;
                var innerWidth = this._boxWidth - vScrollbarWidth;
                var hHidden = this._hscroll.hidden();
                if (this.hasHScroll()) {
                    this._contentWidth = 0;
                    var cols = (this._columns.length < 1 ? 1 : this._columns.length);
                    var defaultWidth = Math.floor((innerWidth - this._borderWidth * cols) / cols);
                    for (var i = 0; i < this._columns.length; i++) {
                        this._contentWidth += Grid.colSize(this._columns[i].width, defaultWidth) + this._borderWidth;
                    }
                    if (this._contentWidth > innerWidth) {
                        this._hscroll[0].style.right = vScrollbarWidth + "px";
                        this._hscroll.total(this._contentWidth - innerWidth).value(this._scrollLeft).step(10).page(innerWidth / this._contentWidth * (this._contentWidth - innerWidth));
                        this._hscroll.hidden(false);
                    } else {
                        this._hscroll.hidden(true);
                        this._hscroll.total(0);
                    }
                } else {
                    this._contentWidth = innerWidth;
                    this._hscroll.hidden(true);
                    this._hscroll.total(0);
                }
                this._scrollLeft = this._hscroll.value();
                if (hHidden !== this._hscroll.hidden())
                    this.computeVScroll(mark);
            };

            Grid.prototype.computeScroll = function () {
                this._boxWidth = this[0].clientWidth;
                this._boxHeight = this[0].clientHeight;
                var cell = document.createElement("span");
                cell.className = "tui-grid-cell";
                var line = document.createElement("span");
                line.className = "tui-grid-line";
                line.appendChild(cell);
                cell.innerHTML = "a";
                this[0].appendChild(line);
                this._lineHeight = line.offsetHeight;
                this._borderWidth = $(cell).outerWidth() - $(cell).width();
                cell.className = "tui-grid-header-cell";
                line.className = "tui-grid-header";
                this._headHeight = line.offsetHeight;
                this[0].removeChild(line);
                this._contentHeight = this._lineHeight * this._data.length();
                var mark = { isHScrollComputed: false };
                this._hscroll.hidden(true);
                this._vscroll.hidden(true);
                this.computeVScroll(mark);
                if (!mark.isHScrollComputed) {
                    this.computeHScroll(mark);
                    this.computeColumns();
                }
                if (!this._hscroll.hidden() && !this._vscroll.hidden()) {
                    this._space.style.display = "";
                } else
                    this._space.style.display = "none";
            };

            // Do not need call this function standalone,
            // it's always to be called by computeScroll function
            Grid.prototype.computeColumns = function () {
                var vScrollbarWidth = this._vscroll.hidden() ? 0 : this._vscroll[0].offsetWidth;
                var innerWidth = this._boxWidth - vScrollbarWidth;

                //_realWidth = new Array();
                var cols = (this._columns.length < 1 ? 1 : this._columns.length);
                var defaultWidth = Math.floor((innerWidth - this._borderWidth * cols) / cols);
                if (this.hasHScroll()) {
                    if (defaultWidth < 100)
                        defaultWidth = 100;
                    for (var i = 0; i < this._columns.length; i++) {
                        delete this._columns[i]["_important"];
                        this._columns[i].width = Grid.colSize(this._columns[i].width, defaultWidth);
                    }
                } else {
                    var totalNoBorderWidth = this._contentWidth - this._borderWidth * cols;
                    var totalNoImportantWidth = totalNoBorderWidth;
                    var totalNeedComputed = 0;
                    var percent = [];
                    var important = null;
                    for (var i = 0; i < this._columns.length; i++) {
                        if (typeof this._columns[i].width !== "number" || isNaN(this._columns[i].width))
                            this._columns[i].width = defaultWidth;
                        else if (this._columns[i].width < 0)
                            this._columns[i].width = 0;
                        if (this._columns[i]["_important"]) {
                            important = i;
                            delete this._columns[i]["_important"];
                            this._columns[i].width = Math.round(this._columns[i].width);
                            if (this._columns[i].width > totalNoBorderWidth) {
                                this._columns[i].width = totalNoBorderWidth;
                            }
                            totalNoImportantWidth -= this._columns[i].width;
                        } else
                            totalNeedComputed += Math.round(this._columns[i].width);
                    }
                    for (var i = 0; i < this._columns.length; i++) {
                        if (i !== important) {
                            if (totalNeedComputed === 0)
                                this._columns[i].width = 0;
                            else
                                this._columns[i].width = Math.floor(Math.round(this._columns[i].width) / totalNeedComputed * totalNoImportantWidth);
                        }
                    }
                    var total = 0;
                    for (var i = 0; i < this._columns.length; i++) {
                        total += this._columns[i].width;
                    }
                    if (total < totalNoBorderWidth && this._columns.length > 0)
                        this._columns[this._columns.length - 1].width += totalNoBorderWidth - total;
                }
                var cssText = "";
                for (var i = 0; i < this._columns.length; i++) {
                    var wd = this._columns[i].width;
                    cssText += (".tui-grid-" + this._tableId + "-" + i + "{width:" + wd + "px}");
                }
                if (document.createStyleSheet)
                    this._gridStyle.cssText = cssText;
                else
                    this._gridStyle.innerHTML = cssText;
            };

            Grid.prototype.drawHead = function () {
            };

            Grid.prototype.drawLine = function () {
            };

            Grid.prototype.drawLines = function () {
            };

            Grid.prototype.clearBufferLines = function () {
                if (!this[0])
                    return;
                for (var i = 0; i < this._bufferedLines.length; i++) {
                    var l = this._bufferedLines[i];
                    this[0].removeChild(l);
                }
                this._bufferedLines = [];
                this._bufferedEnd = this._bufferedBegin = 0;
            };

            Grid.prototype.hasHScroll = function (val) {
                if (typeof val === "boolean") {
                    this.is("data-has-hscroll", val);
                    this.refresh();
                    return this;
                } else
                    return this.is("data-has-hscroll");
            };

            Grid.prototype.hasHead = function (val) {
                if (typeof val === "boolean") {
                    this.is("data-has-head", val);
                    this.refresh();
                    return this;
                } else
                    return this.is("data-has-head");
            };

            Grid.prototype.columns = function (val) {
                if (val) {
                    this._columns = val;
                    this.refresh();
                    return this;
                } else {
                    if (!this._columns) {
                        var valstr = this.attr("data-columns");
                        this._columns = eval("(" + valstr + ")");
                    }
                    return this._columns;
                }
            };

            Grid.prototype.resizable = function (val) {
                if (typeof val === "boolean") {
                    this.is("data-resizable", val);

                    //this.createSplitters();
                    this.refresh();
                    return this;
                } else
                    return this.is("data-resizable");
            };

            Grid.prototype.data = function (data) {
                if (data) {
                    this._data = data;
                    return this;
                } else {
                    return this._data;
                }
            };

            Grid.prototype.refresh = function () {
                if (!this[0])
                    return;
                this.computeScroll();
                this.clearBufferLines();
                this.drawHead();
                this.drawLines();
            };
            Grid.CLASS = "tui-grid";
            return Grid;
        })(ctrl.Control);
        ctrl.Grid = Grid;

        /**
        * Construct a grid.
        * @param el {HTMLElement or element id or construct info}
        */
        function grid(param) {
            return tui.ctrl.control(param, Grid);
        }
        ctrl.grid = grid;

        tui.ctrl.registerInitCallback(Grid.CLASS, grid);
    })(tui.ctrl || (tui.ctrl = {}));
    var ctrl = tui.ctrl;
})(tui || (tui = {}));
//# sourceMappingURL=tui.grid.js.map

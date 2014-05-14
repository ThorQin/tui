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
        var Table = (function (_super) {
            __extends(Table, _super);
            function Table(el) {
                _super.call(this);
                this._splitters = [];
                this._columns = [];
                var self = this;
                if (el)
                    this.elem(el);
                else
                    throw new Error("Must specify a table control");
                this.addClass(Table.CLASS);
                this[0]._ctrl = this;
                if (tui.ieVer > 0 && tui.ieVer < 9)
                    this.addClass("tui-table-ie8");
                else
                    this.createSplitters();
                this.refresh();
            }
            Table.prototype.headLine = function () {
                var tb = this[0];
                if (!tb)
                    return null;
                return tb.rows[0];
            };

            Table.prototype.createSplitters = function () {
                var self = this;
                this._splitters.length = 0;
                var tb = this[0];
                if (!tb)
                    return;

                var headLine = this.headLine();
                if (!headLine)
                    return;

                for (var i = 0; i < this._splitters.length; i++) {
                    tui.removeNode(this._splitters[i]);
                }
                if (this.resizable()) {
                    for (var i = 0; i < headLine.cells.length; i++) {
                        var cell = headLine.cells[i];
                        var splitter = document.createElement("span");
                        splitter["colIndex"] = i;
                        splitter.className = "tui-table-splitter";
                        this._columns[i] = { width: $(cell).width() };
                        $(splitter).attr("unselectable", "on");
                        if (i < headLine.cells.length - 1)
                            headLine.cells[i + 1].appendChild(splitter);
                        else
                            headLine.cells[i].appendChild(splitter);
                        $(headLine).css("position", "relative");
                        this._splitters.push(splitter);
                        $(splitter).mousedown(function (e) {
                            var target = e.target;
                            var span = document.createElement("span");
                            span.className = "tui-table-splitter-move";
                            var pos = tui.offsetToPage(target);
                            span.style.left = pos.x + "px";
                            span.style.top = pos.y + "px";
                            span.style.height = $(tb).height() + "px";
                            var mask = tui.mask();
                            var srcX = e.clientX;
                            mask.appendChild(span);
                            mask.style.cursor = "col-resize";
                            function dragEnd(e) {
                                $(document).off("mousemove", onDrag);
                                $(document).off("mouseup", dragEnd);
                                tui.unmask();
                                var colIndex = target["colIndex"];
                                var tmpWidth = self._columns[colIndex].width + e.clientX - srcX;
                                if (tmpWidth < 0)
                                    tmpWidth = 0;
                                self._columns[colIndex].width = tmpWidth;
                                self._columns[colIndex].important = true;
                                self.refresh();
                                self.fire("resizecolumn", colIndex);
                            }
                            function onDrag(e) {
                                span.style.left = pos.x + e.clientX - srcX + "px";
                            }

                            $(document).mousemove(onDrag);
                            $(document).mouseup(dragEnd);
                        });
                    }
                }
            };

            Table.prototype.resizable = function (val) {
                if (typeof val === "boolean") {
                    this.is("data-resizable", val);
                    this.createSplitters();
                    this.refresh();
                    return this;
                } else
                    return this.is("data-resizable");
            };

            Table.prototype.refresh = function () {
                if (!this.resizable())
                    return;
                var tb = this[0];
                if (!tb)
                    return;
                var headLine = tb.rows[0];
                if (!headLine)
                    return;
                if (tui.ieVer > 0 && tui.ieVer < 9)
                    return;
                var cellPadding = headLine.cells.length > 0 ? $(headLine.cells[0]).outerWidth() - $(headLine.cells[0]).width() : 0;
                var defaultWidth = Math.floor(tb.offsetWidth / (headLine.cells.length > 0 ? headLine.cells.length : 1) - cellPadding);
                var totalWidth = 0;
                var computeWidth = tb.offsetWidth - cellPadding * (headLine.cells.length > 0 ? headLine.cells.length : 1);
                for (var i = 0; i < this._columns.length; i++) {
                    if (typeof this._columns[i].width !== "number") {
                        this._columns[i].width = defaultWidth;
                        totalWidth += defaultWidth;
                    } else if (!this._columns[i].important) {
                        totalWidth += this._columns[i].width;
                    } else {
                        if (this._columns[i].width > computeWidth)
                            this._columns[i].width = computeWidth;
                        if (this._columns[i].width < 1)
                            this._columns[i].width = 1;
                        computeWidth -= this._columns[i].width;
                    }
                }
                for (var i = 0; i < this._columns.length; i++) {
                    if (!this._columns[i].important) {
                        if (totalWidth === 0)
                            this._columns[i].width = 0;
                        else
                            this._columns[i].width = Math.floor(this._columns[i].width / totalWidth * computeWidth);
                        if (this._columns[i].width < 1)
                            this._columns[i].width = 1;
                    } else {
                        this._columns[i].important = false;
                    }
                    if (tb.rows.length > 0) {
                        var row = tb.rows[0];
                        $(row.cells[i]).css("width", this._columns[i].width + "px");
                    }
                }
                var headLine = this.headLine();
                for (var i = 0; i < this._splitters.length; i++) {
                    var splitter = this._splitters[i];

                    //var left = tui.offsetToPage(<HTMLElement>headLine.cells[i], tb).x;
                    //splitter.style.left = left + (<any>headLine.cells[i]).offsetWidth + "px";
                    //splitter.style.height = headLine.offsetHeight + "px";
                    if (i < this._splitters.length - 1)
                        $(splitter).css({ "left": "-3px", "right": "auto", "height": headLine.offsetHeight + "px" });
                    else
                        $(splitter).css({ "right": "-3px", "left": "auto", "height": headLine.offsetHeight + "px" });
                }
            };
            Table.CLASS = "tui-table";
            return Table;
        })(ctrl.Control);
        ctrl.Table = Table;

        /**
        * Construct a table control.
        * @param el {HTMLElement or element id or construct info}
        */
        function table(param) {
            return tui.ctrl.control(param, Table);
        }
        ctrl.table = table;

        tui.ctrl.registerInitCallback(Table.CLASS, table);
    })(tui.ctrl || (tui.ctrl = {}));
    var ctrl = tui.ctrl;
})(tui || (tui = {}));
//# sourceMappingURL=tui.table.js.map

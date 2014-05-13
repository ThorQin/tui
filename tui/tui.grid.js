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
                this._value = null;
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
            }
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

            Grid.prototype.value = function (value) {
                if (value) {
                    this._value = value;
                    return this;
                } else {
                    return this._value;
                }
            };

            Grid.prototype.refresh = function () {
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

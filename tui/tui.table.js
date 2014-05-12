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
                var self = this;
                if (el)
                    this.elem(el);
                else
                    this.elem("table", Table.CLASS);
                this[0]._ctrl = this;
                this.attr("tabIndex", "0");
                this[0].innerHTML = "";
            }
            Table.prototype.resizable = function (val) {
                if (typeof val === "boolean") {
                    this.is("data-resizable", val);
                    this.refresh();
                    return this;
                } else
                    return this.is("data-resizable");
            };

            Table.prototype.refresh = function () {
            };
            Table.CLASS = "tui-table";
            return Table;
        })(ctrl.Control);
        ctrl.Table = Table;

        /**
        * Construct a grid.
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

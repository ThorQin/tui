/// <reference path="tui.core.ts" />
var tui;
(function (tui) {
    var ArrayProvider = (function () {
        function ArrayProvider(data) {
            if (data && data instanceof Array) {
                this._src = this._data = data;
            } else if (data && (data.header && data.data)) {
                this._src = this._data = data.data;
                this._header = data.header;
            }
        }
        ArrayProvider.prototype.length = function () {
            if (this._data)
                return this._data.length;
            else
                return 0;
        };
        ArrayProvider.prototype.at = function (index) {
            if (this._data)
                return this._data[index];
            else
                return null;
        };
        ArrayProvider.prototype.slice = function (start, end) {
            if (this._data)
                return this._data.slice(start, end);
            else
                return [];
        };

        ArrayProvider.prototype.sort = function (key, desc) {
            if (typeof desc === "undefined") { desc = false; }
            if (this._src) {
                if (typeof key === "function") {
                    this._data = this._src.sort(key);
                } else {
                    if (this._header) {
                        key = this._header.indexOf(key);
                    }
                    this._data = this._src.sort(function (a, b) {
                        if (a[key] > b[key]) {
                            return desc ? -1 : 1;
                        } else if (a[key] < b[key]) {
                            return desc ? 1 : -1;
                        } else {
                            return 0;
                        }
                    });
                }
                return this;
            } else if (key === null) {
                this._data = this._src;
                return this;
            }
        };
        return ArrayProvider;
    })();
    tui.ArrayProvider = ArrayProvider;

    var RemoteCursorProvider = (function () {
        function RemoteCursorProvider(result) {
        }
        RemoteCursorProvider.prototype.length = function () {
            return this._length;
        };
        RemoteCursorProvider.prototype.at = function (index) {
        };
        RemoteCursorProvider.prototype.slice = function (start, end) {
        };
        RemoteCursorProvider.prototype.sort = function (key, desc) {
        };
        RemoteCursorProvider.prototype.onfill = function (callback) {
        };
        return RemoteCursorProvider;
    })();
    tui.RemoteCursorProvider = RemoteCursorProvider;
})(tui || (tui = {}));
//# sourceMappingURL=tui.dataprovider.js.map

﻿/// <reference path="tui.core.ts" />
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

        ArrayProvider.prototype.sort = function (key, desc, func) {
            if (this._src) {
                if (typeof func === "function") {
                    this._data = this._src.sort(func);
                } else if (key === null && func === null) {
                    this._data = this._src;
                    return this;
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
            } else {
                this._data = null;
            }
            return this;
        };
        return ArrayProvider;
    })();
    tui.ArrayProvider = ArrayProvider;

    var RemoteCursorProvider = (function () {
        function RemoteCursorProvider(cacheSize) {
            if (typeof cacheSize === "undefined") { cacheSize = 100; }
            this._cacheSize = cacheSize;
            this._invalid = true;
            this._data = [];
            this._begin = 0;
            this._length = 0;
            this._sortKey = null;
        }
        RemoteCursorProvider.prototype.length = function () {
            if (this._invalid) {
                this.doQuery(0);
                return 0;
            }
            return this._length;
        };

        RemoteCursorProvider.prototype.at = function (index) {
            if (index < 0 || index >= this.length()) {
                return null;
            } else if (this._invalid || index < this._begin || index >= this._begin + this._data.length) {
                this.doQuery(index);
                return null;
            } else
                return this._data[index - this._begin];
        };

        RemoteCursorProvider.prototype.sort = function (key, desc, func) {
            this._sortKey = key;
            this._desc = desc;
            this._invalid = true;
            return this;
        };

        RemoteCursorProvider.prototype.doQuery = function (begin) {
            var _this = this;
            if (typeof this._queryCallback === "function") {
                this._queryCallback({
                    begin: begin,
                    cacheSize: this._cacheSize,
                    sortKey: this._sortKey,
                    sortDesc: this._desc,
                    update: function (data, length, begin) {
                        _this._data = data;
                        _this._length = length;
                        _this._begin = begin;
                        if (typeof _this._updateCallback === "function") {
                            _this._updateCallback({
                                length: _this._length,
                                begin: _this._begin,
                                data: _this._data
                            });
                        }
                    }
                });
            }
        };

        RemoteCursorProvider.prototype.onupdate = function (callback) {
            this._updateCallback = callback;
        };

        // Cursor own functions
        RemoteCursorProvider.prototype.onquery = function (callback) {
            this._queryCallback = callback;
        };
        return RemoteCursorProvider;
    })();
    tui.RemoteCursorProvider = RemoteCursorProvider;
})(tui || (tui = {}));
//# sourceMappingURL=tui.dataprovider.js.map
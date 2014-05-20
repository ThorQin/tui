/// <reference path="tui.core.ts" />

module tui {

	export interface IQueryInfo {
		begin: number;
		cacheSize: number;
		sortKey: string;
		sortDesc: boolean;
		update: (info: { data: any[]; length: number; begin: number; head?: string[];}) => void;
	}

	export interface IUpdateInfo {
		length: number;
		begin: number;
		data: any[];
	}

	export interface IDataProvider {
		length(): number;
		at(index: number): any;
		columnKeyMap(): {};
		sort(key: any, desc: boolean, func?: (a: any, b: any) => number): IDataProvider;
		onupdate? (callback: (updateInfo: IUpdateInfo) => void);
	}

	export interface IQueryResult {
		length: number;
		head?: string[];
		data: any[];
	}

	export class ArrayProvider implements IDataProvider {
		private _src: any[];
		private _data: any[];
		private _head: string[];
		private _headCache: {} = {};

		constructor(result: IQueryResult);
		constructor(data: any[]);
		constructor(data: any) {
			if (data && data instanceof Array) {
				this._src = this._data = data;
			} else if (data && (data.head && data.data )) {
				this._src = this._data = data.data;
				this._head = data.head;
			}
		}
		length(): number {
			if (this._data)
				return this._data.length;
			else
				return 0;
		}
		at(index: number): any {
			if (this._data)
				return this._data[index];
			else
				return null;
		}
		columnKeyMap(): {} {
			if (this._head) {
				var map = {};
				for (var i = 0; i < this._head.length; i++) {
					map[this._head[i]] = i;
				}
				return map;
			} else
				return {};
		}
		sort(key: any, desc: boolean, func: (a: any, b: any) => number = null): ArrayProvider {
			if (this._src) {
				if (typeof func === "function") {
					this._data = this._src.concat();
					this._data.sort(func);
				} else if (key === null && func === null) {
					this._data = this._src;
					return this;
				} else {
					if (this._head && typeof key === "string") {
						key = this._head.indexOf(key);
					}
					this._data = this._src.concat();
					this._data.sort(function (a: any, b: any): number {
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
		}
	}

	

	export class RemoteCursorProvider implements IDataProvider {
		private _head: string[];
		private _length: number;
		private _invalid: boolean;
		private _data: any[];
		private _cacheSize: number;
		private _begin: number;
		private _sortKey: string;
		private _desc: boolean;
		private _queryCallback: (queryInfo: IQueryInfo) => void;
		private _updateCallback: (updateInfo: IUpdateInfo) => void;
		private _queryTimer: number = null;

		constructor(cacheSize: number = 100) {
			this._cacheSize = cacheSize;
			this._invalid = true;
			this._data = [];
			this._begin = 0;
			this._length = 0;
			this._sortKey = null;
		}

		length(): number {
			if (this._invalid) {
				this.doQuery(0);
			}
			return this._length;
		}

		at(index: number): any {
			if (index < 0 || index >= this.length()) {
				return null;
			} else if (this._invalid ||
				index < this._begin ||
				index >= this._begin + this._data.length) {
				this.doQuery(index);
			}
			if (index >= this._begin ||
				index < this._begin + this._data.length)
				return this._data[index - this._begin];
			else
				return null;
		}
		columnKeyMap(): {} {
			if (this._head) {
				var map = {};
				for (var i = 0; i < this._head.length; i++) {
					map[this._head[i]] = i;
				}
				return map;
			} else
				return {};
		}
		sort(key: any, desc: boolean, func: (a: any, b: any) => number = null): RemoteCursorProvider {
			this._sortKey = key;
			this._desc = desc;
			this._invalid = true;
			return this;
		}

		private _firstQuery = true;

		private doQuery(begin: number) {
			if (typeof this._queryCallback !== "function") {
				return;
			}
			if (this._queryTimer !== null)
				clearTimeout(this._queryTimer);
			var self = this;
			var cacheBegin = begin - Math.round(this._cacheSize / 2);
			if (cacheBegin < 0)
				cacheBegin = 0;
			var queryInfo = {
				begin: cacheBegin,
				cacheSize: this._cacheSize,
				sortKey: this._sortKey,
				sortDesc: this._desc,
				update: (info: { data: any[]; length: number; begin: number; head?: string[]; }) => {
					self._data = info.data;
					self._length = info.length;
					self._begin = info.begin;
					self._invalid = false;
					if (typeof info.head !== tui.undef) {
						self._head = info.head;
					}
					if (typeof self._updateCallback === "function") {
						self._updateCallback({
							length: self._length,
							begin: self._begin,
							data: self._data
						});
					}
				}
			};
			if (this._firstQuery) {
				this._firstQuery = false;
				this._queryCallback(queryInfo);
			} else {
				this._queryTimer = setTimeout(() => {
					this._firstQuery = true;
					this._queryTimer = null;
					this._queryCallback(queryInfo);
				}, 50);
			}
		}

		onupdate(callback: (updateInfo: IUpdateInfo) => void) {
			this._updateCallback = callback;
		}

		// Cursor own functions
		onquery(callback: (queryInfo: IQueryInfo) => void) {
			this._queryCallback = callback;
		}
	}
}
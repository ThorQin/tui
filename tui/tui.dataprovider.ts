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
		addKeyMap(key: any, mapTo: any);
		removeKeyMap(key: any);
		cell(index: number, key: any): any;
		sort(key: any, desc: boolean, func?: (a: any, b: any) => number): IDataProvider;
		onupdate? (callback: (updateInfo: IUpdateInfo) => void);
		mapKey(key: any): any;
	}

	export interface IQueryResult {
		length: number;
		head?: string[];
		data: any[];
	}

	export class ArrayProvider implements IDataProvider {
		private _src: any[] = null;
		private _data: any[] = null;
		private _head: string[] = null;
		private _headCache: {} = {};
		private _mapping = {};
		private _realKeyMap = null;

		constructor(result: IQueryResult);
		constructor(data: any[]);
		constructor(data: any) {
			if (data && data instanceof Array) {
				this._src = this._data = data;
			} else if (data && data.data) {
				this._src = this._data = data.data;
				if (data.head)
					this._head = data.head;
				else
					this._head = null;
			} else
				throw new Error("TUI Grid: Unsupported data format!");
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
		cell(index: number, key: any): any {
			var row = this.at(index);
			if (!row)
				return null;
			var map = this.columnKeyMap();
			var realKey = map[key];
			if (realKey != null) {
				return row[realKey];
			} else {
				return row[key];
			}
		}
		columnKeyMap(): {} {
			if (this._realKeyMap !== null)
				return this._realKeyMap;
			if (this._head) {
				var map = {};
				for (var i = 0; i < this._head.length; i++) {
					map[this._head[i]] = i;
				}
				for (var k in this._mapping) {
					if (!this._mapping.hasOwnProperty(k))
						continue;
					var mapTo = this._mapping[k];
					if (map.hasOwnProperty(mapTo)) {
						map[k] = map[mapTo];
					} else {
						map[k] = mapTo;
					}
				}
				this._realKeyMap = map;
				return map;
			} else {
				this._realKeyMap = this._mapping;
				return this._mapping;
			}
		}
		mapKey(key: any): any {
			var map = this.columnKeyMap();
			var realKey = map[key];
			if (realKey != null) {
				return realKey;
			} else {
				return key;
			}
		}
		addKeyMap(key: any, mapTo: any) {
			this._mapping[key] = mapTo;
			this._realKeyMap = null;
		}
		removeKeyMap(key: any) {
			delete this._mapping[key];
			this._realKeyMap = null;
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

		/**
		 * ArrayDataProvider peculiar, get or set sorted data set
		 */
		data(result: IQueryResult): ArrayProvider;
		data(data: any[]): ArrayProvider;
		data(): any[];
		data(data?: any): any {
			if (data) {
				if (data instanceof Array) {
					this._src = this._data = data;
					return this;
				} else if (data.data) {
					this._src = this._data = data.data;
					if (data.head)
						this._head = data.head;
					else
						this._head = null;
					return this;
				} else
					throw new Error("TUI Grid: Unsupported data format!");
			} else {
				return this._data;
			}
		}

		/**
		 * ArrayDataProvider peculiar, get source data set
		 */
		src(): any[]{
			return this._src;
		}

		process(func: (input: any[]) => any[]) {
			this._data = func(this._src);
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
		private _mapping = {};
		private _realKeyMap = null;

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
		cell(index: number, key: any): any {
			var row = this.at(index);
			if (!row)
				return null;
			var map = this.columnKeyMap();
			var realKey = map[key];
			if (realKey != null) {
				return row[realKey];
			} else {
				return row[key];
			}
		}
		addKeyMap(key: any, mapTo: any) {
			this._mapping[key] = mapTo;
			this._realKeyMap = null;
		}
		removeKeyMap(key: any) {
			delete this._mapping[key];
			this._realKeyMap = null;
		}
		columnKeyMap(): {} {
			if (this._realKeyMap !== null)
				return this._realKeyMap;
			if (this._head) {
				var map = {};
				for (var i = 0; i < this._head.length; i++) {
					map[this._head[i]] = i;
				}
				for (var k in this._mapping) {
					if (!this._mapping.hasOwnProperty(k))
						continue;
					var mapTo = this._mapping[k];
					if (map.hasOwnProperty(mapTo)) {
						map[k] = map[mapTo];
					} else {
						map[k] = mapTo;
					}
				}
				this._realKeyMap = map;
				return map;
			} else {
				this._realKeyMap = this._mapping;
				return this._mapping;
			}
		}
		mapKey(key: any): any {
			var map = this.columnKeyMap();
			var realKey = map[key];
			if (realKey != null) {
				return realKey;
			} else {
				return key;
			}
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
				}, 100);
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
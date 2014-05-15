/// <reference path="tui.core.ts" />

module tui {

	export interface IQueryInfo {
		begin: number;
		cacheSize: number;
		sortKey: string;
		sortDesc: boolean;
		update: (data: any[], length: number, begin: number) => void;
	}

	export interface IUpdateInfo {
		length: number;
		begin: number;
		data: any[];
	}

	export interface IDataProvider {
		length(): number;
		at(index: number): any;
		sort(key: any, desc: boolean, func?: (a: any, b: any) => number): IDataProvider;
		onupdate? (callback: (updateInfo: IUpdateInfo) => void);
	}

	export interface IQueryResult {
		length: number;
		header?: string[];
		data: any[];
	}

	export class ArrayProvider implements IDataProvider {
		private _src: any[];
		private _data: any[];
		private _header: string[];

		constructor(result: IQueryResult);
		constructor(data: any[]);
		constructor(data: any) {
			if (data && data instanceof Array) {
				this._src = this._data = data;
			} else if (data && (data.header && data.data )) {
				this._src = this._data = data.data;
				this._header = data.header;
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
	
		sort(key: any, desc: boolean, func?: (a: any, b: any) => number): ArrayProvider {
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
					this._data = this._src.sort(function (a: any, b: any): number {
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
		private _header: string[];
		private _length: number;
		private _invalid: boolean;
		private _data: any[];
		private _cacheSize: number;
		private _begin: number;
		private _sortKey: string;
		private _desc: boolean;
		private _queryCallback: (queryInfo: IQueryInfo) => void;
		private _updateCallback: (updateInfo: IUpdateInfo) => void;

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
				return 0;
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
				return null;
			} else
				return this._data[index - this._begin];
		}

		sort(key: any, desc: boolean, func?: (a: any, b: any) => number): RemoteCursorProvider {
			this._sortKey = key;
			this._desc = desc;
			this._invalid = true;
			return this;
		}

		private doQuery(begin: number) {
			if (typeof this._queryCallback === "function") {
				this._queryCallback({
					begin: begin,
					cacheSize: this._cacheSize,
					sortKey: this._sortKey,
					sortDesc: this._desc,
					update: (data: any[], length: number, begin: number) => {
						this._data = data;
						this._length = length;
						this._begin = begin;
						if (typeof this._updateCallback === "function") {
							this._updateCallback({
								length: this._length,
								begin: this._begin,
								data: this._data
							});
						}
					}
				});
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
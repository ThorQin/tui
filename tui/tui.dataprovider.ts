/// <reference path="tui.core.ts" />
module tui {

	export interface IDataProvider<T> {
		length(): number;
		at(index: number): any;
		slice(start: number, end?: number): any[];
		sort(key: any, desc?: boolean): T;
		onfill? (callback: (index: number, line: any) => void);
	}

	export interface IQueryResult {
		length: number;
		header?: string[];
		data: any[];
	}

	export class ArrayProvider implements IDataProvider<ArrayProvider> {
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
		slice(start: number, end?: number): any[] {
			if (this._data)
				return this._data.slice(start, end);
			else
				return [];
		}
		sort(compareFn?: (a: any, b: any) => number, desc?: boolean): ArrayProvider;
		sort(key: any, desc: boolean = false): ArrayProvider {
			if (this._src) {
				if (typeof key === "function") {
					this._data = this._src.sort(key);
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
				return this;
			} else if (key === null) {
				this._data = this._src;
				return this;
			}
		}
	}


	export class RemoteCursorProvider implements IDataProvider<RemoteCursorProvider> {
		private _header: string[];
		private _length: number;
		private _data: any[];

		constructor(result: IQueryResult) {

		}
		length(): number {
			return this._length;
		}
		at(index: number): any {
		}
		slice(start: number, end?: number): any[] {

		}
		sort(key: any, desc?: boolean): RemoteCursorProvider {
		}
		onfill(callback: (index: number, line: any) => void) {
		}
	}
}
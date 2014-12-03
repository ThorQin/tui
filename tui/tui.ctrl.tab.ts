﻿/// <reference path="tui.ctrl.control.ts" />
module tui.ctrl {
	export class Tab extends Control<Tab> {
		static CLASS: string = "tui-tab";
		private _tabId = "tab-" + tui.uuid();
		private _buttons: Radiobox[] = [];

		constructor(el?: HTMLElement) {
			super("div", Tab.CLASS, el);
			var self = this;
			var removeList = [];
			var activeIndex = 0;
			for (var i = 0; i < this[0].childNodes.length; i++) {
				var child = (<HTMLElement>this[0]).childNodes[i];
				if (child.nodeName.toLowerCase() === "span" || child.nodeName.toLowerCase() === "a") {
					$(child).addClass("tui-radiobox");
					var button = tui.ctrl.radiobox(<HTMLElement>child);
					button.group(this._tabId);
					this._buttons.push(button);
					if (button.checked())
						activeIndex = this._buttons.length - 1;
					button.on("check", function(data){
						self.checkPage(data.ctrl);
					});
				} else
					removeList.push(child);
			}
			//for (var i = 0; i < removeList.length; i++) {
			//	tui.removeNode(removeList[i]);
			//}
			this.at(activeIndex).checked(true);
		}

		private checkPage(button: any) {
			var tabId = button.attr("data-tab");
			tabId = "#" + tabId;
			if (button.checked()) {
				$(tabId).removeClass("tui-hidden");
				tui.ctrl.initCtrls($(tabId)[0]);
			} else {
				$(tabId).addClass("tui-hidden");
			}
			this.fire("active", {index: this._buttons.indexOf(button), text: button.text()});
		}

		at(index: number): Radiobox {
			if (index >= 0 && index < this._buttons.length)
				return this._buttons[index];
			else
				return null;
		}
		
		count(): number {
			return this._buttons.length;
		}

		add(name: string): Radiobox;
		add(name: string, index: number): Radiobox;
		add(name: string, index?: number): Radiobox {
			var self = this;
			if (typeof index === "number") {
				if (index >= this._buttons.length)
					return null;
			}			
			var button = tui.ctrl.radiobox();
			button.text(name);
			button.group(this._tabId);
			button.on("check", function(data){
				self.checkPage(data.ctrl);
			});
			if (typeof index === tui.undef) {
				this[0].appendChild(button[0]);
				this._buttons.push(button);
			} else {
				this[0].insertBefore(button[0], this.at(index)[0]);
				this._buttons.splice(index, 0, button);
			}
			return button;
		}

		remove(index: number): Radiobox {
			var button = this.at(index);
			if (button) {
				this._buttons.splice(index, 1);
				tui.removeNode(button[0]);
				if (index < this._buttons.length)
					this.active(index);
				else if (this._buttons.length > 0)
					this.active(this._buttons.length - 1);
				return button;
			}
			return null;
		}

		active(): number;
		active(index: number): Tab;
		active(index?: number): any {
			if (typeof index !== tui.undef) {
				var button = this.at(index);
				if (button) {
					button.checked(true);
					this.checkPage(button);
				}
				return this;
			} else {
				for (var i = 0; i < this._buttons.length; i++) {
					if (this._buttons[i].checked())
						return i;
				}
				return -1;
			}
		}
	}

	export function tab(elem: HTMLElement): Tab;
	export function tab(elemId: string): Tab;
	export function tab(): Tab;
	export function tab(param?: any): Tab {
		return tui.ctrl.control(param, Tab);
	}
	tui.ctrl.registerInitCallback(Tab.CLASS, tab);
}
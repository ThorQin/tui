﻿/// <reference path="tui.ctrl.control.ts" />
/// <reference path="tui.ctrl.button.ts" />
/// <reference path="tui.ctrl.textarea.ts" />
module tui {
	export module ctrl {
		var _dialogStack: Dialog[] = [];
		var _mask: HTMLDivElement = document.createElement("div");
		_mask.className = "tui-dialog-mask";
		_mask.setAttribute("unselectable", "on");
		var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
		$(_mask).on(mousewheelevt + " selectstart", function (ev) {
			ev.stopPropagation();
			ev.preventDefault();
		});

		function reorder() {
			if (_mask.parentNode !== null) {
				_mask.parentNode.removeChild(_mask);
			}
			if (_dialogStack.length > 0) {
				document.body.insertBefore(_mask, _dialogStack[_dialogStack.length - 1].elem());
			} else {
			}
		}

		function push(dlg: Dialog) {
			_dialogStack.push(dlg);
			document.body.appendChild(dlg.elem());
			reorder();
		}

		function remove(dlg: Dialog) {
			var index = _dialogStack.indexOf(dlg);
			if (index >= 0) {
				_dialogStack.splice(index, 1);
			}
			document.body.removeChild(dlg.elem());
			reorder();
		}

		function getParent(dlg: Dialog): Dialog {
			var index = _dialogStack.indexOf(dlg);
			if (index > 0) {
				_dialogStack[index - 1];
			} else
				return null;
		}

		export interface DialogButton {
			name: string;
			id?: string;
			cls?: string;
			func?: (data: {}) => any;
		}

		export class Dialog extends Control<Dialog> {
			static CLASS: string = "tui-dialog";
			private _titleDiv: HTMLDivElement;
			private _contentDiv: HTMLDivElement;
			private _buttonDiv: HTMLDivElement;
			private _closeIcon: HTMLSpanElement;
			private _resourceElement: HTMLElement = null;
			private _placeHolder: HTMLElement = null;
			private _hiddenOriginal: boolean = false;
			private _isMoved: boolean = false;
			private _isInitialize: boolean = true;
			private _titleText: string = null;
			private _noRefresh: boolean = false;
			private _useEsc: boolean = true;
			private _sizeTimer: number = null;
			private _originScrollHeight: number = null;
			private _originScrollWidth: number = null;

			constructor() {
				super("div", Dialog.CLASS, null);
			}

			/**
			 * Show HTML content
			 */
			showContent(content: string, title?: string, buttons?: DialogButton[]) {
				if (this[0])
					return this;
				this._resourceElement = null;
				this._placeHolder = null;
				return this.showElement(<HTMLElement>tui.toElement(content, true), title, buttons);
			}

			/**
			 * Show resource form <script type="text/html"> ... </script>
			 */
			showResource(resourceId: string, title?: string, buttons?: DialogButton[]) {
				if (this[0])
					return this;
				var elem = document.getElementById(resourceId);
				if (!elem) {
					throw new Error("Resource id not found: " + resourceId);
				}
				return this.showContent(elem.innerHTML, title, buttons);
			}

			/**
		     * Show a element from page, put the element into the dialog, 
			 * when dialog closed the specify element will be put back to its original place.
			 */
			showElement(elem: any, title?: string, buttons?: DialogButton[]) {
				if (this[0])
					return this;
				if (typeof elem === "string") {
					var elemId = elem;
					elem = document.getElementById(elem);
				}
				if (!elem) {
					throw new Error("Invalid element!");
				}
				this._resourceElement = elem;
				if ($(elem).hasClass("tui-hidden"))
					this._hiddenOriginal = true;
				else
					this._hiddenOriginal = false;
				if (elem.parentNode !== null) {
					this._placeHolder = document.createElement("span");
					this._placeHolder.className = "tui-hidden";
					elem.parentNode.insertBefore(this._placeHolder, elem);
				} else
					this._placeHolder = null;
				// Temporary inhibit refresh to prevent unexpected calculation
				this._noRefresh = true;
				this.elem("div", Dialog.CLASS);
				this.attr("tabIndex", "-1");
				this._titleDiv = document.createElement("div");
				this._titleDiv.className = "tui-dlg-title-bar";
				this._titleDiv.setAttribute("unselectable", "on");
				this._titleDiv.onselectstart = function () { return false; };
				this[0].appendChild(this._titleDiv);
				this._closeIcon = document.createElement("span");
				this._closeIcon.className = "tui-dlg-close";
				this._titleDiv.appendChild(this._closeIcon);
				this._contentDiv = document.createElement("div");
				this[0].appendChild(this._contentDiv);
				this._buttonDiv = document.createElement("div");
				this._buttonDiv.className = "tui-dlg-btn-bar";
				this[0].appendChild(this._buttonDiv);
				var tt: string = "";
				if (typeof title === "string") {
					tt = title;
				} else {
					if (elem.title) {
						tt = elem.title;
					}
				}
				this.title(tt);
				this._contentDiv.appendChild(elem);
				$(elem).removeClass("tui-hidden");
				var self = this;
				if (buttons && typeof buttons.length === "number") {
					for (var i = 0; i < buttons.length; i++) {
						this.insertButton(buttons[i]);
					}
				} else {
					this.insertButton({
						name: str("Ok"),
						func: (data) => {
							self.close();
						}
					});
				}
				// Add to document
				push(this);
				// Convert all child elements into tui controls
				tui.ctrl.initCtrls(elem);
				this._isInitialize = true;
				this._isMoved = false;
				
				$(this._closeIcon).on("click", () => {
					this.close();
				});

				$(this._titleDiv).on("mousedown", (e) => {
					if (e.target === this._closeIcon)
						return;
					var dialogX = this[0].offsetLeft;
					var dialogY = this[0].offsetTop;
					var beginX = e.clientX;
					var beginY = e.clientY;
					var winSize: {
						width: number;
						height: number;
					} = { width: _mask.offsetWidth, height: _mask.offsetHeight };
					tui.mask();
					function onMoveEnd(e) {
						tui.unmask();
						$(document).off("mousemove", onMove);
						$(document).off("mouseup", onMoveEnd);
					}
					function onMove(e) {
						var l = dialogX + e.clientX - beginX;
						var t = dialogY + e.clientY - beginY;
						if (l > winSize.width - self[0].offsetWidth) l = winSize.width - self[0].offsetWidth;
						if (l < 0) l = 0;
						if (t > winSize.height - self[0].offsetHeight) t = winSize.height - self[0].offsetHeight;
						if (t < 0) t = 0;
						self[0].style.left = l + "px";
						self[0].style.top = t + "px";
						self._isMoved = true;
					}
					$(document).on("mousemove", onMove);
					$(document).on("mouseup", onMoveEnd);
				});
				$(this[0]).on(mousewheelevt, function (ev) {
					ev.stopPropagation();
					ev.preventDefault();
				});
				// After initialization finished preform refresh now.
				this._noRefresh = false;
				this[0].style.left = "0px";
				this[0].style.top = "0px";
				this.limitSize();
				this.refresh();
				this[0].focus();
				this.fire("open");
				this._sizeTimer = setInterval(function () {
					if (self._contentDiv.scrollHeight !== self._originScrollHeight ||
						self._contentDiv.scrollWidth !== self._originScrollWidth) {
						self.refresh();
						self._originScrollHeight = self._contentDiv.scrollHeight;
						self._originScrollWidth = self._contentDiv.scrollWidth;
					}
				}, 100);
				return this;
			}

			limitSize() {
				setTimeout(() => {
					this._contentDiv.style.maxHeight = "";
					this[0].style.maxWidth = _mask.offsetWidth + "px";
					this[0].style.maxHeight = _mask.offsetHeight + "px";
					this._contentDiv.style.maxHeight = _mask.offsetHeight - this._titleDiv.offsetHeight - this._buttonDiv.offsetHeight - $(this._contentDiv).outerHeight() + $(this._contentDiv).height() + "px";
					this._contentDiv.style.maxWidth = _mask.offsetWidth - $(this._contentDiv).outerWidth() + $(this._contentDiv).width() + "px";
					this.refresh();
				}, 0);
			}

			insertButton(btn: DialogButton, index?: number): Button {
				if (!this[0])
					return null;
				var button = tui.ctrl.button();
				button.text(btn.name);
				btn.id && button.id(btn.id);
				btn.cls && button.addClass(btn.cls);
				btn.func && button.on("click", btn.func);
				if (typeof index === "number" && !isNaN(index)) {
					var refButton = this._buttonDiv.childNodes[index];
					if (refButton)
						this._buttonDiv.insertBefore(button.elem(), refButton);
					else
						this._buttonDiv.appendChild(button.elem());
				} else {
					this._buttonDiv.appendChild(button.elem());
				}
				this.refresh();
				return button;
			}

			removeButton(btn: Button);
			removeButton(btnIndex: number);
			removeButton(btn: any) {
				if (!this[0])
					return;
				var refButton: HTMLElement;
				if (typeof btn === "number") {
					refButton = <HTMLElement>this._buttonDiv.childNodes[<number>btn];
				} else if (btn instanceof Button) {
					refButton = btn.elem();
				}
				this._buttonDiv.removeChild(refButton);
			}

			button(index: number): Button {
				if (!this[0])
					return null;
				var refButton: HTMLElement = <HTMLElement>this._buttonDiv.childNodes[index];
				if (refButton) {
					return tui.ctrl.button(refButton);
				} else
					return null;
			}

			removeAllButtons() {
				if (!this[0])
					return;
				this._buttonDiv.innerHTML = "";
			}

			useesc(): boolean;
			useesc(val: boolean): Dialog;
			useesc(val?: boolean): any {
				if (typeof val === "boolean") {
					this._useEsc = val;
					this.title(this.title());
				} else {
					return this._useEsc;
				}
			}

			title(): string;
			title(t: string): Dialog;
			title(t?: string): any {
				if (typeof t === "string") {
					if (!this[0])
						return this;
					if (this._closeIcon.parentNode)
						this._closeIcon.parentNode.removeChild(this._closeIcon);
					this._titleDiv.innerHTML = t;
					if (this._useEsc)
						this._titleDiv.appendChild(this._closeIcon);
					this._titleText = t;
					this.refresh();
					return this;
				} else {
					if (!this[0])
						return null;
					return this._titleText;
				}
			}

			close(): void {
				if (!this[0])
					return;
				clearInterval(this._sizeTimer);
				remove(this);
				this.elem(null);
				this._titleDiv = null;
				this._contentDiv = null;
				this._buttonDiv = null;
				this._closeIcon = null;
				this._titleText = null;
				if (this._placeHolder) {
					this._placeHolder.parentNode && this._placeHolder.parentNode.insertBefore(this._resourceElement, this._placeHolder);
					tui.removeNode(this._placeHolder);
					this._placeHolder = null;
					if (this._hiddenOriginal)
						$(this._resourceElement).addClass("tui-hidden");
					this._resourceElement = null;
				}
				this.fire("close");
			}

			refresh(): void {
				if (!this[0])
					return;
				if (this._noRefresh)
					return;
				// Change position
				var winSize: {
					width: number;
					height: number;
				} = {width: _mask.offsetWidth, height:_mask.offsetHeight };

				var box: {
					left: number;
					top: number;
					width: number;
					height: number;
				} = {
					left: this[0].offsetLeft,
					top: this[0].offsetTop,
					width: this[0].offsetWidth,
					height: this[0].offsetHeight
				};
				if (this._isInitialize) {
					var parent = getParent(this);
					var centX: number, centY: number;
					if (parent) {
						var e = parent.elem();
						centX = e.offsetLeft + e.offsetWidth / 2;
						centY = e.offsetTop + e.offsetHeight / 2;
						this._isMoved = true;
					} else {
						centX = winSize.width / 2;
						centY = winSize.height / 2;
						this._isMoved = false;
					}
					box.left = centX - box.width / 2;
					box.top = centY - box.height / 2;
					this._isInitialize = false;
				} else {
					if (!this._isMoved) {
						box.left = (winSize.width - box.width) / 2;
						box.top = (winSize.height - box.height) / 2;
					}
				}
				if (box.left + box.width > winSize.width)
					box.left = winSize.width - box.width;
				if (box.top + box.height > winSize.height)
					box.top = winSize.height - box.height;
				if (box.left < 0)
					box.left = 0;
				if (box.top < 0)
					box.top = 0;
				this[0].style.left = box.left + "px";
				this[0].style.top = box.top + "px";
			}
		}


		/**
		 * Construct a button.
		 * @param el {HTMLElement or element id or construct info}
		 */
		export function dialog(): Dialog {
			return tui.ctrl.control(null, Dialog);
		}


		$(document).on("keydown", (e) => {
			var k = e.keyCode;
			if (_dialogStack.length <= 0)
				return;
			var dlg = _dialogStack[_dialogStack.length - 1];
			if (k === 27) {
				dlg.useesc() && dlg.close();
			} else if (k === 9) {
				setTimeout(function () {
					if (!dlg.isPosterity(document.activeElement)) {
						dlg.focus();
					}
				}, 0);
			}
		});

		$(window).resize(() => {
			for (var i = 0; i < _dialogStack.length; i++) {
				_dialogStack[i].limitSize();
				_dialogStack[i].refresh();
			}
		});
	}
	
	function makeWarp(className, message) {
		var wrap = document.createElement("div");
		wrap.className = className;
		if (typeof message === null || message === undefined)
			message = "";
		else
			message += "";
		var testSpan = document.createElement("span");
		testSpan.style.position = "absolute";
		testSpan.style.visibility = "hidden";
		testSpan.style.display = "inline-block";
		testSpan.style.whiteSpace = "nowrap";
		testSpan.innerHTML = message;
		document.body.appendChild(testSpan);
		var realWidth = testSpan.offsetWidth;
		tui.removeNode(testSpan);
		if (realWidth < 400)
			wrap.innerHTML = message;
		else {
			var span = document.createElement("span");
			span.className = "tui-textarea tui-inline";
			var textarea = new tui.ctrl.TextArea(span);
			textarea.addClass("tui-dlg-long-msg");
			textarea.text(message);
			textarea.readonly(true);
			$(wrap).addClass("tui-dlg-long-warp");
			wrap.appendChild(textarea[0]);
		}
		return wrap;
	}

	export function msgbox(message: string, title?: string): ctrl.Dialog {
		var dlg = tui.ctrl.dialog();
		dlg.showElement(makeWarp("tui-dlg-msg", message), title);
		return dlg;
	}

	export function infobox(message: string, title?: string): ctrl.Dialog {
		var dlg = tui.ctrl.dialog();
		dlg.showElement(makeWarp("tui-dlg-warp tui-dlg-info", message), title);
		return dlg;
	}

	export function okbox(message: string, title?: string): ctrl.Dialog {
		var dlg = tui.ctrl.dialog();
		dlg.showElement(makeWarp("tui-dlg-warp tui-dlg-ok", message), title);
		return dlg;
	}

	export function errbox(message: string, title?: string): ctrl.Dialog {
		var dlg = tui.ctrl.dialog();
		dlg.showElement(makeWarp("tui-dlg-warp tui-dlg-err", message), title);
		return dlg;
	}

	export function warnbox(message: string, title?: string): ctrl.Dialog {
		var dlg = tui.ctrl.dialog();
		dlg.showElement(makeWarp("tui-dlg-warp tui-dlg-warn", message), title);
		return dlg;
	}

	export function askbox(message: string, title?: string, callback?: (result: boolean) => void): ctrl.Dialog {
		var dlg = tui.ctrl.dialog();
		var result = false;
		dlg.showElement(makeWarp("tui-dlg-warp tui-dlg-ask", message), title, [
			{
				name: str("Ok"), func: () => {
					result = true;
					dlg.close();
				}
			},{
				name: str("Cancel"), func: () => {
					dlg.close();
				}
			}
		]);
		dlg.on("close", () => {
			if (typeof callback === "function")
				callback(result);
		});
		return dlg;
	}

	export function waitbox(message: string, cancelProc: () => {} = null): ctrl.Dialog {
		var dlg = tui.ctrl.dialog();
		var wrap = document.createElement("div");
		wrap.className = "tui-dlg-warp tui-dlg-wait";
		wrap.innerHTML = message;
		if (typeof cancelProc === "function")
			dlg.showElement(wrap, null, [{
				name: str("Cancel"), func: function () {
					dlg.close();
					cancelProc();
				}
			}]);
		else {
			dlg.showElement(wrap, null, []);
		}
		dlg.useesc(false);
		return dlg;
	}
	
	export function progressbox(message: string, cancelProc: () => {} = null): ctrl.Dialog {
		var dlg = tui.ctrl.dialog();
		var outbox = document.createElement("div");
		var wrap = document.createElement("div");
		wrap.className = "tui-progress-title";
		wrap.innerHTML = message;
		outbox.appendChild(wrap);
		outbox.className = "tui-progress-wrap";
		var progressbar = document.createElement("div");
		progressbar.className = "tui-progress-bar";
		var progress = document.createElement("span");
		progress.className = "tui-progress";
		progressbar.appendChild(progress);
		var block = document.createElement("span");
		block.className = "tui-progress-block";
		progress.appendChild(block);
		var text = document.createElement("span");
		text.className = "tui-progress-text";
		text.innerHTML = "0%";
		progressbar.appendChild(text);
		outbox.appendChild(progressbar);
		if (typeof cancelProc === "function")
			dlg.showElement(outbox, null, [{
				name: str("Cancel"), func: function () {
					dlg.close();
					cancelProc();
				}
			}]);
		else {
			dlg.showElement(outbox, null, []);
		}
		dlg.useesc(false);
		dlg["text"] = function(value) {
			wrap.innerHTML = value;
		};
		dlg["progress"] = function(value: number) {
			if (typeof value !== "number" || isNaN(value))
				return;
			if (value < 0) value = 0;
			if (value > 100) value = 100;
			block.style.width = Math.floor(300 * (value / 100)) + "px";
			text.innerHTML = value + "%";
		};
		return dlg;
	}

	export function loadHTML(url: string, elem: HTMLElement, completeCallback?: (status: string, jqXHR: JQueryXHR) => any, async: boolean = true, method?: string, data?: any) {
		loadURL(url, function (status: string, jqXHR: JQueryXHR) {
			if (typeof completeCallback === "function" && completeCallback(status, jqXHR) === false) {
				return;
			}
			if (status === "success") {
				var matched = /<body[^>]*>((?:.|[\r\n])*)<\/body>/gim.exec(jqXHR.responseText);
				if (matched != null)
					elem.innerHTML = matched[1];
				else
					elem.innerHTML = jqXHR.responseText;
				tui.ctrl.initCtrls(elem);
			} else {
				tui.errbox(tui.str(status) + " (" + jqXHR.status + ")", tui.str("Failed"));
			}
		}, async, method, data);
	}
}

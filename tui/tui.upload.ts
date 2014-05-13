/// <reference path="tui.core.ts" />
module tui {

	function getBox(el): { left: number; top: number; right: number; bottom: number; } {
		var left, right, top, bottom;
		var offset = $(el).offset();
		left = offset.left;
		top = offset.top;
		right = left + el.offsetWidth;
		bottom = top + el.offsetHeight;
		return {
			left: left,
			right: right,
			top: top,
			bottom: bottom
		};
	}

	function copyLayout(from, to): void {
		var box = getBox(from);
		$(to).css({
			position: 'absolute',
			left: box.left + 'px',
			top: box.top + 'px',
			width: from.offsetWidth + 'px',
			height: from.offsetHeight + 'px'
		});
	}

	function fileFromPath(file): string {
		return file.replace(/.*(\/|\\)/, "");
	}

	function getExt(file): string {
		return (-1 !== file.indexOf('.')) ? file.replace(/.*[.]/, '') : '';
	}

	function preventDefault(e: JQueryEventObject) {
		return e.preventDefault();
	}

	export interface UploadOptions {
		// Location of the server-side upload script
		action: string;
		// File upload name
		name: string;
		// Select & upload multiple files at once FF3.6+, Chrome 4+
		multiple?: boolean;
		// Accept file type only worked with HTML5
		accept?: string;
		// Additional data to send
		data?: {};
		// Submit file as soon as it's selected
		autoSubmit?: boolean;
		// The type of data that you're expecting back from the server.
		// html and xml are detected automatically.
		// Only useful when you are using json data as a response.
		// Set to "json" in that case. 
		responseType?: string;
		// Class applied to button when mouse is hovered
		hoverClass?: string;
		// Class applied to button when button is focused
		focusClass?: string;
		// Class applied to button when AU is disabled
		disabledClass?: string;
    }

	export class UploadBinding extends EventObject {
		private _settings: UploadOptions = {
			action: "upload",
			name: "userfile",
			multiple: false,
			autoSubmit: true,
			responseType: "auto",
			hoverClass: "tui-input-btn-hover",
			focusClass: "tui-input-btn-active",
			disabledClass: "tui-input-btn-disabled"
		};
        private _button = null;           
		private _input = null;
		private _disabled = false;

		constructor(button: HTMLElement, options: UploadOptions);
		constructor(button: HTMLElement);
		constructor(buttonId: string, options: UploadOptions);
		constructor(buttonId: string);
		constructor(button, options?: UploadOptions) {
			super();
			if (options) {
				// Merge the users options with our defaults
				for (var i in options) {
					if (options.hasOwnProperty(i)) {
						this._settings[i] = options[i];
					}
				}
			}
			if (typeof button === "string") {
				if (/^#.*/.test(button)) {
					// If jQuery user passes #elementId don't break it
					button = button.slice(1);
				}
				button = document.getElementById(button);
			}
			if (!button || button.nodeType !== 1) {
				throw new Error("Please make sure that you're passing a valid element");
			}
			if ((<string>button.nodeName).toLowerCase() === 'a') {
				// disable link
				$(button).on('click', preventDefault);
			}
			// DOM element
			this._button = button;
			// DOM element                 
			this._input = null;
			this._disabled = false;

			this.installBind();
		}

		private createIframe() {
			var id = tui.uuid();
			var iframe = <HTMLIFrameElement>toElement('<iframe src="javascript:false;" name="' + id + '" />');
			iframe.setAttribute('id', id);
			iframe.style.display = 'none';
			document.body.appendChild(iframe);
			var doc = iframe.contentDocument ? iframe.contentDocument : window.frames[iframe.id].document;
			doc.charset = "utf-8";
			return iframe;
		}

		private createForm(iframe: HTMLIFrameElement) {
			var settings = this._settings;                  
			var form = <HTMLFormElement>toElement('<form method="post" enctype="multipart/form-data" accept-charset="UTF-8"></form>');
			form.setAttribute('accept-charset', 'UTF-8');
			if (settings.action)
				form.setAttribute('action', settings.action);
			form.setAttribute('target', iframe.name);
			form.style.display = 'none';
			document.body.appendChild(form);
			// Create hidden input element for each data key
			for (var prop in settings.data) {
				if (settings.data.hasOwnProperty(prop)) {
					var el = document.createElement("input");
					el.setAttribute('type', 'hidden');
					el.setAttribute('name', prop);
					el.setAttribute('value', settings.data[prop]);
					form.appendChild(el);
				}
			}
			return form;
        }

		private createInput() {
			var input = document.createElement("input");
			input.setAttribute('type', 'file');
			if (this._settings.accept)
				input.setAttribute('accept', this._settings.accept);
			input.setAttribute('name', this._settings.name);
			if (this._settings.multiple)
				input.setAttribute('multiple', 'multiple');
			if (tui.ieVer > 0)
				input.title = "";
			else
				input.title = " ";
			$(input).css({
				'position': 'absolute',
				'right': 0,
				'margin': 0,
				'padding': 0,
				'fontSize': '480px',
				'fontFamily': 'sans-serif',
				'cursor': 'pointer'
			});
			var div = document.createElement("div");
			$(div).css({
				'display': 'block',
				'position': 'absolute',
				'overflow': 'hidden',
				'margin': 0,
				'padding': 0,
				'opacity': 0,
				'direction': 'ltr',
				//Max zIndex supported by Opera 9.0-9.2
				'zIndex': 2147483583
			});
			// Make sure that element opacity exists.
			// Otherwise use IE filter
			if (div.style.opacity !== "0") {
				if (typeof (div.filters) === 'undefined') {
					throw new Error('Opacity not supported by the browser');
				}
				div.style.filter = "alpha(opacity=0)";
			}
			$(input).on('change', () => {
				if (!input || input.value === '') {
					return;
				}
				// Get filename from input, required                
				// as some browsers have path instead of it
				var file = fileFromPath(input.value);
				if (this.fire("change", { "file": file, "ext": getExt(file) }) === false) {
					this.clearInput();
					return;
				}
				// Submit form when value is changed
				if (this._settings.autoSubmit) {
					this.submit();
				}
			});
			$(input).on('mouseover', () => {
				$(this._button).addClass(this._settings.hoverClass);
			});
			$(input).on('mouseout', () => {
				$(this._button).removeClass(this._settings.hoverClass);
				$(this._button).removeClass(this._settings.focusClass);

				if (input.parentNode) {
					// We use visibility instead of display to fix problem with Safari 4
					// The problem is that the value of input doesn't change if it 
					// has display none when user selects a file
					(<HTMLElement>input.parentNode).style.visibility = 'hidden';
				}
			});
			$(input).on('focus', () => {
				$(this._button).addClass(this._settings.focusClass);
			});
			$(input).on('blur', () => {
				$(this._button).removeClass(this._settings.focusClass);
			});
			div.appendChild(input);
			document.body.appendChild(div);
			this._input = input;
		}

		private deleteInput() {
			if (!this._input) {
				return;
			}
			tui.removeNode(this._input.parentNode);
			this._input = null;
			$(this._button).removeClass(this._settings.hoverClass);
			$(this._button).removeClass(this._settings.focusClass);
		}

		private clearInput() {
			this.deleteInput();
			this.createInput();
		}

		/**
		* Gets response from iframe and fires onComplete event when ready
		* @param iframe
		* @param file Filename to use in onComplete callback 
		*/
		private processResponse(iframe: HTMLIFrameElement, file) {
			// getting response
			var toDeleteFlag = false, settings = this._settings;
			$(iframe).on('load', () => {
				if (// For Safari 
					iframe.src === "javascript:'%3Chtml%3E%3C/html%3E';" ||
					// For FF, IE
					iframe.src === "javascript:'<html></html>';") {
					// First time around, do not delete.
					// We reload to blank page, so that reloading main page
					// does not re-submit the post.
					if (toDeleteFlag) {
						// Fix busy state in FF3
						setTimeout(() => {
							tui.removeNode(iframe);
						}, 0);
					}
					return;
				}

				var doc = iframe.contentDocument ? iframe.contentDocument : window.frames[iframe.id].document;
				// fixing Opera 9.26,10.00
				if (doc.readyState && doc.readyState !== 'complete') {
					return;
				}
				// fixing Opera 9.64
				if (doc.body && doc.body.innerHTML === "false") {
					return;
				}
				var response;
				if (doc.XMLDocument) {
					// response is a xml document Internet Explorer property
					response = doc.XMLDocument;
				} else if (doc.body) {
					// response is html document or plain text
					response = doc.body.innerHTML;
					if (settings.responseType && settings.responseType.toLowerCase() === 'json') {
						if (doc.body.firstChild && doc.body.firstChild.nodeName.toUpperCase() === 'PRE') {
							doc.normalize();
							response = doc.body.firstChild.firstChild.nodeValue;
						}
						if (response) {
							try {
								response = eval("(" + response + ")");
							} catch (e) {
								response = null;
							}
						} else {
							response = null;
						}
					}
				} else {
					// response is a xml document
					response = doc;
				}
				this.fire("complete", { "file": file, "ext": getExt(file), "response": response });
				// Reload blank page, so that reloading main page
				// does not re-submit the post. Also, remember to
				// delete the frame
				toDeleteFlag = true;
				// Fix IE mixed content issue
				iframe.src = "javascript:'<html></html>';";
				tui.removeNode(iframe);
			});
        }

		submit(exparams?: string) {
			if (!this._input || this._input.value === '') {
				return;
			}
			var file = fileFromPath(this._input.value);
			// user returned false to cancel upload
			if (this.fire("submit", { "file": file, "ext": getExt(file) }) === false) {
				this.clearInput();
				return;
			}
			// sending request    
			var iframe = this.createIframe();
			var form = this.createForm(iframe);
			// assuming following structure
			// div -> input type='file'
			tui.removeNode(this._input.parentNode);
			$(this._button).removeClass(this._settings.hoverClass);
			$(this._button).removeClass(this._settings.focusClass);
			form.appendChild(this._input);
			var el = document.createElement("input");
			el.setAttribute('type', 'hidden');
			el.setAttribute('name', "exparams");
			el.setAttribute('value', exparams);
			form.appendChild(el);
			form.submit();
			// request set, clean up
			tui.removeNode(form);
			form = null;
			this.deleteInput();
			// Get response from iframe and fire onComplete event when ready
			this.processResponse(iframe, file);
			// get ready for next request
			this.createInput();
		}

		disabled(): boolean;
		disabled(val: boolean): UploadBinding;
		disabled(val?: boolean): any {
			if (typeof val === "boolean") {
				this._disabled = val;
				return this;
			} else
				return this._disabled;
		}

		private static makeBind = ((e: JQueryEventObject) => {
			var self = e.data.self;
			if (self._disabled) {
				return;
			}
			if (!self._input) {
				self.createInput();
			}
			var div = self._input.parentNode;
			copyLayout(self._button, div);
			div.style.visibility = 'visible';
		});

		installBind() {
			$(this._button).on('mouseover', {self:this}, UploadBinding.makeBind);
		}

		uninstallBind() {
			this.deleteInput();
			$(this._button).off('mouseover', UploadBinding.makeBind);
		}
		
	}

	export function bindUpload(button: HTMLElement, options: UploadOptions): UploadBinding;
	export function bindUpload(button: HTMLElement): UploadBinding;
	export function bindUpload(buttonId: string, options: UploadOptions): UploadBinding;
	export function bindUpload(buttonId: string): UploadBinding;
	export function bindUpload(button, options?: UploadOptions): UploadBinding {
		return new UploadBinding(button, options);
	}
}
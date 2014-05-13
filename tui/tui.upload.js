var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="tui.core.ts" />
var tui;
(function (tui) {
    function getBox(el) {
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

    function copyLayout(from, to) {
        var box = getBox(from);
        $(to).css({
            position: 'absolute',
            left: box.left + 'px',
            top: box.top + 'px',
            width: from.offsetWidth + 'px',
            height: from.offsetHeight + 'px'
        });
    }

    function fileFromPath(file) {
        return file.replace(/.*(\/|\\)/, "");
    }

    function getExt(file) {
        return (-1 !== file.indexOf('.')) ? file.replace(/.*[.]/, '') : '';
    }

    function preventDefault(e) {
        return e.preventDefault();
    }

    var UploadBinding = (function (_super) {
        __extends(UploadBinding, _super);
        function UploadBinding(button, options) {
            _super.call(this);
            this._settings = {
                action: "upload",
                name: "userfile",
                multiple: false,
                autoSubmit: true,
                responseType: "auto",
                hoverClass: "tui-input-btn-hover",
                focusClass: "tui-input-btn-active",
                disabledClass: "tui-input-btn-disabled"
            };
            this._button = null;
            this._input = null;
            this._disabled = false;
            if (options) {
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
            if (button.nodeName.toLowerCase() === 'a') {
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
        UploadBinding.prototype.createIframe = function () {
            var id = tui.uuid();
            var iframe = tui.toElement('<iframe src="javascript:false;" name="' + id + '" />');
            iframe.setAttribute('id', id);
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            var doc = iframe.contentDocument ? iframe.contentDocument : window.frames[iframe.id].document;
            doc.charset = "utf-8";
            return iframe;
        };

        UploadBinding.prototype.createForm = function (iframe) {
            var settings = this._settings;
            var form = tui.toElement('<form method="post" enctype="multipart/form-data" accept-charset="UTF-8"></form>');
            form.setAttribute('accept-charset', 'UTF-8');
            if (settings.action)
                form.setAttribute('action', settings.action);
            form.setAttribute('target', iframe.name);
            form.style.display = 'none';
            document.body.appendChild(form);

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
        };

        UploadBinding.prototype.createInput = function () {
            var _this = this;
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
            $(input).on('change', function () {
                if (!input || input.value === '') {
                    return;
                }

                // Get filename from input, required
                // as some browsers have path instead of it
                var file = fileFromPath(input.value);
                if (_this.fire("change", { "file": file, "ext": getExt(file) }) === false) {
                    _this.clearInput();
                    return;
                }

                // Submit form when value is changed
                if (_this._settings.autoSubmit) {
                    _this.submit();
                }
            });
            $(input).on('mouseover', function () {
                $(_this._button).addClass(_this._settings.hoverClass);
            });
            $(input).on('mouseout', function () {
                $(_this._button).removeClass(_this._settings.hoverClass);
                $(_this._button).removeClass(_this._settings.focusClass);

                if (input.parentNode) {
                    // We use visibility instead of display to fix problem with Safari 4
                    // The problem is that the value of input doesn't change if it
                    // has display none when user selects a file
                    input.parentNode.style.visibility = 'hidden';
                }
            });
            $(input).on('focus', function () {
                $(_this._button).addClass(_this._settings.focusClass);
            });
            $(input).on('blur', function () {
                $(_this._button).removeClass(_this._settings.focusClass);
            });
            div.appendChild(input);
            document.body.appendChild(div);
            this._input = input;
        };

        UploadBinding.prototype.deleteInput = function () {
            if (!this._input) {
                return;
            }
            tui.removeNode(this._input.parentNode);
            this._input = null;
            $(this._button).removeClass(this._settings.hoverClass);
            $(this._button).removeClass(this._settings.focusClass);
        };

        UploadBinding.prototype.clearInput = function () {
            this.deleteInput();
            this.createInput();
        };

        /**
        * Gets response from iframe and fires onComplete event when ready
        * @param iframe
        * @param file Filename to use in onComplete callback
        */
        UploadBinding.prototype.processResponse = function (iframe, file) {
            var _this = this;
            // getting response
            var toDeleteFlag = false, settings = this._settings;
            $(iframe).on('load', function () {
                if (iframe.src === "javascript:'%3Chtml%3E%3C/html%3E';" || iframe.src === "javascript:'<html></html>';") {
                    // First time around, do not delete.
                    // We reload to blank page, so that reloading main page
                    // does not re-submit the post.
                    if (toDeleteFlag) {
                        // Fix busy state in FF3
                        setTimeout(function () {
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
                            try  {
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
                _this.fire("complete", { "file": file, "ext": getExt(file), "response": response });

                // Reload blank page, so that reloading main page
                // does not re-submit the post. Also, remember to
                // delete the frame
                toDeleteFlag = true;

                // Fix IE mixed content issue
                iframe.src = "javascript:'<html></html>';";
                tui.removeNode(iframe);
            });
        };

        UploadBinding.prototype.submit = function (exparams) {
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
        };

        UploadBinding.prototype.disabled = function (val) {
            if (typeof val === "boolean") {
                this._disabled = val;
                return this;
            } else
                return this._disabled;
        };

        UploadBinding.prototype.installBind = function () {
            $(this._button).on('mouseover', { self: this }, UploadBinding.makeBind);
        };

        UploadBinding.prototype.uninstallBind = function () {
            this.deleteInput();
            $(this._button).off('mouseover', UploadBinding.makeBind);
        };
        UploadBinding.makeBind = (function (e) {
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
        return UploadBinding;
    })(tui.EventObject);
    tui.UploadBinding = UploadBinding;

    function bindUpload(button, options) {
        return new UploadBinding(button, options);
    }
    tui.bindUpload = bindUpload;
})(tui || (tui = {}));
//# sourceMappingURL=tui.upload.js.map

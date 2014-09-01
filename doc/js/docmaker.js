﻿var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var doc;
(function (_doc) {
    var tableType = {
        'param': ['参数', '类型', '描述'],
        'ret': ['返回值', '类型', '描述'],
        'method': ['方法', '类型', '描述'],
        'event': ['事件', '类型', '描述'],
        'prop': ['属性', '类型', '描述'],
        'const': ['常量', '类型', '描述']
    };
    var DocMaker = (function (_super) {
        __extends(DocMaker, _super);
        function DocMaker(catalog, contentDiv, edit) {
            if (typeof edit === "undefined") { edit = false; }
            var _this = this;
            _super.call(this);
            this._fullMenu = [
                { key: "edit", value: "编辑章节", icon: "fa-edit" },
                { value: "-" },
                { key: "addChild", value: "添加子章节" },
                { key: "insertBefore", value: "在本章节之前插入新章节" },
                { key: "insertAfter", value: "在本章节之后插入新章节" },
                { value: "-" },
                { key: "delete", value: "删除本章节以及所有子章节", icon: "fa-trash-o" }
            ];
            this._rootMenu = [
                { key: "edit", value: "编辑章节", icon: "fa-edit" },
                { value: "-" },
                { key: "addChild", value: "添加子章节" }
            ];
            this._dragStart = (function () {
                var self = _this;
                return function (data) {
                    var catalogList = self._catalog;
                    catalogList.foldRow(data.index);
                };
            })();
            this._dragEnd = (function () {
                var self = _this;
                return function (data) {
                    if (data.canceled)
                        return;
                    var catalogList = self._catalog;
                    var dragRow = catalogList.data().at(data.index);
                    if (!dragRow.__parent)
                        return;
                    var dp = dragRow.__parent;
                    var tagetRow = catalogList.data().at(data.targetIndex);
                    if (data.position === "before") {
                        if (!tagetRow.__parent)
                            return;
                        var tp = tagetRow.__parent;
                        var didx = dp.content.indexOf(dragRow);
                        dp.content.splice(didx, 1);
                        var tidx = tp.content.indexOf(tagetRow);
                        tp.content.splice(tidx, 0, dragRow);
                    } else if (data.position === "after") {
                        if (!tagetRow.__parent)
                            return;
                        var tp = tagetRow.__parent;
                        var didx = dp.content.indexOf(dragRow);
                        dp.content.splice(didx, 1);
                        var tidx = tp.content.indexOf(tagetRow);
                        tp.content.splice(tidx + 1, 0, dragRow);
                    } else {
                        var didx = dp.content.indexOf(dragRow);
                        dp.content.splice(didx, 1);
                        if (!tagetRow.content)
                            tagetRow.content = [];
                        tagetRow.content.push(dragRow);
                    }

                    //catalogList.data(catalogList.data());
                    self.refreshCatalog();
                    self.makeItem(self._doc, 0, null, 0, self._div);
                    self.fire("change", null);
                };
            })();
            this._edit = edit;
            if (typeof catalog === "string") {
                this._catalog = document.getElementById(catalog)["_ctrl"];
            } else if (typeof catalog === "object" && catalog)
                this._catalog = catalog;
            else
                throw new Error("Invalid parameter need a accordion group or a list control.");
            if (typeof contentDiv === "string")
                this._div = document.getElementById(contentDiv);
            else if (typeof contentDiv === "object" && contentDiv && contentDiv.nodeName)
                this._div = contentDiv;
            else
                throw new Error("Invalid parameter need a HTML element or specify element's id.");
        }
        DocMaker.prototype.makeTable = function (name, items, container) {
            var tb = document.createElement("table");
            tb.className = "doc-table";
            tb.cellPadding = "0";
            tb.cellSpacing = "0";
            tb.border = "0";
            var head = tb.insertRow(-1);
            var cols = tableType[name];
            for (var i = 0; i < cols.length; i++) {
                var th = document.createElement("th");
                th.innerHTML = cols[i];
                th.className = "doc-col-" + i;
                head.appendChild(th);
            }
            for (var i = 0; i < items.length; i++) {
                var row = tb.insertRow(-1);
                var item = items[i];
                for (var j = 0; j < cols.length; j++) {
                    row.insertCell(-1).innerHTML = item[j];
                }
            }
            container.appendChild(tb);
        };

        DocMaker.prototype.makeItem = function (item, idx, parent, level, container) {
            var _this = this;
            item.refresh = function () {
                container.innerHTML = "";
                var parentKey, parentNumber;
                parentKey = parent ? parent.key : null;
                parentNumber = parent ? parent.num : null;
                if (item.id) {
                    item.key = parentKey ? parentKey + "." + item.id : "#" + item.id;
                    item.num = (parentNumber ? parentNumber + "." : "") + (idx + 1);
                } else {
                    item.key = null;
                    item.num = null;
                }
                item.level = level;
                var caption = document.createElement("div");
                if (item.num)
                    caption.setAttribute("data-number", item.num);
                caption.innerHTML = item.name;
                if (_this._edit) {
                    var self = _this;
                    var btnMenu = tui.ctrl.button();
                    btnMenu.attr("data-menu", "test");
                    btnMenu.text("<i class='fa fa-bars'></i> 编辑");
                    if (parent === null)
                        btnMenu.menu(_this._rootMenu);
                    else
                        btnMenu.menu(_this._fullMenu);
                    btnMenu.menuPos("Rb");
                    btnMenu.on("select", function (data) {
                        if (data.item.key === "edit") {
                            self.showCaptionDialog(parent, item);
                        } else if (data.item.key === "insertBefore") {
                            self.showCaptionDialog(parent, idx, "before");
                        } else if (data.item.key === "insertAfter") {
                            self.showCaptionDialog(parent, idx, "after");
                        } else if (data.item.key === "addChild") {
                            self.showCaptionDialog(item);
                        } else if (data.item.key === "delete") {
                            tui.askbox("确认删除章节 '" + item.name + "' 吗？", "删除", function (result) {
                                if (result === true) {
                                    parent.content.splice(idx, 1);
                                    parent.refresh();
                                    self.refreshCatalog();
                                    self.fire("change", null);
                                }
                            });
                        }
                    });
                    caption.appendChild(btnMenu[0]);
                }
                if (item.key)
                    caption.id = item.key.substr(1);
                caption.className = "doc-caption doc-level-" + level;
                container.appendChild(caption);
                if (item.desc) {
                    var desc = document.createElement("div");
                    desc.innerHTML = item.desc;
                    desc.className = "doc-desc";
                    container.appendChild(desc);
                }
                for (var n in tableType) {
                    if (!tableType.hasOwnProperty(n))
                        continue;
                    if (item[n] && item[n].length > 0) {
                        _this.makeTable(n, item[n], container);
                    }
                }
                if (item.code) {
                    var code = document.createElement("pre");
                    code.innerHTML = item.code;
                    code.className = "tui-panel doc-code";
                    container.appendChild(code);
                }
                if (item.pic) {
                    var img = document.createElement("img");
                    img.src = item.pic;
                    img.className = "doc-pic";
                    container.appendChild(img);
                }
                if (item.content) {
                    for (var i = 0; i < item.content.length; i++) {
                        var child = item.content[i];
                        var childDiv = document.createElement("div");
                        childDiv.className = "doc-container doc-level-" + (level + 1);
                        _this.makeItem(child, i, item, level + 1, childDiv);
                        container.appendChild(childDiv);
                    }
                }
                tui.ctrl.initCtrls(container);
            };
            item.refresh();
        };

        DocMaker.prototype.showCaptionDialog = function (parent, item, pos) {
            var dlg = tui.ctrl.dialog();
            var self = this;
            var itemClone = (typeof item === "object" ? tui.clone(item, "__parent") : {});
            for (var n in tableType) {
                if (!itemClone.hasOwnProperty(n) || itemClone[n] === null)
                    itemClone[n] = [];
            }
            dlg.showResource("captionDlg", "段落", [
                {
                    name: "确定",
                    func: function () {
                        var fm = tui.ctrl.input("itemForm");
                        if (!fm.validate())
                            return;
                        var val = fm.value();
                        if (item && typeof item === "object") {
                            if (typeof val.id !== tui.undef)
                                item.id = val.id;
                            item.name = val.name;
                            item.desc = val.desc;
                            item.pic = val.pic;
                            item.code = val.code;
                            item.index = val.index;
                            for (var n in tableType) {
                                if (itemClone[n].length > 0)
                                    item[n] = itemClone[n];
                                else
                                    delete item[n];
                            }
                            item.refresh();
                        } else {
                            if (typeof val.id !== tui.undef)
                                itemClone.id = val.id;
                            itemClone.name = val.name;
                            itemClone.desc = val.desc;
                            itemClone.pic = val.pic;
                            itemClone.code = val.code;
                            itemClone.index = val.index;
                            var items;
                            if (parent.content)
                                items = parent.content;
                            else
                                items = parent.content = [];
                            if (typeof item === "number" && !isNaN(item)) {
                                if (pos === "before") {
                                    items.splice(item, 0, itemClone);
                                } else {
                                    items.splice(item + 1, 0, itemClone);
                                }
                            } else
                                items.push(itemClone);
                            parent.refresh();
                        }
                        dlg.close();
                        self.refreshCatalog();
                        self.fire("change", null);
                    }
                },
                {
                    name: "取消",
                    func: function () {
                        dlg.close();
                    }
                }]);
            var tb = tui.ctrl.grid("detailGrid");
            tui.ctrl.button("detailAdd").on("click", function () {
                var d = tb.data().src();
                d.push(["", "", ""]);
                tb.data(d);
                tb.editRow(d.length - 1);
            });
            function refreshTable() {
                var dtype = tui.ctrl.formAgent("selectedDetail").value();
                tb.data(itemClone[dtype]);
            }
            tui.on("param ret method event prop const", function () {
                refreshTable();
            });
            if (itemClone) {
                if (parent === null) {
                    tui.removeNode(document.getElementById("lineItemId"));
                }
                tui.ctrl.input("itemForm").value(itemClone);
                refreshTable();
            }
        };

        DocMaker.prototype.buildCatalog = function (doc, result, edit) {
            if (!doc)
                return;
            for (var i = 0; i < doc.length; i++) {
                var item = {};
                item.key = doc[i].key;
                item.value = doc[i].name;
                doc[i].expand = true;
                if (!edit)
                    item.checked = false;
                else
                    item.expand = true;
                result.push(item);
                if (doc[i].content && doc[i].content.length > 0 && (doc[i].index || edit)) {
                    item.children = [];
                    this.buildCatalog(doc[i].content, item.children, edit);
                }
            }
        };

        DocMaker.prototype.refreshCatalog = function () {
            //this.makeItems(doc, null, null, 0, this._div);
            var doc = this._doc;
            var catalog = [];
            var accordions = [];
            doc.expand = true;
            this.buildCatalog(doc.content, catalog, this._edit);

            // Then build catalog
            if (this._catalog instanceof tui.ctrl.List) {
                var catalogList = this._catalog;
                var dp = new tui.ArrayProvider([doc]);
                dp.addKeyMap("value", "name");
                dp.addKeyMap("children", "content");
                catalogList.data(dp);
            } else if (this._catalog instanceof tui.ctrl.AccordionGroup) {
                for (var i = 0; i < catalog.length; i++) {
                    var acc = tui.ctrl.accordion();
                    acc.caption(catalog[i].value);
                    if (i == 0)
                        acc.expanded(true);
                    acc.group(this._catalog.id());
                    var dp = new tui.ArrayProvider(catalog[i].children || []);
                    acc.data(dp);
                    this._catalog.addAccordion(acc);
                    accordions.push(acc);
                }
                setTimeout(function () {
                    for (var i = 0; i < accordions.length; i++) {
                        accordions[i].useAnimation(true);
                    }
                }, 0);
                this._catalog.refresh();
            }
        };

        DocMaker.prototype.make = function (doc) {
            if (!doc)
                return;
            this._doc = doc;
            var section = 1;

            // Build content first
            this.makeItem(doc, 0, null, 0, this._div);

            // Refresh catalog
            this.refreshCatalog();
            if (this._edit) {
                var catalogList = this._catalog;
                catalogList.on("rowdragstart", this._dragStart);
                catalogList.on("rowdragend", this._dragEnd);
            }
        };
        return DocMaker;
    })(tui.EventObject);
    _doc.DocMaker = DocMaker;
})(doc || (doc = {}));
//# sourceMappingURL=docmaker.js.map

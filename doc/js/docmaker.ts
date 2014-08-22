module doc {
	var tableType = {
		'param': ['参数', '类型', '描述'],
		'ret': ['返回值', '类型', '描述'],
		'method': ['方法', '类型', '描述'], 
		'event': ['事件', '类型', '描述'], 
		'prop': ['属性', '类型', '描述'], 
		'const': ['常量', '类型', '描述']
	};
	export class DocMaker extends tui.EventObject {
		private _catalog: any;
		private _div: HTMLElement;
		private _imagePath: string;
		private _edit: boolean;
		private _doc: any;

		constructor(catalog: any, contentDiv: any, imagePath: string = "image", edit: boolean = false) {
			super();
			this._edit = edit;
			this._imagePath = imagePath;
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

		private makeTable(name: string, items: any[], container: HTMLElement) {
			var tb = document.createElement("table");
			tb.className = "doc-table";
			tb.cellPadding = "0";
			tb.cellSpacing = "0";
			tb.border = "0";
			var head: HTMLTableRowElement = <HTMLTableRowElement>tb.insertRow(-1);
			var cols = tableType[name];
			for (var i = 0; i < cols.length; i++) {
				var th = document.createElement("th");
				th.innerHTML = cols[i];
				th.className = "doc-col-" + i;
				head.appendChild(th);
			}
			for (var i = 0; i < items.length; i++) {
				var row: HTMLTableRowElement = <HTMLTableRowElement>tb.insertRow(-1);
				var item = items[i];
				for (var j = 0; j < cols.length; j++) {
					row.insertCell(-1).innerHTML = item[j];
				}
			}
			container.appendChild(tb);
		}

		private _fullMenu = [
			{ key: "edit", value: "编辑章节", icon: "fa-edit" },
			{ value: "-" },
			{ key: "moveUp", value: "上移", icon: "fa-level-up" },
			{ key: "moveDown", value: "下移", icon: "fa-level-down" },
			{ key: "moveTo", value: "移动到...", icon: "fa-move" },
			{ value: "-" },
			{ key: "addChild", value: "添加子章节" },
			{ key: "insertBefore", value: "在本章节之前插入新章节" },
			{ key: "insertAfter", value: "在本章节之后插入新章节" },
			{ value: "-" },
			{ key: "delete", value: "删除本章节以及所有子章节", icon: "fa-trash-o" }
		];

		private _rootMenu = [
			{ key: "edit", value: "编辑章节", icon: "fa-edit" },
			{ value: "-" },
			{ key: "addChild", value: "添加子章节" },
		];

		private _firstChildMenu = [
			{ key: "edit", value: "编辑章节", icon: "fa-edit" },
			{ value: "-" },
			{ key: "moveDown", value: "下移", icon: "fa-level-down" },
			{ key: "moveTo", value: "移动到...", icon: "fa-move" },
			{ value: "-" },
			{ key: "addChild", value: "添加子章节" },
			{ key: "insertBefore", value: "在本章节之前插入新章节" },
			{ key: "insertAfter", value: "在本章节之后插入新章节" },
			{ value: "-" },
			{ key: "delete", value: "删除本章节以及所有子章节", icon: "fa-trash-o" }
		];

		private _lastChildMenu = [
			{ key: "edit", value: "编辑章节", icon: "fa-edit" },
			{ value: "-" },
			{ key: "moveUp", value: "上移", icon: "fa-level-up" },
			{ key: "moveTo", value: "移动到...", icon: "fa-move" },
			{ value: "-" },
			{ key: "addChild", value: "添加子章节" },
			{ key: "insertBefore", value: "在本章节之前插入新章节" },
			{ key: "insertAfter", value: "在本章节之后插入新章节" },
			{ value: "-" },
			{ key: "delete", value: "删除本章节以及所有子章节", icon: "fa-trash-o" }
		];

		private _uniqueChildMenu = [
			{ key: "edit", value: "编辑章节", icon: "fa-edit" },
			{ value: "-" },
			{ key: "moveTo", value: "移动到...", icon: "fa-move" },
			{ value: "-" },
			{ key: "addChild", value: "添加子章节" },
			{ key: "insertBefore", value: "在本章节之前插入新章节" },
			{ key: "insertAfter", value: "在本章节之后插入新章节" },
			{ value: "-" },
			{ key: "delete", value: "删除本章节以及所有子章节", icon: "fa-trash-o" }
		];

		private makeItem(item: any, idx: number, parent: any,
			level: number, container: HTMLElement) {
			item.refresh = () => {
				container.innerHTML = "";
				var parentKey: string, parentNumber: string;
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
				if (this._edit) {
					var self = this;
					var btnMenu = tui.ctrl.button();
					btnMenu.text("<i class='fa fa-bars'></i> 编辑");
					if (parent === null)
						btnMenu.menu(this._rootMenu);
					else if (parent.content.length === 1)
						btnMenu.menu(this._uniqueChildMenu);
					else if (idx === 0)
						btnMenu.menu(this._firstChildMenu);
					else if (idx === parent.content.length - 1)
						btnMenu.menu(this._lastChildMenu);
					else
						btnMenu.menu(this._fullMenu);
					btnMenu.menuPos("Rb");
					btnMenu.on("select", function (data: any) {
						if (data.item.key === "edit") {
							self.showCaptionDialog(parent, item);
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
						this.makeTable(n, item[n], container);
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
					img.src = this._imagePath + "/" + item.pic;
					img.className = "doc-pic";
					container.appendChild(img);
				}
				if (item.content) {
					for (var i = 0; i < item.content.length; i++) {
						var child = item.content[i];
						var childDiv = document.createElement("div");
						childDiv.className = "doc-container doc-level-" + (level + 1);
						this.makeItem(child, i, item, level + 1, childDiv);
						container.appendChild(childDiv);
					}
				}
			};
			item.refresh();
		}

		private showCaptionDialog(parent: any, item?: any) {
			var dlg = tui.ctrl.dialog();
			var self = this;
			dlg.showResource("captionDlg",
				"段落", [
					{
						name: "确定",
						func: function () {
							var fm = tui.ctrl.input("itemForm");
							if (!fm.validate())
								return;
							var val = fm.value();
							if (item) {
								if (typeof val.id !== tui.undef)
									item.id = val.id;
								item.name = val.name;
								item.desc = val.desc;
								item.pic = val.pic;
								item.code = val.code;
								item.index = val.index;
								item.refresh();
							} else {
								var items;
								if (parent.content)
									items = parent.content;
								else
									items = parent.content = [];
								items.push(val);
								parent.refresh();
							}
							dlg.close();
							self.refreshCatalog();
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
				var d = (<tui.ArrayProvider>tb.data()).src();
				d.push(["", "", ""]);
				tb.data(d);
				tb.editRow(d.length - 1);
			});
			function refreshTable() {
				var dtype = tui.ctrl.formAgent("selectedDetail").value();
				var d = item[dtype] || [];
				tb.data(d);
			}
			tui.on("param ret method event prop const", function () {
				refreshTable();
			});
			if (item) {
				if (parent === null) {
					tui.removeNode(document.getElementById("lineItemId"));
				}
				tui.ctrl.input("itemForm").value(item);
				refreshTable();
			} 
		}

		private buildCatalog(doc: any[], result: any[], edit: boolean) {
			if (!doc)
				return;
			for (var i = 0; i < doc.length; i++) {
				var item: any = {};
				item.key = doc[i].key;
				item.value = doc[i].name;
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
		}

		private refreshCatalog() {
			//this.makeItems(doc, null, null, 0, this._div);
			var catalog = [];
			var accordions = [];
			var doc = this._doc;
			this.buildCatalog(doc.content, catalog, this._edit);
			// Then build catalog
			if (this._catalog instanceof tui.ctrl.List) {
				var catalogList: tui.ctrl.List = this._catalog;
				var dp = new tui.ArrayProvider(catalog);
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
		}

		make(doc: any) {
			if (!doc)
				return;
			this._doc = doc;
			var section = 1;
			// Build content first
			this.makeItem(doc, 0, null, 0, this._div);
			// Refresh catalog
			this.refreshCatalog();
		}
	}
}
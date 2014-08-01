var doc;
(function (_doc) {
    var tableType = {
        'param': ['参数', '类型', '描述'],
        'method': ['方法', '类型', '描述'],
        'event': ['事件', '类型', '描述'],
        'prop': ['属性', '类型', '描述'],
        'value': ['常量', '类型', '描述'],
        'ret': ['返回值', '类型', '描述']
    };
    var contentType = ['index', 'content'];
    var DocMaker = (function () {
        function DocMaker(accordionGroup, contentDiv, groupName) {
            if (typeof accordionGroup === "string")
                this._group = tui.ctrl.accordionGroup(accordionGroup);
            else if (typeof accordionGroup === "object" && accordionGroup)
                this._group = accordionGroup;
            else
                throw new Error("Invalid parameter need a accordion group or specify id.");
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

        DocMaker.prototype.makeItems = function (items, parentKey, parentNumber, level, container) {
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var itemKey = item.name;
                var itemName = item.name;
                if (itemKey.indexOf("#") >= 0) {
                    itemKey = itemKey.substr(itemKey.indexOf("#"));
                    itemName = itemName.substr(0, itemName.indexOf("#"));
                }
                var itemNumber = parentNumber + "." + (i + 1);
                item.key = parentKey + "." + item;
                item.name = itemName;

                var caption = document.createElement("div");
                caption.setAttribute("data-number", itemNumber);
                caption.innerHTML = itemName;
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
                    if (item[n]) {
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
                    img.src = "../image/" + item.pic;
                    img.className = "doc-pic";
                    container.appendChild(img);
                }

                for (var n in contentType) {
                    if (!contentType.hasOwnProperty(n))
                        continue;
                    if (item[contentType[n]]) {
                        var childDiv = document.createElement("div");
                        childDiv.className = "doc-container doc-level-" + level;
                        container.appendChild(childDiv);
                        this.makeItems(item[contentType[n]], item.key, itemNumber, level + 1, childDiv);
                    }
                }
            }
        };

        DocMaker.prototype.make = function (doc) {
            if (!doc)
                return;
            this._div.innerHTML = "";
            var section = 1;
            for (var k in doc) {
                if (!doc.hasOwnProperty(k))
                    continue;
                var numberId = (section++) + "";
                var sectionId = k + "";
                var sectionName = sectionId;
                if (sectionId.indexOf("#") >= 0) {
                    sectionId = sectionId.substr(sectionId.indexOf("#") + 1);
                    sectionName = sectionName.substr(0, sectionName.indexOf("#"));
                }
                sectionId = "#" + sectionId;
                var acc = tui.ctrl.accordion();
                acc.caption(sectionName);
                acc.group(this._group.id());
                var dp = new tui.ArrayProvider(doc[k]);
                dp.addKeyMap("value", "name");
                dp.addKeyMap("children", "index");
                this._group[0].appendChild(acc[0]);

                var caption = document.createElement("div");
                caption.innerHTML = sectionName;
                caption.id = sectionId.substr(1);
                caption.className = "doc-section";
                this._div.appendChild(caption);
                this.makeItems(doc[k], sectionId, numberId, 0, this._div);

                acc.data(dp);
            }
        };
        return DocMaker;
    })();
    _doc.DocMaker = DocMaker;
})(doc || (doc = {}));
//# sourceMappingURL=docmaker.js.map

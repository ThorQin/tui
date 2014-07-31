var doc;
(function (_doc) {
    var tableType = {
        'param': ['参数', '类型', '描述'],
        'method': ['方法', '类型', '描述'],
        'event': ['事件', '类型', '描述'],
        'prop': ['属性', '类型', '描述'],
        'value': ['值', '类型', '描述'],
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
            var head = tb.insertRow(-1);
            var cols = tableType[name];
            for (var i = 0; i < cols.length; i++) {
                var th = document.createElement("th");
                th.innerHTML = cols[i];
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

        DocMaker.prototype.makeItems = function (items, parentKey, level, container) {
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                item.key = parentKey + "_" + i;

                var caption = document.createElement("div");
                caption.innerHTML = item.name;
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
                    var code = document.createElement("div");
                    code.innerHTML = item.desc;
                    code.className = "doc-code";
                    container.appendChild(code);
                }

                if (item.code) {
                    var img = document.createElement("img");
                    img.src = item.pic;
                    img.className = "doc-img";
                    container.appendChild(img);
                }

                for (var n in contentType) {
                    if (!contentType.hasOwnProperty(n))
                        continue;
                    if (item[n]) {
                        var childDiv = document.createElement("div");
                        childDiv.className = "doc-container doc-level-" + level;
                        container.appendChild(childDiv);
                        this.makeItems(item[n], item.key, level + 1, childDiv);
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
                var acc = tui.ctrl.accordion();
                acc.caption(k);
                acc.group(this._group.id());
                var dp = new tui.ArrayProvider(doc[k]);
                dp.addKeyMap("value", "name");
                dp.addKeyMap("children", "index");
                this._group[0].appendChild(acc[0]);
                acc.data(dp);
                this.makeItems(doc[k], "#section" + section++, 0, this._div);
            }
        };
        return DocMaker;
    })();
    _doc.DocMaker = DocMaker;
})(doc || (doc = {}));
//# sourceMappingURL=docmaker.js.map

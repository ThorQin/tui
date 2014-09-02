var downloadMenu = [
	{ link: 'download/tui-project.zip', value: '下载工程源码' },
	{ link: 'download/tui-release.zip', value: '下载开发包', icon:'fa-download' }];

var detailItemMenu = [
	{ key: "moveUp", value: "上移" ,icon:"fa-arrow-up"},
	{ key: "moveDown", value: "下移" ,icon:"fa-arrow-down" },
	{ value: "-" },
	{ key: "delete", value: "删除条目", icon: "fa-trash-o" }
]

var docTableCol = [
	{ name: "名称", key: 0, width: 80, _important: true, format: tui.ctrl.Grid.textEditor() },
	{ name: "类型", key: 1, width: 80, _important: true, format: tui.ctrl.Grid.textEditor() },
	{ name: "描述", key: 2, format: tui.ctrl.Grid.textEditor() },
	{
		name: "", format: tui.ctrl.Grid.menu(detailItemMenu, function (item, data) {
			var array = data.grid.data().src();
			if (item.key === "delete") {
				array.splice(data.rowIndex, 1);
				data.grid.data(array);
			} else if (item.key === "moveUp") {
				if (data.rowIndex > 0) {
					var tmp = array[data.rowIndex - 1];
					array[data.rowIndex - 1] = array[data.rowIndex];
					array[data.rowIndex] = tmp;
					data.grid.data(array);
				}
			} else if (item.key === "moveDown") {
				if (data.rowIndex < array.length - 1) {
					var tmp = array[data.rowIndex + 1];
					array[data.rowIndex + 1] = array[data.rowIndex];
					array[data.rowIndex] = tmp;
					data.grid.data(array);
				}
			}
			
			
		}),	width: 32, fixed:true
	},
];

function setupCatalogSize() {
	var size = tui.windowSize();
	var g = document.getElementById("docIndex")._ctrl;
	if (g instanceof tui.ctrl.AccordionGroup)
		g.maxHeight(size.height - 240);
	else if (g) {
		g[0].style.minHeight = size.height - 140 + "px";
		g.refresh();
	}
}

$(window).resize(function () {
	setupCatalogSize();
});
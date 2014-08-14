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
	{ name: "参数", key: 0, width: 80, _important: true, format: tui.ctrl.Grid.textEditor() },
	{ name: "类型", key: 1, width: 80, _important: true, format: tui.ctrl.Grid.textEditor() },
	{ name: "描述", key: 2, format: tui.ctrl.Grid.textEditor() },
	{
		name: "", format: function (data) {
			if (data.rowIndex < 0)
				return;
			var tb = data.grid;
			var array = data.grid.data().src();
			data.cell.firstChild.innerHTML = "";
			var btnDel = tui.ctrl.button();
			btnDel.text("<i class='fa fa-bars'></i>");
			btnDel.menu(detailItemMenu);
			btnDel.menuPos("Rb");
			data.cell.firstChild.appendChild(btnDel[0]);
			btnDel.on("select", function () {
				array.splice(data.rowIndex, 1);
				tb.data(array);
			});
		},
		width: 32,
		fixed:true
	},
];

function setupCatalogSize() {
	var size = tui.windowSize();
	var g = document.getElementById("docIndex")._ctrl;
	if (g instanceof tui.ctrl.AccordionGroup)
		g.maxHeight(size.height - 240);
	else if (g) {
		g[0].style.minHeight = size.height - 240 + "px";
		g.refresh();
	}
}

$(window).resize(function () {
	setupCatalogSize();
});
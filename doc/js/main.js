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
	{
		name: "参数", key: 0, width: 300
	},
	{
		name: "类型", key: 1, width: 300
	},
	{
		name: "描述", key: 2
	},
	{
		name: "", format: function (data) {
			if (data.rowIndex < 0)
				return;
			data.cell.firstChild.innerHTML = "";
			var btnDel = tui.ctrl.button();
			btnDel.text("<i class='fa fa-bars'></i>");
			btnDel.menu(detailItemMenu);
			btnDel.menuPos("Rb");
			data.cell.firstChild.appendChild(btnDel[0]);
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
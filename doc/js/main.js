var downloadMenu = [
	{ link: 'download/project.zip', value: '下载工程源码' },
	{ link: 'download/release.zip', value: '下载开发包', icon:'fa-download' }];

$(window).resize(function () {
	var size = tui.windowSize();
	var g = tui.ctrl.accordionGroup("docIndex");
	g && g.maxHeight(size.height - 240);
});
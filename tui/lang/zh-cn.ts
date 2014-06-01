/// <reference path="../tui.core.ts" />
(function () {
	var dict = {
		"Day": "天",
		"Days": "天",
		"Hour": "小时",
		"Hours": "小时",
		"Minute": "分钟",
		"Minutes": "分钟",
		"Second": "秒",
		"Seconds": "秒",
		"Failed": "失败",
		"success": "成功", 
		"notmodified": "查询内容没有改变！", 
		"error": "发生内部错误！", 
		"timeout": "请求超时！", 
		"abort": "操作被中止！", 
		"parsererror": "服务器返回内容无效！",
		"Ok": "确定",
		"Cancel": "取消",
		"Apply": "应用",
		"Sun": "日",
		"Mon": "一",
		"Tue": "二",
		"Wed": "三",
		"Thu": "四",
		"Fri": "五",
		"Sat": "六",
		"Rerresh": "刷新",
		"Clear": "清除",
		"Select": "选择",
		"Today": "今天",
		"yyyy-MM-dd": "yyyy 年 M 月 d 日",
		"Invalid input.": "输入内容无效。",
		"Previous": "上一页",
		"Next": "下一页"
	};
	tui.registerTranslator("zh-cn", (str: string): string => {
		return dict[str] || str;
	});
})();
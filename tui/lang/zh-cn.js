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
        "Invalid input.": "输入内容无效。"
    };
    tui.registerTranslator("zh-cn", function (str) {
        return dict[str] || str;
    });
})();
//# sourceMappingURL=zh-cn.js.map

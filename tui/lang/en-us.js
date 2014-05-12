/// <reference path="../tui.core.ts" />
(function () {
    var dict = {
        "yyyy-MM-dd": "d MMM yyyy"
    };
    tui.registerTranslator("en-us", function (str) {
        return dict[str] || str;
    });
})();
//# sourceMappingURL=en-us.js.map

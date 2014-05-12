/// <reference path="../tui.core.ts" />
(function () {
	var dict = {
		"yyyy-MM-dd": "d MMM yyyy"
	};
	tui.registerTranslator("en-us", (str: string): string => {
		return dict[str] || str;
	});
})();
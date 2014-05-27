/// <reference path="../tui.core.ts" />
(function () {
	var dict = {
		"yyyy-MM-dd": "d MMM yyyy",
		"success": "Success",
		"notmodified": "Request's content has not been modified!",
		"error": "Occurred an internal error!",
		"timeout": "Request timeout!",
		"abort": "Operating has been aborted!",
		"parsererror": "Server response invalid content!",
	};
	tui.registerTranslator("en-us", (str: string): string => {
		return dict[str] || str;
	});
})();
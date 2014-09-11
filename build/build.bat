rmdir /S /Q tui
mkdir tui
xcopy /Y ..\tui tui\tui\
xcopy /Y /S ..\depends tui\depends\

tsc -m amd --sourcemap --out tui/tui/tui.all.js ^
	tui/tui/tui.core.ts ^
	tui/tui/tui.time.ts ^
	tui/tui/tui.upload.ts ^
	tui/tui/tui.dataprovider.ts ^
	tui/tui/tui.ctrl.control.ts ^
	tui/tui/tui.ctrl.button.ts ^
	tui/tui/tui.ctrl.checkbox.ts ^
	tui/tui/tui.ctrl.radiobox.ts ^
	tui/tui/tui.ctrl.calendar.ts ^
	tui/tui/tui.ctrl.popup.ts ^
	tui/tui/tui.ctrl.dialog.ts ^
	tui/tui/tui.ctrl.scrollbar.ts ^
	tui/tui/tui.ctrl.table.ts ^
	tui/tui/tui.ctrl.grid.ts ^
	tui/tui/tui.ctrl.list.ts ^
	tui/tui/tui.ctrl.input.ts ^
	tui/tui/tui.ctrl.textarea.ts ^
	tui/tui/tui.ctrl.form.ts ^
	tui/tui/tui.ctrl.formagent.ts ^
	tui/tui/tui.ctrl.tab.ts ^
	tui/tui/tui.ctrl.paginator.ts ^
	tui/tui/tui.ctrl.tips.ts ^
	tui/tui/tui.ctrl.accordiongroup.ts ^
	tui/tui/tui.ctrl.accordion.ts ^
	tui/tui/tui.ctrl.menu.ts ^
	tui/tui/tui.ctrl.navbar.ts
	


xcopy /Y /S ..\tui\css tui\css\
xcopy /Y /S ..\tui\lang tui\lang\
xcopy /Y /S ..\depends depends\

ajaxmin tui\tui.all.js -out tui\tui.all.min.js

lessc -x tui/css/tui.less > tui/css/tui.min.css




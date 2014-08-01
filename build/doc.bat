tsc -m amd --sourcemap --out ../doc/js/tui/tui.all.js ^
	../tui/tui.core.ts ^
	../tui/tui.time.ts ^
	../tui/tui.upload.ts ^
	../tui/tui.dataprovider.ts ^
	../tui/tui.ctrl.control.ts ^
	../tui/tui.ctrl.button.ts ^
	../tui/tui.ctrl.checkbox.ts ^
	../tui/tui.ctrl.radiobox.ts ^
	../tui/tui.ctrl.calendar.ts ^
	../tui/tui.ctrl.popup.ts ^
	../tui/tui.ctrl.dialog.ts ^
	../tui/tui.ctrl.scrollbar.ts ^
	../tui/tui.ctrl.table.ts ^
	../tui/tui.ctrl.grid.ts ^
	../tui/tui.ctrl.list.ts ^
	../tui/tui.ctrl.input.ts ^
	../tui/tui.ctrl.textarea.ts ^
	../tui/tui.ctrl.form.ts ^
	../tui/tui.ctrl.formagent.ts ^
	../tui/tui.ctrl.tab.ts ^
	../tui/tui.ctrl.paginator.ts ^
	../tui/tui.ctrl.tips.ts ^
	../tui/tui.ctrl.accordiongroup.ts ^
	../tui/tui.ctrl.accordion.ts ^
	../tui/tui.ctrl.menu.ts ^
	../tui/tui.ctrl.navbar.ts

xcopy /Y /S ..\tui\css ..\doc\js\tui\css\
xcopy /Y /S ..\tui\lang ..\doc\js\tui\lang\
xcopy /Y /S ..\depends ..\doc\js\

ajaxmin ..\doc\js\tui\tui.all.js -out ..\doc\js\tui\tui.all.min.js

lessc -x ../doc/js/tui/css/tui.less > ../doc/js/tui/css/tui.min.css




tsc -m amd --out tui/tui.all.js ^
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
	../tui/tui.ctrl.tips.ts

xcopy /Y /S ..\tui\css tui\css\
xcopy /Y /S ..\tui\lang tui\lang\
xcopy /Y /S ..\Scripts Scripts\
xcopy /Y /S ..\Demo Demo\

ajaxmin tui\tui.all.js -out tui\tui.all.min.js

cscript demo.js

lessc -x tui/css/tui.less > tui/css/tui.min.css




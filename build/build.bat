rem =====================================
rem CLEAN BUILD
rem =====================================
rmdir /S /Q tui
del *.zip


rem =====================================
rem BUILD SOURCE PACKAGE
rem =====================================
mkdir tui
mkdir tui\build
xcopy /Y /S tools tui\build\tools\
copy build.bat tui\build\build.bat
xcopy /Y /S ..\tui tui\tui\
xcopy /Y /S ..\depends tui\depends\
copy ..\.gitignore tui\
copy ..\license tui\
copy ..\README.md tui\
tools\7z a -tzip tui-1.0-src.zip tui

rem =====================================
rem BUILD RELEASE PACKAGE
rem =====================================
del tui\.gitignore
rmdir /S /Q tui\build

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
	
del tui\tui\*.ts
tools\ajaxmin tui\tui\tui.all.js -out tui\tui\tui.all.min.js
java -jar tools/js.jar -f tools/less-rhino-1.7.0.js tools/lessc-rhino-1.7.0.js -x tui/tui/css/tui.less tui/tui/css/tui.min.css
del tui\tui\css\*.less

tools\7z a -tzip tui-1.0-release.zip tui


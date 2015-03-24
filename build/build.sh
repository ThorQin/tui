# =====================================
# CLEAN BUILD
# =====================================
rm -rf tui
rm *.zip


# =====================================
# BUILD RELEASE PACKAGE
# =====================================
mkdir tui

cp -r ../tui tui/tui/
cp -r ../depends tui/depends/
cp ../license tui/
cp ../README.md tui/

# tools\tsc.exe -m amd --sourcemap --out tui/tui/tui.all.js \
tsc -m amd --out tui/tui/tui.all.js \
	tui/tui/tui.core.ts \
	tui/tui/tui.time.ts \
	tui/tui/tui.upload.ts \
	tui/tui/tui.dataprovider.ts \
	tui/tui/tui.ctrl.control.ts \
	tui/tui/tui.ctrl.button.ts \
	tui/tui/tui.ctrl.checkbox.ts \
	tui/tui/tui.ctrl.radiobox.ts \
	tui/tui/tui.ctrl.calendar.ts \
	tui/tui/tui.ctrl.popup.ts \
	tui/tui/tui.ctrl.dialog.ts \
	tui/tui/tui.ctrl.scrollbar.ts \
	tui/tui/tui.ctrl.table.ts \
	tui/tui/tui.ctrl.grid.ts \
	tui/tui/tui.ctrl.list.ts \
	tui/tui/tui.ctrl.input.ts \
	tui/tui/tui.ctrl.textarea.ts \
	tui/tui/tui.ctrl.form.ts \
	tui/tui/tui.ctrl.formagent.ts \
	tui/tui/tui.ctrl.tab.ts \
	tui/tui/tui.ctrl.paginator.ts \
	tui/tui/tui.ctrl.tips.ts \
	tui/tui/tui.ctrl.accordiongroup.ts \
	tui/tui/tui.ctrl.accordion.ts \
	tui/tui/tui.ctrl.menu.ts \
	tui/tui/tui.ctrl.navbar.ts
	
rm tui/tui/*.ts

# tools\ajaxmin\ajaxmin tui\tui\tui.all.js \
#	-out tui\tui\tui.all.min.js \
#	-map:v3 tui\tui\tui.all.min.js.map

java -jar tools/yuicompressor-2.4.8.jar tui/tui/tui.all.js -o tui/tui/tui.all.min.js --charset utf-8
	
java -jar tools/lessc/js.jar -f \
	tools/lessc/less-rhino-1.7.0.js \
	tools/lessc/lessc-rhino-1.7.0.js -x\
	tui/tui/css/tui.less tui/tui/css/tui.min.css
	
	
rm tui/tui/css/*.less

7z a -tzip tui-1.0.11.zip tui

# rm -r tui

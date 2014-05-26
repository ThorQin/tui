function loadFile(fileName) {
    var f = new ActiveXObject("ADODB.Stream");
    f.Charset = "utf-8";
    f.Type = 2;
    f.Open();
    f.LoadFromFile(fileName);
    var content = f.ReadText();
    f.Close();
	return content;
}

function saveFile(fileName, content) {
     var f = new ActiveXObject("ADODB.Stream");
    f.Charset = "utf-8";
    f.Type = 2;
    f.Open();
    f.WriteText(content);
    f.SaveToFile(fileName, 2);
    f.Close();
}

var demo = loadFile("Demo\\index.html");
demo = demo.replace(/<!--#TUI BEGIN#-->((?:.|\r|\n)*)<!--#TUI END#-->/gm, "<script src=\"../tui/tui.all.min.js\"></script>");
saveFile("Demo\\index.html", demo);
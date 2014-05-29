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

var begin = demo.indexOf("<!--#TUI BEGIN#-->");
var end = demo.indexOf("<!--#TUI END#-->") + "<!--#TUI END#-->".length;
var result = demo.substring(0, begin);
result += "<script src=\"../tui/tui.all.min.js\"></script>";
result += demo.substr(end);

//demo = demo.replace(/<!--#TUI BEGIN#-->((?:.|\r|\n)*)<!--#TUI END#-->/mi, "<script src=\"../tui/tui.all.min.js\"></script>");

saveFile("Demo\\index.html", result);
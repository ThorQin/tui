<%@ WebHandler Language="C#" Class="Handler" %>

using System;
using System.Web;
using System.Web.Script.Serialization;
using System.Text;
using System.IO;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.Win32;
using System.Xml;

public class Handler : IHttpHandler {

	private void saveText(string file, string text) {
		using (StreamWriter writer = File.CreateText(file)) {
			writer.Write(text);
		}
	}

	class Row {
		public string name;
		public string sex;
		public int age;
		public int height;
	}

	class Query {
		public string name;
		public int? age;
		public string sex;
	}
        
    public void ProcessRequest (HttpContext context) {
		string info = "";
		info = "Query String: " + context.Request.QueryString + "\r\n";
		info += "Raw Url: " + context.Request.RawUrl + "\r\n";
		string post = "";
		using (StreamReader reader = new StreamReader(context.Request.InputStream)) {
			post = reader.ReadToEnd();
			info += post;
		}
		JavaScriptSerializer json = new JavaScriptSerializer();
		Query query;
		try {
			query = json.Deserialize<Query>(post);
		
		

			
		
			context.Response.ContentType = "application/json; charset=utf-8";

			List<Row> list = new List<Row>();
			list.Add(new Row() {
				name = "张三",
				age = 23,
				sex = "男",
				height = 173
			});
			list.Add(new Row() {
				name = "张四",
				age = 23,
				sex = "男",
				height = 173
			});
			list.Add(new Row() {
				name = "李四",
				age = 25,
				sex = "男",
				height = 173
			});
			list.Add(new Row() {
				name = "樊梨花",
				age = 18,
				sex = "女",
				height = 173
			});
			list.Add(new Row() {
				name = "王宝钏",
				age = 22,
				sex = "女",
				height = 163
			});
			list.Add(new Row() {
				name = "王五",
				age = 27,
				sex = "男",
				height = 178
			});
			list = list.FindAll(w =>
				(query.name == null || w.name.Contains(query.name)) && 
				w.sex == query.sex &&
				(w.age == query.age || query.age == null));
		

			byte[] buffer = Encoding.UTF8.GetBytes(json.Serialize(list));
			context.Response.OutputStream.Write(buffer, 0, buffer.Length);
		} catch (Exception err) {
			info += ("\n" + err.StackTrace);
		}
		saveText(context.Request.PhysicalPath + ".request.txt", info);
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }

}
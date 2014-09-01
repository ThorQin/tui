using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace TS.doc.content {
	/// <summary>
	/// Summary description for Handler1
	/// </summary>
	public class FileHandler : IHttpHandler {

		public void ProcessRequest(HttpContext context) {
			string file = context.Request["file"];
			string action = context.Request["action"];
			string filePath = new FileInfo(context.Request.PhysicalPath).Directory + "\\" + file;
			if (action == "save") {
				if (context.Request.ContentType != null && 
					context.Request.ContentType.Split(new char[] { ';' })[0].Trim().ToLower() == "application/json" && 
					context.Request.ContentLength > 0) {
					using (StreamReader reader = new StreamReader(context.Request.InputStream)) {
						string content = reader.ReadToEnd();
						using (StreamWriter writer = File.CreateText(filePath)) {
							writer.Write(content);
						}
					}
				} else
					context.Response.StatusCode = 400;
			} else {
				try {
					using (StreamReader reader = File.OpenText(filePath)) {
						string content = reader.ReadToEnd();
						context.Response.ContentType = "application/json";
						context.Response.ContentEncoding = System.Text.Encoding.UTF8;
						context.Response.Write(content);
					}
				} catch {
					context.Response.StatusCode = 404;
				} 
			}
		}

		public bool IsReusable {
			get {
				return false;
			}
		}
	}
}
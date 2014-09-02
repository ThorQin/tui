using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using System.Collections;

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
					JavaScriptSerializer json = new JavaScriptSerializer();
					Dictionary<string, object> obj;
					try {
						using (StreamReader reader = new StreamReader(context.Request.InputStream)) {
							string content = reader.ReadToEnd();
							obj = json.Deserialize<Dictionary<string, object>>(content);						
						}
						if (!obj.ContainsKey("password")) {
							context.Response.StatusCode = 401;
							context.Response.Status = "401.1";
							return;
						}
						if ((string)obj["password"] != "js.tui") {
							context.Response.StatusCode = 401;
							context.Response.Status = "401.1 Login Failed";
							return;
						}
						if (!obj.ContainsKey("content")) {
							context.Response.StatusCode = 400;
							return;
						}
						using (FileStream fs = new FileStream(filePath, FileMode.Create, FileAccess.ReadWrite, FileShare.ReadWrite)) {
							byte[] data = System.Text.Encoding.UTF8.GetBytes(json.Serialize(obj["content"]));
							fs.Lock(0, data.Length);
							fs.Write(data, 0, data.Length);
							fs.Unlock(0, data.Length);
						}
					} catch {
						context.Response.StatusCode = 400;
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
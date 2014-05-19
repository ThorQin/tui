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

    struct Result
    {
        public string fileId;
    }
        
    public void ProcessRequest (HttpContext context) {
        context.Response.ContentType = "text/html";
        JavaScriptSerializer json = new JavaScriptSerializer();
		Result result;
		result.fileId = "file1234";
		byte[] buffer = Encoding.UTF8.GetBytes(json.Serialize(result));
		context.Response.OutputStream.Write(buffer, 0, buffer.Length);   
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }

}
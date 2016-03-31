//the server configuration file
var configuration = "config.json";
//the database file
var dataFile = "data.json";
//set to port you want server hosted on
var port = 8008;
//End Of settings
var querystring = require('querystring')
	, fs = require('fs')
	, http = require('http')
	, path = require("path");
url = require('url');

var cookiesTable = {};

function readFile(filePath) {
	return fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
}

if (fs.existsSync(configuration)) {
	console.log("A past server configuration file already exists!");
	config = JSON.parse(readFile(configuration));
	console.log("data setup!");
} else {
	console.log("There is no server configuration file creating one now...");
	fs.writeFileSync(configuration, '{"pages":{}}');
	config = JSON.parse(readFile(configuration));
	console.log("configuration setup!");

}


if (fs.existsSync(dataFile)) {
	console.log("A past server data file already exists!");
	console.log("Initializing the data...");
	data = JSON.parse(readFile(dataFile));
	console.log("data setup!");
} else {
	console.log("There is no server data file creating one now...");
	fs.writeFileSync(dataFile, '{}');
	data = JSON.parse(readFile(dataFile));
	console.log("data setup!");

}

function updateDatabase() {
	fs.writeFileSync(dataFile, JSON.stringify(data));
}


http.IncomingMessage.prototype.getCookie = function(name) {
  var cookies;
  cookies = {};
  this.headers.cookie && this.headers.cookie.split(';').forEach(function(cookie) {
    var parts;
    parts = cookie.split('=');
    cookies[parts[0].trim()] = (parts[1] || '').trim();
  });
  return cookies[name] || null;
};
//Handling cookies
//geting cookies
http.IncomingMessage.prototype.getCookies = function() {
  var cookies;
  cookies = {};
  this.headers.cookie && this.headers.cookie.split(';').forEach(function(cookie) {
    var parts;
    parts = cookie.split('=');
    cookies[parts[0].trim()] = (parts[1] || '').trim();
  });
  return cookies;
};
//setting cookies
http.OutgoingMessage.prototype.setCookie = function(name, value, exdays, domain, path) {
  var cookieText, cookies, exdate;
  cookies = this.getHeader('Set-Cookie');
  if (typeof cookies !== 'object') {
    cookies = [];
  }
  exdate = new Date();
  exdate.setDate(exdate.getDate() + exdays);
  cookieText = name + '=' + value + ';expires=' + exdate.toUTCString() + ';';
  if (domain) {
    cookieText += 'domain=' + domain + ';';
  }
  if (path) {
    cookieText += 'path=' + path + ';';
  }
  cookies.push(cookieText);
  this.setHeader('Set-Cookie', cookies);
};

 var generateKey = function generateKey(keyLength){
   var chars ="0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
   var randomStr = '';

   for (var i=0; i < keyLength; i++) {
     var rnum = Math.floor(Math.random() * chars.length);
     randomStr += chars.substring(rnum,rnum+1);
   }
   return randomStr;
 };

//here just in case
function redirectPage(codeToExecute, redirectUrl) {
	return "<html><script>window.location.replace({{url}});</script></html>".replace("{{url}}", redirectUrl);
}

//function for adding users
function addUser(username,password,email) {
	if(data.users) {} else {data.users = {}}
	if(data.users[username]) {
		return "User Already Exists";
	} else {
		data.users[username] = {"password":password,"email":email,extraData:{}};
		updateDatabase();
		return true;
		
	}
}
function login(request,response) {
	if(data.users[request.post.username]) {
		if(data.users[request.post.username].password == request.post.password) {
			var randString = generateKey(50);
			response.setCookie("sessionId",randString,7);
			cookiesTable[request.post.username] = randString;
			
			return true;
		} else {return "Invalid Username Of Password"}
	} else {return "Invalid Username Or Password"}
}

function register(request,response) {
	response.setHeader("Content-Type","text/html");
	if(request.post.password == request.post.rpassword) {
		var status = addUser(request.post.username,request.post.password,request.post.email);
		if(status == true) {
			response.write("you have been registered");
		} else {
			response.write("That username is taken");
		}
	} else {
		response.write("passwords don't match");
	}
	
}

//allow server to handle post data and cut off if data exceeds 1 MB of data.
function processPost(n, t, e) {
	var o = "";
	return "function" != typeof e ? null : void("POST" == n.method ? (n.on("data", function (e) {
		o += e, o.length > 1e6 && (o = "", t.writeHead(413, {
			"Content-Type": "text/plain"
		}).end(), n.connection.destroy())
	}), n.on("end", function () {
		n.post = querystring.parse(o), e()
	})) : (t.writeHead(405, {
		"Content-Type": "text/plain"
	}), t.end()))
}

//the server
http.createServer(function (request, response) {
	query = url.parse(request.url, true).query;
	if (request.method == 'POST') {
		processPost(request, response, function () {
		console.log(request.post);
		
			// Use request.post here
			if(query.p == "submitLogin") {
				var status = login(request,response);
				console.log(status);
				response.writeHead(200, "OK", {
					'Content-Type': 'text/html'
				});
				if(status == true) {
					response.write("you are logged in!");
				} else {response.write("login failed");}
			}
			if(query.p == "submitReg") {
				register(request,response);
			}
			response.end();
			
		});
	} else {
		//response.writeHead(200, "OK", {
		//	'Content-Type': 'text/html'
		//});
		response.setHeader("Content-Type","text/html");
		if (query.p) {
			//response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages[config.index].file)).replace("{{ page-title }}", config.pages[config.index].title));
			if(config.pages[query.p]) {
				response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages[query.p].file)).replace("{{ page-title }}", config.pages[query.p].title).replace("{{ site-title }}", config.pages[query.p].siteTitle));
			} else {
				response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages[config["404"]].file)).replace("{{ page-title }}", config.pages[config["404"]].title).replace("{{ site-title }}", config.pages["404"].siteTitle));
			}
		} else {
			response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages[config.index].file)).replace("{{ page-title }}", config.pages[config.index].title).replace("{{ site-title }}", config.pages[config.index].siteTitle));
		}
		//response.write(readFile("assets/global.html"));
		response.end();
	}

}).listen(port);

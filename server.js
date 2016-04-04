// the server configuration file
var configuration = "config.json";
// the database file
var dataFile = "data.json";
// set to port you want server hosted on
var port = 8008; // STOP CHANGING IT!!!!!
// end of settings

const querystring = require('querystring'),
      fs = require('fs'),
      http = require('http'),
      path = require("path"),
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

var Sha1 = {};Sha1.hash = function(t) {t=t.utf8Encode();var e=[1518500249,1859775393,2400959708,3395469782];t+=String.fromCharCode(128);for(var r=t.length/4+2,o=Math.ceil(r/16),n=new Array(o),a=0;o>a;a++){n[a]=new Array(16);for(var f=0;16>f;f++)n[a][f]=t.charCodeAt(64*a+4*f)<<24|t.charCodeAt(64*a+4*f+1)<<16|t.charCodeAt(64*a+4*f+2)<<8|t.charCodeAt(64*a+4*f+3)}n[o-1][14]=8*(t.length-1)/Math.pow(2,32),n[o-1][14]=Math.floor(n[o-1][14]),n[o-1][15]=8*(t.length-1)&4294967295;for(var h,u,c,S,d,i=1732584193,p=4023233417,s=2562383102,y=271733878,v=3285377520,g=new Array(80),a=0;o>a;a++){for(var l=0;16>l;l++)g[l]=n[a][l];for(var l=16;80>l;l++)g[l]=Sha1.ROTL(g[l-3]^g[l-8]^g[l-14]^g[l-16],1);h=i,u=p,c=s,S=y,d=v;for(var l=0;80>l;l++){var x=Math.floor(l/20),C=Sha1.ROTL(h,5)+Sha1.f(x,u,c,S)+d+e[x]+g[l]&4294967295;d=S,S=c,c=Sha1.ROTL(u,30),u=h,h=C}i=i+h&4294967295,p=p+u&4294967295,s=s+c&4294967295,y=y+S&4294967295,v=v+d&4294967295}return Sha1.toHexStr(i)+Sha1.toHexStr(p)+Sha1.toHexStr(s)+Sha1.toHexStr(y)+Sha1.toHexStr(v)},Sha1.f=function(t,e,r,o){switch(t){case 0:return e&r^~e&o;case 1:return e^r^o;case 2:return e&r^e&o^r&o;case 3:return e^r^o}},Sha1.ROTL=function(t,e){return t<<e|t>>>32-e},Sha1.toHexStr=function(t){for(var e,r="",o=7;o>=0;o--)e=t>>>4*o&15,r+=e.toString(16);return r},"undefined"==typeof String.prototype.utf8Encode&&(String.prototype.utf8Encode=function(){return unescape(encodeURIComponent(this))}),"undefined"==typeof String.prototype.utf8Decode&&(String.prototype.utf8Decode=function(){try{return decodeURIComponent(escape(this))}catch(t){return this}}),"undefined"!=typeof module&&module.exports&&(module.exports=Sha1),"function"==typeof define&&define.amd&&define([],function(){return Sha1});

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

// Handling cookies
// geting cookies
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
	return "<html><a href='{{url}}' id='element'></a><script>document.getElementById('element').click()</script></html>".replace("{{url}}", redirectUrl);
}

//function for adding users
function addUser(username,password,email,salt) {
	if(data.users) {} else {data.users = {}}
	if(data.users[username]) {
		return "User Already Exists";
	} else {
		data.users[username] = {"password":Sha1.hash(password + salt),"email":email,"salt":salt,extraData:{}};
		updateDatabase();
		return true;
		
	}
}
function login(request,response) {
	if(data.users[request.post.username]) {
		if(data.users[request.post.username].password == Sha1.hash(request.post.password + data.users[request.post.username].salt)) {
			var randString = generateKey(50);
			response.setCookie("sessionId",randString,7);
			cookiesTable[randString] = request.post.username;
			console.log(request.post.username + " Signed in with the session key: " + randString);
			return true;
		} else {console.log(request.post.username + " Had an Invalid username or password");return "Invalid Username Of Password";}
	} else {console.log(request.post.username + " Had an invalid username or password");return "Invalid Username Or Password";}
}

function register(request,response) {
	response.setHeader("Content-Type","text/html");
	if(request.post.password == request.post.rpassword) {
		var status = addUser(request.post.username,request.post.password,request.post.email,generateKey(60));
		if(status == true) {
			console.log(request.post.username + " Signed up")
			response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages["signupGood"].file)).replace("{{ page-title }}", config.pages["signupGood"].title).replace("{{ site-title }}", config.pages["signupGood"].siteTitle));
		} else {
			console.log("someone attempted to sign in with the username: " + request.post.username + " but it was already taken");
			response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages["signupFailu"].file)).replace("{{ page-title }}", config.pages["signupFailu"].title).replace("{{ site-title }}", config.pages["signupFailu"].siteTitle));
		}
	} else {
		console.log("someone attempted to signup with the usename " + request.post.username + " but there passwords dis not match");
		response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages["signupFailpm"].file)).replace("{{ page-title }}", config.pages["signupFailpm"].title).replace("{{ site-title }}", config.pages["signupFailpm"].siteTitle));
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
	
	var key = request.getCookie("sessionId");
	var user = {"username":"guest","loggedIn":false};
	if(cookiesTable[key]) {
		user.username = cookiesTable[key];
		user.loogedIn = true;
	}
	
	if (request.method == 'POST') {
		processPost(request, response, function () {
		//console.log(request.post);
		
			// Use request.post here
			if(query.p == "submitLogin") {
				var status = login(request,response);
				response.writeHead(200, "OK", {
					'Content-Type': 'text/html'
				});
				if(status == true) {
					response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages["loginGood"].file)).replace("{{ page-title }}", config.pages["loginGood"].title).replace("{{ site-title }}", config.pages["loginGood"].siteTitle));
				} else {response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages["loginFailed"].file)).replace("{{ page-title }}", config.pages["loginFailed"].title).replace("{{ site-title }}", config.pages["loginFailed"].siteTitle));}
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
				if(query.p == config.index) {
					response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages[config.index].file)).replace("{{ page-title }}", config.pages[config.index].title).replace("{{ site-title }}", config.pages[config.index].siteTitle).replace("{{ loggedin }}", "Welcome back " + user.username + ", "));
				} else {
					response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages[query.p].file)).replace("{{ page-title }}", config.pages[query.p].title).replace("{{ site-title }}", config.pages[query.p].siteTitle));
				}
			} else {
				response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages[config["404"]].file)).replace("{{ page-title }}", config.pages[config["404"]].title).replace("{{ site-title }}", config.pages["404"].siteTitle));
			}
		} else {
			response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages[config.index].file)).replace("{{ page-title }}", config.pages[config.index].title).replace("{{ site-title }}", config.pages[config.index].siteTitle).replace("{{ loggedin }}", "Welcome " + user.username));
		}
		//response.write(readFile("assets/global.html"));
		response.end();
	}

}).listen(port);

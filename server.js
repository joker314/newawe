/*
 * This file is part of Newawe.
 *
 * Newawe is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Foobar is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Newawe.  If not, see <http://www.gnu.org/licenses/>.
 */ 

//the server configuration file
var configuration = "config.json";
//the database file
var dataFile = "data.json";

const querystring = require('querystring'),
      fs = require('fs'),
      http = require('http'),
      path = require("path"),
      url = require('url'),
      bcrypt = require("bcrypt-nodejs");

var cookiesTable = {};

function readFile(filePath) {
	return fs.readFileSync(path.resolve(__dirname, filePath), 'utf-8');
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

function substitute(string, data) { // Replaces string 'test{{ abc }}' with data '{"abc": "123"}' in order to make test123
	var str = string;
	for(var key in data){
		str = str.replace("{{ "+key+" }}", data[key]);
	}
	return str;
};

function globalSiteText(pageName){ // A nice function to return replaced data ({{ content }}) from a given file based off of global.html
	return substitute(readFile("pages/global.html"),{"content": substitute(readFile("pages/html/" + config.pages[pageName].file), {"page-title": config.pages[pageName].title, "site-title": config.pages[pageName].siteTitle})});
}

http.IncomingMessage.prototype.getCookie = function (name) {
	var cookies;
	cookies = {};
	this.headers.cookie && this.headers.cookie.split(';').forEach(function (cookie) {
		var parts;
		parts = cookie.split('=');
		cookies[parts[0].trim()] = (parts[1] || '').trim();
	});
	return cookies[name] || null;
};

//Handling cookies
//geting cookies
http.IncomingMessage.prototype.getCookies = function () {
	var cookies;
	cookies = {};
	this.headers.cookie && this.headers.cookie.split(';').forEach(function (cookie) {
		var parts;
		parts = cookie.split('=');
		cookies[parts[0].trim()] = (parts[1] || '').trim();
	});
	return cookies;
};

//setting cookies
http.OutgoingMessage.prototype.setCookie = function (name, value, exdays, domain, path) {
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

var generateKey = function generateKey(keyLength) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var randomStr = '';

	for (var i = 0; i < keyLength; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomStr += chars[rnum];
	}
	return randomStr;
};

//here just in case
function redirectPage(codeToExecute, redirectUrl) {
	return substitute('<html><script>window.location={{ url }}</script><p>If you are not redirected within 10 seconds, click <a href="{{ url }}">here.</a></p></html>', {"url": redirectUrl});
}

//function for adding users
function addUser(username, password, email, salt) {
	if (!data.users) {
		data.users = {}
	}
	if (data.users[username]) {
		return "User Already Exists";
	} else {
		data.users[username] = {
			"password": bcrypt.hashSync(password)
			, "email": email
			, extraData: {}
		};
		updateDatabase();
		return true;

	}
}

function login(request, response) {
	if (data.users[request.post.username]) {
		if (bcrypt.compareSync(request.post.password, data.users[request.post.username].password)) {
			var randString = generateKey(50);
			response.setCookie("sessionId", randString, 7);
			cookiesTable[randString] = request.post.username;
			console.log(request.post.username + " Signed in with the session key: " + randString);
			return true;
		} else {
			console.log(request.post.username + " Had an Invalid username or password");
			return "Invalid Username Of Password";
		}
	} else {
		console.log(request.post.username + " Had an invalid username or password");
		return "Invalid Username Or Password";
	}
}

function register(request, response) {
	response.setHeader("Content-Type", "text/html");
	if (request.post.password == request.post.rpassword) {
		var status = addUser(request.post.username, request.post.password, request.post.email);
		if (status == true) {
			console.log(request.post.username + " Signed up")
			response.write(globalSiteText("signupGood"));
		} else {
			console.log("someone attempted to sign up with the username: " + request.post.username + " but it was already taken");
			response.write(globalSiteText("signupFailu"));
		}
	} else {
		console.log("someone attempted to signup with the username " + request.post.username + " but the passwords don't match");
		response.write(globalSiteText("signupFailpm"));
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
	var user = {
		"username": "guest"
		, "loggedIn": false
	};
	if (cookiesTable[key]) {
		user.username = cookiesTable[key];
		user.loogedIn = true;
	}

	if (request.method == 'POST') {
		processPost(request, response, function () {
			//console.log(request.post);

			// Use request.post here
			if (query.p == "submitLogin") {
				var status = login(request, response);
				response.writeHead(200, "OK", {
					'Content-Type': 'text/html'
				});
				if (status == true) {
					response.write(globalSiteText("loginGood"));
				} else {
					response.write(globalSiteText("loginFailed"));
				}
			}
			if (query.p == "submitReg") {
				register(request, response);
			}
			response.end();

		});
	} else {
		response.setHeader("Content-Type", "text/html");

		if (query.p) {
			if (config.pages[query.p]) {
				if (query.p == config.index) {
					response.write(globalSiteText(config.index).replace("{{ loggedin }}", "Welcome back " + user.username + " , "));
				} else {
					response.write(globalSiteText(query.p));
				}
			} else {
				response.write(globalSiteText("404"));
			}
		} else {
			response.write(globalSiteText(config.index).replace("{{ loggedin }}", "Welcome " + user.username));
		}
		response.end();
	}

}).listen(config.port);

//the server configuration file
var configuration = "config.json";
//the database file
var dataFile = "data.json";
//set to port you want server hosted on
var port = 8080;
//End Of settings
var querystring = require('querystring')
	, fs = require('fs')
	, http = require('http')
	, path = require("path");
url = require('url');

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

//allow for adding cookies to the system for sessions
function genScriptPage(codeToExecute, redirectUrl) {
	return "<html><script>{{code}}</script><script>window.location.replace({{url}});</script></html>".replace("{{code}}", codeToExecute).replace("{{url}}", redirectUrl);
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

			response.writeHead(200, "OK", {
				'Content-Type': 'text/plain'
			});
			response.end();
		});
	} else {
		response.writeHead(200, "OK", {
			'Content-Type': 'text/html'
		});
		if (query.p) {
			//response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages[config.index].file)).replace("{{ page-title }}", config.pages[config.index].title));
			if(config.pages[query.p]) {
				response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages[query.p].file)).replace("{{ page-title }}", config.pages[query.p].title));
			} else {
				response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages[config["404"]].file)).replace("{{ page-title }}", config.pages[config["404"]].title));
			}
		} else {
			response.write(readFile("assets/global.html").replace("{{ content }}", readFile("assets/pages/" + config.pages[config.index].file)).replace("{{ page-title }}", config.pages[config.index].title));
		}
		//response.write(readFile("assets/global.html"));
		response.end();
	}

}).listen(port);

/**
 * wallSpider.js is a node module that allows for easy crawling of Facebook pages, posts and comments.
 * 
 * Please note: misusing this may make you a stalker, and is probably against some Facebook rule.
 * 
 * @author Aelexe
 * @see {@link https://developers.facebook.com/docs/graph-api}
 * @see {@link https://developers.facebook.com/tools/explorer}
 */
// Requires
var http = require('http');
var https = require('https');

// URL parameters.
var _apiToken;
var _fbHost = "graph.facebook.com";
var _pageId;
var _feedPath = "/feed?fields=id,message,story,from,created_time";
var _commentPath = "/comments?";
var _replyPath = "/comments?";
var _sinceQuery = "&since=";
var _untilQuery = "&until=";
var _apiTokenQuery = "&access_token=";

// Query configuration.
var _pastDateQueryLimit = 7; // The number of days backwards to go hunting for posts.

// Constants
var _epochDay = 86400; // A day in epoch time.

/**
 * Sets the API token to use for requests.
 * 
 * @param apiToken API token to use for requests.
 */
function setApiToken(apiToken) {
	_apiToken = apiToken;
}

/**
 * Crawls the Facebook API node indicated by the provided node ID, returning a list of the next node type in the hierarchy.<br>
 * page > post > comment > repply
 * <p>
 * Options include:
 * 
 * since/until - Lower and upper limit of epoch time to limit results to. (No default)
 * sinceDaysAgo - Number of days ago from which to limit results to. (Default 7 when type is page)
 * 
 * @param pageId Page ID of page to crawl.
 * @param type Type of node. e.g. page, post, comment
 */
function crawlNode(nodeId, nodeType, options) {
	return new Promise(function(resolve, reject) {
		// Default the options if not provided.
		if(!options){options = {};}
		
		// Validate type.
		if(!nodeType || (nodeType != "page" && nodeType != "post" && nodeType != "comment")){reject("Please enter a valid node type.");return;}
		
		// Default sinceDaysAgo for page.
		if(nodeType == "page" && !options.since && !options.sinceDaysAgo) {
			options.sinceDaysAgo = 7;
		}
		
		// If sinceDaysAgo is provided, set since and clear until.
		if(options.sinceDaysAgo) {
			options.since = (Math.round(new Date().getTime() / 1000)) - (_epochDay * options.sinceDaysAgo);
			options.until = undefined;
		}
		
		// Generate the path.
		var crawlPath = 	"/" + nodeId 
							+ (nodeType == "page" ? _feedPath : "")
							+ (nodeType == "post" ? _commentPath : "")
							+ (nodeType == "comment" ? _replyPath : "")
							+ (options.since ? _sinceQuery + options.since : "") 
							+ (options.until ? _untilQuery + options.until : "") 
							+ _apiTokenQuery + _apiToken;
		// Crawl!
		getRecursive(crawlPath).then(function(responses) {
			resolve(parseResponses(responses));
		});
	});
}

function parseResponses(responses, nodeType) {
	var nodes = [];
	
	for(var i = 0; i < responses.length; i++) {
		for(var j = 0; j < responses[i].data.length; j++) {
			var node = responses[i].data[j];
			var createdTime = parseDate(node.created_time);
			nodes.push({
				id: node.id,
				message: node.message ? node.message : node.story ? node.story : "",
				by: node.from.name,
				createdTime: Math.round(createdTime.getTime() / 1000),
				readableTime: createdTime.toDateString() + " " + createdTime.toTimeString()
			});
		}
	}
	
	return nodes;
}

/**
 * Recursively GETs from a Facebook API service for as long as it keeps providing cursors back.
 * 
 * @param path URL path for the Facebook API node request.
 * @param responseList List of responses for each individual request.
 * @returns {Promise}
 */
function getRecursive(path, responseList) {
	return new Promise(function(fulfill, reject) {
		if(!responseList){responseList = [];}
		
		getRequest(_fbHost, path).then(function(response) {
			responseList.push(response);
			if(response.paging && response.paging.next) {
				getRecursive(response.paging.next.split(/https:\/\/graph\.facebook\.com\/v\d\.\d/)[1], responseList).then(function(){fulfill(responseList);})
			} else {
				fulfill(responseList);
			}
		})
	});
}

/**
 * Makes a request to the provided host and path, returning a promise which will 
 * resolve with the JSON content of the response.
 * TODO Error handling.
 * 
 * @param host Host to make the request to. e.g. graph.facebook.com
 * @param path Path to make the request to (including query parameters). e.g. pagenamehere/feed
 * @returns A promise that will resolve with the JSON content of the response.
 */
function getRequest(host, path) {
	return new Promise(function(fulfill, reject) {
		https.request({
			host: host,
			path: path,
			method: 'GET'
		}, function(response) {
			var content = "";
			response.setEncoding('utf8');
			response.on('data', function (chunk) {
				content += chunk;
			});
			response.on("end", function() {
				var jsonContent = JSON.parse(content);
				fulfill(jsonContent);
			});
		}).end();
	});
}

function parseDate(date) {
	return new Date((date || "").replace(/-/g,"/").replace(/[TZ]/g," "));
}

/*
 * Exposed functions.
 */
exports.setApiToken = setApiToken;
exports.crawlNode = crawlNode;
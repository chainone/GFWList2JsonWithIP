var fs = require('fs');
var path = require('path');
var http = require('http');
var url = require('url');
var lineReader = require('line-reader');
var dns = require('dns');
var _ = require("underscore");
var base64Decode = require('base64-stream').Decode;

var gfwListFileName = "gfwlist.txt";
var outputGfwlistFileName = "gfwlist.json";
var gfwIPMappingNum = 0;

var downloadGfwlist = function(url, dest, cb){
	var file = fs.createWriteStream(dest);
	var request = http.get(url, function(response){
		response.pipe(base64Decode()).pipe(file);
		file.on('finish', function(){
			file.close(cb);
		});
	});
}

var domainsIPMapping = {};

var processGfwlistLine = function(line){
	if(line.indexOf(".*")!=-1)
		return;

	if(line.indexOf("*") != -1){
		line = line.replace('*', '/');
	}

	if(line.charAt(0) == '!' || line.charAt(0) == '[' || line.charAt(0) == '@')
		return;

	var startPos = 0;

	if(line.charAt(0) == '|' && line.charAt(1) == '|' )
		startPos = 2;
	else if(line.charAt(0) == '|' || line.charAt(0) == '.')
		startPos = 1;

	var rawUrl = line.substr(startPos);
	if(rawUrl.indexOf("http://") != 0 || rawUrl.indexOf("https://") !=0)
		rawUrl = "http://"+rawUrl;


	var hostname = url.parse(rawUrl).hostname;
	if(hostname == null || hostname == ''){
		console.log("Failed to parse "+rawUrl);
		return;
	}else{
		domainsIPMapping[hostname]='';
	}
}


function removeNull(key, value) {
  if ( value === null || value === "") {
    return undefined;
  }
  return value;
}

var finishUp = function(){
	console.log("Saving to file gfwlist.json.......");
	fs.writeFile(outputGfwlistFileName, JSON.stringify(domainsIPMapping,removeNull), function (err) {
  	if (err){
  		console.log("Failed to write to "+outputGfwlistFileName);
  	}else
		console.log("Results saved to "+outputGfwlistFileName);
	});
}

var reverseOneIP = function(value, key, list){
	dns.resolve4(key, function (err, addresses) {
		;
		if (!err){
   				domainsIPMapping[key] = addresses;
   			}else
   				console.log("Failed to resolve "+key);

   		if( --gfwIPMappingNum == 0)
   		{
   			console.log("Finished querying all IPs");
   			finishUp();
   		}
   			
	});
}

var reverseIP = function(){
	gfwIPMappingNum = Object.keys(domainsIPMapping).length;
	_.each(domainsIPMapping, reverseOneIP);
}

var startProcess = function(){
	lineReader.eachLine(gfwListFileName, function(line) {
  	processGfwlistLine(line);
	}).then(function () {
		reverseIP();
});
}




downloadGfwlist("http://autoproxy-gfwlist.googlecode.com/svn/trunk/gfwlist.txt", gfwListFileName,startProcess);

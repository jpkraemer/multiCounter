#!/usr/bin/env node

var fs = require ("fs"); 
var pathUtils = require("path");
var _ = require("lodash");
var nomnom = require("nomnom");

var config = {
	folder: ".",
	depth: 0,
	filePattern: /.*/,
	patterns: [
		{ 
			name: "All Lines", 
			pattern: /.*/
		}
	]
}; 

function countPatternsInString(content) { 
	var lines = content.split('\n');
	var result = config.patterns.map(function(pattern) {
		return { name: pattern.name, count: 0 };
	}); 
	lines.forEach(function(line) {
		config.patterns.forEach(function(pattern, index) {
			if (pattern.pattern.test(line)) {
				result[index].count ++;
			}
		});
	});

	return result;
}

function printResultToCommandline(result) {
	Object.keys(result).forEach(function (file) {
		console.log(file); 
		result[file].forEach(function(resultDict) {
			console.log("\t" + resultDict.name + ": " + resultDict.count);
		});
		// console.dir(result[file]);
	});
}

function printSummary(result, folder) {
	console.log("Summary for " + folder); 
	var summary = [];
	_.forEach(result, function (elem) {
		_.forEach(elem, function (value, key) {
			if (summary[key] === undefined) {
				summary[key] = value;
			} else {
				summary[key].count += value.count; 
			}
		});
	});
	summary.forEach(function(resultDict) {
		console.log("\t" + resultDict.name + ": " + resultDict.count);
	});
	console.log("");
}

function checkConfigFile(configFile) {
	var stats = fs.statSync(configFile);
	if (stats.isFile()) {
		var patternsString = fs.readFileSync(configFile, { encoding: "utf8" });
		try {
			var parsedPatterns = JSON.parse(patternsString); 
			if (parsedPatterns.patterns !== undefined) {
				config.patterns = parsedPatterns.patterns.map(function(parsedPattern) {
					return { name: parsedPattern.name, pattern: new RegExp(parsedPattern.pattern) };
				});
			}
			if (parsedPatterns.depth !== undefined) {
				if (typeof(parsedPatterns.depth) !== "number") { 
					console.error("Ignored depth config. Not a number.");
				} else {
					config.depth = parsedPatterns.depth;
				}
			}
			if (parsedPatterns.filePattern !== undefined) {
				var regex; 
				try {
					regex = new RegExp(parsedPatterns.filePattern);
				} catch (err) { 
					console.error("Invalid filePattern regular expression.");
					regex = undefined; 
				}
				if (regex !== undefined) {
					config.filePattern = regex;
				}
			}
		} catch (e) {
			return "Error parsing patterns file";
		}
	} else {
		return "Patterns option requires a file";
	}
}

var opts = require("nomnom")
	.option('config', {
		abbr: 'c',
		metavar: 'FILE',
		help: 'A JSON File. Config options are: patterns: { name: string, pattern: RegEx as string }, filePattern: RegEx as string, depth: int',
		callback: checkConfigFile
	})
	.option('depth', {
		abbr: 'd',
		help: 'How deep the directory hierarchy will be traversed. Overwrites value from config. Default: 0',
		callback: function (depth) { 
			if (depth != parseInt(depth)) {
				return "Depth needs to be a number";
			} else {
				config.depth = parseInt(depth);
			}
		}
	})
	.option('files', {
		position: 0,
		help: 'The directory in which to count. Required.',
		required: true
	})
	.parse();

config.folder = opts.files;
if (config.folder.match(/.*\/$/) === null) {
	config.folder += "/";
}

var folderStats = fs.statSync(config.folder);
if (! folderStats.isDirectory()) {
	console.error(config.folder + "is not a directory");
	process.exit(1);
}

var result = {}; 
function parseFolder(folder, currentDepth) {
	if (currentDepth > config.depth) {
		return;
	}
	var folderResult = {}; 
	var files = fs.readdirSync(folder); 
	for (var i = 0; i < files.length; i++) {
		var file = files[i];
		var path = pathUtils.join(folder, file); 
		var pathStats = fs.statSync(path); 
		if (pathStats.isDirectory()) {
			parseFolder(path, currentDepth + 1);
		} else if (config.filePattern.test(file)) {
			var fileContent = fs.readFileSync(path, { encoding: "utf8" });
			var resultForFile = countPatternsInString(fileContent); 
			folderResult[path] = resultForFile;
		}
	}
	printResultToCommandline(folderResult);
	printSummary(folderResult, folder);
}

parseFolder(config.folder, 0);



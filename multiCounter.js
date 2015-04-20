#!/usr/bin/env node

var fs = require ("fs"); 
var pathUtils = require("path");
var _ = require("lodash");

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

var args = process.argv; 
args.splice(0, 2);

if (args.length === 0) {
	console.log("Multi Counter"); 
	console.log("");
	console.log("Usage: multiCounter [options] directory");
	console.log("Options: ");
	console.log("  --config FILE \t JSON File. Valid config options are: ");
	console.log("\t\tpatterns \t An array of JSON objects with a name (string) and a pattern (regex as string) key. ");
	console.log("\t\tfilePattern \t A regex as string. Will count only in files matching this if present.");
	console.log("\t\tdepth \t A number. How deep the directory hierarchy will be traversed. Default: 0");
	process.exit(0);
}

var argv = require("minimist")(args);

if (argv._.length === 0) {
	console.error("Need to provide a directory containing files");
	process.exit(1);
} else {
	config.folder = argv._[0];
}

if (argv.patterns !== undefined) {
	var stats = fs.statSync(argv.patterns);
	if (stats.isFile()) {
		var patternsString = fs.readFileSync(argv.patterns, { encoding: "utf8" });
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
			console.error("Error parsing patterns file");
			process.exit(1);
		}
	} else {
		console.error("Patterns option requires a file");
		process.exit(1);
	}
} 

if (argv.depth !== undefined) {
	if (typeof(argv.depth) === "number") {
		config.depth = argv.depth;
	} else {
		console.error("Depth option requires a number parameter");
		process.exit(1);
	}
}

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



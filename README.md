# Multi Counter
Multi Counter is a simple commandline app to count certain lines in text files. For example, if you have a folder full of logs and are interested in, say, three different types of log statements that you need to count, Multi Counter is for you. 

## Installation 
    npm install -g multi-counter

## Usage
Start by `multiCounter some/log/dir`. It will output something like this: 
```
some/log/dir/1.txt
    All Lines: 9
some/log/dir/2.txt
    All Lines: 41
some/log/dir/3.txt
    All Lines: 57
some/log/dir/4.txt
    All Lines: 49
```

It becomes way more interesting when a config file is provided: `multiCounter some/log/dir -c config.json`. 

The config file is a JSON-formatted config that looks like this: 
```
{
    "patterns": [
        {
            "name": "Number of single line comments",
            "pattern": "^\\s*//"
        }
    ], 
    "depth": 1,
    "filePattern": "\\.log$"
}
```

MultiCounter will output how often every specified pattern occurred. If the **filePattern** option is specified, only files matching this regular expression will be counted. The __depth__ option specifies how many directory levels will be traversed. It can be overridden by passing the --depth option to multiCounter. 

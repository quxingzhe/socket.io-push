var winston = require('winston-levelonly');
var fs = require('fs');

var dir = 'log';
var workerId = 1;
var transports = [];
var formatter = function (options) {
    return options.timestamp() + " " + 'work:' + workerId + ' ' + options.level.substring(0, 1).toUpperCase() + '/' + (undefined !== options.message ? options.message : '');
}

var logger;

function setArgs(args) {
    if (args.workId) {
        workerId = args.workId;
    }
    if (args.dir) {
        dir = args.dir;
    }
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    if (args.count >= 10) {
        if (workerId < 10) {
            workerId = '0' + workerId;
        }
    }

    var level;
    if (args.debug) {
        level = 'debug';
    }  else {
        level = 'info';
    }

    var opts = {
        name: 'error',
        json: false,
        level: 'error',
        datePattern: 'yyyy-MM-dd.log',
        filename: dir + "/" + "error_",
        maxSize: 1,
        maxFiles: 2,
        timestamp: function () {
            return new Date().toLocaleString();
        },
        formatter: formatter
    };

    transports.push(new (winston.transports.DailyRotateFile)(opts));

    opts.name = level;
    opts.level = level;
    opts.filename = dir + "/" + level + "_";
    transports.push(new (winston.transports.DailyRotateFile)(opts))

    if (args.foreground) {
        opts.name = 'console';
        opts.levelOnly = false;
        delete opts.filename;
        delete opts.datePattern;
        opts.level = level;
        transports.push(new (winston.transports.Console)(opts));
    }

    logger = new (winston.Logger)({
        transports: transports
    });
}

var LogProxy = function (logger, tag) {
    this.logger = logger;
    this.tag = tag;
};

var meta = {};

['debug', 'info', 'error'].forEach(function (command) {

    LogProxy.prototype[command] = function (key, arg, callback) {
        if (this.logger) {
            arguments[0] = this.tag + ' ' + arguments[0];
            var mainArguments = Array.prototype.slice.call(arguments);
            mainArguments.push(meta);
            this.logger[command].apply(this, mainArguments);
        }
    }

});

var defaultArgs = {
    workId: 1,
    dir: 'log',
    debug: 1,
    foreground: 1
}
var Logger = function Logger(tag) {
    if ((typeof tag) == 'string') {
        if (!logger) {
            setArgs(defaultArgs)
        }
        return new LogProxy(logger, tag);
    } else if (tag) {
        setArgs(tag);
    } else {
        setArgs(defaultArgs);
    }
};

module.exports = Logger;
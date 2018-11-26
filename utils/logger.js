"use strict";

const fs=require('fs');
const log=require('log4js');
const config=require('../config.js');
const loggers = {};

let logdir=process.cwd()+config.logger.dir;
let stat =null;
try {
    stat = fs.statSync(logdir);
} catch(error) {
    if(error.code=='ENOENT') fs.mkdirSync(logdir);
}

// todo npm install log4js-node-mongodb
// https://github.com/litixsoft/log4js-node-mongodb


/*
log.addLayout('console', function(config) {
    return function(loggingEvent) {
    }
});
*/

const options = {
    appenders: {
        "info": {
            type: "dateFile",
            filename: logdir + "/info",
            "maxLogSize": 20480000,
            "backups": 3,
            pattern: "-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        "access": {
            type: "dateFile",
            filename: logdir + "/access",
            "maxLogSize": 20480000,
            "backups": 3,
            pattern: "-yyyy-MM-dd.log",
            category:"access",
            alwaysIncludePattern: true
        },
        "job": {
            type: "dateFile",
            filename: logdir + "/jobs",
            "maxLogSize": 20480000,
            "backups": 3,
            pattern: "-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        "sql": {
            type: "dateFile",
            filename: logdir + "/sql",
            "maxLogSize": 20480000,
            "backups": 3,
            pattern: "-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        "mongo": {
            type: "dateFile",
            filename: logdir + "/mongo",
            "maxLogSize": 20480000,
            "backups": 3,
            pattern: "-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        "error": {
            type: "dateFile",
            filename: logdir + "/error",
            "maxLogSize": 20480000,
            "backups": 3,
            pattern: "-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        "console": {
            type: "console"
        }
    },
    categories: {
        default: { appenders: ['console', 'info'], level: 'debug' },
        job: { appenders: ['console', 'job'], level: 'debug' },
        sql: { appenders: ['console', 'sql'], level: 'debug' },
        access: { appenders: ['console', 'access'], level: 'debug' },
        mongo: { appenders: ['console', 'mongo'], level: 'debug' },
        error: { appenders: ['console', 'error'], level: 'error' }
    }
};

log.configure(options);


function logger(o) {
    o=o || 'default';

    if(!options.categories[o]){
        o = 'default';
    }

    if(!loggers[o]){
        loggers[o] = log.getLogger(o);
    }
    return loggers[o];
}

module.exports=logger;
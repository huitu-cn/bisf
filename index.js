"use strict"
/**
 * Created by xman on 2017/6/14.
 */

const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const cookieParser = require('restify-cookies');
const moment = require('moment');

const logger=require('./utils/logger.js')();
const logerr=require('./utils/logger.js')('error');
const access =require('./utils/logger.js')('access');

const config = require('./config.js');
const router = require('./router.js');

const server = restify.createServer({
    name: config.name||undefined
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.dateParser());
server.use(restify.plugins.queryParser({mapParams:true}));
server.use(restify.plugins.bodyParser({mapParams:true}));
server.use(cookieParser.parse);
server.use(restify.plugins.gzipResponse());

let cors =  null;
if(config.auth) {
    cors = corsMiddleware({
            origins:config.origins,
            allowHeaders:['authorization','x-token',"accept-version"],
            // credentials:true
        });
} else {
    cors = corsMiddleware({
        origins:['*'],
        allowHeaders:['authorization','x-token',"accept-version"],
    });
}

server.pre(cors.preflight);
server.use(cors.actual);

router.register(server);

server.get('/*', restify.plugins.serveStatic({
    directory: './static',
    default: 'index.html'
}));

server.pre(function(req, res, next) {
    req["@pre"] = new Date();

    let ips = ( (req.headers['x-forwarded-for'] || '').split(',')[0]
        || req.connection.remoteAddress
        || req.socket.remoteAddress
        || req.connection.socket.remoteAddress
        || '').split(':');
    let ip = ips.length==1 ? ips[0] : ips[ips.length-1];

    req.ip = ip;
    ips = ip.split(".");

    let ipnum = Number(ips[0]) * 256 * 256 * 256 + Number(ips[1]) * 256 * 256 + Number(ips[2]) * 256 + Number(ips[3]);
    ipnum = ipnum >>> 0;

    req.ipnum = ipnum;

    return next();
});
server.on('routed',function(req, res, route) {
});

let onError =  function(req, res, error, callback) {

    let timestamp = moment().format("YYYY-MM-DD HH:mm:ss.SSSS");

    let o = {timestamp:timestamp};

    let message = "uncaught exception";
    let code = "ex-ue";

    if(error && error.message){
        message = error.message;
    }
    if(error && error.code){
        code = error.code;
    }

    o.method = req.method;
    o.url = req.url;
    o.route = req.route;
    o.params = req.params;
    o.header = req.header;

    o.code = code;
    o.message = message;

    logerr.error(JSON.stringify(o));
    access.error(JSON.stringify(o));

    return callback();
}

server.on('InternalServer',onError);
server.on('restifyError', onError);

server.listen(config.port, function () {
    logger.info('%s start listening at %s', server.name, server.url);
});

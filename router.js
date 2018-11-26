/**
 * Created by xman on 2017/6/30.
 */
"use strict"

const fs = require("fs");
const errs = require('restify-errors');
const auth = require("./auth/passport.js");
const utils=require('./utils/utils.js');
const cache = require("./utils/cache.js");

const config = require('./config.js');
const reqend = require('./end.js');

const logger=require('./utils/logger.js')();
const logerr=require('./utils/logger.js')('error');
const mongo=require('./utils/logger.js')('mongo');
const cros  = require("./api/cros.js");
const init = require("./init.js");

const routes = {};

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = (new JSDOM('')).window;
const DOMPurify = createDOMPurify(window);

function __addRouter(root,filename) {
    if(!filename.endsWith(".js")
        || filename.endsWith("cros.js")
        || filename.endsWith(".conf.js")
        || filename.endsWith(".exclude.js")){
        return;
    }

    try{
        let o = require(filename);

        if(typeof o.method=="string" && typeof o.path=="string" && 'function'==typeof o.fn){
            logger.info("\t auto load router :"+filename)
            routes[filename] = {root:root,route:o};
        }
    }catch (ex){
        logerr.error("\t load router["+filename+"] on error:"+ ex.message);
    }
}

function __loadSubRoutes(root,path) {

    logger.info(`found router sub dir:${path}`);

    let files = fs.readdirSync(path,'utf8');

    files.forEach((it)=>{
        let filename = path+it;
        let stat = fs.statSync(filename);

        if(stat.isFile()){
            __addRouter(root,filename);
        }else if(stat.isDirectory()){
            __loadSubRoutes(root,path+it+"/");
        }

    });

}

function __loadSubConfig(name,filename) {

    if(!fs.existsSync(filename)){
        return;
    }
    let stat = fs.statSync(filename);

    if(!stat.isFile()){
        return;
    }


    if(!config['api']){
        config['api'] = {};
    }

    let obj = config['api'];

    console.info("[Info]\t\tauto load config item :"+filename)

    if ('undefined' != typeof obj[name]) {
        console.warn(`[Warn]\t\toverride config['api'][${name}]`);
    }

    let str = fs.readFileSync(filename, {encoding: "utf-8"});

    try {
        obj[name] = JSON.parse(str);
    } catch (ex) {
        console.error(`[Error]\t\tstring to json on error[${ex.message}]:\r\n${str}`)
    }

}

/*auto load api router*/
function __loadRootRoutes(path) {

    logger.info(`found router root dir:${path}`)

    let files = fs.readdirSync(path,'utf8');

    files.forEach((it)=>{
        let filename = path+it;
        let stat = fs.statSync(filename);

        if(stat.isFile()){
            __addRouter(base,filename);
        }else if(stat.isDirectory()){
            __loadSubRoutes(base+it+"/", path+it+"/");
            __loadSubConfig(it,path+it+"/config.json");
        }

    });

}

const base = "/api/";

const isAuth = config.auth;

function __run(fn,cacheable) {
    return function(req, res, next){

        for(let key in req.params){
            let val  = req.params[key];
            let xss = DOMPurify.sanitize(val);
            if(val!==xss){
                req.params[key] = xss;
            }
        }

        //是否进行认证
        if(isAuth && req.route
            //&& "/api/cros"!==req.route.path
            && null!=passport){
            passport.authenticate('bearer', { session: false })(req,res,___fn);
        } else {
            ___fn();
        }

        function ___fn() {

            if(cacheable && req.hit) {//命中一级缓存
                return reqend(req,res,next,res.result,cacheable);
            }

            const asyncBlock =(async function() {
                try {

                    let result = null;

                    let params = req.params;

                    let val = JSON.stringify(params);

                    let ckey = req.route.name + ":" + utils.md5(val);

                    if (cacheable) {
                        result = await cache.deflate.get(ckey);
                    }
                    req.ckey = ckey;

                    if (null != result) {//命中二级缓存
                        req.hit = true;
                        req.result = result;
                        return reqend(req, res, next, result, cacheable);
                    }

                    result = await fn(req, res);//res.send

                    /*
                    if (fn.length && fn.length == 3) {

                        result = await fn(req, res, mongo);//写res.result

                    } else {
                        result = await fn(req, res);//写res.result
                    }*/

                    if('undefined'!==typeof result){
                        return reqend(req, res, next, result, cacheable);
                    }else {
                        //todo fixed muti version bug[res.send("ok")]
                        // return next();
                    }
                }catch (e) {
                    return next(new errs.InternalServerError(e.message));
                }
            })
            
            asyncBlock();
        }

    };
}

let  passport = null;
function __auth(server) {
    passport = auth.initialize(server);
    auth.reload();

    server.post(base + 'auth/login',
        function (req, res, next) {
            passport.authenticate('local', {session: false},
                function (err, user, info) {

                    if (err) {
                        req.user = {username:req.params.username};
                        mongo.warn("sys_log",req,"用户认证异常",{status:"err",tp:"用户认证",password:req.params.password});

                        return res.send(500,{'code': 'InternalServer', 'message': err.message});
                    }
                    if (!user) {

                        req.user = {username:req.params.username};
                        mongo.warn("sys_log",req,"用户认证失败",{status:"fail",tp:"用户认证",password:req.params.password});

                        return res.send(200,{'status': 'fail', 'message': info.message});
                    }

                    req.user = user;

                    mongo.info("sys_log",req,"用户认证成功",{status:"ok",tp:"用户认证"});

                    return res.send(200,{'status': 'ok', 'user': user});

                })(req, res, next);
        });

    server.get(base+'auth/logout',function (req, res, next) {//是否进行认证
        if(isAuth && null!=passport){
            passport.authenticate('bearer', { session: false })(req,res,___fn);
        }

        function ___fn() {

            mongo.info("sys_log",req,"用户退出登录",{status:"ok",tp:"用户认证"});

            passport.logout(req);
            return res.send(200,{'status': 'ok'});
        }
    });
}

function _register(server) {

    server[cros.method](cros.path,__run(cros.fn));//api/cros

    __auth(server);

    for(var key in routes){
        let cfg = routes[key];
        let root = cfg.root;
        let route = cfg.route;
        try{
            let cacheable = route.cacheable;
            if('undefined'==typeof cacheable){
                cacheable = true;//默认启用缓存
            }
            server[route.method](root+route.path, __run(route.fn,!!cacheable));
            logger.info("register route[%s]-%s%s",route.method,root,route.path);
        }catch (ex){
            logerr.error("register route[%s]-%s%s on error:%s",route.method,root,route.path,ex.message)
        }
    }
}


const __initializing = async ()=> {
    try {
        //加载api
        __loadRootRoutes(process.cwd()+"/api/");
        //todo 发布正式版时打开下行注释:每次重启API清空缓存
        // init.clear();
        await init.ensure();
    } catch (e) {
        logger.error(e);
    }
}

__initializing();

module.exports = {
    register:_register
}

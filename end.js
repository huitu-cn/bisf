/**
 * Created by xman on 2017/6/30.
 */
"use strict";

const moment = require('moment');
const logerr=require('./utils/logger.js')('error');
const conv = require("./conv/api.js");
const access =require('./utils/logger.js')('access');

let _end = function (req,res,next,result,cacheable) {

    if(!result) {
        res.send(200,result);

        if('function'==typeof next){
            return next();
        }
        return true;
    }

    let now = new Date();
    let pre = req["@pre"] || now;

    let timestamp = moment(pre).format("YYYY-MM-DD HH:mm:ss.SSSS");

    let duration = now.getTime()-pre.getTime();

    let o = {timestamp:timestamp};

    o.method = req.method;
    o.url = req.url;
    o.route = req.route;
    o.duration = duration;
    o.params = req.params;
    o.headers = req.headers;

    if(duration>1000){//如果从缓存读取，请求不会超过这个时间，所以不会继续更新缓存

        let ckey = req.ckey;
        let expires = 60;//大于1秒的消息缓存60秒

        access.warn(JSON.stringify(o));
        if(duration>5000){//大于5秒写响应,并缓存600秒
            // logger.warn(JSON.stringify(result) );
            access.warn("request duration ["+duration+"]");
            expires = 600;//
        }

        if(cacheable && ckey ) {
        }
    } else {
        access.info(JSON.stringify(o));
    }

    res.charSet('utf-8');//设置响应编码

    try{
        let name = req.params.conv || '';
        if(conv[name]) {//调用转换函数，将结果转换成前端直接绑定的成果

            let args = req.params.args || [];

            if(! args instanceof Array) {
                args = args.split(',');
            }

            args.unshift(result);

            let cresult =  conv[name].apply(conv,args);

            res.send(200,{code:20000,data:cresult});
        } else {
            res.send(200,{code:20000,data:result});
        }
    }catch(ex){
        logerr.error(JSON.stringify(ex));
        logerr.error(JSON.stringify(o));
        access.error(JSON.stringify(ex));
        res.send(500,{code:500,error:{code:"InternalServer",message:ex.message}});
        return false;
    }

    if('function'==typeof next){
        return next();
    }
    return true;
}

module.exports = _end;

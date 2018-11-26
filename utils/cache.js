/**
 * Created by xman on 2017/7/13.
 */
"use strict";

const Redis = require('async-redis');
const config = require('../config.js');
const pako = require("pako");
const logger=require('../utils/logger.js')("error");

let redis = null;
//todo 如果未安装redis 设置has为flase
let has = config.redis.enable;

let cache = {};

cache.instance = function () {
    if (!has) {
        return this;
    }
    redis = Redis.createClient(config['redis']);
    redis.on('error', function (err) {
        logger.error('redis-error', err);
    });

    return this;
}

cache.set = async function(key,value,expires) {
    if(!has){
        return null;
    }
    await redis.set(key,JSON.stringify(value));
    if(!isNaN(expires)){
        await redis.expire(key,expires);
    }
};

cache.get = async function(key) {
    if(!has){
        return null;
    }
    let r=await redis.get(key);
    return r? JSON.parse(r) : null;
};
cache.del = async function(key) {
    await redis.del(key);
}

cache.deflate = {};

cache.deflate.set = async function (key, value, expires) {
    if(!has){
        return null;
    }
    let val = pako.deflate(JSON.stringify(value), { to: 'string' });

    await redis.set(key,val);
    if(!isNaN(expires)){
        await redis.expire(key,expires);
    }
}
cache.deflate.get = async function (key) {
    if(!has){
        return null;
    }
    let r=await redis.get(key);
    return r ? JSON.parse(pako.inflate( r , { to: 'string' }) ) : null;
}

cache.strlen = async function (key) {
    if(!has){
        return null;
    }
    return await redis.strlen(key);
}

cache.getrange = async function (key,start,end) {
    if(!has){
        return null;
    }
    return await redis.getrange(key,start,end);
}

cache.setrange = async function (key,start,value) {
    if(!has){
        return null;
    }
    return await redis.setrange(key,start,value);
}

module.exports = cache.instance();
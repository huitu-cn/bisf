"use strict";

const crypto = require('crypto');
const mysql = require('mysql')


/**
 * 程序休眠
 * @param ms
 * @returns {Function}
 */
function sleep(ms) {
    return function (cb) { setTimeout(cb, ms); };
}

function cacle(time) {
    //计算出相差天数
    time = time * 1000;

    var days=Math.floor(time/(24*3600*1000))
    //计算出小时数
    var leave1=time%(24*3600*1000)    //计算天数后剩余的毫秒数
    var hours=Math.floor(leave1/(3600*1000))
    //计算相差分钟数
    var leave2=leave1%(3600*1000)        //计算小时数后剩余的毫秒数
    var minutes=Math.floor(leave2/(60*1000))
    //计算相差秒数
    var leave3=leave2%(60*1000)      //计算分钟数后剩余的毫秒数
    var seconds=Math.round(leave3/1000);

    return days+"天 "+hours+"小时 "+minutes+" 分钟"+seconds+" 秒";
}

/**
 * md5
 * @param {*} data 
 * @param {*} digest 
 */
function md5(data, digest) {
    return crypto.createHash('md5').update(data,'utf8').digest(digest ||'hex' ).slice(4,-4);
}


function cypwd(salt,password,digest) {
    let data = salt+password+salt;

    return crypto.createHash('md5').update(data,'utf8').digest(digest ||'hex' );
}

/**
 * Return a unique identifier with the given `len`.
 * @author: jaredhanson
 *
 *     utils.uid(10);
 *     // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */
 function uid(len) {
    var buf = []
        , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        , charlen = chars.length;

    for (var i = 0; i < len; ++i) {
        buf.push(chars[__random(0, charlen - 1)]);
    }

    return buf.join('');
};

/**
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 */
function __random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let _fixed=function(value,digits){
    return parseFloat( parseFloat(value).toFixed(digits));
}

let _precision=function(value,digits){
    return parseFloat( parseFloat(value).toPrecision(digits));
}

function _padRight(str,maxlen,chr) {
    let len = maxlen-str.length;
    for(let xx=0;xx<len;xx++) {
        str += chr;
    }
    return str;
}

function _args(name) {
    var args = process.argv.splice(2);

    return args;
}

function _cdate(obj,attr) {
    if('object'!=typeof obj){

        if('string'===typeof obj){
            if(10===obj.length) {
                try{
                    return new Date(obj+" 00:00:00");//yyyy-MM-dd
                } catch (ex){
                    console.error(ex.message)
                }
            } else if(0==obj.length){
                return new Date();
            }

            try{
                return new Date(obj);
            } catch (ex){
                console.error(ex.message)
            }
        } else if('number'==typeof obj) {
            return new Date(obj);
        }

        return obj;
    }

    if(obj instanceof Array){
        obj.forEach((it)=>{
           _cdate(it,attr);
        });
    } else if(obj[attr] && 'string'==typeof obj[attr] || 'number'==typeof obj[attr]){
        try{
            obj[attr] = new Date(obj[attr]);
        }catch (ex){
            return obj;
            console.error(ex.message)
        }
    } else {
        return obj;
    }
}

let _sort = function (property){
    return function(a,b){
        var value1 = a[property];
        var value2 = b[property];
        return value1 - value2;
    }
}
let _escape = function (val) {
    if('string'===typeof val) {//移除'
        val = mysql.escape(val);
        val = val.substring(1,val.length-1);
    }
    return val;
};

let _queryFormat = function (query, values) {
    if (!values) return query;
    let sql = query.replace(/\:(\w+)/g, function (txt, key) {
        if (values.hasOwnProperty(key)) {
            let val = _escape(values[key]);
            return val;
        }
        return (txt);
    }.bind(this));

     // console.log("execute sql :\r\n"+sql)

    return sql;
};

module.exports={
    md5:md5,
    cdate:_cdate,
    sleep:sleep,
    cacle:cacle,
    padRight:_padRight,
    args:_args,
    uid:uid,
    fixed:_fixed,
    precision:_precision,
    cypwd:cypwd,
    sort:_sort,
    escape:_escape,
    queryFormat:_queryFormat
};

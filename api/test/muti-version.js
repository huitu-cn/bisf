/**
 * Created by xman on 2017/6/30.
 */

const restify = require('restify');
const reqend = require('../../end.js');

const config = require('../../config.js');
let __v1 = async function (req, res) {

    let result =  "OK-1";
    let cacheable = false;

    return reqend(req, res, null, result, cacheable);
}

let __v2 = async function (req, res) {
    let result =  "OK-2";
    let cacheable = false;

    let obj = config.api;
    return reqend(req, res, null, result, cacheable);
}

let _fn = restify.plugins.conditionalHandler([
    { version: '1.0.0', handler: __v1 },
    { version: '2.0.0', handler: __v2 }
])

module.exports = {
    "method":"get",
    "path":"muti-version",
    "fn":_fn
};
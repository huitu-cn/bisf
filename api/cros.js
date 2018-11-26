/**
 * Created by xman on 2017/6/30.
 */

const errs = require('restify-errors');

let _fn = async function (req, res) {
    return "OK";
}

module.exports = {
    "method":"get",
    "path":"/api/cros",
    "fn":_fn
};
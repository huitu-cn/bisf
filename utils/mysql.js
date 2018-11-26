const mysql = require('mysql')
const config = require("../config.js");
const utils = require("../utils/utils.js");
const logger=require('../utils/logger.js')("sql");

function _(name) {
    name = name||'mysql';

    config.db[name].queryFormat =utils.queryFormat;
    const pool =new mysql.createPool(config.db[name]);

    pool.on('error', err => {
        logger.error("mssql error:"+JSON.stringify(err));
    })
    async function _query(query,values) {
        return new Promise(function (resolve, reject) {

            let tm = new Date();
            pool.query(query, values, function (err, rows) {
                let tick = (new Date()).getTime()-tm.getTime();
                if(tick>3000){
                    logger.warn(`slow mysql query [${tick}]: ${query}`)
                }
                if (err) {
                    logger.error(`mssql query error[${err.message}]:\n${query}`)
                    reject(new Error(err));
                } else {
                    resolve(rows);
                }
            });
        });
    }

    this.query = _query;

    return this;
}

module.exports = _;
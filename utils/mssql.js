const mssql = require('mssql')
const config = require("../config.js");
const utils = require("../utils/utils.js");
const logger=require('../utils/logger.js')("sql");

function _(name) {
    name = name || 'mssql';

    const pool = new mssql.ConnectionPool(config.db[name]);

    pool.on('error', err => {
        logger.error("mssql error:" + JSON.stringify(err));
    })

    async function _query(query, values) {
        if (!pool._connected) {
            await pool.connect();
        }
        let sql = utils.queryFormat(query, values);

        let tm = new Date();
        let result = null;
        try {
            result = await pool.request()
                .query(sql)
        } catch (e) {
            logger.error(`mssql query error[${e.message}]:\n${query}`)
        }
        let tick = (new Date()).getTime() - tm.getTime();
        if (tick > 3000) {
            logger.warn(`slow mssql query[${tick}]: ${query}`)
        }
        return result;
    }
}

module.exports = _;
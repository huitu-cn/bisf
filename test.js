let m = require('./api/eoms/question/tfs.put.js')
let texts = "";

(async function f() {
   await m.fn(
        {
            params:{
                multi:'F',
                cid:4,
                tp:4,
                texts:texts
            }
        }
    );
})()
/**
 * Created by xman on 2017/7/26.
 */
"use strict"

const _ = require('lodash');
const logger=require('../utils/logger.js')();

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const BearerStrategy = require('passport-http-bearer').Strategy;

const utils=require('../utils/utils.js');
const config = require('../config.js');

const fs = require("fs");

const users = {
    "admin": {
        username: 'admin',
        password: '21232f297a57a5a743894a0e4a801fc3',
        salt:"",
        adcd:"",
        adnm:"",
        roles:[],
        token:'',
        email: 'admin@huitu.com.cn'
    },
    "guest": {
        username: 'guest',
        password: '084e0343a0486ff05530df6c705c8bb4',
        salt:"",
        adcd:"",
        adnm:"",
        roles:[],
        token:'',
        email: 'guest@huitu.com.cn'
    }
};

const online = {};
const salts = {};

async function __findByToken(token,) {
    let o = online[token];

    return o;
}

async function  __findByUsername (username, fn) {

    let user = {};

    if(user && user.password) {
        user.salt = user.salt || '';
        return user;
    }
    return user;
}

function __initialize() {
    passport.use(new LocalStrategy({
            usernameField:"username",
            passwordField:"password"
        },
        function(username,password, done) {
            process.nextTick(async function () {
                try{
                    let user = await __findByUsername(username);

                    if (!user) {
                        return done(null, false, { message: 'Unknown user ' + username });
                    }
                    // 当password=="usepwd==false"时  需要跳过密码验证
                    if (password!="usepwd==false") {
                        let pwd =  utils.cypwd(user.salt,password) ;//前后加盐
                        if (user.password != pwd) {
                            return done(null, false, { message: 'Invalid password' });
                        }
                    }

                    //online
                    let cuser = _.cloneDeep(user);//当前用户clone

                    delete cuser.password;//删除密码
                    delete cuser.salt;//删除盐

                    var token = utils.uid(256);
                    cuser.token = token;

                    online[cuser.token] = {user:cuser,date:new Date()};
                    salts[cuser.token] = cuser.salt;
                    return done(null, cuser);
                }catch (e) {
                    return done(e);
                }
            });
        }
    ));

// Use the BearerStrategy within Passport.
    passport.use(new BearerStrategy({
        },
        function(token, done) {
            process.nextTick(async function () {
                try{
                    let user = __findByToken(token);

                    if (!user) {
                        return done(null, false);
                    }

                    user.salt = salts[token];
                    return done(null, user);
                }catch (e) {
                    return done(e);
                }
            });
        }
    ));
}

function initialize(server) {
    server.use(passport.initialize());
    __initialize();//是否验证密码usePwd

    return passport;
}

passport.logout = function (req) {
    if(req && req.user && req.logout){
        let user = req.user;
        req.logout();
        delete online[user.token];
        delete salts[user.token];
    }
}

setInterval(function () {
    let now = new Date();
    let max = 60 * 60 * 24;//1天
    let list = [];

    for(let key in online) {
        let date = online[key].date;
        let seconds = (now.getTime()-date.getTime())/1000;
        if(seconds>max) {
            //强制退出
            let user = online[key].user;
            let token = user.token || ''
            list.push({username:user.username,token:token,status:"ok",limit:max,timestamp:new Date(),ip:"",message:"系统强制退出超时用户",tp:"用户认证"});

            logger.info("强制退出:"+user.username);
            delete online[key];
            delete salts[user.token];
        }
    }

    if(0==list.length){
        return;
    }

    //TODO 记录日志到数据库中

   /* co(function*() {
        yield beat.connect(config.mongodb.url);
        let conn=beat.collection("sys_log");
        let bulk = conn.initializeOrderedBulkOp();

        list.forEach((it)=>{
            bulk.insert(it);
        });

        yield bulk.execute(); //bulk execute
        // beat.close();
    }).catch(function(err) {
        console.error(err);
    });*/
},1000 * 60);


let memf = "./mem.json";

function handle(signal) {
    logger.info('Received '+(signal ? signal : 'SIGTERM')+',save online');
    let mem = {online:online,salts:salts};

    //保存在线用户信息
    fs.writeFileSync(memf,JSON.stringify(mem),{encoding:"UTF-8"});
    process.exit(0);
}

function reload() {
    if(fs.existsSync(memf)) {
        logger.info("reload online user info")
        let mem = fs.readFileSync(memf,'utf-8');
        mem = JSON.parse(mem);
        for(let key in mem.online) {
            online[key] = mem.online[key];
            try{
                online[key].date = new Date(online[key].date);
            }catch(ex){
                logger.error(ex);
            }
        }
        for(let key in mem.salts) {
            salts[key] = mem.salts[key];
        }
    }
}

process.on('SIGINT', handle);
process.on('SIGTERM', handle);

module.exports = {
    initialize:initialize,
    reload:reload
};
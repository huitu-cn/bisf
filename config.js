const fs = require("fs");


const config = {
    port:8091,
    auth:false,
    name: "api-eoms",
    api:{},
    logger:{
        dir:'/logs',
    }
}

function __addConfig(obj,name,filename) {
    if(!fs.existsSync(filename)){
        return;
    }
    let stat = fs.statSync(filename);
    if(!stat.isFile()){
        return;
    }

    if (!filename.endsWith(".json")) {
        return;
    }

    let it = name.substr(0, name.length - 5);

    console.info("[Info]\t\tauto load config item :"+filename)

    if ('undefined' != typeof obj[it]) {
        console.warn(`[Warn]\t\toverride obj[${it}]`);
    }

    let str = fs.readFileSync(filename, {encoding: "utf-8"});

    try {
        obj[it] = JSON.parse(str);
    } catch (ex) {
        console.error(`[Error]\t\tstring to json on error[${ex.message}]:\r\n${str}`)
    }

}

function __loadSubConfig(root,path) {

    console.info(`[Info]\t\tfound config sub dir:${path}`);

    let files = fs.readdirSync(path,'utf8');

    files.forEach((it)=>{
        let filename = path+it;
        let stat = fs.statSync(filename);

        if(stat.isFile()){
            __addConfig(root,it,filename);
        }else if(stat.isDirectory()){

            if('undefined'!=typeof root[it]){
                console.warn(`[Warn]\t\toverride root[${it}]`);
            }

            root[it] = {};

            __loadSubConfig(root[it],path+it+"/");
        }

    });
}

function __loadConfigRoutes(path) {

    console.info(`[Info]\t\tfound config root dir:${path}`);

    let files = fs.readdirSync(path,'utf8');

    files.forEach((it)=>{
        let filename = path+it;
        let stat = fs.statSync(filename);

        if(stat.isFile()){
            __addConfig(config,it,filename);
        }else if(stat.isDirectory()){

            if('undefined'!=typeof config[it]){
                console.warn(`[Warn]\t\toverride config[${it}]`);
            }

            config[it] = {};

            __loadSubConfig(config[it],path+it+"/");
        }

    });
}

function __initializing(){
    try {
        __loadConfigRoutes(process.cwd()+"/config/");
    } catch (e) {
        console.error(e);
    }
}

__initializing();

module.exports = config;
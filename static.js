const fs = require("fs"); 
const path = require("path"); 
const crypto = require('crypto')

//读文件内容
function parseStatic(dir){
    return new Promise((resolve,reject) => {
        fs.readFile(dir,(err,data)=>{
            if(err) return reject(err) 
            resolve(data)
        })
    })
  }
//取文件信息
function statfile(url){
    return new Promise((resolve,reject)=>{
        fs.stat(url, function (err, stats) {
            if(err) return reject(err)
            resolve(stats)        //true
        })
    })
}
  
//取文件后缀,添加对应文件类型
const mimes = {
  css: 'text/css',
  less: 'text/css',
  gif: 'image/gif',
  html: 'text/html',
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'text/javascript',
  json: 'application/json',
  pdf: 'application/pdf',
  png: 'image/png'
};
let maxage = 0;
//处理强缓存时间单位y M d h m s
function getMaxage(maxage){
    const unit = maxage.substring(maxage.length-1);
    const time = maxage.substring(0,maxage.length-1);
     switch(unit){
        case 's':
            maxage = time
            break;
        
        case 'm':
            maxage = time * 60
            break;
        
        case 'h':
            maxage = time * 60 * 60
            break;
        
        case 'd':
            maxage = time * 60 * 60 * 24
            break;
        
        case 'M':
            maxage = time * 60 * 60 * 24 * 30
            break;

        case 'y':
            maxage = time * 60 * 60 * 24 * 30 * 365
            break;
        default:
            break

    }
    return maxage
}
//设置文件类型
function setContentType(url){
    let extname = path.extname(url)       //extname  取路径的后缀名
    extname = extname?extname.substring(1):''
    return mimes[extname]
}
function staticFun(dir,opts){
    return async  function(ctx,next){  
        let staticFile = dir.substring(dir.lastIndexOf('/') + 1)
            staticFile =  ctx.url.indexOf(staticFile); //取是否静态资源目录
        const currPath = path.relative('/',ctx.url);
        let statsName; // 读文件信息
        if(staticFile > 0){
            try{
                ctx.set('Content-Type', setContentType(ctx.url))
                const ifModifiedSince = ctx.request.header['if-modified-since']
                const ifNoneMatch = ctx.request.headers['if-none-match']
                let hash = "";
                let bodyCont = ""
                let status = 200
                if(opts.maxAge){
                    maxage = getMaxage(opts.maxAge)
                    ctx.set({
                        'Cache-Control':`max-age=${maxage}`,
                    })
                } else {
                    ctx.set({
                        'Cache-Control': 'no-cache'
                    })
                }
                if(opts.lastModified){
                    statsName = await statfile(currPath); // 读文件信息
                    ctx.set('Last-Modified',statsName.mtime.toGMTString())
                    if(ifModifiedSince === statsName.mtime.toGMTString()){
                        status = ctx.status = 304
                    }
                }
                if(opts.etag){
                    bodyCont = await parseStatic(currPath) 
                    hash = crypto.createHash('md5').update(bodyCont).digest('base64')
                    ctx.set('Etag',hash)
                    if(ifNoneMatch === hash){
                        status = ctx.status = 304
                    }
                }
                if(status === 200){
                    ctx.status = 200
                    ctx.body = await parseStatic(currPath) 
                }
                
            }catch(e){
                ctx.status = 404
                console.log(e)
            }
        }else if(ctx.url == '/' || path.extname(ctx.url) == '.html' || path.extname(ctx.url) == '.htm'){
            if(opts.htmlCache){
                maxage = getMaxage(opts.maxAge)
                ctx.set({
                    'Cache-Control':`max-age=${maxage}`,
                })
            }else{
                ctx.set({
                    'Cache-Control':'no-cache'
                })
            }
            ctx.status = 200
            ctx.set({
                'Content-Type':'text/html'
            })
            ctx.body = await parseStatic('./index.html')
        }
    }
}
module.exports = staticFun
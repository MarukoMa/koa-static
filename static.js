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
function statFile(url){
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
//处理强缓存时间单位y M d h m s
function getMaxage(value){
    let maxage = 0;
    const unit = value.substring(value.length-1);
    const time = value.substring(0,value.length-1);
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
            maxage = value
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
    const defaultOpts = {
        htmlCache:false,
        maxAge:'',
        lastModified:true,
        etag:false
    }
    opts = Object.assign(defaultOpts,opts);
    return async  function(ctx,next){  
        try{
            const ifModifiedSince = ctx.request.header['if-modified-since']
            const ifNoneMatch = ctx.request.headers['if-none-match']
            ctx.status = 200
            const currUrl = path.relative('/',ctx.url);
            const filePath = currUrl?currUrl:'./index.html'
            const isHtml = (ctx.url == '/' || path.extname(ctx.url) == '.html' || path.extname(ctx.url) == '.htm')?true:false
            if(!isHtml){
                ctx.set('Content-Type', setContentType(ctx.url))
            }else{
                ctx.set({'Content-Type':'text/html'})
            }
            if(opts.maxAge && (!isHtml || opts.htmlCache && isHtml)){
                ctx.set({
                    'Cache-Control':`max-age=${getMaxage(opts.maxAge)}`,
                })
            } else {
                ctx.set({
                    'Cache-Control': 'no-cache'
                })
            }
            if(opts.lastModified && !isHtml){
                const statFileInfo = await statFile(filePath); // 读文件信息
                ctx.set('Last-Modified',statFileInfo.mtime.toGMTString())
                if(ifModifiedSince === statFileInfo.mtime.toGMTString()){
                    ctx.status = 304
                }
            }
            if(opts.etag && !isHtml){
                const bodyCont = await parseStatic(filePath) 
                const hash = crypto.createHash('md5').update(bodyCont).digest('base64')
                ctx.set('Etag',hash)
                if(ifNoneMatch === hash){
                    ctx.status = 304
                }
            }
            if(ctx.status === 200){
                ctx.status = 200
                ctx.body = await parseStatic(filePath) 
            }
        }catch(e){
            console.log(e)
        }
    }
}
module.exports = staticFun
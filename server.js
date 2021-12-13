const koa = require('koa')
const app = new koa()
const static = require('./static') 
const opts = {
    htmlCache:false,   
    maxAge:'3y',      
    lastModified:true,  
    etag:false
}
app.use(static((__dirname +'/static'),opts));
app.listen(2000,()=>{
    console.log('http://localhost:2000')
})
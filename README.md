# koa-static

自定义静态资源中间件koa-static,此背景源于笔者学习测试强缓存、协商缓存具体使用学习而开发的.
* 支持能支持无后缀的路径pathname,默认响应此目录下的index.html，并支持可配
* 支持开关控制，可设置.html、.htm 后缀配置为无缓存 
* 支持开关配置强缓存,缓存值单位配置
* 支持etag开关配置
* 支持last-modified开关配置
  
### Installation

`$ npm install --save-dev koaStatic`

### API

const koa = require('koa')
const app = new koa()
app.use(require('koaStatic')(root, opts));

.root:根目录
.opts options object.

## options

.htmlCache  html文件是否缓存,默认关闭(false),参数为:boolean
.maxAge   是否开启强缓存,并且支持其他时间单位配置( y:年 M:月 d:日 h:时 m:分 ),参数为:string,默认为空
.lastModified 默认打开(true), 如果有效http状态码返回304 参数为:boolean
.etag   默认关闭(false), 如果有效http状态码返回304 参数为:boolean


### Example
const koa = require('koa')
const app = new koa()
const static = require('koaStatic')
const opts = {
    htmlCache:false,   
    maxAge:'2m',      
    lastModified:true,  
    etag:false
}
app.use(static((__dirname +'/static'),opts));
app.listen(1000)
/**
 * 更新记录（自动维护，北京时间 UTC+8）
 * - 2026-03-23 09:29: 新增「全局缓存版本号」（KV: SYSTEM_CACHE_BUSTER）：更新/发布/删除后 bump，并加入 cacheKey（cb=...），解决 caches.default 分布式导致的首页不刷新问题。
 * - 2026-03-23 08:32: 发布/更新/删除后自动清理 Workers Cache API（caches.default）首页缓存，避免更新封面后首页不刷新。
 * - 2026-03-22 23:30: 修复侧栏与文章列表未对齐（两列布局被卡片边框撑宽导致 sidebar 掉落）：全局 box-sizing=border-box；卡片样式不再作用于 .main/.sidebar 容器，仅作用于 sec-panel/文章项/侧栏 widget。
 * - 2026-03-22 23:19: 新增 cacheKeyVersion（缓存Key版本）并写入 Workers Cache Key，避免部署后仍命中旧边缘缓存。
 * - 2026-03-22 22:59: 修复侧栏「近期文章」样式覆盖优先级（JustNews 的 widget_post_thumb），使用 !important 强制覆盖主题 float/margin。
 * - 2026-03-22 22:55: 移除重复注入的旧版 jQuery，避免破坏主题 JS（懒加载/侧栏固定）。
 * - 2026-04-01 12:29: 修复 Mustache 未加载导致全站 1101（Mustache is not defined）；内联 Mustache 源码（避免 CI/Module 校验环境下 importScripts 不可用）。
 * - 2026-03-22 22:40: 注入深色赛博 UI；新增发布 Token 管理接口（/admin/api/update、/admin/api/delete）；增加默认封面 defaultCover + img 兜底。
 */

/**------【①.谋而后定：配置区】-----**/

'use strict';

// Mustache template engine (inlined)
// - Why: Cloudflare Wrangler/CI validates scripts as modules; importScripts is not available there.
// - This UMD build attaches global.Mustache (global=self in Workers).
// - Use globalThis explicitly: in module workers, top-level `this` may be undefined.
(function(global,factory){typeof exports==="object"&&typeof module!=="undefined"?module.exports=factory():typeof define==="function"&&define.amd?define(factory):(global=global||self,global.Mustache=factory())})(globalThis,function(){"use strict";var objectToString=Object.prototype.toString;var isArray=Array.isArray||function isArrayPolyfill(object){return objectToString.call(object)==="[object Array]"};function isFunction(object){return typeof object==="function"}function typeStr(obj){return isArray(obj)?"array":typeof obj}function escapeRegExp(string){return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")}function hasProperty(obj,propName){return obj!=null&&typeof obj==="object"&&propName in obj}function primitiveHasOwnProperty(primitive,propName){return primitive!=null&&typeof primitive!=="object"&&primitive.hasOwnProperty&&primitive.hasOwnProperty(propName)}var regExpTest=RegExp.prototype.test;function testRegExp(re,string){return regExpTest.call(re,string)}var nonSpaceRe=/\S/;function isWhitespace(string){return!testRegExp(nonSpaceRe,string)}var entityMap={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;","`":"&#x60;","=":"&#x3D;"};function escapeHtml(string){return String(string).replace(/[&<>"'`=\/]/g,function fromEntityMap(s){return entityMap[s]})}var whiteRe=/\s*/;var spaceRe=/\s+/;var equalsRe=/\s*=/;var curlyRe=/\s*\}/;var tagRe=/#|\^|\/|>|\{|&|=|!/;function parseTemplate(template,tags){if(!template)return[];var lineHasNonSpace=false;var sections=[];var tokens=[];var spaces=[];var hasTag=false;var nonSpace=false;var indentation="";var tagIndex=0;function stripSpace(){if(hasTag&&!nonSpace){while(spaces.length)delete tokens[spaces.pop()]}else{spaces=[]}hasTag=false;nonSpace=false}var openingTagRe,closingTagRe,closingCurlyRe;function compileTags(tagsToCompile){if(typeof tagsToCompile==="string")tagsToCompile=tagsToCompile.split(spaceRe,2);if(!isArray(tagsToCompile)||tagsToCompile.length!==2)throw new Error("Invalid tags: "+tagsToCompile);openingTagRe=new RegExp(escapeRegExp(tagsToCompile[0])+"\\s*");closingTagRe=new RegExp("\\s*"+escapeRegExp(tagsToCompile[1]));closingCurlyRe=new RegExp("\\s*"+escapeRegExp("}"+tagsToCompile[1]))}compileTags(tags||mustache.tags);var scanner=new Scanner(template);var start,type,value,chr,token,openSection;while(!scanner.eos()){start=scanner.pos;value=scanner.scanUntil(openingTagRe);if(value){for(var i=0,valueLength=value.length;i<valueLength;++i){chr=value.charAt(i);if(isWhitespace(chr)){spaces.push(tokens.length);indentation+=chr}else{nonSpace=true;lineHasNonSpace=true;indentation+=" "}tokens.push(["text",chr,start,start+1]);start+=1;if(chr==="\n"){stripSpace();indentation="";tagIndex=0;lineHasNonSpace=false}}}if(!scanner.scan(openingTagRe))break;hasTag=true;type=scanner.scan(tagRe)||"name";scanner.scan(whiteRe);if(type==="="){value=scanner.scanUntil(equalsRe);scanner.scan(equalsRe);scanner.scanUntil(closingTagRe)}else if(type==="{"){value=scanner.scanUntil(closingCurlyRe);scanner.scan(curlyRe);scanner.scanUntil(closingTagRe);type="&"}else{value=scanner.scanUntil(closingTagRe)}if(!scanner.scan(closingTagRe))throw new Error("Unclosed tag at "+scanner.pos);if(type==">"){token=[type,value,start,scanner.pos,indentation,tagIndex,lineHasNonSpace]}else{token=[type,value,start,scanner.pos]}tagIndex++;tokens.push(token);if(type==="#"||type==="^"){sections.push(token)}else if(type==="/"){openSection=sections.pop();if(!openSection)throw new Error('Unopened section "'+value+'" at '+start);if(openSection[1]!==value)throw new Error('Unclosed section "'+openSection[1]+'" at '+start)}else if(type==="name"||type==="{"||type==="&"){nonSpace=true}else if(type==="="){compileTags(value)}}stripSpace();openSection=sections.pop();if(openSection)throw new Error('Unclosed section "'+openSection[1]+'" at '+scanner.pos);return nestTokens(squashTokens(tokens))}function squashTokens(tokens){var squashedTokens=[];var token,lastToken;for(var i=0,numTokens=tokens.length;i<numTokens;++i){token=tokens[i];if(token){if(token[0]==="text"&&lastToken&&lastToken[0]==="text"){lastToken[1]+=token[1];lastToken[3]=token[3]}else{squashedTokens.push(token);lastToken=token}}}return squashedTokens}function nestTokens(tokens){var nestedTokens=[];var collector=nestedTokens;var sections=[];var token,section;for(var i=0,numTokens=tokens.length;i<numTokens;++i){token=tokens[i];switch(token[0]){case"#":case"^":collector.push(token);sections.push(token);collector=token[4]=[];break;case"/":section=sections.pop();section[5]=token[2];collector=sections.length>0?sections[sections.length-1][4]:nestedTokens;break;default:collector.push(token)}}return nestedTokens}function Scanner(string){this.string=string;this.tail=string;this.pos=0}Scanner.prototype.eos=function eos(){return this.tail===""};Scanner.prototype.scan=function scan(re){var match=this.tail.match(re);if(!match||match.index!==0)return"";var string=match[0];this.tail=this.tail.substring(string.length);this.pos+=string.length;return string};Scanner.prototype.scanUntil=function scanUntil(re){var index=this.tail.search(re),match;switch(index){case-1:match=this.tail;this.tail="";break;case 0:match="";break;default:match=this.tail.substring(0,index);this.tail=this.tail.substring(index)}this.pos+=match.length;return match};function Context(view,parentContext){this.view=view;this.cache={".":this.view};this.parent=parentContext}Context.prototype.push=function push(view){return new Context(view,this)};Context.prototype.lookup=function lookup(name){var cache=this.cache;var value;if(cache.hasOwnProperty(name)){value=cache[name]}else{var context=this,intermediateValue,names,index,lookupHit=false;while(context){if(name.indexOf(".")>0){intermediateValue=context.view;names=name.split(".");index=0;while(intermediateValue!=null&&index<names.length){if(index===names.length-1)lookupHit=hasProperty(intermediateValue,names[index])||primitiveHasOwnProperty(intermediateValue,names[index]);intermediateValue=intermediateValue[names[index++]]}}else{intermediateValue=context.view[name];lookupHit=hasProperty(context.view,name)}if(lookupHit){value=intermediateValue;break}context=context.parent}cache[name]=value}if(isFunction(value))value=value.call(this.view);return value};function Writer(){this.templateCache={_cache:{},set:function set(key,value){this._cache[key]=value},get:function get(key){return this._cache[key]},clear:function clear(){this._cache={}}}}Writer.prototype.clearCache=function clearCache(){if(typeof this.templateCache!=="undefined"){this.templateCache.clear()}};Writer.prototype.parse=function parse(template,tags){var cache=this.templateCache;var cacheKey=template+":"+(tags||mustache.tags).join(":");var isCacheEnabled=typeof cache!=="undefined";var tokens=isCacheEnabled?cache.get(cacheKey):undefined;if(tokens==undefined){tokens=parseTemplate(template,tags);isCacheEnabled&&cache.set(cacheKey,tokens)}return tokens};Writer.prototype.render=function render(template,view,partials,config){var tags=this.getConfigTags(config);var tokens=this.parse(template,tags);var context=view instanceof Context?view:new Context(view,undefined);return this.renderTokens(tokens,context,partials,template,config)};Writer.prototype.renderTokens=function renderTokens(tokens,context,partials,originalTemplate,config){var buffer="";var token,symbol,value;for(var i=0,numTokens=tokens.length;i<numTokens;++i){value=undefined;token=tokens[i];symbol=token[0];if(symbol==="#")value=this.renderSection(token,context,partials,originalTemplate,config);else if(symbol==="^")value=this.renderInverted(token,context,partials,originalTemplate,config);else if(symbol===">")value=this.renderPartial(token,context,partials,config);else if(symbol==="&")value=this.unescapedValue(token,context);else if(symbol==="name")value=this.escapedValue(token,context,config);else if(symbol==="text")value=this.rawValue(token);if(value!==undefined)buffer+=value}return buffer};Writer.prototype.renderSection=function renderSection(token,context,partials,originalTemplate,config){var self=this;var buffer="";var value=context.lookup(token[1]);function subRender(template){return self.render(template,context,partials,config)}if(!value)return;if(isArray(value)){for(var j=0,valueLength=value.length;j<valueLength;++j){buffer+=this.renderTokens(token[4],context.push(value[j]),partials,originalTemplate,config)}}else if(typeof value==="object"||typeof value==="string"||typeof value==="number"){buffer+=this.renderTokens(token[4],context.push(value),partials,originalTemplate,config)}else if(isFunction(value)){if(typeof originalTemplate!=="string")throw new Error("Cannot use higher-order sections without the original template");value=value.call(context.view,originalTemplate.slice(token[3],token[5]),subRender);if(value!=null)buffer+=value}else{buffer+=this.renderTokens(token[4],context,partials,originalTemplate,config)}return buffer};Writer.prototype.renderInverted=function renderInverted(token,context,partials,originalTemplate,config){var value=context.lookup(token[1]);if(!value||isArray(value)&&value.length===0)return this.renderTokens(token[4],context,partials,originalTemplate,config)};Writer.prototype.indentPartial=function indentPartial(partial,indentation,lineHasNonSpace){var filteredIndentation=indentation.replace(/[^ \t]/g,"");var partialByNl=partial.split("\n");for(var i=0;i<partialByNl.length;i++){if(partialByNl[i].length&&(i>0||!lineHasNonSpace)){partialByNl[i]=filteredIndentation+partialByNl[i]}}return partialByNl.join("\n")};Writer.prototype.renderPartial=function renderPartial(token,context,partials,config){if(!partials)return;var tags=this.getConfigTags(config);var value=isFunction(partials)?partials(token[1]):partials[token[1]];if(value!=null){var lineHasNonSpace=token[6];var tagIndex=token[5];var indentation=token[4];var indentedValue=value;if(tagIndex==0&&indentation){indentedValue=this.indentPartial(value,indentation,lineHasNonSpace)}var tokens=this.parse(indentedValue,tags);return this.renderTokens(tokens,context,partials,indentedValue,config)}};Writer.prototype.unescapedValue=function unescapedValue(token,context){var value=context.lookup(token[1]);if(value!=null)return value};Writer.prototype.escapedValue=function escapedValue(token,context,config){var escape=this.getConfigEscape(config)||mustache.escape;var value=context.lookup(token[1]);if(value!=null)return typeof value==="number"&&escape===mustache.escape?String(value):escape(value)};Writer.prototype.rawValue=function rawValue(token){return token[1]};Writer.prototype.getConfigTags=function getConfigTags(config){if(isArray(config)){return config}else if(config&&typeof config==="object"){return config.tags}else{return undefined}};Writer.prototype.getConfigEscape=function getConfigEscape(config){if(config&&typeof config==="object"&&!isArray(config)){return config.escape}else{return undefined}};var mustache={name:"mustache.js",version:"4.2.0",tags:["{{","}}"],clearCache:undefined,escape:undefined,parse:undefined,render:undefined,Scanner:undefined,Context:undefined,Writer:undefined,set templateCache(cache){defaultWriter.templateCache=cache},get templateCache(){return defaultWriter.templateCache}};var defaultWriter=new Writer;mustache.clearCache=function clearCache(){return defaultWriter.clearCache()};mustache.parse=function parse(template,tags){return defaultWriter.parse(template,tags)};mustache.render=function render(template,view,partials,config){if(typeof template!=="string"){throw new TypeError('Invalid template! Template should be a "string" '+'but "'+typeStr(template)+'" was given as the first '+"argument for mustache#render(template, view, partials)")}return defaultWriter.render(template,view,partials,config)};mustache.escape=escapeHtml;mustache.Scanner=Scanner;mustache.Context=Context;mustache.Writer=Writer;return mustache});

// Ensure Mustache identifier is available in module scope (Wrangler deploys as modules by default)
// In module workers, global properties (globalThis.Mustache) are NOT injected as free variables.
// Also handle cases where bundlers/CJS shims make the UMD branch pick module.exports instead of global.
if(!globalThis.Mustache){
  try{
    if(typeof module !== 'undefined' && module && module.exports){
      globalThis.Mustache = module.exports;
    }else if(typeof exports !== 'undefined' && exports){
      globalThis.Mustache = exports;
    }
  }catch(e){}
}
var Mustache = globalThis.Mustache;

// =============================
// 全局缓存版本号（KV）
// - 解决问题：Workers Cache API（caches.default）是按边缘节点分布的，单点 delete 不保证全网立即刷新
// - 方案：在 KV 写入全局 cache buster，并将其加入 cacheKey，使所有边缘节点自然 miss 生成新首页
// =============================
const CACHE_BUSTER_KEY = "SYSTEM_CACHE_BUSTER";
let __cacheBuster = "";
let __cacheBusterAt = 0;
async function getCacheBuster(){
  const now = Date.now();
  // 本地缓存 30 秒，避免每次请求都打 KV
  if(__cacheBuster && (now - __cacheBusterAt) < 30000) return __cacheBuster;
  try{
    const v = await CFBLOG.get(CACHE_BUSTER_KEY);
    __cacheBuster = v || "";
  }catch(e){
    __cacheBuster = "";
  }
  __cacheBusterAt = now;
  return __cacheBuster;
}
async function bumpCacheBuster(){
  try{
    const v = String(Date.now());
    await CFBLOG.put(CACHE_BUSTER_KEY, v);
    __cacheBuster = v;
    __cacheBusterAt = Date.now();
    return true;
  }catch(e){
    return false;
  }
}

const ACCOUNT = { //账号相关，安全性更高

  "user" : "admin", //博客后台用户名
  "password" : "admin17", //博客后台密码
  "third_token" : "cfblog", //开放token，当前仅允许访问/admin/search.xml，/admin/sitemap.xml时可用，在cfblog_token的头信息中传递
  "cacheZoneId":"1ae06feafca1dbd9e406058de1c1c32f",//区域 ID
  "cacheToken":"Ufyw3C-MUsBTilR69-8Hn3o5XAYUWHLjZAYqqM1C",//API token

  "kv_var": this['CFBLOG'],//workers绑定kv时用的变量名
}

const OPT = { //网站配置

  /*--前台参数--*/
  "siteDomain" : "blog.201310.xyz",// 域名(不带https 也不带/)
  "siteName" : "CFBLOG-Plus",//博客名称
  "siteDescription":"CFBLOG-Plus" ,//博客描述
  "keyWords":"cloudflare,KV,workers,blog",//关键字
  "logo":"https://cdn.jsdelivr.net/gh/Arronlong/cfblog-plus@master/themes/JustNews/files/logo2.png",//JustNews主题的logo
  "defaultCover":"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200&h=630",// 默认封面（当文章 img 为空时兜底）

  "theme_github_path":"https://cdn.jsdelivr.net/gh/Arronlong/cfblog-plus@master/themes/",//主题路径
  "themeURL" : "https://raw.githubusercontent.com/Arronlong/cfblog-plus/master/themes/JustNews/", // 模板地址,以 "/"" 结尾
  //"search_xml_url":"", //search.xml外部链接，可通过github的action自动生成，不设置则实时生成
  //"sitemap_xml_url":"", //sitemap.xml外部链接，可通过github的action自动生成，不设置则实时生成
  
  "pageSize" : 5,//每页文章数
  "recentlySize" : 6,//最近文章数
  "recentlyType" : 1,//最近文章类型：1-按创建时间倒序（按id倒序），2-按修改时间排序
  "readMoreLength":150,//阅读更多截取长度
  "cacheTime" : 60*60*24*2, //文章在浏览器的缓存时长(秒),建议=文章更新频率
  "cacheKeyVersion": "2026-03-23-01", // 缓存Key版本：每次部署/UI调整后建议递增，用于让 Workers Cache API 失效旧缓存
  "html404" : `<b>404</b>`,//404页面代码
  "codeBeforHead":`
  <!-- NOTE: JustNews theme already loads jQuery. Do NOT load a second (older) jQuery here; it breaks theme JS (lazyload/fixed sidebar). -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
  /* ===== Cyber Dark UI Pack (injected via OPT.codeBeforHead) ===== */
  :root{
    --bg0:#070A12;
    --bg1:#0B1020;
    --card:#0E1630;
    --line:rgba(120,180,255,.14);
    --text:#D7E1FF;
    --muted:#96A6D6;
    --brand:#7C4DFF;
    --brand2:#00E5FF;
    --good:#29F5A6;
    --warn:#FFB020;
    --shadow:0 16px 40px rgba(0,0,0,.45);
  }
  *,*::before,*::after{box-sizing:border-box;}
  html,body{background:radial-gradient(1200px 900px at 20% 10%, rgba(124,77,255,.18), transparent 50%),
                     radial-gradient(1000px 800px at 80% 30%, rgba(0,229,255,.12), transparent 55%),
                     linear-gradient(180deg,var(--bg0),var(--bg1));
            color:var(--text);
            font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
            -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
  }
  a{color:var(--brand2);} a:hover{color:var(--good);} 
  /* container: follow JustNews theme default width (do not override) */

  /* cards (layout-safe): avoid styling .main/.sidebar containers to prevent sidebar dropping */
  .sec-panel, .post-loop .item, article .entry, .sidebar .widget{
    background:rgba(14,22,48,.65);
    border:1px solid var(--line);
    border-radius:14px;
    box-shadow:var(--shadow);
    backdrop-filter: blur(10px);
  }

  /* typography */
  .entry-content{font-size:16px; line-height:1.85; color:var(--text);} 
  h1,h2,h3{letter-spacing:.2px;}
  h1{font-size:32px;} h2{font-size:24px;} h3{font-size:18px; color:var(--text);} 
  p{color:var(--text);} 
  .meta, .entry-meta, .post-meta, .muted{color:var(--muted);} 

  /* code */
  pre, code{font-family:"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;}
  pre{background:rgba(0,0,0,.35); border:1px solid rgba(0,229,255,.14); border-radius:12px; padding:14px; overflow:auto;}
  code{background:rgba(0,0,0,.28); border:1px solid rgba(124,77,255,.22); border-radius:8px; padding:2px 6px;}
  blockquote{border-left:3px solid var(--brand2); background:rgba(0,229,255,.06); margin:18px 0; padding:10px 14px; border-radius:12px; color:var(--text);} 
  hr{border:none; border-top:1px solid var(--line); opacity:.9; margin:26px 0;}

  /* images (fix layout) */
  img{max-width:100%; height:auto; border-radius:14px;}

  /* Recently widget fixes (JustNews)
   * NOTE: JustNews main.css uses floats + margin-left.
   * We force a flex layout and override with !important to win specificity.
   */
  .widget_post_thumb ul{margin:0 !important; padding:0 !important; list-style:none !important;}
  .widget_post_thumb ul .item{display:flex !important; gap:12px !important; align-items:flex-start !important; padding:10px 0 !important; overflow:visible !important;}
  .widget_post_thumb .item-img{float:none !important; width:120px !important; flex:0 0 120px !important; overflow:visible !important; border-radius:12px !important;}
  .widget_post_thumb .item-img-inner{display:block !important; width:120px !important; height:72px !important; overflow:hidden !important; border-radius:12px !important; border:1px solid var(--line) !important; background:rgba(0,0,0,.25) !important;}
  .widget_post_thumb .item-img img{width:100% !important; height:100% !important; object-fit:cover !important; display:block !important; border-radius:12px !important; vertical-align:top !important;}
  .widget_post_thumb .item-content{margin-left:0 !important; flex:1 1 auto !important; min-width:0 !important;}
  .widget_post_thumb .item-title{height:auto !important; margin-bottom:6px !important;}
  .widget_post_thumb .item-title a{color:var(--text) !important; text-decoration:none !important;}
  .widget_post_thumb .item-title a:hover{color:var(--good) !important;}
  .widget_post_thumb .item-date{color:var(--muted) !important; margin-top:6px !important;}

  /* video embed */
  .oc-video{position:relative; padding-top:56.25%; border-radius:14px; overflow:hidden; border:1px solid var(--line); background:rgba(0,0,0,.35); box-shadow:var(--shadow);}
  .oc-video iframe{position:absolute; inset:0; width:100%; height:100%;}

  /* buttons */
  .btn, button, input[type=submit]{border-radius:12px;}
  </style>
  `,//其他代码,显示在</head>前
  "codeBeforBody":`
  `,//其他代码,显示在</body>前
  "commentCode":`
  <script>
    //文章浏览页 添加编辑直达功能
    $(".entry-info").append('<a style="float:right;margin-left:5px;" href="'+location.href.replace('/article/','/admin/edit/')+'" target="_blank">编辑</a>')
  </script>
  `,//评论区代码
  "widgetOther":`
  `,//20201224新增参数,用于右侧 小部件扩展
  "otherCodeA":`热度`,//模板开发用的其他自定义变量
  "otherCodeB":``,//
  "otherCodeC":``,//
  "otherCodeD":``,//
  "otherCodeE":``,//
  "copyRight" :`Powered by <a href="https://www.cloudflare.com">Cloudflare</a> & <a href="https://blog.arrontg.cf">CFBlog-Plus</a> & <a href="https://blog.gezhong.vip">CF-Blog </a>`,//自定义版权信息,建议保留大公无私的 Coudflare 和 作者 的链接
  "robots":`User-agent: *
Disallow: /admin`,//robots.txt设置
  
  /*--前后台共用参数--*/
  
  "top_flag":`<topflag>[置顶]</topflag>`,//置顶标志
  "top_flag_style":`<style>topflag {color:#ff5722}</style>`,//置顶标志的样式


  /*--后台参数--*/

  "hidden_flag":`<hiddenflag>[隐藏]</hiddenflag>`,//隐藏标志
  "hidden_flag_style":`<style>hiddenflag {color:#000000;background-color: #ffff00;}</style>`,//隐藏标志的样式
  
  "admin_home_idx": 1, //后台首页tab索引设置：1-我的文章,2-新建,3-设置,4-发布
  "editor_page_scripts": `
    //置顶设置
    let top_setting=\`
      <div class="form-group">
      <label for="exampleInputEmail2">是否置顶</label>
      <input type="hidden" class="form-control" id="top_timestamp" name="top_timestamp">
      <select class="form-control" id="istop" name="istop">
        <option value="0" selected >否</option>
        <option value="1" >是</option>
      </select>
      </div>\`
    $('form#addNewForm div.form-group,form#editForm div.form-group').last().after(top_setting);//新建和编辑页面添加置顶设置
    $("#istop").change(function(){
      $("#top_timestamp").val($(this).val()*1?new Date().getTime():0);
    });
    if(location.pathname.startsWith('/admin/edit')){//修改文章页面，自动设置置顶
      $("#istop").val(articleJson.top_timestamp?1:0);
      $("#top_timestamp").val(articleJson.top_timestamp?articleJson.top_timestamp:0);
    }
    $("#istop").trigger('change')
    //隐藏设置
    let hidden_setting=\`
      <div class="form-group">
      <label for="exampleInputEmail2">是否隐藏</label>
      <select class="form-control" id="hidden" name="hidden">
        <option value="0" selected >否</option>
        <option value="1" >是</option>
      </select>
      </div>\`
    $('form#addNewForm div.form-group,form#editForm div.form-group').last().after(hidden_setting);//新建和编辑页面添加隐藏设置
    if(location.pathname.startsWith('/admin/edit')){//修改文章页面，自动设置隐藏
      $("#hidden").val(articleJson.hidden?1:0);
    }
    let sitemapxml=\`<a  tabindex="0"  role="button"  type="submit" id="btn_export" class="btn btn-default"  href="/admin/sitemap.xml" >导出sitemap.xml</a>\`
    $('form#importForm a').last().after(sitemapxml);//设置页面添加导出sitemap.xml导出按钮
    let searchxml=\`<a  tabindex="0"  role="button"  type="submit" id="btn_export" class="btn btn-default"  href="/admin/search.xml" >导出search.xml</a>\`
    $('form#importForm a').last().after(searchxml);//设置页面添加导出search.xml导出按钮
    
    //关闭email匹配和@匹配，否则图片使用jsdelivr的cdn，如果有版本号会匹配成“mailto:xxx”从而导致显示异常
    mdEditor.settings.emailLink=false;
    mdEditor.settings.atLink=false;

    //mdEditor.settings.toc=false
    //mdEditor.settings.tocm=true  // Using [TOCM]
    //mdEditor.settings.tocContainer="#custom-toc-container" // 自定义 ToC 容器层
    //mdEditor.settings.gfm=false
    //mdEditor.settings.tocDropdown=true
    //mdEditor.settings.markdownSourceCode=true // 是否保留 Markdown 源码，即是否删除保存源码的 Textarea 标签
    mdEditor.settings.emoji=true
    mdEditor.settings.taskList=true;// 默认不解析
    mdEditor.settings.tex=true;// 默认不解析
    mdEditor.settings.flowChart=true; // 默认不解析
    mdEditor.settings.sequenceDiagram=true;// 默认不解析
    
    //开启全局html标签解析-不推荐
    //mdEditor.settings.htmlDecode=true;
    
    window.mdEditor=mdEditor;    
    //editormd工具栏上添加html标签解析开关
    mdEditor.getToolbarHandles().parseHtml=function(){
      let ele = $(".editormd-menu li a i:last");
      if(ele.hasClass('fa-toggle-off')){
        ele.removeClass('fa-toggle-off').addClass('fa-toggle-on');
        mdEditor.settings.htmlDecode = true;
      }else if(ele.hasClass('fa-toggle-on')){
        ele.removeClass('fa-toggle-on').addClass('fa-toggle-off')
        mdEditor.settings.htmlDecode = false;
      }
      mdEditor.setMarkdown(mdEditor.getMarkdown());
    }
    setTimeout(function(){
      $(".editormd-menu").append('<li class="divider" unselectable="on">|</li><li><a href="javascript:;" title="解析HTML标签" unselectable="on"><i class="fa fa-toggle-off" name="parseHtml" unselectable="on"> 解析HTML标签 </i></a></li>')
      mdEditor.setToolbarHandler(mdEditor.getToolbarHandles())
    },300)

    //默认图片，工具：https://tool.lu/imageholder/
    if($('#img').val()=="")$('#img').val('https://cdn.jsdelivr.net/gh/Arronlong/cdn@master/cfblog/cfblog-plus.png');
    //默认时间设置为当前时间
    if($('#createDate').val()=="")$('#createDate').val(new Date(new Date().getTime()+8*60*60*1000).toJSON().substr(0,16));
    `, //后台编辑页面脚本

};

//---对部分配置进行处理---
{
  //CFBLOG 通用变量
  this.CFBLOG = ACCOUNT.kv_var;
  
  //默认为非私密博客
  if(null==OPT.privateBlog){
    OPT.privateBlog=false;
  }
  //处理themeURL、theme_github_path参数设定
  if(OPT.themeURL.substr(-1)!='/'){
    OPT.themeURL=OPT.themeURL+'/';
  }
  if(OPT.theme_github_path.substr(-1)!='/'){
    OPT.theme_github_path=OPT.theme_github_path+'/';
  }
  //置顶样式对于前台来说，与codeBeforHead结合即可
  if(OPT.top_flag_style){
  OPT.codeBeforHead += OPT.top_flag_style
  }
}

/**------【②.猎杀时刻：请求处理入口】-----**/

//监听请求
addEventListener("fetch",event=>{
  //处理请求
  event.respondWith(handlerRequest(event))
})

// 处理请求
async function handlerRequest(event){
  let request = event.request
  //获取url请求对象
  let url=new URL(request.url)
  // 路径切分：trim("/") 在原项目里是自定义 String.trim 扩展，但更推荐直接 split/filter
  let paths=url.pathname.split("/").filter(Boolean)

  //校验权限
  // - /admin 默认使用 Basic Auth
  // - /admin/api/* 允许使用发布 Token（用于自动化发布）绕过 Basic Auth
  const isAdminApi = (paths[0] === "admin" && paths[1] === "api");
  const okPublishToken = isAdminApi && verifyPublishToken(request);

  if(("admin"==paths[0]||true===OPT.privateBlog) && !okPublishToken && !parseBasicAuth(request)){
    return new Response("Unauthorized",{
      headers:{
        "WWW-Authenticate":'Basic realm="cfblog"',
        "Access-Control-Allow-Origin":"*"
      },
      status:401
    });
  }

  //组装请求url，查看是否有缓存（仅缓存前台 GET 请求；私密博客不建议使用共享边缘缓存）
  const head = paths[0] || "";
  const cache = caches.default;

  // 缓存 key：只允许白名单 query，避免 theme/pageSize 预览污染或被随机 query 打爆缓存
  const sp = url.searchParams;
  const allow = new URLSearchParams();
  if (sp.has("theme")) allow.set("theme", sp.get("theme"));
  if (sp.has("pageSize")) allow.set("pageSize", sp.get("pageSize"));
  // include cacheKeyVersion to bust edge cache after deployments
  const v = (OPT.cacheKeyVersion ? String(OPT.cacheKeyVersion) : "");
  if(v) allow.set("v", v);

  // include global KV cache buster so homepage/list pages refresh across all edge locations
  const cb = await getCacheBuster();
  if(cb) allow.set("cb", cb);

  const cacheUrl = "https://" + OPT.siteDomain + url.pathname + (allow.toString() ? ("?" + allow.toString()) : "");
  const cacheKey = new Request(cacheUrl, { method: "GET" });

  let k;
  if (!OPT.privateBlog && request.method === "GET" && head !== "admin") {
    console.log("cacheKey:", cacheUrl);
    k = await cache.match(cacheKey);
    if (k) {
      console.log("hit cache!");
      return k;
    }
  }

  switch(head){
    case "favicon.ico": //图标
      k = await handle_favicon(request);
      break;
    case "robots.txt":
      k = await handle_robots(request);
      break;
    case "sitemap.xml":
      k = await handle_sitemap(request);
      break;
    case "search.xml":
      k = await handle_search(request);
      break;
    case "admin": //后台
      k = await handle_admin(request);
      break;
    case "article": //文章内容页
      k = await handle_article(paths[1]);
      break;
    case "": //文章 首页
    case "page": //文章 分页
    case "category": //分类 分页
    case "tags": //标签 分页
      k = await renderBlog(url);
      break;
    default:
      //其他页面返回404
      k= new Response(OPT.html404,{
        headers:{
          "content-type":"text/html;charset=UTF-8"
        },
        status:404
      })
      break;
  }  
  //设置浏览器缓存时间:后台不缓存、只缓存前台
  try{
    if(head === "admin"){
      k.headers.set("Cache-Control","no-store")
    }else{
      // 私密博客建议不使用 public 缓存
      k.headers.set("Cache-Control", (OPT.privateBlog ? "private" : "public") + ", max-age=" + OPT.cacheTime)
      if (!OPT.privateBlog && request.method === "GET") {
        event.waitUntil(cache.put(cacheKey, k.clone()))
      }
    }
  }catch(e){}
  
  return k
}

/**------【③.分而治之：各种请求分开处理】-----**/

//访问: favicon.ico
async function handle_favicon(request){
  /*
  想要自定义，或者用指定的ico，可将此请求置为404，并在codeBeforHead中自行添加类似代码：
    <link rel="icon" type="image/x-icon" href="https://cdn.jsdelivr.net/gh/gdtool/zhaopp/cfblog/favicon.ico" />
    <link rel="Shortcut Icon" href="https://cdn.jsdelivr.net/gh/gdtool/zhaopp/cfblog/favicon.ico">
  */
  /*
  return new Response("404",{
      headers:{
          "content-type":"text/plain;charset=UTF-8"
      },
      status:404
  });
  */
  let url = new URL(request.url)
  url.host="dash.cloudflare.com"
  return await fetch(new Request(url, request));
}

//访问: robots.txt
async function handle_robots(request){
  return new Response(OPT.robots+"\nSitemap: https://"+OPT.siteDomain+"/sitemap.xml",{
    headers:{
      "content-type":"text/plain;charset=UTF-8"
    },
    status:200
  });
}

//访问: sitemap.xml
async function handle_sitemap(request){
  //如果设置了参数，则使用参数指定的url
  //可使用github action方式自动定期更新
  let xml;
  if(OPT.sitemap_xml_url){
    
    //cf代理方式，速度可以，实时性更好
    let url = new URL(request.url)
    url.href = OPT.sitemap_xml_url.replace('cdn.jsdelivr.net/gh','raw.githubusercontent.com').replace('@','/');
    xml = await fetch(new Request(url, request));
    xml = await xml.text();
    
    ////302方式，如果使用jsdelivr作为cdn，速度快，但更新有延迟
    //return new Response("",{
    //    headers:{
    //        "location":OPT.sitemap_xml_url
    //    },
    //    status:302
    //});
  
  }else{ //未配置参数，则实时获取结构
  
    //读取文章列表，并按照特定的xml格式进行组装
    let articles_all=await getArticlesList()
    xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    for(var i=0;i<articles_all.length;i++){
      xml+="\n\t<url>",
      xml+="\n\t\t<loc>https://"+OPT.siteDomain+"/article/"+articles_all[i].id+"/"+articles_all[i].link+".html</loc>",
      xml+="\n\t\t<lastmod>"+articles_all[i].createDate.substr(0,10)+"</lastmod>",
      xml+="\n\t\t<changefreq>"+(void 0===articles_all[i].changefreq?"daily":articles_all[i].changefreq)+"</changefreq>",
      xml+="\n\t\t<priority>"+(void 0===articles_all[i].priority?"0.5":articles_all[i].priority)+"</priority>",
      xml+="\n\t</url>";
    }
    xml+="\n</urlset>"
  }
  return new Response(xml,{
    headers:{
        "content-type":"text/xml;charset=UTF-8"
    },
    status:200
  });
}

//访问: search.xml
async function handle_search(request){
  //如果设置了参数，则使用参数指定的url
  //可使用github action方式自动定期更新
  let xml;
  if(OPT.search_xml_url){
    
    //cf代理方式，速度可以，实时性更好
    let url = new URL(request.url)
    url.href = OPT.search_xml_url.replace('cdn.jsdelivr.net/gh','raw.githubusercontent.com').replace('@','/');
    xml = await fetch(new Request(url, request));
    xml = await xml.text();
    
    ////302方式，如果使用jsdelivr作为cdn，速度快，但更新有延迟
    //return new Response("",{
    //    headers:{
    //        "location":OPT.search_xml_url
    //    },
    //    status:302
    //});
  
  }else{ //未配置参数，则实时获取结构
  
    //读取文章列表，并按照特定的xml格式进行组装
    let articles_all=await getArticlesList()
    xml='<?xml version="1.0" encoding="UTF-8"?>\n<blogs>';
    for(var i=0;i<articles_all.length;i++){
      xml+="\n\t<blog>",
      xml+="\n\t\t<title>"+articles_all[i].title+"</title>";
      let article = await getArticle(articles_all[i].id);
      if(null != article){
        xml+="\n\t\t<content>"+article.contentMD.replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('&','&amp;')+"</content>"
      }
      xml+="\n\t\t<url>https://"+OPT.siteDomain+"/article/"+articles_all[i].id+"/"+articles_all[i].link+".html</url>",
      xml+="\n\t\t<time>"+articles_all[i].createDate.substr(0,10)+"</time>",
      xml+="\n\t</blog>";
    }
    xml+="\n</blogs>"
  }
  return new Response(xml,{
    headers:{
      "content-type":"text/xml;charset=UTF-8"
    },
    status:200
  });
}

//渲染前端博客：指定一级路径page\tags\category，二级路径value，以及页码，默认第一页
async function renderBlog(url){
  console.log("---进入renderBlog函数---，path=", url.href.substr(url.origin.length))
  
  //处理主题预览及分页
  let theme=url.searchParams.get("theme"),
      pageSize=url.searchParams.get("pageSize");
  if(theme){
    OPT.themeURL=OPT.theme_github_path+theme+"/";
  }
  if(pageSize){
    OPT.pageSize=parseInt(pageSize);
  }
  //如果采用默认default主题，则改为加载default2.0主题
  if(OPT.theme_github_path+"default/"==OPT.themeURL){
    OPT.themeURL=OPT.theme_github_path+"default2.0/";
  }
  console.log("theme pageSize",OPT.pageSize,OPT.themeURL)
  
  //获取主页模板源码
  let theme_html=await getThemeHtml("index"),
      //KV中读取导航栏、分类目录、标签、链接、所有文章、近期文章等配置信息
      menus=await getWidgetMenu(),
      categories=await getWidgetCategory(),
      tags=await getWidgetTags(),
      links=await getWidgetLink(),
      articles_all=await getArticlesList(),
      articles_recently=await getRecentlyArticles(articles_all);
  
  /** 前台博客
   *  路径格式：
   *  域名/              文章列表首页，等价于域名/page/1
   *  域名/page/xxx      文章列表翻页
   * 
   *  域名/category/xxx  分类页，等价于域名/category/xxx/page/1
   *  域名/category/xxx/page/xxx  分类页+翻页
   * 
   *  域名/tags/xxx      标签页，等价于域名/tags/xxx/page/1
   *  域名/tags/xxx/page/xxx  分类页+翻页
   * 
   */
  const paths = url.pathname.split("/").filter(Boolean)
  let articles = [],
      pageNo = 1

  //获取文章列表
  switch (paths[0] || "page") {
    case "page":
      articles = articles_all
      pageNo = paths[1] || 1
      break;
    case "tags":
    case "category": {
      const pageIndex = paths.indexOf("page")
      let category_tag = ""
      if (pageIndex !== -1) {
        pageNo = paths[pageIndex + 1] || 1
        category_tag = paths.slice(1, pageIndex).join("/")
      } else {
        category_tag = paths.slice(1).join("/")
      }
      category_tag = decodeURIComponent(category_tag)
      articles = articles_all.filter(a => (a && a[paths[0]] && a[paths[0]].includes(category_tag)))
      break;
    }
  }
  pageNo = parseInt(pageNo, 10)
  // console.log(pageNo)
  // console.log(articles)

  //获取当页要显示文章列表
  let articles_show = articles.slice((pageNo-1)*OPT.pageSize,pageNo*OPT.pageSize);
  // console.log(articles_show)
  
  //处理文章属性（年月日、url等）
  processArticleProp(articles_show);

  // console.log(url.pathname)
  let url_prefix = url.pathname.replace(/(.*)\/page\/\d+/,'$1/')
  if(url_prefix.substr(-1)=='/'){
    url_prefix=url_prefix.substr(0,url_prefix.length-1);
  }
  // console.log(url_prefix)
  //组装各种参数
  let newer=[{title:"上一页",url:url_prefix+"/page/"+(pageNo-1)}];
  if(1==pageNo){
    newer=[];
  }
  let older=[{title:"下一页",url:url_prefix+"/page/"+(pageNo+1)}];
  if(pageNo*OPT.pageSize>=articles.length){
    older=[];
  }
  // console.log(newer)
  // console.log(older)

  //文章标题、关键字
  let title=(pageNo>1 ? "page "+pageNo+" - " : "")+OPT.siteName,
      keyWord=OPT.keyWords,
      cfg={};
  cfg.widgetMenuList=menus,//导航
  cfg.widgetCategoryList=categories,//分类目录
  cfg.widgetTagsList=tags,//标签
  cfg.widgetLinkList=links,//链接
  cfg.widgetRecentlyList=articles_recently,//近期文章
  cfg.articleList=articles_show,//当前页文章列表
  cfg.pageNewer=newer,//上翻页链接
  cfg.pageOlder=older,//下翻页链接
  cfg.title=title,//网页title
  cfg.keyWords=keyWord;//SEO关键字
  
  //使用mustache.js进行页面渲染（参数替换）
  cfg.OPT=OPT

  const M = globalThis.Mustache;
  if(!M || typeof M.render !== 'function'){
    throw new Error('Mustache runtime missing: globalThis.Mustache.render is not available');
  }
  let html = M.render(theme_html,cfg)
  
  return new Response(html,{
    headers:{
      "content-type":"text/html;charset=UTF-8"
    },
    status:200
  })
}

//渲染前端博客的文章内容页
async function handle_article(id){
  //获取内容页模板源码
  let theme_html=await getThemeHtml("article"),
      //KV中读取导航栏、分类目录、标签、链接、近期文章等配置信息
      menus=await getWidgetMenu(),
      categories=await getWidgetCategory(),
      tags=await getWidgetTags(),
      links=await getWidgetLink(),
      articles_recently=await getRecentlyArticles();

  //获取上篇、本篇、下篇文章
  let articles_sibling=await getSiblingArticle(id);
  
  //处理文章属性（年月日、url等）
  processArticleProp(articles_sibling);
  
  //获取本篇文章
  let article=articles_sibling[1];

  //组装文章详情页各参数
  let title=article.title.replace(nullToEmpty(OPT.top_flag),'').replace(nullToEmpty(OPT.hidden_flag),'')+" - "+OPT.siteName, 
      keyWord=article.tags.concat(article.category).join(","),
      cfg={};
  cfg.widgetMenuList=menus,//导航
  cfg.widgetCategoryList=categories,//分类目录
  cfg.widgetTagsList=tags,//标签
  cfg.widgetLinkList=links,//链接
  cfg.widgetRecentlyList=articles_recently,//近期文章
  cfg.articleOlder=articles_sibling[0]?[articles_sibling[0]]:[],//上篇文章
  cfg.articleSingle=article,//本篇文章
  cfg.articleNewer=articles_sibling[2]?[articles_sibling[2]]:[],//下篇文章
  cfg.title=title,//网页title
  cfg.keyWords=keyWord;//SEO关键字
  
  //使用mustache.js渲染页面（参数替换）
  cfg.OPT=OPT

  const M = globalThis.Mustache;
  if(!M || typeof M.render !== 'function'){
    throw new Error('Mustache runtime missing: globalThis.Mustache.render is not available');
  }
  let html = M.render(theme_html,cfg)

  //以html格式返回
  return new Response(html,{
    headers:{
      "content-type":"text/html;charset=UTF-8"
    },
    status:200
  })
}

//后台请求处理
async function handle_admin(request){
  let url = new URL(request.url),
      paths = url.pathname.split("/").filter(Boolean),
      html,//返回html
      json,//返回json
      file;//返回文件

  // 自动化发布 API：/admin/api/publish
  if (paths[1] === "api") {
    return await handle_admin_api(request, paths);
  }
  //新建页
  if(1==paths.length||"list"==paths[1]){
    //读取主题的admin/index.html源码
    let theme_html=await getThemeHtml("admin/index"),
        //KV中读取导航栏、分类目录、链接、近期文章等配置信息
        categoryJson=await getWidgetCategory(),
        menuJson=await getWidgetMenu(),
        linkJson=await getWidgetLink();
    
    //手动替换<!--{xxx}-->格式的参数
    html = theme_html.replaceHtmlPara("categoryJson",JSON.stringify(categoryJson))
                    .replaceHtmlPara("menuJson",JSON.stringify(menuJson))
                    .replaceHtmlPara("linkJson",JSON.stringify(linkJson))
                    
    //添加后台首页配置
    if(OPT.admin_home_idx && OPT.admin_home_idx>=1 && OPT.admin_home_idx<=4){
      html = html.replace("$('#myTab li:eq(0) 1').tab('show')","$($('#myTab a[href*=\"'+location.hash+'\"]')[0]||$('#myTab a:eq("+OPT.admin_home_idx+")')).tab('show')")
    }
    //添加置顶样式
    if(OPT.top_flag_style){
      html += OPT.top_flag_style
    }
    //添加隐藏样式
    if(OPT.hidden_flag_style){
      html += OPT.hidden_flag_style
    }
  }

  //发布
  if("publish"==paths[1]){
    //KV中获取文章列表
    let articles_all=await getAllArticlesList(),
        tags=[]; //操作标签
    
    //遍历所有文章，汇集所有的tag
    for(var i=0;i<articles_all.length;i++){
      //若文章设定了标签
      if("object"==typeof articles_all[i].tags){
        //将所有tags存入e中
        for(var j=0;j<articles_all[i].tags.length;j++){
          if(articles_all[i].tags[j] 
            && articles_all[i].tags[j].length>0 
            && -1==tags.indexOf(articles_all[i].tags[j])){
            tags.push(articles_all[i].tags[j]);
          }
        }
      }
    }
    console.log(articles_all)
    //将所有标签一次性写入到KV中，并清除缓存
    await saveWidgetTags(JSON.stringify(tags))
    
    json = await purge()?'{"msg":"published ,purge Cache true","rst":true}':'{"msg":"published ,buuuuuuuuuuuut purge Cache false !!!!!!","rst":true}'
      
  }

  //文章列表
  if("getList"==paths[1]){
    //默认取第一页，每页20篇
    let pageNo=(undefined===paths[2]) ? 1 : parseInt(paths[2]),
        list=await admin_nextPage(pageNo, 20);//每次加载20个
    json = JSON.stringify(list)
  }
  
  //修改文章
  if("edit"==paths[1]){
    let id=paths[2],
        //获取主题admin/edit源码
        theme_html=await getThemeHtml("admin/edit"),
        //KV中读取分类
        categoryJson=JSON.stringify(await getWidgetCategory()),
        //KV中读取文章内容
        articleJson=JSON.stringify(await getArticle(id));
    
    //手动替换<!--{xxx}-->格式的参数
    html = theme_html.replaceHtmlPara("categoryJson",categoryJson).replaceHtmlPara("articleJson",articleJson.replaceAll("script>","script＞"))
  }
  
  //保存配置
  if("saveConfig"==paths[1]){
    const ret=await parseReq(request);
    let widgetCategory=ret.WidgetCategory,//分类
        widgetMenu=ret.WidgetMenu,//导航
        widgetLink=ret.WidgetLink;//链接
    
    //判断格式，写入分类、导航、链接到KV中
    if(checkFormat(widgetCategory) && checkFormat(widgetMenu) && checkFormat(widgetLink)){
      let success = await saveWidgetCategory(widgetCategory)
      success = success && await saveWidgetMenu(widgetMenu)
      success = success && await saveWidgetLink(widgetLink)
      json = success ? '{"msg":"saved","rst":true}' : '{"msg":"Save Faild!!!","ret":false}'
    }else{
      json = '{"msg":"Not a JSON object","rst":false}'
    }
  }
  
  //导入
  if("import"==paths[1]){
    let importJsone=(await parseReq(request)).importJson;
    console.log("开始导入",typeof importJson)
    
    if(checkFormat(importJson)){
      let importJson=JSON.parse(importJson),
          keys=Object.keys(importJson);
      for(let i=0;i<keys.length;++i){
        console.log(keys[i],importJson[keys[i]]),
        await saveArticle(keys[i],importJson[keys[i]]);
      }
      json = '{"msg":"import success!","rst":true}'
    }else{
      json = '{"msg":" importJson Not a JSON object","rst":false}'
    }        
  }
  
  //导出
  if("export"===paths[1]){
    console.log("开始导出");
    async function exportArticle(arr=[],cursor="",limit=1){
      //分页获取文章内容
      const list=await CFBLOG.list({limit:limit,cursor:cursor});
      if(!1 in list) return {};
      arr=arr.concat(list.keys)
      console.log("导出: ",typeof list, JSON.stringify(list))
      //判断是否导出完毕
      if(list.list_complete){
        let ret = {OPT:OPT};
        for(let i=0;i<arr.length;++i){
          const article = await CFBLOG.get(arr[i].name);
          if(null != article){
            ret[arr[i].name] = checkFormat(article)?JSON.parse(article):article
          }
        }
        return ret
      }
      return await exportArticle(arr,list.cursor,limit)
    }
    
    let articles=await exportArticle();
    file = {
      name: "cfblog-"+new Date().getTime()+".json",
      content: JSON.stringify(articles)
    }
  }
  
  //导出search.xml 
  if("search.xml"===paths[1]){
    console.log("开始导出");
    //读取文章列表，并按照特定的xml格式进行组装
    let articles_all=await getArticlesList()
    let xml='<?xml version="1.0" encoding="UTF-8"?>\n<blogs>';
    for(var i=0;i<articles_all.length;i++){
      xml+="\n\t<blog>",
      xml+="\n\t\t<title>"+articles_all[i].title+"</title>";
      let article = await getArticle(articles_all[i].id);
      if(null != article){
        xml+="\n\t\t<content>"+article.contentMD.replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('&','&amp;')+"</content>"
      }
      xml+="\n\t\t<url>https://"+OPT.siteDomain+"/article/"+articles_all[i].id+"/"+articles_all[i].link+".html</url>",
      xml+="\n\t\t<time>"+articles_all[i].createDate.substr(0,10)+"</time>",
      xml+="\n\t</blog>";
    }
    xml+="\n</blogs>"
    file = {
      name: "search.xml",
      content: xml
    }
  }
  
  //导出sitemap.xml 
  if("sitemap.xml"===paths[1]){
    console.log("开始导出");
    //读取文章列表，并按照特定的xml格式进行组装
    let articles_all=await getArticlesList()
    let xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    for(var i=0;i<articles_all.length;i++){
      xml+="\n\t<url>",
      xml+="\n\t\t<loc>https://"+OPT.siteDomain+"/article/"+articles_all[i].id+"/"+articles_all[i].link+".html</loc>",
      xml+="\n\t\t<lastmod>"+articles_all[i].createDate.substr(0,10)+"</lastmod>",
      xml+="\n\t\t<changefreq>"+(void 0===articles_all[i].changefreq?"daily":articles_all[i].changefreq)+"</changefreq>",
      xml+="\n\t\t<priority>"+(void 0===articles_all[i].priority?"0.5":articles_all[i].priority)+"</priority>",
      xml+="\n\t</url>";
    }
    xml+="\n</urlset>"
    file = {
      name: "sitemap.xml",
      content: xml
    }
  }
  
  //新建文章
  if("saveAddNew"==paths[1]){
    const ret=await parseReq(request);
    let title=ret.title,//文章标题
        img=ret.img || `https://source.unsplash.com/featured/1200x630?abstract,technology,dark&sig=${id || Date.now()}`,//插图
        link=ret.link,//永久链接
        createDate=ret.createDate.replace('T',' '),//发布日期
        category=ret.category,//分类
        tags=ret.tags,//标签
        priority=void 0===ret.priority?"0.5":ret.priority,//权重
        changefreq=void 0===ret.changefreq?"daily":ret.changefreq,//更新频率
        contentMD=ret["content-markdown-doc"],//文章内容-md格式
        contentHtml=ret["content-html-code"],//文章内容-html格式
        contentText="",//文章摘要
        top_timestamp=ret.top_timestamp*1,//置顶时间戳，不置顶时为0
        modify_timestamp=new Date().getTime()+8*60*60*1000,//修改时间戳
        hidden=ret.hidden*1,//是否隐藏
        id="";//文章id
    
    //校验参数完整性
    if(title.length>0
      && createDate.length>0
      && category.length>0
      && contentMD.length>0
      && contentHtml.length>0){

      id=await generateId(),
      contentText=contentHtml.replace(/<\/?[^>]*>/g,"").trim().substring(0,OPT.readMoreLength);//摘要
      //组装文章json
      let article={
        id:id,
        title:title,
        img:img,
        link:link,
        createDate:createDate,
        category:category,
        tags:tags,
        contentMD:contentMD,
        contentHtml:contentHtml,
        contentText:contentText,
        priority:priority,
        top_timestamp:top_timestamp,
        modify_timestamp:modify_timestamp,
        hidden:hidden,
        changefreq:changefreq
      };
      
      //将文章json写入KV（key为文章id，value为文章json字符串）
      await saveArticle(id,JSON.stringify(article));
      
      //组装文章json
      let articleWithoutHtml={
        id:id,
        title:title,
        img:img,
        link:link,
        createDate:createDate,
        category:category,
        tags:tags,
        contentText:contentText,
        priority:priority,
        top_timestamp:top_timestamp,
        modify_timestamp:modify_timestamp,
        hidden:hidden,
        changefreq:changefreq
      },
      articles_all_old=await getAllArticlesList(),//读取文章列表
      articles_all=[];
    
      //将最新的文章写入文章列表中，并按id排序后，再次回写到KV中
      articles_all.push(articleWithoutHtml),
      articles_all=articles_all.concat(articles_all_old),
      articles_all=sortArticle(articles_all),
      await saveArticlesList(JSON.stringify(articles_all))

      // After create, auto-refresh homepage/list caches so summaries stay in sync
      try{ await bumpCacheBuster(); }catch(e){}
      try{ await purgeWorkersCache(); }catch(e){}
      
      json = '{"msg":"added OK","rst":true,"id":"'+id+'"}'
    }else{
      json = '{"msg":"信息不全","rst":false}'
    }
  }
  
  //删除
  if("delete"==paths[1]){
    let id=paths[2]
    if(6==id.length){
      await CFBLOG.delete(id);
      let e=await getAllArticlesList();
      for(r=0;r<e.length;r++){
        if(id==e[r].id){
          e.splice(r,1);
          
          await saveArticlesList(JSON.stringify(e))

          // After delete, auto-refresh homepage/list caches
          try{ await bumpCacheBuster(); }catch(e){}
          try{ await purgeWorkersCache(); }catch(e){}

          json = '{"msg":"Delete ('+id+')  OK","rst":true,"id":"'+id+'"}'
          break;
        }
      }
    }else{
      json = '{"msg":"Delete  false ","rst":false,"id":"'+id+'"}'
    }
  }
  
  //保存编辑的文章
  if("saveEdit"==paths[1]){
    const ret=await parseReq(request);
    let title=ret.title,//文章标题
        img=ret.img || `https://source.unsplash.com/featured/1200x630?abstract,technology,dark&sig=${id || Date.now()}`,//插图
        link=ret.link,//永久链接
        createDate=ret.createDate.replace('T',' '),//发布日期
        category=ret.category,//分类
        tags=ret.tags,//标签
        priority=void 0===ret.priority?"0.5":ret.priority,//权重
        changefreq=void 0===ret.changefreq?"daily":ret.changefreq,//更新频率
        contentMD=ret["content-markdown-doc"],//文章内容-md格式
        contentHtml=ret["content-html-code"],//文章内容-html格式
        contentText="",//文章摘要
        top_timestamp=ret.top_timestamp*1,//置顶则设置时间戳,不置顶时为0
        modify_timestamp=new Date().getTime()+8*60*60*1000,//修改时间戳
        hidden=ret.hidden*1,//是否隐藏
        id=ret.id;//文章id
        
    //校验参数完整性
    if(title.length>0
      && createDate.length>0
      && category.length>0
      && contentMD.length>0
      && contentHtml.length>0){
          
      contentText=contentHtml.replace(/<\/?[^>]*>/g,"").trim().substring(0,OPT.readMoreLength);//摘要
      //组装文章json
      let article={
        id:id,
        title:title,
        img:img,
        link:link,
        createDate:createDate,
        category:category,
        tags:tags,
        contentMD:contentMD,
        contentHtml:contentHtml,
        contentText:contentText,
        priority:priority,
        top_timestamp:top_timestamp,
        modify_timestamp:modify_timestamp,
        hidden:hidden,
        changefreq:changefreq
      };
      
      //将文章json写入KV（key为文章id，value为文章json字符串）
      await saveArticle(id,JSON.stringify(article));
      
      //组装文章json
      let articleWithoutHtml={
        id:id,
        title:title,
        img:img,
        link:link,
        createDate:createDate,
        category:category,
        tags:tags,
        contentText:contentText,
        priority:priority,
        top_timestamp:top_timestamp,
        modify_timestamp:modify_timestamp,
        hidden:hidden,
        changefreq:changefreq
      },
      articles_all=await getAllArticlesList();//读取文章列表
      //console.log(articles_all)
      //将原对象删掉，将最新的文章加入文章列表中，并重新按id排序后，再次回写到KV中
      for(var i=articles_all.length-1;i>=0;i--){//按索引删除，要倒序，否则索引值会变
        if(articles_all[i].id == id){
          articles_all.splice(i,1);
          break;
        }
      }
      articles_all.push(articleWithoutHtml),
      articles_all=sortArticle(articles_all),
      await saveArticlesList(JSON.stringify(articles_all))

      // After edit, auto-refresh homepage/list caches so summaries stay in sync
      try{ await bumpCacheBuster(); }catch(e){}
      try{ await purgeWorkersCache(); }catch(e){}

      json = '{"msg":"Edit OK","rst":true,"id":"'+id+'"}'
    }else{
      json = '{"msg":"信息不全","rst":false}'
    }
  }
  
  //返回结果
  if(!json &&!html && !file){
    json = '{"msg":"some errors","rst":false}'
  }
  if(file){
    return new Response(file.content,{
      headers:{
        "content-type":"application/octet-stream;charset=utf-8",
        "Content-Disposition":"attachment; filename="+file.name
      },
      status:200
    })
  }
  if(html){
    return new Response(html,{
      headers:{
        "content-type":"text/html;charset=UTF-8"
      },
      status:200
    })
  }
  if(json){
    return new Response(json ,{
      headers:{
        "content-type":"application/json;charset=UTF-8"
      },
      status:200
    })
  }
}

/**------【④.抽丝剥茧，抽取公用的业务方法】-----**/

// =============================
// 自动化发布 API（方案2）
// 路径：POST /admin/api/publish
// 鉴权：Header x-cfblog-publish-token 必须等于 Workers Secret：PUBLISH_TOKEN
// =============================

function verifyPublishToken(request){
  try{
    const token = request.headers.get("x-cfblog-publish-token") || "";
    if(!token) return false;
    // PUBLISH_TOKEN 建议在 Workers Secrets 里配置，而不是写入代码
    return (typeof PUBLISH_TOKEN !== "undefined") && token === PUBLISH_TOKEN;
  }catch(e){
    return false;
  }
}

async function handle_admin_api(request, paths){
  // paths: ["admin","api", ...]
  const action = paths[2] || "";

  if(request.method !== "POST"){
    return new Response(JSON.stringify({rst:false,msg:"Method Not Allowed"}),{
      headers:{"content-type":"application/json;charset=UTF-8"},
      status:405
    })
  }

  if(!verifyPublishToken(request)){
    return new Response(JSON.stringify({rst:false,msg:"Unauthorized"}),{
      headers:{"content-type":"application/json;charset=UTF-8"},
      status:401
    })
  }

  // 期待 JSON body
  let payload;
  try{
    payload = await request.json();
  }catch(e){
    return new Response(JSON.stringify({rst:false,msg:"Invalid JSON"}),{
      headers:{"content-type":"application/json;charset=UTF-8"},
      status:400
    })
  }

  if(action === "publish"){
    return await api_publish(payload);
  }
  if(action === "update"){
    return await api_update(payload);
  }
  if(action === "delete"){
    return await api_delete(payload);
  }

  return new Response(JSON.stringify({rst:false,msg:"unknown api"}),{
    headers:{"content-type":"application/json;charset=UTF-8"},
    status:404
  })
}

// --- API impl: publish / update / delete ---

function normArr(v){
  return Array.isArray(v) ? v : (v ? [v] : []);
}

function nowBJStr(){
  const nowBJ = new Date(Date.now()+8*60*60*1000);
  return nowBJ.toISOString().slice(0,16).replace('T',' ');
}

async function rebuildTagsFromIndex(articles_all){
  let allTags=[];
  for(let i=0;i<(articles_all||[]).length;i++){
    const a = articles_all[i];
    if(Array.isArray(a && a.tags)){
      for(let j=0;j<a.tags.length;j++){
        const t = a.tags[j];
        if(t && t.length>0 && allTags.indexOf(t)===-1) allTags.push(t);
      }
    }
  }
  await saveWidgetTags(JSON.stringify(allTags));
}

async function api_publish(payload){
  const title = (payload.title || "").trim();
  const contentMD = (payload.contentMD || "").trim();
  const contentHtml = (payload.contentHtml || "").trim();
  // img 可选；为空则用默认封面兜底，避免列表/侧栏破图
  let img = ((payload.img || "").trim()); if(!img) { img = `https://source.unsplash.com/featured/1200x630?abstract,technology,dark&sig=${Date.now()}`; }
  const link = (payload.link || "").trim();
  const category = normArr(payload.category);
  const tags = normArr(payload.tags);

  const createDate = (payload.createDate || nowBJStr());
  const hidden = (payload.hidden === 1 || payload.hidden === "1") ? 1 : 0;
  const top_timestamp = (payload.top_timestamp ? (payload.top_timestamp*1) : 0);
  const priority = (payload.priority !== undefined ? String(payload.priority) : "0.5");
  const changefreq = (payload.changefreq !== undefined ? String(payload.changefreq) : "daily");
  const modify_timestamp = new Date().getTime()+8*60*60*1000;

  if(!title || !contentMD || !contentHtml || category.length === 0){
    return new Response(JSON.stringify({rst:false,msg:"missing fields"}),{
      headers:{"content-type":"application/json;charset=UTF-8"},
      status:400
    })
  }

  const id = await generateId();
  const contentText = contentHtml.replace(/<\/?[^>]*>/g,"").trim().substring(0,OPT.readMoreLength);

  const article = { id,title,img,link,createDate,category,tags,contentMD,contentHtml,contentText,priority,top_timestamp,modify_timestamp,hidden,changefreq };
  await saveArticle(id, JSON.stringify(article));

  const articleWithoutHtml = { id,title,img,link,createDate,category,tags,contentText,priority,top_timestamp,modify_timestamp,hidden,changefreq };
  const old = await getAllArticlesList();
  let articles_all = [articleWithoutHtml].concat(old || []);
  articles_all = sortArticle(articles_all);
  await saveArticlesList(JSON.stringify(articles_all));

  await rebuildTagsFromIndex(articles_all);
  const purged = await purge();
  const workersCachePurged = await purgeWorkersCache();
  const cacheBusterBumped = await bumpCacheBuster();

  return new Response(JSON.stringify({rst:true,msg:"published",id, purged, workersCachePurged, cacheBusterBumped}),{
    headers:{"content-type":"application/json;charset=UTF-8"},
    status:200
  })
}

async function api_update(payload){
  const id = (payload.id || "").trim();
  if(!/^\d{6}$/.test(id)){
    return new Response(JSON.stringify({rst:false,msg:"invalid id"}),{headers:{"content-type":"application/json;charset=UTF-8"},status:400});
  }

  const oldRaw = await getArticle(id);
  if(!oldRaw){
    return new Response(JSON.stringify({rst:false,msg:"not found"}),{headers:{"content-type":"application/json;charset=UTF-8"},status:404});
  }

  let old;
  try{ old = (typeof oldRaw === 'string') ? JSON.parse(oldRaw) : oldRaw; }catch(e){ old = oldRaw; }

  // allow partial updates; if contentHtml changes -> refresh contentText
  const next = Object.assign({}, old);

  const set = (k, v) => { if(v !== undefined && v !== null) next[k] = v; };

  if(payload.title !== undefined) set('title', String(payload.title).trim());
  if(payload.img !== undefined) set('img', String(payload.img).trim() || (OPT.defaultCover || ""));
  if(payload.link !== undefined) set('link', String(payload.link).trim());
  if(payload.createDate !== undefined) set('createDate', String(payload.createDate).trim());
  if(payload.category !== undefined) set('category', normArr(payload.category));
  if(payload.tags !== undefined) set('tags', normArr(payload.tags));
  if(payload.contentMD !== undefined) set('contentMD', String(payload.contentMD));
  if(payload.contentHtml !== undefined) set('contentHtml', String(payload.contentHtml));
  if(payload.hidden !== undefined) set('hidden', (payload.hidden === 1 || payload.hidden === "1") ? 1 : 0);
  if(payload.top_timestamp !== undefined) set('top_timestamp', payload.top_timestamp ? (payload.top_timestamp*1) : 0);
  if(payload.priority !== undefined) set('priority', String(payload.priority));
  if(payload.changefreq !== undefined) set('changefreq', String(payload.changefreq));

  // always bump modify_timestamp
  next.modify_timestamp = new Date().getTime()+8*60*60*1000;

  if(next.contentHtml){
    next.contentText = String(next.contentHtml).replace(/<\/?[^>]*>/g,"").trim().substring(0,OPT.readMoreLength);
  }

  // basic required fields sanity
  if(!next.title || !next.createDate || !next.category || next.category.length===0 || !next.contentMD || !next.contentHtml){
    return new Response(JSON.stringify({rst:false,msg:"missing fields after update"}),{headers:{"content-type":"application/json;charset=UTF-8"},status:400});
  }

  await saveArticle(id, JSON.stringify(next));

  // update index entry
  const articleWithoutHtml = {
    id: next.id,
    title: next.title,
    img: next.img,
    link: next.link,
    createDate: next.createDate,
    category: next.category,
    tags: next.tags,
    contentText: next.contentText,
    priority: next.priority,
    top_timestamp: next.top_timestamp,
    modify_timestamp: next.modify_timestamp,
    hidden: next.hidden,
    changefreq: next.changefreq
  };

  let articles_all = await getAllArticlesList();
  articles_all = (articles_all || []).filter(a => !(a && a.id === id));
  articles_all.push(articleWithoutHtml);
  articles_all = sortArticle(articles_all);
  await saveArticlesList(JSON.stringify(articles_all));

  await rebuildTagsFromIndex(articles_all);
  const purged = await purge();
  const workersCachePurged = await purgeWorkersCache();
  const cacheBusterBumped = await bumpCacheBuster();

  return new Response(JSON.stringify({rst:true,msg:"updated",id, purged, workersCachePurged, cacheBusterBumped}),{headers:{"content-type":"application/json;charset=UTF-8"},status:200});
}

async function api_delete(payload){
  const id = (payload.id || "").trim();
  if(!/^\d{6}$/.test(id)){
    return new Response(JSON.stringify({rst:false,msg:"invalid id"}),{headers:{"content-type":"application/json;charset=UTF-8"},status:400});
  }

  // delete KV
  await CFBLOG.delete(id);

  let articles_all = await getAllArticlesList();
  articles_all = (articles_all || []).filter(a => !(a && a.id === id));
  await saveArticlesList(JSON.stringify(articles_all));

  await rebuildTagsFromIndex(articles_all);
  const purged = await purge();
  const workersCachePurged = await purgeWorkersCache();
  const cacheBusterBumped = await bumpCacheBuster();

  return new Response(JSON.stringify({rst:true,msg:"deleted",id, purged, workersCachePurged, cacheBusterBumped}),{headers:{"content-type":"application/json;charset=UTF-8"},status:200});
}


//访问管理后台或私密博客，则进行Base Auth
function parseBasicAuth(request){
    const auth=request.headers.get("Authorization");
    if(!auth||!/^Basic [A-Za-z0-9._~+/-]+=*$/i.test(auth)){
        const token = request.headers.get("cfblog_token");
        if(token){
            //获取url请求对象
            let url=new URL(request.url)
            let paths=url.pathname.split("/").filter(Boolean)

            //校验权限
            if("admin"==paths[0] && ("search.xml"==paths[1]||"sitemap.xml"==paths[1])){
                return token === ACCOUNT.third_token
            }
        }
        return false;
    }
    const decoded = atob(auth.split(" ").pop());
    const idx = decoded.indexOf(":");
    const user = idx === -1 ? decoded : decoded.slice(0, idx);
    const pwd  = idx === -1 ? "" : decoded.slice(idx+1);
    console.log("-----parseBasicAuth----- ", user)

    // 支持使用 Workers Secrets 覆盖（避免密码写死在代码仓库里）
    const expectedUser = (typeof ADMIN_USER !== "undefined" && ADMIN_USER !== null && ADMIN_USER !== "") ? ADMIN_USER : ACCOUNT.user;
    const expectedPwd  = (typeof ADMIN_PASSWORD !== "undefined" && ADMIN_PASSWORD !== null && ADMIN_PASSWORD !== "") ? ADMIN_PASSWORD : ACCOUNT.password;
    return user===expectedUser && pwd===expectedPwd
}

//获取所有【公开】文章：仅前台使用
async function getArticlesList(){
  const articles_all = await getAllArticlesList();
  // 注意：不要在正向遍历时 splice，会跳过元素
  return (articles_all || []).filter(a => !(a && a.hidden));
}

//文章排序：先按id倒排，再按置顶时间倒排
function sortArticle(articles){
  return sort(sort(articles,'id'),'top_timestamp');
}

//获取近期文章列表
async function getRecentlyArticles(articles){
  if(!articles){
    articles = await getArticlesList();
  }
  if(OPT.recentlyType == 2){//按修改时间倒序
    articles = sort([].concat(articles),'modify_timestamp');
  }
  let articles_recently = articles.slice(0,OPT.recentlySize);

  for(var i=0;i<articles_recently.length;i++){
      //调整文章的日期(yyyy-MM-dd)和url
      if(articles_recently[i].top_timestamp && !articles_recently[i].title.startsWith(OPT.top_flag)){
        articles_recently[i].title = OPT.top_flag + articles_recently[i].title
      }
      articles_recently[i].createDate10=articles_recently[i].createDate.substr(0,10),
      articles_recently[i].url="/article/"+articles_recently[i].id+"/"+articles_recently[i].link+".html";
  }
  return articles_recently;
}

//处理文章的属性信息：日期(yyyy-MM-dd)、年、月、日、内容长度和url
function processArticleProp(articles){
    for(var i=0;i<articles.length;i++){
        //调整文章的日期(yyyy-MM-dd)、文章长度和url
        if(articles[i]){
            if(articles[i].top_timestamp && !articles[i].title.startsWith(OPT.top_flag)){
              articles[i].title = OPT.top_flag + articles[i].title
            }
            //调整文章的日期(yyyy-MM-dd)、年、月、日、内容长度和url
            articles[i].createDate10=articles[i].createDate.substr(0,10),
            articles[i].createDateYear=articles[i].createDate.substr(0,4),
            articles[i].createDateMonth=articles[i].createDate.substr(5,7),
            articles[i].createDateDay=articles[i].createDate.substr(8,10),
            articles[i].contentLength=articles[i].contentText.length,
            articles[i].url="/article/"+articles[i].id+"/"+articles[i].link+".html";
        }
    }
}

//获取前台模板源码, template_path:模板的相对路径
async function getThemeHtml(template_path){
  template_path=template_path.replace(".html","")
  let html = await (await fetch(OPT.themeURL+template_path+".html",{cf:{cacheTtl:600}})).text();
  
  //对后台编辑页下手
  if("admin/index|admin/editor".includes(template_path)){
      html = html.replace("$('#WidgetCategory').val(JSON.stringify(categoryJson))",OPT.editor_page_scripts+"$('#WidgetCategory').val(JSON.stringify(categoryJson))")
  }
  
  return html
}

//根据文章id，返回上篇、下篇文章，文章内容页底部会用到
async function getSiblingArticle(id){
    id=("00000"+parseInt(id)).substr(-6);
    //读取文章列表，查找指定id的文章
    let articles_all=await getArticlesList(),
        article_idx=-1;
    for(var i=0,len=articles_all.length;i<len;i++)
      if(articles_all[i].id==id){
          article_idx=i;
          break
      }
    let value=await getArticle(id);
    return null==value||0===value.length?[void 0,void 0,void 0]:[articles_all[article_idx-1],value,articles_all[article_idx+1]]
}

//清除缓存
async function purge(cacheZoneId=ACCOUNT.cacheZoneId,cacheToken=ACCOUNT.cacheToken){
    if(null==cacheZoneId||null==cacheToken||cacheZoneId.length<5||cacheToken.length<5){
        return false;
    }
    let ret=await fetch(`https://api.cloudflare.com/client/v4/zones/${cacheZoneId}/purge_cache`,{
        method:"POST",
        headers:{
            "Authorization":"Bearer "+cacheToken,
            "Content-Type":"application/json"
        },
        body:'{"purge_everything":true}'
    });
    return (await ret.json()).success
}

// 清理 Workers Cache API（caches.default）里的页面缓存。
// 注意：这与 Cloudflare Zone purge 是两套缓存。
async function purgeWorkersCache(){
  try{
    const cache = caches.default;
    const v = (OPT.cacheKeyVersion ? String(OPT.cacheKeyVersion) : "");
    // 这些 URL 需要与 handlerRequest 里生成 cacheKey 的方式一致（含 v）。
    const urls = [
      `https://${OPT.siteDomain}/?v=${encodeURIComponent(v)}`,
      `https://${OPT.siteDomain}/page/1?v=${encodeURIComponent(v)}`,
    ];
    await Promise.all(urls.map(u => cache.delete(new Request(u, {method:"GET"}))));
    return true;
  }catch(e){
    return false;
  }
}

//后台文章列表页的分页加载，返回[文章列表,是否无下一页]
async function admin_nextPage(pageNo,pageSize=OPT.pageSize){
    pageNo=pageNo<=1?1:pageNo;
    let articles_all=await getAllArticlesList(),
        articles=[];
    for(var i=(pageNo-1)*pageSize,s=Math.min(pageNo*pageSize,articles_all.length);i<s;i++){
      if(articles_all[i].top_timestamp && !articles_all[i].title.startsWith(OPT.top_flag)){
        articles_all[i].title = OPT.top_flag + articles_all[i].title
      }
      if(articles_all[i].hidden && !articles_all[i].title.startsWith(OPT.hidden_flag)){
        articles_all[i].title = OPT.hidden_flag + articles_all[i].title
      }
      articles.push(articles_all[i]);
    }
    //articles=sortArticle(articles);
    return articles
}

//解析后台请求的参数
async function parseReq(request){
    const content_type=request.headers.get("content-type")||"";
    //json格式
    if(content_type.includes("application/json")){
    let json=JSON.stringify(await request.json()),
        content_type=JSON.parse(json),
        settings={category:[],top_timestamp:0, hidden:0};
        for(var i=0;i<content_type.length;i++){
            if("tags"==content_type[i].name){//标签，用逗号分隔
                settings[content_type[i].name]=content_type[i].value.split(",")
            }else if(content_type[i].name.includes("category")){
                settings.category.push(content_type[i].value)
            }else{
                settings[content_type[i].name]=content_type[i].value
            }
        }
        return settings
    }
    if(content_type.includes("application/text")){
        return await request.text();
    }
    if(content_type.includes("text/html")){
        return await request.text();
    }
    if(content_type.includes("form")){
        const formData=await request.formData(),
                ret={};
        for(const field of formData.entries())
            ret[field[0]]=field[1];
        return JSON.stringify(ret)
    }
    {
        const blob=await request.blob();
        return URL.createObjectURL(blob)
    }
}

//为文章分配ID
async function generateId(){
    //KV中读取文章数量（初始化为1），并格式化为6位，不足6位前面补零
    let article_id_seq=await getIndexNum();
    if(""===article_id_seq||null===article_id_seq||"[]"===article_id_seq||void 0===article_id_seq){
        await saveIndexNum(1)
        return "000001"
    }else{
        await saveIndexNum(parseInt(article_id_seq)+1)
        return ("00000"+(parseInt(article_id_seq)+1)).substr(-6)
    }
}

/**------【⑤.术业有专攻，读写KV方法集】-----**/

/* 【KV的Key的含义】
  SYSTEM_INDEX_LIST             文章列表(不包含内容)
  SYSTEM_INDEX_NUM              最新文章序号（不删除文章时，等于文章数量）
  SYSTEM_VALUE_WidgetMenu       导航栏
  SYSTEM_VALUE_WidgetCategory   分类目录
  SYSTEM_VALUE_WidgetTags       标签
  SYSTEM_VALUE_WidgetLink       链接
*/

//KV读取，toJson是否转为json，默认false
async function getKV(key, toJson=false){
  console.log("------------KV读取------------key,toJson:", key, toJson);
  let value=await CFBLOG.get(key);
  if(!toJson)
    return null==value?"[]":value;
  try{
    return null==value?[]:JSON.parse(value)
  }catch(e){
    return[]
  }
}
//KV读取，获取所有文章（含公开+隐藏）:仅后台使用
async function getAllArticlesList(){
  return await getKV("SYSTEM_INDEX_LIST", true);
}
//KV读取，最新文章序号（不删除文章时，等于文章数量），用于计算下个文章id
async function getIndexNum(){
  return await getKV("SYSTEM_INDEX_NUM", true);
}
//KV读取，获取导航栏
async function getWidgetMenu(){
  return await getKV("SYSTEM_VALUE_WidgetMenu", true);
}
//KV读取，获取分类目录
async function getWidgetCategory(){
  return await getKV("SYSTEM_VALUE_WidgetCategory", true);
}
//KV读取，获取标签
async function getWidgetTags(){
  return await getKV("SYSTEM_VALUE_WidgetTags", true);
}
//KV读取，获取链接
async function getWidgetLink(){
  return await getKV("SYSTEM_VALUE_WidgetLink", true);
}
//KV读取，获取文章详细信息
async function getArticle(id){
  return await getKV(id, true);
}

//写入KV，value如果未对象类型（数组或者json对象）需要序列化为字符串
async function saveKV(key,value){
    if(null!=value){
        if("object"==typeof value){
            value=JSON.stringify(value)
        }
        await CFBLOG.put(key,value)
        return true
    }
    return false;
}

//写入KV，获取所有文章（含公开+隐藏）:仅后台使用
async function saveArticlesList(value){
  return await saveKV("SYSTEM_INDEX_LIST",value);
}
//写入KV，最新文章序号（不删除文章时，等于文章数量），用于计算下个文章id
async function saveIndexNum(value){
  return await saveKV("SYSTEM_INDEX_NUM", value);
}
//写入KV，获取导航栏
async function saveWidgetMenu(value){
  return await saveKV("SYSTEM_VALUE_WidgetMenu", value);
}
//写入KV，获取分类目录
async function saveWidgetCategory(value){
  return await saveKV("SYSTEM_VALUE_WidgetCategory", value);
}
//写入KV，获取标签
async function saveWidgetTags(value){
  return await saveKV("SYSTEM_VALUE_WidgetTags", value);
}
//写入KV，获取链接
async function saveWidgetLink(value){
  return await saveKV("SYSTEM_VALUE_WidgetLink", value);
}
//写入KV，获取文章详细信息
async function saveArticle(id,value){
  return await saveKV(id, value);
}

/**------【⑥.站在巨人肩膀上，基础方法】-----**/

//扩展String的方法：
//trim清除前后空格
String.prototype.trim=function(t){
  return t?this.replace(new RegExp("^\\"+t+"+|\\"+t+"+$","g"),""):this.replace(/^\s+|\s+$/g,"")
}
//replaceHtmlPara替换<!--{参数}-->
String.prototype.replaceHtmlPara=function(t,e){
  return null!=e&&(e=e.replace(new RegExp("[$]","g"),"$$$$")),this.replace(new RegExp("\x3c!--{"+t+"}--\x3e","g"),e)
}
//replaceAll 替换全部
String.prototype.replaceAll=function(t,e){
  return this.replace(new RegExp(t,"g"),e)
}

//小于2位，前面补个0
function pad(t){
    return t>=0&&t<=9?"0"+t:t
}

//排序（默认倒序）
function sort(arr, field, desc=true){
    return arr.sort((function(m,n){
        var a=m[field]||'0',
            b=n[field]||'0';
        return desc?(a>b?-1:(a<b?1:0)):(a<b?-1:(a>b?1:0))
    }))
}

//undefined转空字符串
function nullToEmpty(k){
  return k==undefined?'':k
}

//判断格式:字符串是否为json，或者参数是否为对象
function checkFormat(t){
    if("string"==typeof t){
        try{
            var e=JSON.parse(t);
            return !("object"!=typeof e||!e)
        }catch(t){
            return false
        }
    }
    return !("object"!=typeof t||!t)
}

//引入mustache.js，4.1.0：https://cdn.bootcdn.net/ajax/libs/mustache.js/4.1.0/mustache.min.js
(function(global,factory){typeof exports==="object"&&typeof module!=="undefined"?module.exports=factory():typeof define==="function"&&define.amd?define(factory):(global=global||self,global.Mustache=factory())})(this,function(){"use strict";var objectToString=Object.prototype.toString;var isArray=Array.isArray||function isArrayPolyfill(object){return objectToString.call(object)==="[object Array]"};function isFunction(object){return typeof object==="function"}function typeStr(obj){return isArray(obj)?"array":typeof obj}function escapeRegExp(string){return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")}function hasProperty(obj,propName){return obj!=null&&typeof obj==="object"&&propName in obj}function primitiveHasOwnProperty(primitive,propName){return primitive!=null&&typeof primitive!=="object"&&primitive.hasOwnProperty&&primitive.hasOwnProperty(propName)}var regExpTest=RegExp.prototype.test;function testRegExp(re,string){return regExpTest.call(re,string)}var nonSpaceRe=/\S/;function isWhitespace(string){return!testRegExp(nonSpaceRe,string)}var entityMap={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;","`":"&#x60;","=":"&#x3D;"};function escapeHtml(string){return String(string).replace(/[&<>"'`=\/]/g,function fromEntityMap(s){return entityMap[s]})}var whiteRe=/\s*/;var spaceRe=/\s+/;var equalsRe=/\s*=/;var curlyRe=/\s*\}/;var tagRe=/#|\^|\/|>|\{|&|=|!/;function parseTemplate(template,tags){if(!template)return[];var lineHasNonSpace=false;var sections=[];var tokens=[];var spaces=[];var hasTag=false;var nonSpace=false;var indentation="";var tagIndex=0;function stripSpace(){if(hasTag&&!nonSpace){while(spaces.length)delete tokens[spaces.pop()]}else{spaces=[]}hasTag=false;nonSpace=false}var openingTagRe,closingTagRe,closingCurlyRe;function compileTags(tagsToCompile){if(typeof tagsToCompile==="string")tagsToCompile=tagsToCompile.split(spaceRe,2);if(!isArray(tagsToCompile)||tagsToCompile.length!==2)throw new Error("Invalid tags: "+tagsToCompile);openingTagRe=new RegExp(escapeRegExp(tagsToCompile[0])+"\\s*");closingTagRe=new RegExp("\\s*"+escapeRegExp(tagsToCompile[1]));closingCurlyRe=new RegExp("\\s*"+escapeRegExp("}"+tagsToCompile[1]))}compileTags(tags||mustache.tags);var scanner=new Scanner(template);var start,type,value,chr,token,openSection;while(!scanner.eos()){start=scanner.pos;value=scanner.scanUntil(openingTagRe);if(value){for(var i=0,valueLength=value.length;i<valueLength;++i){chr=value.charAt(i);if(isWhitespace(chr)){spaces.push(tokens.length);indentation+=chr}else{nonSpace=true;lineHasNonSpace=true;indentation+=" "}tokens.push(["text",chr,start,start+1]);start+=1;if(chr==="\n"){stripSpace();indentation="";tagIndex=0;lineHasNonSpace=false}}}if(!scanner.scan(openingTagRe))break;hasTag=true;type=scanner.scan(tagRe)||"name";scanner.scan(whiteRe);if(type==="="){value=scanner.scanUntil(equalsRe);scanner.scan(equalsRe);scanner.scanUntil(closingTagRe)}else if(type==="{"){value=scanner.scanUntil(closingCurlyRe);scanner.scan(curlyRe);scanner.scanUntil(closingTagRe);type="&"}else{value=scanner.scanUntil(closingTagRe)}if(!scanner.scan(closingTagRe))throw new Error("Unclosed tag at "+scanner.pos);if(type==">"){token=[type,value,start,scanner.pos,indentation,tagIndex,lineHasNonSpace]}else{token=[type,value,start,scanner.pos]}tagIndex++;tokens.push(token);if(type==="#"||type==="^"){sections.push(token)}else if(type==="/"){openSection=sections.pop();if(!openSection)throw new Error('Unopened section "'+value+'" at '+start);if(openSection[1]!==value)throw new Error('Unclosed section "'+openSection[1]+'" at '+start)}else if(type==="name"||type==="{"||type==="&"){nonSpace=true}else if(type==="="){compileTags(value)}}stripSpace();openSection=sections.pop();if(openSection)throw new Error('Unclosed section "'+openSection[1]+'" at '+scanner.pos);return nestTokens(squashTokens(tokens))}function squashTokens(tokens){var squashedTokens=[];var token,lastToken;for(var i=0,numTokens=tokens.length;i<numTokens;++i){token=tokens[i];if(token){if(token[0]==="text"&&lastToken&&lastToken[0]==="text"){lastToken[1]+=token[1];lastToken[3]=token[3]}else{squashedTokens.push(token);lastToken=token}}}return squashedTokens}function nestTokens(tokens){var nestedTokens=[];var collector=nestedTokens;var sections=[];var token,section;for(var i=0,numTokens=tokens.length;i<numTokens;++i){token=tokens[i];switch(token[0]){case"#":case"^":collector.push(token);sections.push(token);collector=token[4]=[];break;case"/":section=sections.pop();section[5]=token[2];collector=sections.length>0?sections[sections.length-1][4]:nestedTokens;break;default:collector.push(token)}}return nestedTokens}function Scanner(string){this.string=string;this.tail=string;this.pos=0}Scanner.prototype.eos=function eos(){return this.tail===""};Scanner.prototype.scan=function scan(re){var match=this.tail.match(re);if(!match||match.index!==0)return"";var string=match[0];this.tail=this.tail.substring(string.length);this.pos+=string.length;return string};Scanner.prototype.scanUntil=function scanUntil(re){var index=this.tail.search(re),match;switch(index){case-1:match=this.tail;this.tail="";break;case 0:match="";break;default:match=this.tail.substring(0,index);this.tail=this.tail.substring(index)}this.pos+=match.length;return match};function Context(view,parentContext){this.view=view;this.cache={".":this.view};this.parent=parentContext}Context.prototype.push=function push(view){return new Context(view,this)};Context.prototype.lookup=function lookup(name){var cache=this.cache;var value;if(cache.hasOwnProperty(name)){value=cache[name]}else{var context=this,intermediateValue,names,index,lookupHit=false;while(context){if(name.indexOf(".")>0){intermediateValue=context.view;names=name.split(".");index=0;while(intermediateValue!=null&&index<names.length){if(index===names.length-1)lookupHit=hasProperty(intermediateValue,names[index])||primitiveHasOwnProperty(intermediateValue,names[index]);intermediateValue=intermediateValue[names[index++]]}}else{intermediateValue=context.view[name];lookupHit=hasProperty(context.view,name)}if(lookupHit){value=intermediateValue;break}context=context.parent}cache[name]=value}if(isFunction(value))value=value.call(this.view);return value};function Writer(){this.templateCache={_cache:{},set:function set(key,value){this._cache[key]=value},get:function get(key){return this._cache[key]},clear:function clear(){this._cache={}}}}Writer.prototype.clearCache=function clearCache(){if(typeof this.templateCache!=="undefined"){this.templateCache.clear()}};Writer.prototype.parse=function parse(template,tags){var cache=this.templateCache;var cacheKey=template+":"+(tags||mustache.tags).join(":");var isCacheEnabled=typeof cache!=="undefined";var tokens=isCacheEnabled?cache.get(cacheKey):undefined;if(tokens==undefined){tokens=parseTemplate(template,tags);isCacheEnabled&&cache.set(cacheKey,tokens)}return tokens};Writer.prototype.render=function render(template,view,partials,config){var tags=this.getConfigTags(config);var tokens=this.parse(template,tags);var context=view instanceof Context?view:new Context(view,undefined);return this.renderTokens(tokens,context,partials,template,config)};Writer.prototype.renderTokens=function renderTokens(tokens,context,partials,originalTemplate,config){var buffer="";var token,symbol,value;for(var i=0,numTokens=tokens.length;i<numTokens;++i){value=undefined;token=tokens[i];symbol=token[0];if(symbol==="#")value=this.renderSection(token,context,partials,originalTemplate,config);else if(symbol==="^")value=this.renderInverted(token,context,partials,originalTemplate,config);else if(symbol===">")value=this.renderPartial(token,context,partials,config);else if(symbol==="&")value=this.unescapedValue(token,context);else if(symbol==="name")value=this.escapedValue(token,context,config);else if(symbol==="text")value=this.rawValue(token);if(value!==undefined)buffer+=value}return buffer};Writer.prototype.renderSection=function renderSection(token,context,partials,originalTemplate,config){var self=this;var buffer="";var value=context.lookup(token[1]);function subRender(template){return self.render(template,context,partials,config)}if(!value)return;if(isArray(value)){for(var j=0,valueLength=value.length;j<valueLength;++j){buffer+=this.renderTokens(token[4],context.push(value[j]),partials,originalTemplate,config)}}else if(typeof value==="object"||typeof value==="string"||typeof value==="number"){buffer+=this.renderTokens(token[4],context.push(value),partials,originalTemplate,config)}else if(isFunction(value)){if(typeof originalTemplate!=="string")throw new Error("Cannot use higher-order sections without the original template");value=value.call(context.view,originalTemplate.slice(token[3],token[5]),subRender);if(value!=null)buffer+=value}else{buffer+=this.renderTokens(token[4],context,partials,originalTemplate,config)}return buffer};Writer.prototype.renderInverted=function renderInverted(token,context,partials,originalTemplate,config){var value=context.lookup(token[1]);if(!value||isArray(value)&&value.length===0)return this.renderTokens(token[4],context,partials,originalTemplate,config)};Writer.prototype.indentPartial=function indentPartial(partial,indentation,lineHasNonSpace){var filteredIndentation=indentation.replace(/[^ \t]/g,"");var partialByNl=partial.split("\n");for(var i=0;i<partialByNl.length;i++){if(partialByNl[i].length&&(i>0||!lineHasNonSpace)){partialByNl[i]=filteredIndentation+partialByNl[i]}}return partialByNl.join("\n")};Writer.prototype.renderPartial=function renderPartial(token,context,partials,config){if(!partials)return;var tags=this.getConfigTags(config);var value=isFunction(partials)?partials(token[1]):partials[token[1]];if(value!=null){var lineHasNonSpace=token[6];var tagIndex=token[5];var indentation=token[4];var indentedValue=value;if(tagIndex==0&&indentation){indentedValue=this.indentPartial(value,indentation,lineHasNonSpace)}var tokens=this.parse(indentedValue,tags);return this.renderTokens(tokens,context,partials,indentedValue,config)}};Writer.prototype.unescapedValue=function unescapedValue(token,context){var value=context.lookup(token[1]);if(value!=null)return value};Writer.prototype.escapedValue=function escapedValue(token,context,config){var escape=this.getConfigEscape(config)||mustache.escape;var value=context.lookup(token[1]);if(value!=null)return typeof value==="number"&&escape===mustache.escape?String(value):escape(value)};Writer.prototype.rawValue=function rawValue(token){return token[1]};Writer.prototype.getConfigTags=function getConfigTags(config){if(isArray(config)){return config}else if(config&&typeof config==="object"){return config.tags}else{return undefined}};Writer.prototype.getConfigEscape=function getConfigEscape(config){if(config&&typeof config==="object"&&!isArray(config)){return config.escape}else{return undefined}};var mustache={name:"mustache.js",version:"4.1.0",tags:["{{","}}"],clearCache:undefined,escape:undefined,parse:undefined,render:undefined,Scanner:undefined,Context:undefined,Writer:undefined,set templateCache(cache){defaultWriter.templateCache=cache},get templateCache(){return defaultWriter.templateCache}};var defaultWriter=new Writer;mustache.clearCache=function clearCache(){return defaultWriter.clearCache()};mustache.parse=function parse(template,tags){return defaultWriter.parse(template,tags)};mustache.render=function render(template,view,partials,config){if(typeof template!=="string"){throw new TypeError('Invalid template! Template should be a "string" '+'but "'+typeStr(template)+'" was given as the first '+"argument for mustache#render(template, view, partials)")}return defaultWriter.render(template,view,partials,config)};mustache.escape=escapeHtml;mustache.Scanner=Scanner;mustache.Context=Context;mustache.Writer=Writer;return mustache});

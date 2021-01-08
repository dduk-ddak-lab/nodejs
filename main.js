// 모듈 불러오기
var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');                   // filtering

function templateHTML(title, list, body, control) {
  return `
  <!doctype html>
  <html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1><a href="/">WEB</a></h1>
    ${list}
    ${control}
    ${body}
  </body>
  </html>
  `;
}


var app = http.createServer(function(request,response){
  
var _url = request.url;
var queryData = url.parse(_url, true).query;
var pathname = url.parse(_url, true).pathname;
var list = '<ul>';

// list 불러옴
fs.readdir('./data', function(err, filelist){
  for (key in filelist) {
    list = list + `<li><a href="/?id=${filelist[key]}">${filelist[key]}</a></li>`;
  }
  list += '</ul>';
  
  if (pathname === '/') {  // 홈페이지라면
    if (queryData.id === undefined) {  // id가 없다면
      var title = '환영합니다!';
      var description = 'Welcome!! 환영합니다.';
      var template = templateHTML(title, list,
        `<h2>${title}</h2>${description}`, 
        `<a href="/create">create</a>`); 
      response.writeHead(200);
      response.end(template);
    } else {  // id가 있다면
      var filteredId= path.parse(queryData.id).base; // filtering
      fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
      var title = filteredId;
      var template = templateHTML(title, list, 
        `<h2>${title}</h2>${description}`,
        `<a href="/create">create</a> 
        <a href="/update?id=${title}">update</a>
        <form action = "delete_process" method = "post">
          <input type="hidden" name="id" value="${title}">
          <input type="submit" value = "delete">
        </form>
        `); 
      response.writeHead(200);
      response.end(template);
      });
    }
  } else if(pathname === '/create') {  // 생성페이지라면
    var title = 'WEB - create';
      var template = templateHTML(title, list, `
      <form action="/create_process" method="post">
        <p><input type="text" name="title" placeholder="title"></p>
        <p>
          <textarea name="description" placeholder="description"></textarea>
        </p> 
        <p><input type="submit"></p>
      </form>
      `,''); 
      response.writeHead(200);
      response.end(template);  
    } else if(pathname === '/create_process') {  // 생성 프로세스라면
      var body = '';
      request.on('data', function(data){
        body += data;
        console.log(body);
      });
      request.on('end', function(){
        var post = qs.parse(body);
        var title = post.title;
        var description = post.description;
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){});
        response.writeHead(302, {Location : `/?id=${title}`});
        response.end();  
      });
    } else if (pathname === '/update') {  // 업데이트 페이지라면
      fs.readFile(`data/${queryData.id}`, 'utf8', function(err, data){
        var title = queryData.id;
        var description = data;
        var template = templateHTML(title, list, 
          `<form action="/update_process" method="post">
            <input type ="hidden" name="id" value="${title}">
            <p><input type="text" name="title" placeholder="title" value=${title}></p>
            <p>
              <textarea name="description" placeholder="description">${description}</textarea>
            </p> 
            <p><input type="submit"></p>
            </form>`,
          `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`); 
        response.writeHead(200);
        response.end(template);
        });
    } else if (pathname === '/update_process') {  // 업데이트 프로세스라면
      var body = '';
      request.on('data', function(data){
        body += data;
      });
      request.on('end', function(){
        var post = qs.parse(body);
        var id = post.id;
        var title = post.title;
        var description = post.description;
        fs.rename(`data/${id}`, `data/${title}`, function(error){});
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){});
        response.writeHead(302, {Location : `/?id=${title}`});
        response.end();  
      });
    } else if (pathname === '/delete_process') {  // 업데이트 프로세스라면
      var body = '';
      request.on('data', function(data){
        body += data;
      });
      request.on('end', function(){
        var post = qs.parse(body);
        var id = post.id;
        fs.unlink(`data/${id}`, function(error) {
          response.writeHead(302, {Location: '/'});
          response.end();
        });
      });
    } else {
    response.writeHead(404);
    response.end('Not found');
  }
}); // list 데이터 불러온 후 실행되는 코드.

}); // 서버 생성 이후.
app.listen(3000);
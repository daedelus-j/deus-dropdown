var http = require('http');
var fs = require('fs');
var Router = require('routes-router');
var jade = require('jadeify');
var router = Router();

var ecstatic = require('ecstatic');
var serveBrowserify = require('serve-browserify')({
    root: __dirname,
    debug: true
  });

router.addRoute('*.js', serveBrowserify);

router.addRoute('/', function(req, res){
  res.writeHead(200, { 'content-type': 'text/html' });
  fs.createReadStream(__dirname + '/index.html').pipe(res);
});

router.addRoute('/*', ecstatic({
    root: __dirname + '/../',
    autoIndex: true
}));


http.createServer(router)
  .listen(3000, function () {
    console.log('example page loaded on port 3000');
  });

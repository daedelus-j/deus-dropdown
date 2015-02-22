var http = require('http');
var fs = require('fs');
var Router = require('routes-router');
var router = Router();

var browserify = require('browserify');
var concat = require('concat-stream');
var bundleStr;
bundle(function(str){ bundleStr = str; });
function bundle(cb) {
  browserify()
    .add(__dirname + '/client.js')
    .transform(require('jadeify'), {
      compileDebug: true,
      pretty: true
    })
    .bundle()
    .pipe(concat(cb));
}

var ecstatic = require('ecstatic');
var serveBrowserify = require('serve-browserify')({
    root: __dirname,
    debug: true
  });

router.addRoute('*.js', function(req, res){
  if (bundleStr) {
    res.writeHead(200, { 'content-type': 'text/javascript' });
    return res.end(bundleStr);
  }
});

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

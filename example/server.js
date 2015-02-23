var http = require('http');
var fs = require('fs');
var Router = require('routes-router');
var router = Router();

// stylus string
var stylus = require('stylus');
var ee = new (require('events').EventEmitter);
var str = require('fs').readFileSync(__dirname +
  '/../styles/deus-dropdown.styl', 'utf8');
var cssStr;
stylus(str)
  .render(function(err, css){
    if (err) throw err;
    cssStr = css;
    ee.emit('css-compiled', css);
  });

// browserify string
var browserify = require('browserify');
var concat = require('concat-stream');
var bundledJS;
bundle(function(js){
  bundledJS = js;
  ee.emit('js-compiled', js);
});
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
  if (bundledJS) {
    res.writeHead(200, { 'content-type': 'text/javascript' });
    return res.end(bundledJS);
  } else {
    ee.on('js-compiled', function (js){
      res.writeHead(200, { 'content-type': 'text/javascript' });
      return res.end(js);
    });
  }
});

router.addRoute('/', function(req, res){
  res.writeHead(200, { 'content-type': 'text/html' });
  fs.createReadStream(__dirname + '/index.html').pipe(res);
});

router.addRoute('/deus-dropdown.css', function(req, res){
  if (cssStr) {
    res.writeHead(200, { 'content-type': 'text/css' });
    res.end(cssStr);
  } else {
    return ee.on('css-compiled', function(css){
      res.writeHead(200, { 'content-type': 'text/css' });
      res.end(css);
    });
  }
});

router.addRoute('/*', ecstatic({
  root: __dirname + '/../',
  autoIndex: true
}));

http.createServer(router)
  .listen(3000, function () {
    console.log('example page loaded on port 3000');
  });

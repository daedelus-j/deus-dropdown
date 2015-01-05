var Combokeys  = require('combokeys');
var dom        = require('dom-events');
var keyMaps    = {
    8: "backspace",
    9: "tab",
    13: "enter",
    16: "shift",
    17: "ctrl",
    18: "alt",
    20: "capslock",
    27: "esc",
    32: "space",
    33: "pageup",
    34: "pagedown",
    35: "end",
    36: "home",
    37: "left",
    38: "up",
    39: "right",
    40: "down",
    45: "ins",
    46: "del",
    91: "meta",
    93: "meta",
    224: "meta"
};


module.exports = function input(el, opts) {
  var keys = new Combokeys(el);
  keys.bind('down', opts.onDown);
  keys.bind('esc', opts.onEscape);
  keys.bind('up', opts.onUp);
  keys.bind('enter', opts.onEnter);
  dom.on(el, 'keyup', function(e){
    var bindings = ['down', 'up', 'esc', 'enter'];
    var key = keyMaps[e.keyCode];
    if (bindings.indexOf(key) !== -1) return;
    opts.onKeyup(e);
  });
};

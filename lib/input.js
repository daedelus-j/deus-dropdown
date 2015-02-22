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
  dom.on(el, 'keydown', function(e){
    var key = keyMaps[e.keyCode];
    console.log('keydown: ', key)
    if (key === 'down') return opts.onDown(e);
    if (key === 'esc') return  opts.onEscape(e);
    if (key === 'up') return  opts.onUp(e);
    if (key === 'enter') return  opts.onEnter(e);
  });
  dom.on(el, 'keyup', function(e){
    var bindings = ['down', 'up', 'esc', 'enter'];
    var key = keyMaps[e.keyCode];
    if (bindings.indexOf(key) !== -1) return;
    opts.onKeyup(e);
  });
};

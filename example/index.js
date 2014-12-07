var sel = q('#container');
var DeusDropdown = require('../');

var opts = {
  options: [
    { text: 'Stylogee', model: { id: 1 } },
    { text: 'Kranium', model: { id: 2 } },
    { text: 'August Alsina', model: { id: 3 } },
    { text: 'Bun B', model: { id: 4 } },
    { text: 'Juicy J', model: { id: 5 } },
    { text: 'Kirko Bangz', model: { id: 6 } }
  ],
  btn: {
    text: 'Artists'
  }
};

var ddd = DeusDropdown(opts);
sel.appendChild(ddd.render().el());

function q(sel, el) {
  var el = el || document;
  return el.querySelector(sel);
}

function qa(sel, el) {
  var el = el || document;
  return el.querySelectorAll(sel);
}


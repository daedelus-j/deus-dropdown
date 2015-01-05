var sel = q('#container');
var DeusDropdown = require('../');

var opts = {
  dropdownOptions: [
    { text: 'a', model: { id: 1 } },
    { text: 'a s', model: { id: 2 } },
    { text: 'a si', model: { id: 3 } },
    { text: 'a sim', model: { id: 4 } },
    { text: 'a simi', model: { id: 5 } },
    { text: 'a simil', model: { id: 6 } },
    { text: 'a simila', model: { id: 7 } },
    { text: 'a similar', model: { id: 8 } },
    { text: 'a similar s', model: { id: 8 } },
    { text: 'a similar st', model: { id: 9 } },
    { text: 'a similar str', model: { id: 10 } },
    { text: 'a similar stri', model: { id: 11 } },
    { text: 'a similar strin', model: { id: 12 } },
    { text: 'a similar string', model: { id: 13 } }
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

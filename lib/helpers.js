 var helpers = {
  circularIncrement: function circularIncrement(index, max) {
    return (index === max) ? 0 : ++index;
  },
  circularDecrement: function circularDecrement(index, max) {
    return (index === 0) ? max : --index;
  },
  createEl: function createEl(tmpl, options) {
    return helpers.toNode(tmpl(options));
  },
  querySelector: function querySelector(sel, el) {
    var el = el || document;
    return el.querySelector(sel);
  },
  querySelectorAll: function querySelectorAll(sel, el) {
    var el = el || document;
    return el.querySelectorAll(sel);
  },
  toNode: function toNode(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString;
    return div.children[0];
  }
};

module.exports = helpers;

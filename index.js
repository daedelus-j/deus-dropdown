var tmpl = require('./templates/index.jade');
var ASSERT = require('assert').ok;
var Emitter = require('events').EventEmitter;
var inherits = require('inherits');
var dom = require('dom-events');
var bindAll = require('bind-all-lite');
var search = require('./lib/search');
var q = require('./lib/helpers').querySelector;
var qa = require('./lib/helpers').querySelectorAll;
var toNode = require('./lib/helpers').toNode;
var createEl = require('./lib/helpers').createEl;
var circularIncrement = require('./lib/helpers').circularIncrement;
var circularDecrement = require('./lib/helpers').circularDecrement;
var ext = require('jquery-extend');
var input = require('./lib/input');

function DeusDropdown(opts) {

  if (!(this instanceof DeusDropdown)) return new DeusDropdown(opts);

  ASSERT(!!opts.dropdownOptions, 'must pass in an options array');

  bindAll(
    this,
    'render',
    '_onBtnClick',
    '_onEnter',
    '_onEscape',
    '_onItemMouseover',
    '_onItemMouseout',
    '_onKeyup',
    '_onArrowUp',
    '_onArrowDown',
    '_onItemClick'
  );

  this._el = createEl(tmpl, opts);
  this._dropdownOptions = opts.dropdownOptions;
  this.hiddenClassName = opts.hiddenClassName || 'item-hidden';
  this._activeElClassName = opts.activeElClassName || 'deus-item-active';
  this._btnOptionSelector = opts.btnOptionSelector || '.deus-dd-item-btn';
  this.dropdownBtn = opts.dropdownBtn || '.deus-btn-with-icon';
  this._inputSelector = opts.inputSelector || '.deus-dd-input';
  this._searchIndex = search.initialize(this._dropdownOptions);

  this.selectedItems = [];
  this.currentActiveItem = null;
  this.shownItems = setShownItems([], qa(this._btnOptionSelector, this._el));
  this.hiddenItems = [];

}

module.exports = DeusDropdown;
inherits(DeusDropdown, Emitter);
ext(DeusDropdown.prototype, {

  el: function el() {
    return this._el;
  },

  selectedItems: function selectedItems() {
    return this.selectedItems;
  },

  render: function render() {
    this.bindEvents();
    return this;
  },

  bindEvents: function bindEvents() {
    var that = this;
    dom.on(q(this.dropdownBtn, this._el), 'click', this._onBtnClick);

    [].forEach.call(qa(this._btnOptionSelector, this._el),
      function(itemEl, idx) {
        dom.on(itemEl, 'click', function(e) {
          that._onItemClick.call(that, e);
        });
        dom.on(itemEl, 'mouseover', function(e) {
          that._onItemMouseover.call(that, e);
        });
        dom.on(itemEl, 'mouseout', function(e) {
          that._onItemMouseout.call(that, e);
        });
      });

    input(q(this._inputSelector, this._el), {
      down: this._onArrowDown,
      up: this._onArrowUp,
      enter: this._onEnter,
      escape: this._onEscape,
      keyup: this._onKeyup
    });
  },

  _onBtnClick: function _onBtnClick(e) {
    e.preventDefault();
    var that = this;
    this.emit('clicked', e);
    this._el.classList.toggle('deus-dd-active');

    process.nextTick(function() {
      q(that._inputSelector, that._el).focus();
    });
  },

  _onItemClick: function _onItemClick(e, view) {
    e.preventDefault();
    this.emit('clicked', e);
    e.currentTarget.classList.toggle('item-selected');
    this.selectedItems.push(e.currentTarget);
  },

  _onItemMouseover: function _onItemMouseover(e) {
    var el = e.currentTarget;
    var id = parseInt(el.getAttribute('data-id'), 10);
    this.setCurrentItem(getIndexOfView(this.shownItems, id));
  },

  _onItemMouseout: function _onItemMouseout(e) {
    this.setCurrentItem(null);
  },

  _onArrowDown: function _onArrowDown(e) {
    e.preventDefault();
    if (!this.currentActiveItem) this.setCurrentItem(0);
    this._cycleActiveItem(this.currentActiveItem,
      circularIncrement, this.shownItems);
  },

  _onArrowUp: function _onArrowUp(e) {
    e.preventDefault();
    if (!this.currentActiveItem) this.setCurrentItem(
      this.shownItems.length - 1);
    this._cycleActiveItem(this.currentActiveItem,
      circularDecrement, this.shownItems);
  },

  _onEscape: function _onEscape() {
    this._el.classList.toggle('deus-dd-active');
    this.setCurrentItem(null);
  },

  _onEnter: function _onEnter() {
    if (this.currentActiveItem) this._updateSelectedItems(
      this.currentActiveItem, this.selectedItems);
  },

  _onKeyup: function _onKeyup() {
    var searchString = q(this._inputSelector).value;
    var btns = qa(this._btnOptionSelector, this._el);
    var that = this;
    var indices;

    this._el.classList.remove('empty-search');

    // if blank reset active items
    if (searchString === '') {
      this.shownItems = setShownItems([], btns, this.hiddenClassName);
      this.hiddenItems = [];
      this.setCurrentItem(0);
      return;
    }

    indices = search.getIndices(this._searchIndex, searchString);

    if (indices.length > 0) {
      this.shownItems = setShownItems(indices, btns, this.hiddenClassName);
      this.hiddenItems = setHiddenItems(indices, btns, this.hiddenClassName);
      this.setCurrentItem(0);
      return;
    }

    this._showEmptySearch();
  },

  _showEmptySearch: function _showEmptySearch() {
    this._el.classList.add('empty-search');
  },

  showItems: function showItems(indices, els, className) {
    [].forEach.call(els, function(el) {
      var id = parseInt(el.getAttribute('data-id'), 10);
      if (indices.indexOf(id) === -1) return el.classList.add(className);
      el.classList.remove(className);
    });
  },

  _clearInactives: function _clearInactives(hiddenItems, inactiveClassName) {
    hiddenItems.forEach(function(el) {
      el.classList.remove(inactiveClassName);
    });
    hiddenItems = [];
    return this;
  },

  _updateSelectedItems: function _updateSelectedItems(activeItem, selectedItems) {
    if (selectedItems.length === 0) {
      this.selectedItems.push(activeItem);
      activeItem.classList.add('item-selected');
      return;
    }

    if (!this._removeSelectedItem(activeItem, selectedItems)) {
      selectedItems.push(activeItem);
      activeItem.classList.add('item-selected');
    } else activeItem.classList.remove('item-selected');
  },

  _removeSelectedItem: function _removeSelectedItem(activeItem, selectedItems) {
    var idx;
    var found = selectedItems.some(function(selectedItem, index) {
      var currItemId = parseInt(selectedItem.getAttribute('data-id'), 10);
      var activeItemId = parseInt(activeItem.getAttribute('data-id'), 10);
      if (currItemId === activeItemId) {
        idx = index;
        return true;
      }
    });

    if (found === true) selectedItems.splice(idx, 1);
    return found;
  },

  setCurrentItem: function setCurrentItem(index) {
    clearActiveEl(q('.item-active', this._el));
    if (index === null) return this.currentActiveItem = null;

    this.currentActiveItem = this.shownItems[index];
    this.currentActiveItem && this.currentActiveItem.classList.add('item-active');
  },

  _cycleActiveItem: function _cycleActiveItem(activeItem, cycleFn, activeItems) {
    var maxLength = activeItems.length - 1;
    var index = getIndices(activeItems)
      .indexOf(activeItem.getAttribute('data-id'));

    if (activeItem) this.setCurrentItem(cycleFn(index, maxLength));
    else this.setCurrentItem(0);

    function getIndices(els) {
      return [].map.call(els, function(el) {
        return el.getAttribute('data-id');
      });
    }
  }
});

function clearActiveEl(el) {
  if (el) el.classList.remove('item-active');
}


function getIndexOfView(els, id) {
  return [].map.call(els, function(el, index) {
    return {
      index: index,
      id: parseInt(el.getAttribute('data-id'), 10)
    };
  }).filter(function(opt, index) {
    return opt.id === id;
  })[0].index;
}

function setShownItems(indices, els, className) {
  if (indices.length === 0) {
    [].forEach.call(els, function(el) {
      el.classList.remove(className);
    });
    return els;
  }

  var shownEls = [].filter.call(els, function(el, i) {
      return indices.indexOf(
        parseInt(el.getAttribute('data-id'), 10)) !== -1;
    });

  shownEls && shownEls.forEach(function(el) {
    el.classList.remove(className);
  });

  return (shownEls.length === 0) ? els : shownEls;
}

function setHiddenItems(indices, els, className) {
  var items = [].filter.call(els, function(el, i) {
    return indices.indexOf(
      parseInt(el.getAttribute('data-id'), 10)) === -1;
    });

  items && items.forEach(function(el) {
    el.classList.add(className);
  });

  return items;
}

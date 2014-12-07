var tmpl                = require('./templates/index.jade');
var ASSERT              = require('assert').ok;
var Emitter             = require('events').EventEmitter;
var inherits            = require('inherits');
var dom                 = require('dom-events');
var bindAll             = require('bind-all-lite');
var q                   = require('./lib/helpers').querySelector;
var qa                  = require('./lib/helpers').querySelectorAll;
var toNode              = require('./lib/helpers').toNode;
var createEl            = require('./lib/helpers').createEl;
var circularIncrement   = require('./lib/helpers').circularIncrement;
var circularDecrement   = require('./lib/helpers').circularDecrement;
var input               = require('./lib/input');

function DeusDropdown(opts) {
  // ASSERT(!!sel, 'must pass in a selector');

  if (!(this instanceof DeusDropdown)) {
    return new DeusDropdown(opts);
  }

  ASSERT(!!opts.options, 'must pass in an options array');

  bindAll(
    this,
    'render',
    '_onClick',
    '_onEnter',
    '_onEscape',
    '_onArrowUp',
    '_onItemMouseover',
    '_onItemMouseout',
    '_onKeydown',
    '_onArrowDown',
    '_onItemClick'
  );

  this._el = createEl(tmpl, opts);
  this._options = opts.options;
  this.activeItem = null;
  this._selectedItems = [];
}

module.exports = DeusDropdown;
inherits(DeusDropdown, Emitter);
var Proto = DeusDropdown.prototype;

Proto.el = function el(){
  return this._el;
};

Proto.selectedItems = function selectedItems(){
  return this._selectedItems;
};

Proto.render = function render() {
  this.bindEvents();
  return this;
};

Proto.bindEvents = function bindEvents() {
  var that = this;
  dom.on(q('.deus-btn-with-icon', this._el), 'click', this._onClick);

  [].forEach.call(qa('.deus-dd-item-btn', this._el),
    function(itemEl, idx) {
      dom.on(itemEl, 'click', function(e){
        that._onItemClick.apply(that, [e, that._options[idx]]);
      });
      dom.on(itemEl, 'mouseover', function(e){
        that._onItemMouseover.apply(that, [e, that._options[idx]]);
      });
      dom.on(itemEl, 'mouseout', function(e){
        that._onItemMouseout.apply(that, [e, that._options[idx]]);
      });
    });

  input(q('.deus-dd-input', this._el), {
    onDown: this._onArrowDown,
    onEnter: this._onEnter,
    onEscape: this._onEscape,
    onKeydown: this._onKeydown,
    onUp: this._onArrowUp
  });
};

Proto._onClick = function _onClick(e) {
  e.preventDefault();
  this.emit('clicked', e);
  this._el.classList.toggle('deus-dd-active');

  setTimeout(function(){
    q('.deus-dd-input', this._el).focus();
  }, 0);
};

Proto._onItemClick = function _onItemClick(e, view) {
  e.preventDefault();
  this.emit('clicked', e);
  e.currentTarget.classList.toggle('item-selected');
  this._selectedItems.push([e.currentTarget,
    this._getIndexOfView(view.model.id)]);
};

Proto._onItemMouseover = function _onItemMouseover(e, view) {
  e.currentTarget.classList.add('item-active');
  this._setActiveItem(this._getIndexOfView(view.model.id));
};

Proto._onItemMouseout = function _onItemMouseout(e) {
  this._setActiveItem(null);
};

Proto._onArrowDown = function _onArrowDown(e){
  e.preventDefault();
  this._setNextActiveItem(this.activeItem, this._options.length - 1);
};

Proto._onArrowUp = function _onArrowUp(e){
  e.preventDefault();
  this._setPrevActiveItem(this.activeItem, this._options.length - 1);
};

Proto._onEscape = function _onEscape(){
  this._el.classList.toggle('deus-dd-active');
  this._setActiveItem(null);
};

Proto._onEnter = function _onEnter(){
  if (this.activeItem){
    this._updateSelectedItems(this.activeItem, this._selectedItems, this._options);
  }
};

Proto._onKeydown = function _onKeydown(){
  this._updateSearch();
};

Proto._updateSearch = function _updateSearch() {
  // TODO implement search
};

Proto._updateSelectedItems = function _updateSelectedItems(activeItem, selectedItems, options){
  if (selectedItems.length === 0) {
    this._selectedItems.push(activeItem);
    return activeItem[0].classList.add('item-selected');
  }

  if (!this._removeSelectedItem(options[activeItem[1]],
    selectedItems, options)) selectedItems.push(activeItem) &&
      activeItem[0].classList.add('item-selected');
  else activeItem[0].classList.remove('item-selected');

};

Proto._removeSelectedItem = function _removeSelectedItem(item, selectedItems, options){
  var idx;
  var found;
  found = selectedItems.some(function(selectedItem, index){
    if (options[selectedItem[1]].model.id === item.model.id) {
      idx = index;
      return (found = true);
    }
  });

  if (found === true) {
    selectedItems.splice(idx, 1);
  }

  return found;
};

Proto._setActiveItem = function _setActiveItem(index) {
  ASSERT(typeof index !== 'undefined', '_setActiveItem: index can\'t be undefined');

  if (index === null) {
    this._clearActiveEl(q('.item-active', this._el));
    return this.activeItem = null;
  }

  this._clearActiveEl(q('.item-active', this._el));

  this.activeItem = [
    this._getElFromIndex(index),
    index
  ];

  this.activeItem[0].classList.add('item-active');
};

Proto._clearActiveEl = function _clearActiveEl(el) {
  if (el) el.classList.remove('item-active');
};

Proto._setPrevActiveItem = function _setPrevActiveItem(activeItem, maxlength){
  if (activeItem) {
    this._setActiveItem(
      circularDecrement(activeItem[1], maxlength)
    );
  } else {
    this._setActiveItem(0);
  }
};

Proto._setNextActiveItem = function _setNextActiveItem(activeItem, maxlength){
  if (activeItem) {
    this._setActiveItem(
      circularIncrement(activeItem[1], maxlength)
    );
  } else {
    this._setActiveItem(0);
  }
};

Proto._getIndexOfView = function _getIndexOfView(id) {
  return this._options.map(function(opt, index){
      return {
        index: index,
        id: opt.model.id
      };
    }).filter(function(opt, index){
      return opt.id === id;
    })[0].index;
};

Proto._getElFromIndex = function _getElFromIndex(index) {
  return [].filter.call(qa('.deus-dd-item-btn', this._el),
    function(el, idx) {
      return idx === index;
    })[0];
};


Proto._getIndexFromEl = function _getElFromIndex(el) {
  return [].map.call(qa('.deus-dd-item-btn', this._el),
    function(btn, index){
      return {
        el: btn,
        index: index
      };
    })
    .filter(function(btn, idx) {
      return el === btn.el;
    })[0].index;
};

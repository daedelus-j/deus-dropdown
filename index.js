var tmpl                = require('./templates/index.jade');
var ASSERT              = require('assert').ok;
var Emitter             = require('events').EventEmitter;
var inherits            = require('inherits');
var dom                 = require('dom-events');
var bindAll             = require('bind-all-lite');
var search              = require('./lib/search');
var q                   = require('./lib/helpers').querySelector;
var qa                  = require('./lib/helpers').querySelectorAll;
var toNode              = require('./lib/helpers').toNode;
var createEl            = require('./lib/helpers').createEl;
var circularIncrement   = require('./lib/helpers').circularIncrement;
var circularDecrement   = require('./lib/helpers').circularDecrement;
var input               = require('./lib/input');

function DeusDropdown(opts) {

  if (!(this instanceof DeusDropdown)) {
    return new DeusDropdown(opts);
  }

  ASSERT(!!opts.dropdownOptions, 'must pass in an options array');

  bindAll(
    this,
    'render',
    '_onClick',
    '_onEnter',
    '_onEscape',
    '_onArrowUp',
    '_onItemMouseover',
    '_onItemMouseout',
    '_onKeyup',
    '_onArrowDown',
    '_onItemClick'
  );

  this._el = createEl(tmpl, opts);
  this._dropdownOptions = opts.dropdownOptions;
  this._activeElClassName = opts.activeElClassName || '.deus-item-active';
  this._btnOptionSelector = opts.btnOptionSelector || '.deus-dd-item-btn';
  this._iconSelector = opts.iconSelector || '.deus-btn-with-icon';
  this._inputSelector = opts.inputSelector || '.deus-dd-input';
  this._searchIndex = search.initialize(this._dropdownOptions);
  this._selectedItems = [];
  this.activeItem = null;
  this._activeItems = [];
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
  dom.on(q(this._iconSelector, this._el), 'click', this._onClick);

  [].forEach.call(qa(this._btnOptionSelector, this._el),
    function(itemEl, idx) {
      dom.on(itemEl, 'click', function(e){
        that._onItemClick.apply(that, [e, that._dropdownOptions[idx]]);
      });
      dom.on(itemEl, 'mouseover', function(e){
        that._onItemMouseover.apply(that, [e, that._dropdownOptions[idx]]);
      });
      dom.on(itemEl, 'mouseout', function(e){
        that._onItemMouseout.apply(that, [e, that._dropdownOptions[idx]]);
      });
    });

  input(q(this._inputSelector, this._el), {
    onDown: this._onArrowDown,
    onEnter: this._onEnter,
    onEscape: this._onEscape,
    onKeyup: this._onKeyup,
    onUp: this._onArrowUp
  });
};

Proto._onClick = function _onClick(e) {
  e.preventDefault();
  var that = this;
  this.emit('clicked', e);
  this._el.classList.toggle('deus-dd-active');

  process.nextTick(function(){
    q(that._inputSelector, that._el).focus();
  });
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
  this._setNextActiveItem(this.activeItem, this._dropdownOptions.length - 1);
};

Proto._onArrowUp = function _onArrowUp(e){
  e.preventDefault();
  this._setPrevActiveItem(this.activeItem, this._dropdownOptions.length - 1);
};

Proto._onEscape = function _onEscape(){
  this._el.classList.toggle('deus-dd-active');
  this._setActiveItem(null);
};

Proto._onEnter = function _onEnter(){
  if (this.activeItem){
    this._updateSelectedItems(this.activeItem, this._selectedItems, this._dropdownOptions);
  }
};

Proto._onKeyup = function _onKeyup(){
  var searchString = q(this._inputSelector).value;
  var indices;

  // if blank reset active items
  if (searchString === '') {
    this._el.classList.remove('empty-search');
    this._showActiveViewItems(this._dropdownOptions, this._activeElClassName);
    return this;
  }

  indices = search.getIndices(this._searchIndex, searchString);
  console.log('-------------', indices);

  if (indices.length > 0) {
    this._el.classList.remove('empty-search');
    this._clearInactiveItems(qa(this._btnOptionSelector), 'item-inactive')
      ._showActiveViewItems(indices, this._activeElClassName);
    return this;
  }

  this._showEmptySearch();
};


Proto._showEmptySearch = function _showEmptySearch(){
  this._el.classList.add('empty-search');
};

Proto._showActiveViewItems = function _showActiveViewItems(indices, className){
  [].filter.call(qa(this._btnOptionSelector, this._el),
    function(el) {
      console.log('--ids--', el.getAttribute('data-id'), indices);
      return indices.indexOf(parseInt(el.getAttribute('data-id'), 10)) === -1;
    })
    .forEach(function(el){
      el.classList.add('item-inactive');
    });
};

Proto._clearInactiveItems = function _clearInactiveItems(els, inactiveClassName){
  [].forEach.call(els, function(el){ el.classList.remove(inactiveClassName); });
  return this;
};

Proto._updateSelectedItems = function _updateSelectedItems(activeItem, selectedItems, options){
  if (selectedItems.length === 0) {
    this._selectedItems.push(activeItem);
    return activeItem.classList.add('item-selected');
  }

  if (!this._removeSelectedItem(options[activeItem.getAttribute('data-id')],
    selectedItems, options)) selectedItems.push(activeItem) &&
      activeItem.classList.add('item-selected');
  else activeItem.classList.remove('item-selected');

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

  this.activeItem = this._getElFromIndex(index);
  this.activeItem.classList.add('item-active');
};

Proto._clearActiveEl = function _clearActiveEl(el) {
  if (el) el.classList.remove('item-active');
};

Proto._setPrevActiveItem = function _setPrevActiveItem(activeItem, maxlength){
  if (activeItem) {
    this._setActiveItem(
      circularDecrement(activeItem.getAttribute('data-id'), maxlength)
    );
  } else {
    this._setActiveItem(0);
  }
};

Proto._setNextActiveItem = function _setNextActiveItem(activeItem, maxlength){
  if (activeItem) {
    this._setActiveItem(
      circularIncrement(activeItem.getAttribute('data-id'), maxlength)
    );
  } else {
    this._setActiveItem(0);
  }
};

Proto._getIndexOfView = function _getIndexOfView(id) {
  return this._dropdownOptions.map(function(opt, index){
      return {
        index: index,
        id: opt.model.id
      };
    }).filter(function(opt, index){
      return opt.id === id;
    })[0].index;
};

Proto._getElFromIndex = function _getElFromIndex(index) {
  return [].filter.call(qa(this._btnOptionSelector, this._el),
    function(el) {
      return el.getAttribute('data-id') === index;
    })[0];
};


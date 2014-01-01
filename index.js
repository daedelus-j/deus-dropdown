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
    '_onItemMouseover',
    '_onItemMouseout',
    '_onKeyup',
    '_onArrowUp',
    '_onArrowDown',
    '_onItemClick'
  );

  this._el = createEl(tmpl, opts);
  this._dropdownOptions = opts.dropdownOptions;
  this._inactiveElClassName = opts.inactiveElClassName || 'item-inactive';
  this._activeElClassName = opts.activeElClassName || 'deus-item-active';
  this._btnOptionSelector = opts.btnOptionSelector || '.deus-dd-item-btn';
  this._iconSelector = opts.iconSelector || '.deus-btn-with-icon';
  this._inputSelector = opts.inputSelector || '.deus-dd-input';
  this._searchIndex = search.initialize(this._dropdownOptions);
  this._selectedItems = [];
  this.activeItem = null;
  this._activeViewItems = [];
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
    onUp: this._onArrowUp,
    onEnter: this._onEnter,
    onEscape: this._onEscape,
    onKeyup: this._onKeyup
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
  this._selectedItems.push(e.currentTarget);
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
  this._cycleActiveItem(this.activeItem,
    circularIncrement, this._activeViewItems);
};

Proto._onArrowUp = function _onArrowUp(e){
  e.preventDefault();
  this._cycleActiveItem(this.activeItem,
    circularDecrement, this._activeViewItems);
};

Proto._onEscape = function _onEscape(){
  this._el.classList.toggle('deus-dd-active');
  this._setActiveItem(null);
};

Proto._onEnter = function _onEnter(){
  if (this.activeItem){
    this._updateSelectedItems(this.activeItem,
      this._selectedItems,
      this._dropdownOptions);
  }
};

Proto._onKeyup = function _onKeyup(){
  var searchString = q(this._inputSelector).value;
  var indices, btns;

  // if blank reset active items
  if (searchString === '') {
    this._el.classList.remove('empty-search');
    this._showActiveViewItems([], this._activeElClassName);
    this._setActiveItem(0);
    return;
  }

  indices = search.getIndices(this._searchIndex, searchString);
  console.log('-------------', indices);

  if (indices.length > 0) {
    btns = qa(this._btnOptionSelector, this._el);
    this._el.classList.remove('empty-search');
    this._clearInactiveViewItems(btns, 'item-inactive')
      ._showActiveViewItems(indices, btns, this._inactiveElClassName);
    this._activeViewItems = this._getActiveItems(indices, btns);
    this._setActiveItem(0);
    return;
  }

  this._showEmptySearch();
};

Proto._getActiveItems = function _getActiveItems(indices, els){
  var activeEls = [].filter.call(els,
    function(el, i) {
      console.log(el.getAttribute('data-id'))
      return indices.indexOf(
        parseInt(el.getAttribute('data-id'), 10)) !== -1;
    });

  return (activeEls.length === 0) ? els : activeEls;
};

Proto._showEmptySearch = function _showEmptySearch(){
  this._el.classList.add('empty-search');
};

Proto._showActiveViewItems =
  function _showActiveViewItems(indices, els, className){

  [].forEach.call(els, function(el){
    var id = parseInt(el.getAttribute('data-id'), 10);
    if (indices.indexOf(id) === -1) return el.classList.add(className);
    el.classList.remove(className);
  });

};

Proto._clearInactiveViewItems =
  function _clearInactiveViewItems(els, inactiveClassName){
  [].forEach.call(els, function(el){ el.classList.remove(inactiveClassName); });
  return this;
};

Proto._updateSelectedItems =
  function _updateSelectedItems(activeItem, selectedItems, options){
  if (selectedItems.length === 0) {
    this._selectedItems.push(activeItem);
    return activeItem.classList.add('item-selected');
  }

  if (!this._removeSelectedItem(options[activeItem.getAttribute('data-id')],
    selectedItems, options)) selectedItems.push(activeItem) &&
      activeItem.classList.add('item-selected');
  else activeItem.classList.remove('item-selected');

};

Proto._removeSelectedItem =
  function _removeSelectedItem(item, selectedItems, options){
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
  var activeEl = q('.item-active', this._el);

  if (index === null) {
    this._clearActiveEl(activeEl);
    return this.activeItem = null;
  }

  this._clearActiveEl(activeEl);

  this.activeItem = this._activeViewItems[index];
  this.activeItem.classList.add('item-active');
};

Proto._clearActiveEl = function _clearActiveEl(el) {
  if (el) el.classList.remove('item-active');
};

Proto._cycleActiveItem = function
  _cycleActiveItem(activeItem, cycleFn, activeItems){
  var maxLength = activeItems.length - 1;
  var index = getIndices(activeItems)
    .indexOf(activeItem.getAttribute('data-id'));

  console.log(index, maxLength, cycleFn(index, maxLength));
  if (activeItem) this._setActiveItem(cycleFn(index, maxLength));
  else this._setActiveItem(0);

  function getIndices(els){
    return [].map.call(els, function(el){
      return el.getAttribute('data-id');
    });
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


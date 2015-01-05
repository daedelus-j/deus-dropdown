var lunr = require('lunr');

function addIndex(idx) {
  return function add(item) {
    idx.add(item);
  };
}

function initialize(list){
  var idx = lunr(function(){
    this.field('text');
    this.ref('id');
  });
  var list = list.map(function(item){
    item.id = item.model.id;
    return item;
  });

  list.forEach(addIndex(idx));
  return idx;
}

function getIndices(idx, queryString) {
  return idx.search(queryString)
    .map(function(searchResult){
      return parseInt(searchResult.ref, 10);
    });
}

module.exports.initialize = initialize;
module.exports.getIndices = getIndices;

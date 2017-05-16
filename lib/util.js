
var me = module.exports

me.extend = function (o1, o2) {
  Object.keys(o2).forEach(function (key) {
    o1[key] = o2[key]
  })
  return o1
}

// This only works if the items are primitives
me.dedupe = function (a) {
  return a.filter((item, pos) => a.indexOf(item) === pos)
}

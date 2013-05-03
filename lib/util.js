
var me = module.exports

me.extend = function (o1, o2) {
  Object.keys(o2).forEach(function(key) {
    o1[key] = o2[key]    
  })
  return o1  
}


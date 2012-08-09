module.exports.tokens = {
    'file': null
  , 'date': function() { return (new Date()).toDateString(); }
  , 'date-year': function() { return (new Date()).getFullYear(); }
  , 'date-month': function() { return (new Date()).getMonth() + 1; } //JavaScript months are goofy
  , 'date-day': function() { return (new Date()).getDate(); }
  , 'date-hour': function() { return (new Date()).getHour(); }
  , 'date-min': function() { return (new Date()).getMin(); }
  , 'date-sec': function() { return (new Date()).getSeconds(); }   
}
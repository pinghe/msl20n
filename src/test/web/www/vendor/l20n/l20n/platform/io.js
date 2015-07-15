define(function (require, exports) {
  'use strict';

  exports.load = function load(url, callback, sync) {
    var xhr = new XMLHttpRequest();
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('text/plain');
    }
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          callback(null, xhr.responseText);
        } else {
          var ex = new IOError('Not found: ' + url);
          callback(ex);
        }
      }
    };
    xhr.open('GET', url, !sync);
    xhr.send('');
  };

  function IOError(message) {
    this.name = 'IOError';
    this.message = message;
  }
  IOError.prototype = Object.create(Error.prototype);
  IOError.prototype.constructor = IOError;

  exports.Error = IOError;

});

define(function (require, exports) {
  'use strict';

  var EventEmitter = require('../events').EventEmitter;
  var RetranslationManager = require('../retranslation').RetranslationManager;

  function Global() {
    this.id = null;
    this._emitter = new EventEmitter();
    this.value = null;
    this.isActive = false;
  }

  Global.prototype._get = function _get() {
    throw new Error('Not implemented');
  };

  Global.prototype.get = function get() {
    // invalidate the cached value if the global is not active;  active 
    // globals handle `value` automatically in `onchange()`
    if (!this.value || !this.isActive) {
      this.value = this._get();
    }
    return this.value;
  };

  Global.prototype.addEventListener = function(type, listener) {
    if (type !== 'change') {
      throw 'Unknown event type';
    }
    this._emitter.addEventListener(type, listener);
  };


  // XXX: https://bugzilla.mozilla.org/show_bug.cgi?id=865226
  // We want to have @screen.width, but since we can't get it from compiler, we 
  // call it @screen and in order to keep API forward-compatible with 1.0 we 
  // return an object with key width to
  // make it callable as @screen.width
  function ScreenGlobal() {
    Global.call(this);
    this.id = 'screen';
    this._get = _get;

    this.activate = function activate() {
      if (!this.isActive) {
        window.addEventListener('resize', onchange);
        this.isActive = true;
      }
    };

    this.deactivate = function deactivate() {
      window.removeEventListener('resize', onchange);
      this.value = null;
      this.isActive = false;
    };

    function _get() {
      return {
        width: {
          px: document.body.clientWidth
        }
      };
    }

    var self = this;

    function onchange() {
      self.value = _get();
      self._emitter.emit('change', self.id);
    }
  }

  ScreenGlobal.prototype = Object.create(Global.prototype);
  ScreenGlobal.prototype.constructor = ScreenGlobal;


  function OSGlobal() {
    Global.call(this);
    this.id = 'os';
    this.get = get;

    function get() {
      if (/^MacIntel/.test(navigator.platform)) {
        return 'mac';
      }
      if (/^Linux/.test(navigator.platform)) {
        return 'linux';
      }
      if (/^Win/.test(navigator.platform)) {
        return 'win';
      }
      return 'unknown';
    }

  }

  OSGlobal.prototype = Object.create(Global.prototype);
  OSGlobal.prototype.constructor = OSGlobal;

  function HourGlobal() {
    Global.call(this);
    this.id = 'hour';
    this._get = _get;

    this.activate = function activate() {
      if (!this.isActive) {
        var time = new Date();
        I = setTimeout(function() {
          onchange();
          I = setInterval(onchange, interval);
        }, interval - (time.getTime() % interval));
        this.isActive = true;
      }
    };

    this.deactivate = function deactivate() {
      clearInterval(I);
      this.value = null;
      this.isActive = false;
    };

    function _get() {
      var time = new Date();
      return time.getHours();
    }

    var self = this;
    var interval = 60 * 60 * 1000;
    var I = null;



    function onchange() {
      var time = new Date();
      if (time.getHours() !== self.value) {
        self.value = time.getHours();
        self._emitter.emit('change', self.id);
      }
    }
  }

  HourGlobal.prototype = Object.create(Global.prototype);
  HourGlobal.prototype.constructor = HourGlobal;

  RetranslationManager.registerGlobal(ScreenGlobal);
  RetranslationManager.registerGlobal(OSGlobal);
  RetranslationManager.registerGlobal(HourGlobal);

  exports.Global = Global;

});

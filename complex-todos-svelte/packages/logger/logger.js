import {Meteor} from 'meteor/meteor';
import {ReactiveVar} from 'meteor/reactive-var';
import {check, Match} from 'meteor/check';

const helpers = {
  isObject(obj) {
    if (this.isArray(obj) || this.isFunction(obj)) {
      return false;
    }
    return obj === Object(obj);
  },
  isArray(obj) {
    return Array.isArray(obj);
  },
  isBoolean(obj) {
    return obj === true || obj === false || Object.prototype.toString.call(obj) === '[object Boolean]';
  },
  isFunction(obj) {
    return typeof obj === 'function' || false;
  },
  isEmpty(obj) {
    if (this.isDate(obj)) {
      return false;
    }
    if (this.isObject(obj)) {
      return !Object.keys(obj).length;
    }
    if (this.isArray(obj) || this.isString(obj)) {
      return !obj.length;
    }
    return false;
  },
  clone(obj) {
    if (!this.isObject(obj)) return obj;
    return this.isArray(obj) ? obj.slice() : Object.assign({}, obj);
  }
};

const _helpers = ['String', 'Date'];
for (let i = 0; i < _helpers.length; i++) {
  helpers['is' + _helpers[i]] = function (obj) {
    return Object.prototype.toString.call(obj) === '[object ' + _helpers[i] + ']';
  };
}

let _inst = 0;

/*
 * @class Logger
 * @summary Extend-able Logger class
 */
class Logger {
  constructor() {
    this.userId = new ReactiveVar(null);
    this.prefix = ++_inst;
    this._rules = {};
    this._emitters = [];
    
    if (Meteor.isClient) {
      const _accounts = (Package && Package['accounts-base'] && Package['accounts-base'].Accounts) ? Package['accounts-base'].Accounts : undefined;
      if (_accounts) {
        _accounts.onLogin(() => {
          this.userId.set(Meteor.userId());
        });
        
        _accounts.onLogout(() => {
          this.userId.set(null);
        });
      }
    }
  }
  
  /*
   * @memberOf Logger
   * @name _log
   * @param level    {String} - Log level Accepts 'ERROR', 'FATAL', 'WARN', 'DEBUG', 'INFO', 'TRACE', 'LOG' and '*'
   * @param message  {String} - Text human-readable message
   * @param data     {Object} - [optional] Any additional info as object
   * @param userId   {String} - [optional] Current user id
   * @summary Pass log's data to Server or/and Client
   */
  _log(level, message, _data = {}, user) {
    const uid = user || this.userId.get();
    
    // sanitize circular refs before passing to emitters
    let data = Logger.prototype.antiCircular(_data);
    
    for (const i in this._emitters) {
      if (this._rules[this._emitters[i].name] && this._rules[this._emitters[i].name].enable === true) {
        if (Meteor.isServer && this._rules[this._emitters[i].name].server === false || Meteor.isClient && this._rules[this._emitters[i].name].client === false) {
          continue;
        }
        
        if (this._rules[this._emitters[i].name].allow.indexOf('*') !== -1 || this._rules[this._emitters[i].name].allow.indexOf(level) !== -1) {
          if (level === 'TRACE') {
            if (helpers.isString(data)) {
              data = {data: helpers.clone(data)};
            }
            data.stackTrace = this._getStackTrace();
          }
          
          if (Meteor.isClient && this._emitters[i].denyClient === true && this._emitters[i].denyServer === false) {
            Meteor.call(this._emitters[i].method, level, message, data, uid);
          } else if (this._rules[this._emitters[i].name].client === true && this._rules[this._emitters[i].name].server === true && this._emitters[i].denyClient === false && this._emitters[i].denyServer === false) {
            if (Meteor.isServer) {
              this._emitters[i].emitter(level, `SERVER - ${message}`, data, uid);
            }
            if (Meteor.isClient) {
              this._emitters[i].emitter(level, `CLIENT - ${message}`, data, uid);
              Meteor.call(this._emitters[i].method, level, `CLIENT - ${message}`, data, uid);
            }
          } else if (Meteor.isClient && this._rules[this._emitters[i].name].client === false && this._rules[this._emitters[i].name].server === true) {
            Meteor.call(this._emitters[i].method, level, message, data, uid);
          } else {
            this._emitters[i].emitter(level, message, data, uid);
          }
        }
      }
    }
    
    return new LoggerMessage({
      level: level,
      error: level,
      reason: message,
      errorType: level,
      message: message,
      details: data,
      data: data,
      user: uid,
      userId: uid
    });
  }
  
  /*
   * @memberOf Logger
   * @name rule
   * @param name    {String} - Adapter name
   * @param options {Object} - Settings object
         options.enable {Boolean} - Enable/disable adapter
         options.filter {Array}   - Array of strings, accepts:
                                   'ERROR', 'FATAL', 'WARN', 'DEBUG', 'INFO', 'TRACE', 'LOG' and '*'
                                   in lowercase or uppercase
                                   default: ['*'] - Accept all
         options.client {Boolean} - Allow execution on Client
         options.server {Boolean} - Allow execution on Server
   * @summary Enable/disable adapter and set it's settings
   */
  rule(name, options) {
    check(name, String);
    check(options, {
      enable: Boolean,
      client: Match.Optional(Boolean),
      server: Match.Optional(Boolean),
      filter: Match.Optional([String])
    });
    
    if (!helpers.isArray(options.filter) || helpers.isEmpty(options.filter)) {
      options.filter = ['*'];
    }
    
    if (options.filter) {
      for (let j = 0; j < options.filter.length; j++) {
        options.filter[j] = options.filter[j].toUpperCase();
      }
    }
    
    if (!helpers.isBoolean(options.client)) {
      options.client = false;
    }
    
    if (!helpers.isBoolean(options.server)) {
      options.server = true;
    }
    
    if (!helpers.isBoolean(options.enable)) {
      options.enable = true;
    }
    
    this._rules[name] = {
      allow: options.filter,
      enable: options.enable,
      client: options.client,
      server: options.server
    };
  }
  
  /*
   * @memberOf Logger
   * @name add
   * @param name        {String}    - Adapter name
   * @param emitter     {Function}  - Function called on Meteor.log...
   * @param init        {Function}  - Adapter initialization function
   * @param denyClient  {Boolean}   - Strictly deny execution on client, only pass via Meteor.methods
   * @param denyServer  {Boolean}   - Strictly deny execution on server, only client
   * @summary Register new adapter to be used within ostrio:logger package
   */
  add(name, emitter, init, denyClient = false, denyServer = false) {
    if (Meteor.isServer && denyServer || Meteor.isClient && denyClient) {
      return;
    }
    
    if (init && helpers.isFunction(init)) {
      init();
    }
    
    this._emitters.push({
      name: name,
      emitter: emitter,
      method: `${this.prefix}_logger_emit_${name}`,
      denyClient: denyClient,
      denyServer: denyServer
    });
    
    if (Meteor.isServer) {
      const method = {};
      method[`${this.prefix}_logger_emit_${name}`] = function (level, message, data, userId) {
        check(level, String);
        check(message, Match.Optional(Match.OneOf(Number, String, null)));
        check(data, Match.Optional(Match.OneOf(String, Object, null)));
        check(userId, Match.Optional(Match.OneOf(String, Number, null)));
        emitter(level, message, data, (userId || this.userId));
      };
      Meteor.methods(method);
    }
  }
  
  /*
   * @memberOf Logger
   * @name info; debug; error; fatal; warn; trace; log; _
   * @param message {String} - Any text message
   * @param data    {Object} - [optional] Any additional info as object
   * @param userId  {String} - [optional] Current user id
   * @summary Methods below is shortcuts for _log() method
   */
  info(message, data, userId) {
    return this._log('INFO', message, data, userId);
  }
  
  debug(message, data, userId) {
    return this._log('DEBUG', message, data, userId);
  }
  
  error(message, data, userId) {
    return this._log('ERROR', message, data, userId);
  }
  
  fatal(message, data, userId) {
    return this._log('FATAL', message, data, userId);
  }
  
  warn(message, data, userId) {
    return this._log('WARN', message, data, userId);
  }
  
  trace(message, data, userId) {
    return this._log('TRACE', message, data, userId);
  }
  
  log(message, data, userId) {
    return this._log('LOG', message, data, userId);
  }
  
  _(message, data, userId) {
    return this._log('LOG', message, data, userId);
  }
  
  /*
   * @memberOf Logger
   * @name antiCircular
   * @param data {Object} - Circular or any other object which needs to be non-circular
   */
  antiCircular(obj) {
    return JSON.parse(JSON.stringify(obj, this._getCircularReplacer()));
  }
  
  /*
   * @memberOf Logger
   * @name getCircularReplacer
   */
  _getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    };
  }
  
  /*
   * @memberOf Logger
   * @name _getStackTrace
   * @summary Prepare stack trace message
   */
  _getStackTrace() {
    let obj = {};
    if (helpers.isFunction(Error.captureStackTrace)) {
      Error.captureStackTrace(obj, this._getStackTrace);
    } else {
      const err = new Error();
      if (err.stack) {
        obj.stack = err.stack;
      } else {
        obj.stack = 'Not available of not supported';
      }
    }
    
    const idx = obj.stack.indexOf('_getStackTrace');
    const idx2 = obj.stack.indexOf('_log');
    if (idx >= 0) {
      obj.stack = obj.stack.substring(obj.stack.indexOf('\n', idx + 1) + 1);
    }
    if (idx2 >= 0) {
      obj.stack = obj.stack.substring(obj.stack.indexOf('\n', idx2 + 1) + 1);
    }
    
    return obj.stack;
  }
}

/*
 * @class LoggerMessage
 * @param data {Object}
 * @summary Construct message object, ready to be thrown and stringified
 */
class LoggerMessage {
  constructor(data) {
    this.data = data.data;
    this.user = data.user;
    this.level = data.level;
    this.error = data.error;
    this.userId = data.userId;
    this.reason = data.reason;
    this.details = data.details;
    this.message = data.message;
    
    this.toString = () => {
      return `[${this.reason}] \nLevel: ${this.level}; \nDetails: ${JSON.stringify(this.data)}; \nUserId: ${this.userId};`;
    };
  }
}

export {Logger, LoggerMessage};

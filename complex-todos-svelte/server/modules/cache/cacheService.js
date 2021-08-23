import {log} from '../../../imports/shared/logger/logger.js';

/**
 * @type {{PERIOD: number}}
 */
const CACHE_CONFIG = {
  PERIOD: 30
};

/**
 * Memory Cache Service
 * @link https://github.com/node-cache/node-cache
 * @locus server
 */
class CacheService
{
  /**
   * @constructor
   * @locus server
   */
  constructor()
  {
    if(Meteor.isClient)
    {
      log.fatal('MemcacheServerService can not be called from client side');
    }
    
    const NodeCache = Npm.require('node-cache');
    
    this.cache = new NodeCache({stdTTL: 0, checkperiod: CACHE_CONFIG.PERIOD});
    this.handles = new Map();
    this.listeners = new Map();
    
    log.debug('Memcache initialized');
  }
  
  /**
   * Returns an array of all keys
   * @locus server
   * @returns {string[]}
   */
  getKeys()
  {
    return this.cache.keys();
  }
  
  /**
   * Returns if provided key exists
   * @locus server
   * @param keyName {string}
   * @returns {boolean}
   */
  hasKey(keyName)
  {
    return this.cache.has(keyName);
  }
  
  /**
   * Counts the keys starting with provided prefix
   * @locus server
   * @param prefix {string}
   * @returns {number}
   */
  countKeysWithPrefix(prefix)
  {
    let keys = this.getKeys();
    let count = 0;
    
    keys.forEach(k =>
    {
      if(k.startsWith(prefix) === true)
      {
        count++;
      }
    });
    
    return count;
  }
  
  /**
   * Sets a cached value
   * @locus server
   * @param key {string}
   * @param value {object}
   * @param expireInSeconds {number} optional
   */
  setValue(key, value, expireInSeconds = 0)
  {
    let found = this.hasKey(key);
    
    let oldValue = this.getValue(key);
    
    this.cache.set(key, value, expireInSeconds);
    
    //
    // Make sure we only fire event when the value actually changes
    //
    
    if(found && oldValue !== value)
    {
      if(this.listeners.has(key))
      {
        let handlers = this.listeners.get(key);
        
        handlers.forEach(handler =>
        {
          try
          {
            handler(key, value);
          }
          catch(e)
          {
          }
        });
      }
    }
  }
  
  /**
   * Sets an auto updated value and returns its value
   * @locus server
   * @param name {string}
   * @param valueFunction {function} Function for calculating value
   * @param updateInterval {number|null} [optional] int ms
   * @returns {object}
   */
  setAutoUpdatedValue(name, valueFunction, updateInterval = 0)
  {
    
    let value = valueFunction();
    
    // Calculate value and save it to our internal array
    this.setValue(name, value);
    
    // Clear interval in case it was called before
    this._clearInterval(name);
    
    // Set a function to update the provided value after interval passes
    if(updateInterval !== 0)
    {
      const handle = Meteor.setInterval(function()
        {
          try
          {
            let newValue = valueFunction();
            memcache.setValue(name, newValue); // DO NOT USE "this" here else NODE throws resolve exception. Use exported memcache instance!
          }
          catch(e)
          {
            log.error(__fn, `Exception setting cached value ${name}: ${e.toString()}`);
          }
        },
        updateInterval);
      
      this.handles.set(name, handle);
    }
    
    return value;
  }
  
  /**
   * Returns a cached value or null
   * @locus server
   * @param name {string}
   * @param defaultValue {object|null}
   * @returns {object|null}
   */
  getValue(name, defaultValue = null)
  {
    if(this.hasKey(name) === false)
    {
      return defaultValue;
    }
    
    return this.cache.get(name);
  }
  
  /**
   * Returns a cached value and removes it from the cache
   * @locus server
   * @param name {string}
   * @param defaultValue {object|null}
   * @returns {*}
   */
  takeValue(name, defaultValue = null)
  {
    if(this.hasKey(name) === false)
    {
      return defaultValue;
    }
    
    let value = this.getValue(name);
    
    this.remove(name);
    
    return value;
  }
  
  /**
   * Clears a cached value (removes it)
   * @locus server
   * @param key {string}
   */
  remove(key)
  {
    // Clear interval first in case it gets called
    if(this.handles.has(key) === true)
    {
      this._clearInterval(key);
    }
    
    // Remove listeners if there is any
    if(this.listeners.has(key) === true)
    {
      this.listeners.delete(key);
    }
    
    // Delete value from the map
    if(this.hasKey(key) === true)
    {
      this.cache.del(key);
    }
  }
  
  /**
   * Internal method for clearing update function
   * @locus server
   * @param name {string}
   * @private
   */
  _clearInterval(name)
  {
    let handle = this.handles.get(name);
    
    Meteor.clearInterval(handle);
    
    this.handles.delete(name);
  }
  
  /**
   * Adds a change listener for the provided key
   * @locus server
   * @param key {string}
   * @param changeHandler {function} Gets the (key, value) pair as it is two parameters
   */
  addListener(key, changeHandler)
  {
    if(this.listeners.has(key) === true)
    {
      let handlers = this.listeners.get(key);
      
      handlers.push(changeHandler);
      
      this.listeners.set(key, handlers);
    }
    else
    {
      this.listeners.set(key, [changeHandler]);
    }
  }
}

// Create a singleton
export const memcache = new CacheService();
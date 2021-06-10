/**
 * This file will log events as described in LogFile.format
 *   on dev: .meteor/local/build/programs/server/static/logs/meteor.log (relative to meteor project directory)
 *   on prod: assets/app/logs/meteor.log (relative to running directory)
 */
import {Logger} from 'meteor/ostrio:logger';
import {LoggerConsole} from 'meteor/ostrio:loggerconsole';
import Meteor from 'meteor/meteor';
import {EJSON} from 'meteor/ejson';
import {bound} from '../functions/bound.js';

const log = new Logger();

let RELEASE_LOG_FILTER = Meteor.Meteor.settings.public.log;

Object.defineProperty(global, '__stack', {
  get()
  {
    let orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack)
    {
      return stack;
    };
    
    let error = new Error();
    
    let errStack = error.stack;
    Error.prepareStackTrace = orig;
    
    return errStack;
  }
});

Object.defineProperty(global, '__fn', {
  get()
  {
    try
    {
      return '@' + __stack[1].getFunctionName();
    }
    catch(e)
    {
      return '__fn(unresolved)';
    }
  }
});

/**
 * @return {string}
 */
const LOG_FORMATTER = function(opts)
{
  let isEmpty = function(obj)
  {
    for(let key in obj)
    {
      if(obj.hasOwnProperty(key))
      {
        return false;
      }
    }
    return true;
  };
  
  let data = opts.data || '';
  
  if(isEmpty(data))
  {
    data = '';
  }
  
  // Default date outputs too much unnecessary log (such as timezone etc). Let's format it.
  let dateTime = `${opts.time.getDate()}/${opts.time.getMonth() + 1}/${opts.time.getFullYear()} - ${opts.time.getHours()}:${opts.time.getMinutes()}:${opts.time.getSeconds()}`;
  
  return `[${opts.level}] - ${dateTime} ${opts.message} ${data}`;
};

let logConsole = new LoggerConsole(log, {
  format(opts)
  {
    return LOG_FORMATTER(opts);
  }
});

const CONSOLE_MODE = {
  ENABLE: true,
  CLIENT: true,
  SERVER: true
};

logConsole.enable({
  enable: CONSOLE_MODE.ENABLE,
  filter: RELEASE_LOG_FILTER,
  client: CONSOLE_MODE.CLIENT, // Set to `false` to avoid log transfer from Client to Server
  server: CONSOLE_MODE.SERVER // Set to `false` to disallow execution on Server
});


if(Meteor.isServer)
{
  process.on('uncaughtException', err =>
  {
    bound(() =>
    {
      log.error('process.on(uncaughtException)', err);
      
      console.log('== uncaughtException written by logger ==');
      console.error(err.stack);
      process.exit(7);
    });
  });
  
  process.on('unhandledRejection', (reason) =>
  {
    bound(() =>
    {
      log.error('process.on(unhandledRejection)', reason.stack || reason);
      
      console.log('== unhandledRejection written by logger ==');
      console.error(reason.stack || reason);
      
      process.exit(7);
    });
  });
}

/**
 *
 * Hook log.error and log.fatal and inject a stack trace into provided log message
 */
let originalLogError = log.error;
let originalLogFatal = log.fatal;

let stackTracePrinter = function(originalFunc, fn, data)
{
  //
  // Create an Error object for retrieving stack trace if we are not already provided with an error object
  //
  
  let error = new Error();
  
  let message = data;
  let stack = error.stack;
  
  if(data instanceof Error)
  {
    //
    // We already have an error object, let's use its message and stack fields
    //
    
    message = data.message;
    stack = data.stack || '';
  }
  else if(data instanceof Object)
  {
    message = EJSON.stringify(data);
  }
  
  originalFunc.apply(log, [fn, `${message} - ${stack}`]);
};

log.error = function(fn, message)
{
  stackTracePrinter(originalLogError, fn, message);
};

log.fatal = function(fn, message)
{
  stackTracePrinter(originalLogFatal, fn, message);
};

/**
 * Hook Window.onError for forwarding exceptions to our logger
 */
if(Meteor.isClient)
{
  /* Store original window.onerror */
  const _GlobalErrorHandler = window.onerror;
  
  window.onerror = function(msg, url, line, colno, error)
  {
    log.error(msg, {file: url, onLine: line, error: error});
    if(_GlobalErrorHandler)
    {
      _GlobalErrorHandler.apply(this, arguments);
    }
  };
}

export {log};
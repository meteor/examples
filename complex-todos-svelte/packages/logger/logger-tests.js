import {_} from 'meteor/underscore';
import {Meteor} from 'meteor/meteor';
import {Logger, LoggerMessage} from 'meteor/ostrio:logger';

const logs = {
  client: [],
  server: [],
  both: [],
  nowhere: [],
  filtered: [],
  TestAdapter: false,
  ServerAdapter: false,
  emitterClient: false,
  BothAdapter: false,
  NowhereAdapter: false
};

const circular = {desc: 'Circular data example'};
circular.circular = circular;

const log = new Logger();
const testEmitter = () => {

};

const emitterServer = (level, message, data, userId) => {
  logs.server.push({level, message, data, userId});
};

const emitterClient = (level, message, data, userId) => {
  logs.client.push({level, message, data, userId});
};

const emitterBoth = (level, message, data, userId) => {
  logs.both.push({level, message, data, userId});
};

const emitterNowhere = (level, message, data, userId) => {
  logs.nowhere.push({level, message, data, userId});
};

const emitterFilter = (level, message, data, userId) => {
  logs.filtered.push({level, message, data, userId});
};

log.add('TestAdapter', testEmitter, () => {
  logs.TestAdapter = true;
});

///////////
log.add('NowhereAdapter', emitterNowhere, () => {
  logs.NowhereAdapter = true;
}, true, true);

log.rule('NowhereAdapter', {
  enable: true,
  filter: ['*'],
  client: false,
  server: false
});

///////////
log.add('FilteredAdapter', emitterFilter);

log.rule('FilteredAdapter', {
  enable: true,
  filter: ['Warn', 'fataL'],
  client: true,
  server: true
});


///////////
log.add('ServerAdapter', emitterServer, () => {
  logs.ServerAdapter = true;
}, true, false);

log.rule('ServerAdapter', {
  enable: true,
  filter: ['*'],
  client: false,
  server: true
});


//////////////////
log.add('ClientAdapter', emitterClient, () => {
  logs.ClientAdapter = true;
}, false, true);

log.rule('ClientAdapter', {
  enable: true,
  filter: ['*'],
  client: true,
  server: false
});


////////////////
log.add('BothAdapter', emitterBoth, () => {
  logs.BothAdapter = true;
}, false, false);

log.rule('BothAdapter', {
  enable: true,
  filter: ['*'],
  client: true,
  server: true
});

Tinytest.add('Logger#init', (test) => {
  test.isTrue(logs.TestAdapter, 'Test adapter init');
  
  if (Meteor.isServer) {
    test.isTrue(logs.ServerAdapter, 'Server only init');
    test.isFalse(logs.ClientAdapter, 'Client Only init');
  } else {
    test.isFalse(logs.ServerAdapter, 'Server only init');
    test.isTrue(logs.ClientAdapter, 'Client Only init');
  }
  
  test.isTrue(logs.BothAdapter, 'Both init');
  test.isFalse(logs.NowhereAdapter, 'Nowhere init');
});

Tinytest.add('LoggerMessage Instance', (test) => {
  test.instanceOf(log.info('This is message "info"', {data: 'Sample data "info"'}, 'userId "info"'), LoggerMessage);
  test.instanceOf(log.debug('This is message "debug"', {data: 'Sample data "debug"'}, 'userId "debug"'), LoggerMessage);
  test.instanceOf(log.error('This is message "error"', {data: 'Sample data "error"'}, 'userId "error"'), LoggerMessage);
  test.instanceOf(log.fatal('This is message "fatal"', {data: 'Sample data "fatal"'}, 'userId "fatal"'), LoggerMessage);
  test.instanceOf(log.warn('This is message "warn"', {data: 'Sample data "warn"'}, 'userId "warn"'), LoggerMessage);
  test.instanceOf(log.trace('This is message "trace"', {data: 'Sample data "trace"'}, 'userId "trace"'), LoggerMessage);
  test.instanceOf(log._('This is message "_"', {data: 'Sample data "_"'}, 'userId "_"'), LoggerMessage);
  test.instanceOf(log.info('This is message "info", with circular data', circular, 'userId "info"'), LoggerMessage);
});

Tinytest.add('LoggerMessage#toString', (test) => {
  logs.both = [];
  logs.client = [];
  logs.server = [];
  logs.nowhere = [];
  logs.filtered = [];
  
  test.equal(log.info('This is message "info"', {data: 'Sample data "info"'}, 'userId "info"').toString(), '[This is message "info"] \nLevel: INFO; \nDetails: {"data":"Sample data \\"info\\""}; \nUserId: userId "info";');
  test.equal(log.debug('This is message "debug"', {data: 'Sample data "debug"'}, 'userId "debug"').toString(), '[This is message "debug"] \nLevel: DEBUG; \nDetails: {"data":"Sample data \\"debug\\""}; \nUserId: userId "debug";');
  test.equal(log.error('This is message "error"', {data: 'Sample data "error"'}, 'userId "error"').toString(), '[This is message "error"] \nLevel: ERROR; \nDetails: {"data":"Sample data \\"error\\""}; \nUserId: userId "error";');
  test.equal(log.fatal('This is message "fatal"', {data: 'Sample data "fatal"'}, 'userId "fatal"').toString(), '[This is message "fatal"] \nLevel: FATAL; \nDetails: {"data":"Sample data \\"fatal\\""}; \nUserId: userId "fatal";');
  test.equal(log.warn('This is message "warn"', {data: 'Sample data "warn"'}, 'userId "warn"').toString(), '[This is message "warn"] \nLevel: WARN; \nDetails: {"data":"Sample data \\"warn\\""}; \nUserId: userId "warn";');
  test.equal(log._('This is message "_"', {data: 'Sample data "_"'}, 'userId "_"').toString(), '[This is message "_"] \nLevel: LOG; \nDetails: {"data":"Sample data \\"_\\""}; \nUserId: userId "_";');
  test.equal(log.info('This is message "info", with circular data', circular, 'userId "info"').toString(), '[This is message "info", with circular data] \nLevel: INFO; \nDetails: {"desc":"Circular data example","circular":"[Circular]"}; \nUserId: userId "info";');
});

Tinytest.add('Logger Client Only', (test) => {
  if (Meteor.isServer) {
    test.equal(logs.client.length, 0);
  } else {
    test.equal(logs.client.length, 7);
  }
});

Tinytest.add('Logger Server Only', (test) => {
  if (Meteor.isServer) {
    test.equal(logs.server.length, 7);
  } else {
    test.equal(logs.server.length, 0);
  }
});

Tinytest.add('Logger Isomorphic', (test) => {
  test.equal(logs.both.length, 7);
});

Tinytest.add('Logger Nowhere', (test) => {
  test.equal(logs.nowhere.length, 0);
});

Tinytest.add('Filters', (test) => {
  test.equal(logs.filtered.length, 2);
});

Tinytest.add('Throw', (test) => {
  try {
    throw log.fatal('This is message "fatal"', {data: 'Sample data "fatal"'}, 'userId "fatal"');
  } catch (e) {
    test.instanceOf(e, LoggerMessage);
    test.equal(e.level, 'FATAL');
    test.equal(e.toString(), '[This is message "fatal"] \nLevel: FATAL; \nDetails: {"data":"Sample data \\"fatal\\""}; \nUserId: userId "fatal";');
  }
});

Tinytest.add('Log a Number', (test) => {
  test.instanceOf(log.info(10, {data: 10}, 10), LoggerMessage);
  test.instanceOf(log.debug(20, {data: 20}, 20), LoggerMessage);
  test.instanceOf(log.error(30, {data: 30}, 30), LoggerMessage);
  test.instanceOf(log.fatal(40, {data: 40}, 40), LoggerMessage);
  test.instanceOf(log.warn(50, {data: 50}, 50), LoggerMessage);
  test.instanceOf(log.trace(60, {data: 60}, 60), LoggerMessage);
  test.instanceOf(log._(70, {data: 70}, 70), LoggerMessage);
});

Tinytest.add('Trace', (test) => {
  test.isTrue(_.has(log.trace(60, {data: 60}, 60).details, 'stackTrace'));
  test.isTrue(_.has(log.trace(60, {data: 60}, 60).data, 'stackTrace'));
});

Tinytest.add('Logger#antiCircular', (test) => {
  test.equal(Logger.prototype.antiCircular(circular), {'desc': 'Circular data example', 'circular': '[Circular]'});
  test.equal(circular.circular.desc, 'Circular data example');
});

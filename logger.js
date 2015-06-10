var winston = require('winston');

require('winston-mongodb').MongoDB; 

var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config = require('./server/config')[env];

// adapted from http://tostring.it/2014/06/23/advanced-logging-with-nodejs/
winston.emitErrs = true;

if(env == 'production') {
  //if prod, log to file and console
  var logger = new winston.Logger({
    transports: [
      new winston.transports.MongoDB({
        level: 'info'
        , db: config.db
        , capped: true
        , handleExceptions: true
        , collection: 'logs'
      })
      // NOTE: cannot get this to work on docker instance. it will not write to the linked docker volume for some reason. trying mongodb instead.
      // TODO: figure this out. logging to file would be more useful than to mongo
      // new winston.transports.File({
      //   level: 'info'
      //   , filename: './logs/all-logs.log'
      //   , handleExceptions: true
      //   , json: true
      //   , maxSize: 5242880 //5mb
      //   , maxFiles: 5
      //   , colorize: false
      // })

      , new winston.transports.Console({
        level: 'debug'
        , handleExceptions: true
        , json: false
        , colorize: true
      })
    ]
    , exitOnError: false
  });
} else {
  //else if dev, just log to console
  var logger = new winston.Logger({
    transports: [
      new winston.transports.Console({
        level: 'debug'
        , handleExceptions: true
        , json: false
        , colorize: true
      })
    ]
    , exitOnError: false
  });
}

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};

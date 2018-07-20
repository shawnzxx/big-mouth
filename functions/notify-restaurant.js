'use strict';

const co = require('co');
const getRecords = require('../lib/kinesis').getRecords;
const notify = require('../lib/notify');
const retry = require('../lib/retry');

module.exports.handler = co.wrap(function* (event, context, cb) {
    let records = getRecords(event);
    let orderPlaced = records.filter(r => r.eventType === 'order_placed');
  
    for (let order of orderPlaced) {
      try {
        yield notify.restaurantOfOrder(order);
        cb(null, "all done");
      } catch (err) {
          console.log(`notify-restaurant error log: ${err}`);
          yield retry.restaurantNotification(order);
          cb(err);
      }
    }
  });

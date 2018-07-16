'use strict';

function parsePayload(record){
    //https://www.w3schools.com/nodejs/ref_buffer.asp
    let json = new Buffer.from(record.kinesis.data, 'base64').toString('utf8');
    return JSON.parse(json);
}

function getRecords(event){
    console.log(`get kensis event string: ${event.toString()}`);
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
    return event.Records.map(parsePayload);
}

module.exports = {
    getRecords
};
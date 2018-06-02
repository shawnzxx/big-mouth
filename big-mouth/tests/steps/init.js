'use strict';

/**
 * Module dependencies.
 */

const co = require('co');
const Promise = require('bluebird');
const awscred = Promise.promisifyAll(require('awscred'));

let initialized = false;

let init = co.wrap(function* () {
    if(initialized){
        return;
    }

    process.env.restaurants_api = "https://d8rqdddzxj.execute-api.us-east-1.amazonaws.com/dev/restaurants";
    process.env.restaurants_table = "restaurants";
    process.env.AWS_REGION = "us-east-1";
    process.env.cognito_user_pool_id = "dummy_cognito_user_pool_id";
    process.env.cognito_client_id = "dummy_cognito_client_id";

    let cred = (yield awscred.loadAsync()).credentials;

    process.env.AWS_ACCESS_KEY_ID = cred.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = cred.secretAccessKey;

    initialized = true;
});

module.exports.init = init;
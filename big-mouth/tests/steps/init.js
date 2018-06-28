'use strict';

/**
 * Module dependencies.
 */

const co = require('co');
const Promise = require('bluebird');

let initialized = false;

let init = co.wrap(function* () {
    if(initialized){
        return;
    }

    process.env.restaurants_api = "https://d8rqdddzxj.execute-api.us-east-1.amazonaws.com/dev/restaurants";
    process.env.restaurants_table = "restaurants";
    process.env.AWS_REGION = "us-east-1";
    process.env.cognito_client_id = "4bhgqbem4f6p8leiq4fmnals1m";
    process.env.cognito_user_pool_id = "us-east-1_BXJNx0zbs";
    process.env.cognito_server_client_id = '6l978fn8f91ajhht4of78mfjl4';

    initialized = true;
});

module.exports.init = init;
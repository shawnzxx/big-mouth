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
    process.env.cognito_client_id = "4bhgqbem4f6p8leiq4fmnals1m";
    process.env.cognito_user_pool_id = "us-east-1_BXJNx0zbs";
    process.env.cognito_server_client_id = '6l978fn8f91ajhht4of78mfjl4';

    if(!process.env.AWS_ACCESS_KEY_ID){
        let cred = (yield awscred.loadAsync()).credentials;
        console.log(`AWS credential: ${JSON.stringify(cred)}`)
        // https://docs.amazonaws.cn/en_us/cli/latest/userguide/cli-environment.html
        process.env.AWS_ACCESS_KEY_ID = cred.accessKeyId;
        process.env.AWS_SECRET_ACCESS_KEY = cred.secretAccessKey;
        // 1: http call need to use Temporary Security Credentials, so all acceptance-test need token value, but not for integration-test
        // 2: for local test awscred will retrieve credential from local aws -> config file, for code deploy process will get credential from container's Task Role 
        // https://www.terraform.io/docs/providers/aws/index.html find title [ECS and CodeBuild Task Roles]
        console.log(`AWS SessionToken from init - [${cred.sessionToken}]`)  // ES6 template string format
        if(cred.sessionToken){
            process.env.AWS_SESSION_TOKEN = cred.sessionToken;
        }
    }
    
    initialized = true;
});

module.exports.init = init;
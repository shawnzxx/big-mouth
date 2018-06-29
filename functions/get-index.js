'use strict';

const co = require("co");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const Mustache = require('mustache');
const http = require('superagent-promise')(require('superagent'), Promise);
const aws4 = require('aws4')
const URL = require('url');
const awscred = Promise.promisifyAll(require('awscred'));

const awsRegion = process.env.AWS_REGION;
const cognitoUserPoolId = process.env.cognito_user_pool_id;
const cognitoClientId = process.env.cognito_client_id;

const restaurantsApiRoot = process.env.restaurants_api;
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

let html;

//ES6 Generators: https://thejsguy.com/2016/10/15/a-practical-introduction-to-es6-generator-functions.html
//https://stackoverflow.com/questions/26019628/wrapping-co-and-co-mysql-from-within-a-generator-function-and-yielding-out-of-t
//http://2ality.com/2015/03/es6-generators.html
function* loadHtml() {
    if (!html) {
        html = yield fs.readFileAsync('static/index.html', 'utf-8');
    }
    return html;
}


function* getRestaurants() {
    let url = URL.parse(restaurantsApiRoot);
    let opts = {
        host: url.hostname,
        path: url.pathname
    };

    if(!process.env.AWS_ACCESS_KEY_ID){
        let cred = (yield awscred.loadAsync()).credentials;
        console.log(cred)
        process.env.AWS_ACCESS_KEY_ID = cred.accessKeyId;
        process.env.AWS_SECRET_ACCESS_KEY = cred.secretAccessKey;

        console.log(`AWS SessionToken from get-index - [${cred.sessionToken}]`)
        if(cred.sessionToken){
            process.env.AWS_SESSION_TOKEN = cred.sessionToken;
        }
    }

    aws4.sign(opts); // assumes AWS credentials are available in process.env

    let httpReq = http
        .get(restaurantsApiRoot)
        .set('Host', opts.headers['Host'])
        .set('X-Amz-Date', opts.headers['X-Amz-Date'])
        .set('Authorization', opts.headers['Authorization']);

    if(opts.headers['X-Amz-Security-Token']){
        httpReq.set('X-Amz-Security-Token', opts.headers['X-Amz-Security-Token']);
    }

    return (yield httpReq).body
}

module.exports.handler = co.wrap(function* (event, context, callback) {
    let template = yield loadHtml();  //wait for the promises to resolve before continuing
    let restaurants = yield getRestaurants();
    let dayOfWeek = days[new Date().getDay()];

    let view = {
        dayOfWeek,
        restaurants,
        awsRegion,
        cognitoUserPoolId,
        cognitoClientId,
        searchUrl: `${restaurantsApiRoot}/search`
    };
    let html = Mustache.render(template, view);

    const
    response = {
        statusCode: 200,
        body: html,
        headers: {
            'content-type': 'text/html; charset=UTF-8'
        }
    };

    callback(null, response);
});

'use strict';

/**
 * Module dependencies.
 */
const APP_ROOT = '../../';

const _ = require('lodash');
const co = require("co");
const Promise = require("bluebird");
const http = require('superagent-promise')(require('superagent'), Promise);
const aws4 = require('aws4');
const URL = require('url');
const mode = process.env.TEST_MODE;

let respondFrom = function (httpRes) {
    //superagent will return all carmel case into lower case like headers.content-type
    let contentType = _.get(httpRes, 'headers.content-type', 'application/json');
    console.log(`http response ${JSON.stringify(httpRes.headers)}`);    // ES6 template string format
    let body =
        contentType === 'application/json'
            ? httpRes.body
            : httpRes.text;

    return {
        statusCode: httpRes.status,
        body: body,
        headers: httpRes.headers
    };
};

let signHttpRequest = (url, httpReq) => {
    let urlData = URL.parse(url);
    let opts = {
        host: urlData.hostname,
        path: urlData.pathname
    };

    aws4.sign(opts); // assumes AWS credentials are available in process.env, aws4 sign will use it


    httpReq
        .set('Host', opts.headers['Host'])
        .set('X-Amz-Date', opts.headers['X-Amz-Date'])
        .set('Authorization', opts.headers['Authorization']);

    //acceptance-test need to invoke api through http, so we need to add temporary security credential to Signing AWS Requests process
    //temporary security credentials inside X-Amz-Security-Token
    //https://docs.aws.amazon.com/general/latest/gr/sigv4-add-signature-to-request.html -> search for temporary security credentials
    if (opts.headers['X-Amz-Security-Token']) {
        httpReq.set('X-Amz-Security-Token', opts.headers['X-Amz-Security-Token']);
    }
};

let viaHttp = co.wrap(function* (relPath, method, opts) {
    let root = process.env.TEST_ROOT;
    let url = `${root}/${relPath}`;
    console.log(`invoking via HTTP ${method} ${url}`);
    try {
        let httpReq = http(method, url);

        let body = _.get(opts, "body");
        if (body) {
            httpReq.send(body);
        }

        if (_.get(opts, "iam_auth", false) === true) {
            signHttpRequest(url, httpReq);
        }

        //test lodash function result
        //https://codepen.io/travist/full/jrBjBz/
        // let user = {firstname: 'Zhang', lastname: 'Xiaoxiao', idToken: '12345'};
        // let theme = 'cartoon';
        // let body = JSON.stringify({ theme });
        // let auth = user.idToken;
        // let opts = { body, auth };
        // let bodyOut = _.get(opts, "body");
        // let authHeaderOut = _.get(opts, 'auth');
        // result = {theme };

        let authHeader = _.get(opts, 'auth');
        if(authHeader){
            httpReq.set('Authorization', authHeader);
        }

        let res = yield httpReq;
        return respondFrom(res);
    } catch (err) {
        if (err.status) {
            return {
                statusCode: err.status,
                headers: err.response.headers
            };
        } else {
            throw err;
        }
    }
});

//check how to How to set Environment variables within package.json
//https://stackoverflow.com/questions/25112510/how-to-set-environment-variables-from-within-package-json-node-js
let viaHandler = function (event, functionName) {
    let handler = require(`${APP_ROOT}/functions/${functionName}`).handler;
    console.log(`invoking via handler function ${functionName}`);

    return new Promise((resolve, reject) => {
        let context = {};
        let callback = function (err, response) {
            if(err){
                reject(err);
            } else{
                let contentType = _.get(response, 'headers.content-type', 'application/json');
                if(response.body && contentType === 'application/json'){
                    response.body = JSON.parse(response.body);
                }
                resolve(response);
            }
        };

        handler(event, context, callback);
    });
};

let we_invoke_get_index = co.wrap(function* () {
    let res =
        mode === 'handler'
            ? yield viaHandler({}, 'get-index')
            : yield viaHttp('', 'GET');
    return res;
});


let we_invoke_get_restaurants = co.wrap(function* () {
    let res =
        mode === 'handler'
            ? yield viaHandler({}, 'get-restaurants')
            : yield viaHttp('restaurants', 'GET', {iam_auth: true});
    return res;
});

let we_invoke_search_restaurants = co.wrap(function* (user, theme) {
    let body = JSON.stringify({ theme });
    let auth = user.idToken;

    let res =
        mode === 'handler'
            ? viaHandler({ body }, 'search-restaurants')
            : viaHttp('restaurants/search', 'POST', { body, auth });

    return res;
});
// let we_invoke_get_index = () => viaHandler({}, 'get-index');
// let we_invoke_get_restaurants = () => viaHandler({}, 'get-restaurants');
//
// let we_invoke_search_restaurants = (theme) => {
//     let event = {
//         body: JSON.stringify({theme: theme})
//     };
//     return viaHandler(event, 'search-restaurants');
// };


module.exports = {
    we_invoke_get_index,
    we_invoke_get_restaurants,
    we_invoke_search_restaurants
};
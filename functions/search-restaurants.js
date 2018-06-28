'use strict';

/**
 * Module dependencies.
 */

const co = require('co');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const defaultTotalRestaurants = process.env.defaultTotalRestaurants || 8;
const tableName = process.env.restaurants_table;

function* getRestaurantsByTheme(theme, count) {
    let req = {
        TableName: tableName,
        Limit: count,
        FilterExpression: "contains(themes, :theme)",
        ExpressionAttributeValues: {":theme": theme}
    };

    let resp = yield dynamodb.scan(req).promise();
    return resp.Items;
}

module.exports.handler = co.wrap(function* (event, context, cb) {
    let req = JSON.parse(event.body);
    let restaurants = yield getRestaurantsByTheme(req.theme, defaultTotalRestaurants);
    let response = {
        statusCode: 200,
        body: JSON.stringify(restaurants)
    };
    cb(null, response);
});
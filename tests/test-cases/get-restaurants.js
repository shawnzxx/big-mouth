'use strict';

/**
 * Module dependencies.
 */

const co = require('co');
const expect = require('chai').expect;
const init = require('../steps/init');
const when = require('../steps/when');

describe('When we invoke the GET / restaurants endpoint', co.wrap(function* () {
    before(co.wrap(function* () {
        yield init.init();
    }));

    it('should return an array of 8 restaurants and each item have name and image properties', co.wrap(function* () {
        let res = yield when.we_invoke_get_restaurants();

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.lengthOf(8);

        for (let restaurant of res.body){
            expect(restaurant).to.have.property('name');
            expect(restaurant).to.have.property('image');
        }
    }));
}));
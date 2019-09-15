'use strict';

const request = require('request-promise');
const converter = require('rel-to-abs');
const fs = require('fs');
const index = fs.readFileSync('index.html', 'utf8');
const ResponseBuilder = require('./app/ResponseBuilder');

module.exports = app => {



    app.all('/*', (req, res) => {
        const responseBuilder = new ResponseBuilder(res);

        const requestedUrl = req.url.slice(1);
        const corsBaseUrl = '//' + req.get('host');

        console.info(req.protocol + '://' + req.get('host') + req.url);

        if (requestedUrl == '') {
            res.send(index);
            return;
        }

        var request_headers = {
            'authorization': req.headers['authorization'],
            'content-type': req.headers['content-type'],
            'user-agent': req.headers['user-agent']
        };

        request({
            method: req.method,
            uri: requestedUrl,
            resolveWithFullResponse: true,
            headers: request_headers,
            body: req.body,
            json: true
        })
            .then(originResponse => {
                responseBuilder
                    .addHeaderByKeyValue('Access-Control-Allow-Origin', '*')
                    .addHeaderByKeyValue('Access-Control-Allow-Credentials', false)
                    .addHeaderByKeyValue('Access-Control-Allow-Headers', 'Content-Type')
                    .addHeaderByKeyValue('X-Proxied-By', 'cors-container')
                    .build(originResponse.headers);
                if (req.headers['rewrite-urls']) {
                    res.send(
                        converter
                            .convert(originResponse.body, requestedUrl)
                            .replace(requestedUrl, corsBaseUrl + '/' + requestedUrl)
                    );
                } else {
                    res.send(originResponse.body);
                }
            })
            .catch(originResponse => {
                responseBuilder
                    .addHeaderByKeyValue('Access-Control-Allow-Origin', '*')
                    .addHeaderByKeyValue('Access-Control-Allow-Credentials', false)
                    .addHeaderByKeyValue('Access-Control-Allow-Headers', 'Content-Type')
                    .addHeaderByKeyValue('X-Proxied-By', 'cors-containermeh')
                    .build(originResponse.headers);

                res.status(originResponse.statusCode || 500);

                return res.send(originResponse.message);
            });
    });
};

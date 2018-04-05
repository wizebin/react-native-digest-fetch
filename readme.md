## Description

This package implements digest authentication for react native using the fetch library

Digest fetch takes the same parameters as whatwg/fetch, with the addition of two parameters: `username` and `password`.

If the server does not respond with a `www-authenticate` header this function will act exactly like fetch typically does.

## Install

`npm install --save react-native-digest-fetch`

## Usage

    import fetch from 'react-native-digest-fetch';

`...`

    digestFetch('http://api.test.com/endpoint/', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'custom-header': 'anythingyouwant',
      },
      body: JSON.stringify({
        hello: 'world',
      }),
      username: 'DIGEST_AUTH_USERNAME',
      password: 'DIGEST_AUTH_PASSWORD',
    });


## Advanced Usage

If you would like to use your own http interaction library, and just need the Digest header value, you can import `getDigestHeaderValue` like so:

    import { getDigestHeaderValue } from 'react-native-digest-fetch';

and use it like so

    getDigestHeaderValue(serverHeaders['www-authenticate'], { url, method, headers, username, password });

## Web usage

This library has been tested on react-native and vanilla node, but has not been tested on a front-end node project.

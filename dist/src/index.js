'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.setNextNonceId = setNextNonceId;
exports.getNextNonceId = getNextNonceId;
exports.omitNullValues = omitNullValues;
exports.quoteIfRelevant = quoteIfRelevant;
exports.getDigestHeaderValue = getDigestHeaderValue;
exports.default = fetchWithDigest;

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _cryptoJs = require('crypto-js');

var _cryptoJs2 = _interopRequireDefault(_cryptoJs);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// If the user's environment already includes fetch, we want to use it
if (typeof window !== 'undefined' && typeof window.fetch === 'undefined') {
  window.fetch = require('node-fetch');
}
if (typeof global !== 'undefined' && typeof global.fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

/**
 * Pass the server's www-authenticate header
 * @param {*} digestChallenge
 */
function getDigestChallengeParts(digestChallenge) {
  var prefix = 'Digest ';
  var challenge = digestChallenge.substr(digestChallenge.indexOf(prefix) + prefix.length);
  var challengeArray = challenge.split(',');

  return challengeArray.reduce(function (result, challengeItem) {
    var splitPart = challengeItem.match(/^\s*?([a-zA-Z0-0]+)=("?(.*)"?|MD5|MD5-sess|token|TRUE|FALSE)\s*?$/);

    if (splitPart.length > 2) {
      result[splitPart[1]] = splitPart[2].replace(/\"/g, '');
    }

    return result;
  }, {});
}

var globalNonceId = 0;
function setNextNonceId(nextId) {
  globalNonceId = nextId;
}

/**
 * Incremented nonce used in responses to server challenges
 */
function getNextNonceId() {
  globalNonceId = ((globalNonceId || 0) + 1) % 100000000;
  return ('' + globalNonceId).padStart(8, '0');
}

function omitNullValues(data) {
  return _underscore2.default.keys(data).reduce(function (result, key) {
    if (data[key] !== null) result[key] = data[key];
    return result;
  }, {});
}

/**
 * Both the nc and key parameters are expected to be sent without quotes
 * @param {*} object
 * @param {*} key
 */
function quoteIfRelevant(object, key) {
  return key === 'nc' || key === 'qop' ? '' + object[key] : '"' + object[key] + '"';
}

/**
 * Get the authorization header value `Authorization: Digest XXXXX`, we want XXXXX
 * @param {*} digestChallenge
 * @param {*} param1
 */
function getDigestHeaderValue(digestChallenge, _ref) {
  var url = _ref.url,
      method = _ref.method,
      headers = _ref.headers,
      username = _ref.username,
      password = _ref.password;

  var parsed = _url2.default.parse(url);
  var path = parsed.path;
  var challengeParts = getDigestChallengeParts(digestChallenge);

  var authHash = _cryptoJs2.default.MD5([username, challengeParts.realm, password].join(':'));
  var pathHash = _cryptoJs2.default.MD5([method, path].join(':'));

  var cnonce = null;
  var nc = null;
  if (typeof challengeParts.qop === 'string') {
    cnonce = _cryptoJs2.default.MD5(Math.random().toString(36)).toString(_cryptoJs2.default.enc.Hex).substr(0, 8);
    nc = getNextNonceId();
  }

  var responseParams = [authHash.toString(_cryptoJs2.default.enc.Hex), challengeParts.nonce].concat(cnonce ? [nc, cnonce] : []).concat([challengeParts.qop, pathHash.toString(_cryptoJs2.default.enc.Hex)]);

  var authParams = omitNullValues(_extends({}, _underscore2.default.pick(challengeParts, ['realm', 'nonce', 'opaque', 'qop']), {
    username: username,
    uri: path,
    algorithm: 'MD5',
    response: _cryptoJs2.default.MD5(responseParams.join(':')).toString(_cryptoJs2.default.enc.Hex),
    nc: nc,
    cnonce: cnonce
  }));

  var paramArray = _underscore2.default.keys(authParams).reduce(function (result, key) {
    if (typeof authParams[key] !== 'function') {
      result.push(key + '=' + quoteIfRelevant(authParams, key));
    }

    return result;
  }, []);

  return paramArray.join(',');
}

/**
 * Exact same parameters as fetch
 * @param {string} url
 * @param {object} parameters
 */
function fetchWithDigest(url, parameters) {
  var headers = parameters.headers,
      method = parameters.method,
      body = parameters.body,
      username = parameters.username,
      password = parameters.password;

  return fetch(url, _extends({}, parameters)).then(function (initialResults) {
    if (initialResults && initialResults.headers && initialResults.headers.get('www-authenticate')) {
      var digestHeader = getDigestHeaderValue(initialResults.headers.get('www-authenticate'), { url: url, method: method, headers: headers, username: username, password: password });
      return fetch(url, _extends({}, parameters, { headers: _extends({}, headers, { Authorization: 'Digest ' + digestHeader }) }));
    }

    return initialResults;
  });
}
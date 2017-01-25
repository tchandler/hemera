'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _bloomrun = require('bloomrun');

var _bloomrun2 = _interopRequireDefault(_bloomrun);

var _errio = require('errio');

var _errio2 = _interopRequireDefault(_errio);

var _hoek = require('hoek');

var _hoek2 = _interopRequireDefault(_hoek);

var _heavy = require('heavy');

var _heavy2 = _interopRequireDefault(_heavy);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _errors = require('./errors');

var _errors2 = _interopRequireDefault(_errors);

var _constants = require('./constants');

var _constants2 = _interopRequireDefault(_constants);

var _ext = require('./ext');

var _ext2 = _interopRequireDefault(_ext);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

var _extensions = require('./extensions');

var _extensions2 = _interopRequireDefault(_extensions);

var _encoder = require('./encoder');

var _encoder2 = _interopRequireDefault(_encoder);

var _decoder = require('./decoder');

var _decoder2 = _interopRequireDefault(_decoder);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * Module Dependencies
 */

// config
var defaultConfig = {
  timeout: 2000,
  debug: false,
  crashOnFatal: true,
  logLevel: 'silent',
  load: {
    sampleInterval: 0
  }
};

/**
 * @class Hemera
 */

var Hemera = function (_EventEmitter) {
  _inherits(Hemera, _EventEmitter);

  function Hemera(transport, params) {
    _classCallCheck(this, Hemera);

    var _this = _possibleConstructorReturn(this, (Hemera.__proto__ || Object.getPrototypeOf(Hemera)).call(this));

    _this._config = _hoek2.default.applyToDefaults(defaultConfig, params || {});
    _this._catalog = (0, _bloomrun2.default)();
    _this._heavy = new _heavy2.default(_this._config.load);
    _this._transport = transport;
    _this._topics = {};
    _this._exposition = {};

    // special variables for new execution context
    _this.context$ = {};
    _this.meta$ = {};
    _this.delegate$ = {};
    _this.plugin$ = {
      options: {
        payloadValidator: ''
      },
      attributes: {
        name: 'core'
      }
    };
    _this.trace$ = {};
    _this.request$ = {
      duration: 0,
      parentId: '',
      timestamp: 0,
      type: 'request',
      id: ''
    };

    _this._plugins = {
      core: _this.plugin$.attributes
    };

    _this._encoder = {
      encode: _encoder2.default.encode
    };
    _this._decoder = {
      decode: _decoder2.default.decode
    };

    // define extension points
    _this._extensions = {
      onClientPreRequest: new _ext2.default('onClientPreRequest'),
      onClientPostRequest: new _ext2.default('onClientPostRequest'),
      onServerPreHandler: new _ext2.default('onServerPreHandler'),
      onServerPreRequest: new _ext2.default('onServerPreRequest'),
      onServerPreResponse: new _ext2.default('onServerPreResponse')
    };

    _this._heavy.start();

    /**
     * Will be executed before the client request is executed.
     */
    _this._extensions.onClientPreRequest.addRange(_extensions2.default.onClientPreRequest);

    /**
     * Will be executed after the client received and decoded the request.
     */
    _this._extensions.onClientPostRequest.addRange(_extensions2.default.onClientPostRequest);

    /**
     * Will be executed before the server received the request.
     */
    _this._extensions.onServerPreRequest.addRange(_extensions2.default.onServerPreRequest);

    /**
     * Will be executed before the server action is executed.
     */
    _this._extensions.onServerPreHandler.addRange(_extensions2.default.onServerPreHandler);

    /**
     * Will be executed before the server reply the response and build the message.
     */
    _this._extensions.onServerPreResponse.addRange(_extensions2.default.onServerPreResponse);

    _this.log = _this._config.logger || new _logger2.default({
      level: _this._config.logLevel
    });
    return _this;
  }

  /**
   * @readonly
   *
   * @memberOf Hemera
   */


  _createClass(Hemera, [{
    key: 'expose',


    /**
     *
     *
     * @param {string} key
     * @param {mixed} object
     *
     * @memberOf Hemera
     */
    value: function expose(key, object) {

      var pluginName = this.plugin$.attributes.name;

      if (!this._exposition[pluginName]) {

        this._exposition[pluginName] = {};
        this._exposition[pluginName][key] = object;
      } else {

        this._exposition[pluginName][key] = object;
      }
    }

    /**
     * @readonly
     *
     * @memberOf Hemera
     */

  }, {
    key: 'ext',

    /**
     *
     *
     * @param {any} type
     * @param {any} handler
     *
     * @memberOf Hemera
     */
    value: function ext(type, handler) {

      if (!this._extensions[type]) {
        var error = new _errors2.default.HemeraError(_constants2.default.INVALID_EXTENSION_TYPE, {
          type
        });
        this.log.error(error);
        throw error;
      }

      this._extensions[type].add(handler);
    }
    /**
     * @param {any} plugin
     *
     * @memberOf Hemera
     */

  }, {
    key: 'use',
    value: function use(params) {

      if (this._plugins[params.attributes.name]) {
        var error = new _errors2.default.HemeraError(_constants2.default.PLUGIN_ALREADY_IN_USE, {
          plugin: params.attributes.name
        });
        this.log.error(error);
        throw error;
      }

      // create new execution context
      var ctx = this.createContext();
      ctx.plugin$ = {};
      ctx.plugin$.attributes = params.attributes || {};
      ctx.plugin$.attributes.dependencies = params.attributes.dependencies || [];
      ctx.plugin$.options = params.options || {};
      ctx.plugin$.options.payloadValidator = params.options.payloadValidator || '';

      params.plugin.call(ctx, params.options);

      this.log.info(params.attributes.name, _constants2.default.PLUGIN_ADDED);
      this._plugins[params.attributes.name] = ctx.plugin$.attributes;
    }

    /**
     *
     *
     * @param {any} options
     *
     * @memberOf Hemera
     */

  }, {
    key: 'setOption',
    value: function setOption(key, value) {

      this.plugin$.options[key] = value;
    }

    /**
     *
     *
     *
     * @memberOf Hemera
     */

  }, {
    key: 'setConfig',
    value: function setConfig(key, value) {

      this._config[key] = value;
    }

    /**
     * @memberOf Hemera
     */

  }, {
    key: 'fatal',
    value: function fatal() {

      this.close();

      process.exit(1);
    }

    /**
     * @param {any} cb
     *
     * @memberOf Hemera
     */

  }, {
    key: 'ready',
    value: function ready(cb) {
      var _this2 = this;

      this._transport.on('connect', function () {

        _this2.log.info(_constants2.default.TRANSPORT_CONNECTED);
        cb.call(_this2);
      });
    }

    /**
     *
     * @returns
     *
     * @memberOf Hemera
     */

  }, {
    key: 'timeout',
    value: function timeout() {

      return this.transport.timeout.apply(this.transport, arguments);
    }
    /**
     * Add response
     *
     * @returns
     *
     * @memberOf Hemera
     */

  }, {
    key: 'send',
    value: function send() {

      return this.transport.publish.apply(this.transport, arguments);
    }

    /**
     * Act
     *
     * @returns
     *
     * @memberOf Hemera
     */

  }, {
    key: 'sendRequest',
    value: function sendRequest() {

      return this.transport.request.apply(this.transport, arguments);
    }

    /**
     *
     *
     *
     * @memberOf Hemera
     */

  }, {
    key: '_buildMessage',
    value: function _buildMessage() {

      var result = this._response;

      var message = {
        meta: this.meta$ || {},
        trace: this.trace$ || {},
        request: this.request$,
        result: result instanceof Error ? null : result,
        error: result instanceof Error ? _errio2.default.toObject(result) : null
      };

      var endTime = _util2.default.nowHrTime();
      message.request.duration = endTime - message.request.timestamp;
      message.trace.duration = endTime - message.request.timestamp;

      var m = this._encoder.encode.call(this, message);

      // attach encoding issues
      if (m.error) {

        message.error = _errio2.default.toObject(m.error);
        message.result = null;
      }

      this._message = m.value;
    }
    /**
     *
     *
     *
     * @memberOf Hemera
     */

  }, {
    key: 'finish',
    value: function finish() {

      var self = this;

      self._extensions.onServerPreResponse.invoke(self, function (err) {

        // check if an error was already catched
        if (self._response instanceof Error) {

          self.log.error(self._response);
          self._buildMessage();
        }
        // check for an extension error
        else if (err) {

            var error = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);
            self._response = error;
            self.log.error(self._response);
            self._buildMessage();
          } else {

            self._buildMessage();
          }

        // indicates that an error occurs and that the program should exit
        if (self._shouldCrash) {

          if (self._replyTo) {

            // send error back to callee
            return self.send(self._replyTo, self._message, function () {

              // let it crash
              if (self._config.crashOnFatal) {

                self.fatal();
              }
            });
          } else if (self._config.crashOnFatal) {

            return self.fatal();
          }
        }

        if (self._replyTo) {

          return this.send(this._replyTo, self._message);
        }
      });
    }

    /**
     * @param {any} topic
     * @returns
     *
     * @memberOf Hemera
     */

  }, {
    key: 'subscribe',
    value: function subscribe(topic, subToMany, maxMessages) {
      var _this3 = this;

      var self = this;

      // avoid duplicate subscribers of the emit stream
      // we use one subscriber per topic
      if (self._topics[topic]) {
        return;
      }

      var handler = function handler(request, replyTo) {

        // create new execution context
        var ctx = _this3.createContext();
        ctx._shouldCrash = false;
        ctx._replyTo = replyTo;
        ctx._request = request;
        ctx._pattern = {};
        ctx._actMeta = {};

        //Extension point 'onServerPreRequest'
        self._extensions.onServerPreRequest.invoke(ctx, function (err) {

          var self = this;

          if (err) {

            var error = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);

            self.log.error(error);
            self._response = error;

            return self.finish();
          }

          var requestType = self._request.value.request.type;
          self._pattern = self._request.value.pattern;
          self._actMeta = self._catalog.lookup(self._pattern);

          // check if a handler is registered with this pattern
          if (self._actMeta) {

            self._extensions.onServerPreHandler.invoke(ctx, function (err) {

              if (err) {

                self._response = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);

                self.log.error(self._response);

                return self.finish();
              }

              try {

                var action = self._actMeta.action.bind(self);

                // if request type is 'pubsub' we dont have to answer
                if (requestType === 'pubsub') {

                  action(self._request.value.pattern);

                  return self.finish();
                }

                // call action
                action(self._request.value.pattern, function (err, resp) {

                  if (err) {

                    self._response = new _errors2.default.BusinessError(_constants2.default.IMPLEMENTATION_ERROR, {
                      pattern: self._pattern
                    }).causedBy(err);

                    return self.finish();
                  }

                  self._response = resp;

                  self.finish();
                });
              } catch (err) {

                self._response = new _errors2.default.ImplementationError(_constants2.default.IMPLEMENTATION_ERROR, {
                  pattern: self._pattern
                }).causedBy(err);

                self._shouldCrash = true;

                self.finish();
              }
            });
          } else {

            self.log.info({
              topic
            }, _constants2.default.PATTERN_NOT_FOUND);

            self._response = new _errors2.default.PatternNotFound(_constants2.default.PATTERN_NOT_FOUND, {
              pattern: self._pattern
            });

            // send error back to callee
            self.finish();
          }
        });
      };

      // standard pubsub with optional max proceed messages
      if (subToMany) {

        self.transport.subscribe(topic, {
          max: maxMessages
        }, handler);
      } else {

        // queue group names allow load balancing of services
        self.transport.subscribe(topic, {
          'queue': 'queue.' + topic,
          max: maxMessages
        }, handler);
      }

      this._topics[topic] = true;
    }

    /**
     * @param {any} pattern
     * @param {any} cb
     *
     * @memberOf Hemera
     */

  }, {
    key: 'add',
    value: function add(pattern, cb) {

      var hasCallback = _lodash2.default.isFunction(cb);

      // topic is needed to subscribe on a subject in NATS
      if (!pattern.topic) {

        var error = new _errors2.default.HemeraError(_constants2.default.NO_TOPIC_TO_SUBSCRIBE, {
          pattern
        });

        this.log.error(error);
        throw error;
      }

      if (!hasCallback) {

        var _error = new _errors2.default.HemeraError(_constants2.default.MISSING_IMPLEMENTATION, {
          pattern
        });

        this.log.error(_error);
        throw _error;
      }

      var origPattern = _lodash2.default.cloneDeep(pattern);

      var schema = {};

      // remove objects (rules) from pattern and extract scheme
      _lodash2.default.each(pattern, function (v, k) {

        if (_lodash2.default.isObject(v)) {
          schema[k] = _lodash2.default.clone(v);
          delete origPattern[k];
        }
      });

      // remove special $ variables from pattern
      origPattern = _util2.default.cleanPattern(origPattern);

      // create message object which represent the object behind the matched pattern
      var actMeta = {
        schema: schema,
        pattern: origPattern,
        action: cb,
        plugin: this.plugin$
      };

      var handler = this._catalog.lookup(origPattern);

      // check if pattern is already registered
      if (handler) {

        var _error2 = new _errors2.default.HemeraError(_constants2.default.PATTERN_ALREADY_IN_USE, {
          pattern
        });

        this.log.error(_error2);
        throw _error2;
      }

      // add to bloomrun
      this._catalog.add(origPattern, actMeta);

      this.log.info(origPattern, _constants2.default.ADD_ADDED);

      // subscribe on topic
      this.subscribe(pattern.topic, pattern.pubsub$, pattern.maxMessages$);
    }

    /**
     * @param {any} pattern
     * @param {any} cb
     *
     * @memberOf Hemera
     */

  }, {
    key: 'act',
    value: function act(pattern, cb) {

      // topic is needed to subscribe on a subject in NATS
      if (!pattern.topic) {

        var error = new _errors2.default.HemeraError(_constants2.default.NO_TOPIC_TO_REQUEST, {
          pattern
        });

        this.log.error(error);
        throw error;
      }

      // create new execution context
      var ctx = this.createContext();
      ctx._pattern = pattern;
      ctx._prevContext = this;
      ctx._cleanPattern = _util2.default.cleanPattern(pattern);
      ctx._response = {};
      ctx._request = {};

      ctx._extensions.onClientPreRequest.invoke(ctx, function onPreRequest(err) {

        var self = this;

        var hasCallback = _lodash2.default.isFunction(cb);

        if (err) {

          var _error3 = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);

          self.log.error(_error3);

          if (hasCallback) {
            return cb.call(self, _error3);
          }

          return;
        }

        // use simple publish mechanism instead to fire a request
        if (pattern.pubsub$ === true) {

          if (hasCallback) {
            self.log.info(_constants2.default.PUB_CALLBACK_REDUNDANT);
          }

          self.send(pattern.topic, self._request);
        } else {

          // send request
          var sid = self.sendRequest(pattern.topic, self._request, function (response) {

            self._response = self._decoder.decode.call(ctx, response);

            try {

              // if payload is invalid
              if (self._response.error) {

                var _error4 = new _errors2.default.ParseError(_constants2.default.PAYLOAD_PARSING_ERROR, {
                  pattern: self._cleanPattern
                }).causedBy(self._response.error);

                self.log.error(_error4);

                if (hasCallback) {
                  return cb.call(self, _error4);
                }
              }

              self._extensions.onClientPostRequest.invoke(ctx, function (err) {

                if (err) {

                  var _error5 = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);

                  self.log.error(_error5);

                  if (hasCallback) {
                    return cb.call(self, _error5);
                  }

                  return;
                }

                if (hasCallback) {

                  if (self._response.value.error) {

                    var responseError = _errio2.default.fromObject(self._response.value.error);
                    var responseErrorCause = responseError.cause;
                    var _error6 = new _errors2.default.BusinessError(_constants2.default.BUSINESS_ERROR, {
                      pattern: self._cleanPattern
                    }).causedBy(responseErrorCause ? responseError.cause : responseError);

                    self.log.error(_error6);

                    return cb.call(self, responseError);
                  }

                  cb.apply(self, [null, self._response.value.result]);
                }
              });
            } catch (err) {

              var _error7 = new _errors2.default.FatalError(_constants2.default.FATAL_ERROR, {
                pattern: self._cleanPattern
              }).causedBy(err);

              self.log.fatal(_error7);

              // let it crash
              if (self._config.crashOnFatal) {

                self.fatal();
              }
            }
          });

          // handle timeout
          self.handleTimeout(sid, pattern, cb);
        }
      });
    }

    /**
     * @param {any} sid
     * @param {any} pattern
     * @param {any} cb
     *
     * @memberOf Hemera
     */

  }, {
    key: 'handleTimeout',
    value: function handleTimeout(sid, pattern, cb) {
      var _this4 = this;

      // handle timeout
      this.timeout(sid, pattern.timeout$ || this._config.timeout, 1, function () {

        var hasCallback = _lodash2.default.isFunction(cb);

        var error = new _errors2.default.TimeoutError(_constants2.default.ACT_TIMEOUT_ERROR, {
          pattern
        });

        _this4.log.error(error);

        if (hasCallback) {

          try {

            cb.call(_this4, error);
          } catch (err) {

            var _error8 = new _errors2.default.FatalError(_constants2.default.FATAL_ERROR, {
              pattern
            }).causedBy(err);

            _this4.log.fatal(_error8);

            // let it crash
            if (_this4._config.crashOnFatal) {

              _this4.fatal();
            }
          }
        }
      });
    }

    /**
     * @returns
     * OLOO (objects-linked-to-other-objects) is a code style which creates and relates objects directly without the abstraction of classes. OLOO quite naturally * implements [[Prototype]]-based behavior delegation.
     * More details: {@link https://github.com/getify/You-Dont-Know-JS/blob/master/this%20%26%20object%20prototypes/ch6.md}
     * @memberOf Hemera
     */

  }, {
    key: 'createContext',
    value: function createContext() {

      var self = this;

      // create new instance of hemera but with pointer on the previous propertys
      // so we are able to create a scope per act without lossing the reference to the core api.
      var ctx = Object.create(self);

      return ctx;
    }

    /**
     * @memberOf Hemera
     */

  }, {
    key: 'list',
    value: function list(params) {

      return this._catalog.list(params);
    }

    /**
     * @returns
     *
     * @memberOf Hemera
     */

  }, {
    key: 'close',
    value: function close() {

      this._heavy.stop();

      return this.transport.close();
    }
  }, {
    key: 'plugins',
    get: function get() {

      return this._plugins;
    }

    /**
     * @readonly
     *
     * @memberOf Hemera
     */

  }, {
    key: 'catalog',
    get: function get() {

      return this._catalog;
    }

    /**
     *
     *
     * @readonly
     *
     * @memberOf Hemera
     */

  }, {
    key: 'load',
    get: function get() {

      return this._heavy.load;
    }

    /**
     *
     *
     * @readonly
     * @type {Exposition}
     * @memberOf Hemera
     */

  }, {
    key: 'exposition',
    get: function get() {

      return this._exposition;
    }
  }, {
    key: 'transport',
    get: function get() {

      return this._transport;
    }

    /**
     * @readonly
     *
     * @memberOf Hemera
     */

  }, {
    key: 'topics',
    get: function get() {
      return this._topics;
    }
  }]);

  return Hemera;
}(_events2.default);

module.exports = Hemera;
//# sourceMappingURL=index.js.map
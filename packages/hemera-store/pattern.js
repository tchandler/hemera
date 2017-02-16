'use strict'

const Joi = require('joi')

/**
 *
 *
 * @class StorePattern
 */
class StorePattern {


  /**
   *
   *
   * @static
   * @param {any} topic
   * @returns
   *
   * @memberOf StorePattern
   */
  static create(topic) {

    return {
      topic,
      cmd: 'create',
      collection: Joi.string().default(Joi.ref('table')),
      data: Joi.object().required()
    }
  }

  /**
   *
   *
   * @static
   * @param {any} topic
   * @returns
   *
   * @memberOf StorePattern
   */
  static remove(topic) {

    return {
      topic,
      cmd: 'remove',
      collection: Joi.string().default(Joi.ref('table')),
      query: Joi.object().required()
    }
  }

  /**
   *
   *
   * @static
   * @param {any} topic
   * @returns
   *
   * @memberOf StorePattern
   */
  static removeById(topic) {

    return {
      topic,
      cmd: 'removeById',
      collection: Joi.string().default(Joi.ref('table')),
      id: Joi.string().required()
    }
  }

  /**
   *
   *
   * @static
   * @param {any} topic
   * @returns
   *
   * @memberOf StorePattern
   */
  static update(topic) {

    return {
      topic,
      cmd: 'update',
      collection: Joi.string().default(Joi.ref('table')),
      data: Joi.object().required(),
      query: Joi.object().default({}).required()
    }
  }

  /**
   *
   *
   * @static
   * @param {any} topic
   * @returns
   *
   * @memberOf StorePattern
   */
  static updateById(topic) {

    return {
      topic,
      cmd: 'updateById',
      collection: Joi.string().default(Joi.ref('table')),
      data: Joi.object().required(),
      id: Joi.string().required()
    }
  }

  /**
   *
   *
   * @static
   * @param {any} topic
   * @returns
   *
   * @memberOf StorePattern
   */
  static find(topic) {

    return {
      topic,
      cmd: 'find',
      collection: Joi.string().default(Joi.ref('table')),
      query: Joi.object().required(),
      options: Joi.object().optional()
    }
  }


  /**
   *
   *
   * @static
   * @param {any} topic
   * @returns
   *
   * @memberOf StorePattern
   */
  static findById(topic) {

    return {
      topic,
      cmd: 'findById',
      collection: Joi.string().default(Joi.ref('table')),
      id: Joi.string().required()
    }
  }

  /**
   *
   *
   * @static
   * @param {any} topic
   * @returns
   *
   * @memberOf StorePattern
   */
  static replace(topic) {

    return {
      topic,
      cmd: 'replace',
      collection: Joi.string().default(Joi.ref('table')),
      data: Joi.object().required(),
      query: Joi.object().default({}).required()
    }
  }

  /**
   *
   *
   * @static
   * @param {any} topic
   * @returns
   *
   * @memberOf StorePattern
   */
  static replaceById(topic) {

    return {
      topic,
      cmd: 'replaceById',
      collection: Joi.string().default(Joi.ref('table')),
      data: Joi.object().required(),
      id: Joi.string().required()
    }
  }

  /**
   *
   *
   * @static
   * @param {any} topic
   * @returns
   *
   * @memberOf StorePattern
   */
  static exists(topic) {

    return {
      topic,
      cmd: 'exists',
      collection: Joi.string().default(Joi.ref('table')),
      query: Joi.object().required()
    }
  }
}

module.exports = StorePattern

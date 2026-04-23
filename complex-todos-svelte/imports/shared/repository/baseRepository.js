import {log} from '../logger/logger.js';
import {isUndefined} from '../functions/isDefined.js';
import {Random} from 'meteor/random';

/**
 * Base class containing repository functionality
 */
class BaseRepository
{
  /**
   * @constructor
   * @param collection {Mongo.Collection}
   */
  constructor(collection)
  {
    /**
     * @protected
     * @type {Mongo.Collection}
     */
    this._collection = collection;

    /**
     * @private
     */
    this._collectionName = collection._name;

    if(Meteor.isServer)
    {
      /**
       * @protected
       */
      this._bulkOperation = null; // Will be created by first insert/update function
    }
  }

  /**
   * Finds documents based on provided selector and options
   * @param selector {string|object} [optional]
   * @param options {object} [optional]
   * @returns {Mongo.Cursor}
   */
  find(selector = {}, options = {})
  {
    return this._collection.find(selector, options);
  }

  /**
   * Finds one document only
   * @param selector {string|object}
   * @param options {object} [optional]
   * @returns {Promise<object>}
   */
  async findOne(selector = {}, options = {})
  {
    return this._collection.findOneAsync(selector, options);
  }

  /**
   * Inserts a document and returns the id of it
   * @param document {object}
   * @returns {Promise<string>}
   */
  async insert(document)
  {
    return this._collection.insertAsync(document);
  }

  /**
   * Inserts or updates a document
   * @param selector {string|object}
   * @param updateObject {object}
   * @param options {object}
   */
  async upsert(selector, updateObject, options = null)
  {
    return this._collection.upsertAsync(selector, updateObject, options);
  }

  /**
   * Updates a document
   * @param selector {string|object}
   * @param updateObject {object}
   * @param options {object}
   */
  async update(selector, updateObject, options = null)
  {
    return this._collection.updateAsync(selector, updateObject, options);
  }

  /**
   * Updates all matching documents
   * @param selector {string|object}
   * @param updateObject {object}
   */
  async updateMany(selector, updateObject)
  {
    return this._collection.updateAsync(selector, updateObject, {multi: true});
  }

  /**
   * Updates id of provided document
   * @param document {object}
   * @param newId {string}
   */
  async updateId(document, newId)
  {
    await this.remove(document._id);

    document._id = newId;

    await this.insert(document);
  }

  /**
   * Removes a document with id or selector
   * @param selector {string|object}
   * @returns {Promise<number>} affected row count
   */
  async remove(selector)
  {
    return this._collection.removeAsync(selector);
  }

  /**
   * Counts the number of documents for provided selector
   * @param selector {object}
   * @param options {object}
   * @returns {Promise<number>}
   */
  async count(selector = {}, options = {})
  {
    return this._collection.find(selector, options).countAsync();
  }

  /**
   * Creates a new 'ordered' bulk operation
   * @returns {object}
   * @private
   */
  _createBulkOperation()
  {
    return this._collection.rawCollection().initializeOrderedBulkOp();
  }

  /**
   * Inserts a document as a bulk operation
   * @param document {object}
   */
  insertBulk(document)
  {
    if(Meteor.isClient)
    {
      log.fatal(`Bulk operations for ${this._collectionName} can only be called from server side`);
      return;
    }

    if(this._bulkOperation === null)
    {
      this._bulkOperation = this._createBulkOperation();
    }

    //
    // IMPORTANT
    // Bulk insert creates 'MONGO' _id which creates reactivity problem in UI.
    // We better create it with Meteor style 'STRING' _id.
    //
    if(isUndefined(document._id)) // Let caller provide an id
    {
      document._id = this.newId();
    }

    this._bulkOperation.insert(document);
  }

  /**
   * Updates a document as a bulk operation
   * @param selector {object}
   * @param updateObject {object}
   * @param options {object}
   */
  updateBulk(selector, updateObject, options = null)
  {
    if(Meteor.isClient)
    {
      log.fatal(`Bulk operations for ${this._collectionName} can only be called from server side`);
      return;
    }

    if(this._bulkOperation === null)
    {
      this._bulkOperation = this._createBulkOperation();
    }

    delete updateObject._id; // In case we were provided with a document, updating id is not possible

    this._bulkOperation.find(selector).update(updateObject, options);
  }

  /**
   * Removes a document as a bulk operation
   * @param selector {object}
   */
  removeBulk(selector)
  {
    if(Meteor.isClient)
    {
      log.fatal(`Remove bulk operations for ${this._collectionName} can only be called from server side`);
      return;
    }

    if(this._bulkOperation === null)
    {
      this._bulkOperation = this._createBulkOperation();
    }

    this._bulkOperation.find(selector).remove();
  }

  /**
   * Executes the bulk operation
   */
  async executeBulk()
  {
    if(Meteor.isClient)
    {
      log.fatal(`Bulk operations for ${this._collectionName} can only be called from server side`);
      return;
    }

    if(this._bulkOperation === null)
    {
      return;
    }

    log.info(`Executing bulk operations for ${this._collectionName}.`);

    try
    {
      await this._bulkOperation.execute();
    }
    catch(e)
    {
      log.error(e.toString());
    }
    finally
    {
      this._bulkOperation = null;
    }
  }

  /**
   * @return {string}
   */
  newId()
  {
    return Random.id();
  }

  /**
   * @param indexName {string}
   */
  dropIndex(indexName)
  {
    this._collection._dropIndex(indexName);
  }
}

export {BaseRepository};
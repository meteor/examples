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
   * @returns {object}
   */
  findOne(selector = {}, options = {})
  {
    return this._collection.findOne(selector, options);
  }
  
  /**
   * Inserts a document and returns the id of it
   * @param document {object}
   * @returns {string}
   */
  insert(document)
  {
    return this._collection.insert(document);
  }
  
  /**
   * Inserts or updates a document
   * @param selector {string|object}
   * @param updateObject {object}
   * @param options {object}
   */
  upsert(selector, updateObject, options = null)
  {
    this._collection.upsert(selector, updateObject, options);
  }
  
  /**
   * Updates a document
   * @example Notifications.update({assignedTo: userId}, {$set: {'isRead': true}}, {multi: true});
   * @param selector {string|object}
   * @param updateObject {object}
   * @param options {object}
   */
  update(selector, updateObject, options = null)
  {
    this._collection.update(selector, updateObject, options);
  }
  
  /**
   * Updates all matching documents
   * @param selector {string|object}
   * @param updateObject {object}
   */
  async updateMany(selector, updateObject)
  {
    await this._collection.updateAsync(selector, updateObject, {multi: true});
  }
  
  /**
   * Updates id of provided document
   * @param document {object}
   * @param newId {string}
   */
  updateId(document, newId)
  {
    this.remove(document._id);
    
    document._id = newId;
    
    this.insert(document);
  }
  
  /**
   * Removes a document with id or selector
   * @param selector {string|object}
   * @returns {number} affected row count
   */
  remove(selector)
  {
    return this._collection.remove(selector);
  }
  
  /**
   * Counts the number of documents for provided selector
   * @param selector {object}
   * @param options {object}
   * @returns {number}
   */
  count(selector = {}, options = {})
  {
    return this.find(selector, options).count();
  }
  
  /**
   * Creates a new 'ordered' bulk operation
   * IMPORTANT: Bulk operations are not reusable. We should create a new one after each bulk.execute call!
   * @returns {Mongo.Collection}
   * @private
   */
  _createBulkOperation()
  {
    return this._collection.rawCollection().initializeOrderedBulkOp();
  }
  
  /**
   * Inserts a document as a bulk operation
   * @link https://docs.meteor.com/api/collections.html#Mongo-Collection
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
    
    //
    // Convert object to an update object
    //
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
  executeBulk()
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
    
    //
    // Execute bulk operation and delete it for insert/update functions to create a new one
    //
    try
    {
      this._bulkOperation.execute();
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
import {Mongo} from 'meteor/mongo';

const Tasks = new Mongo.Collection('tasks');

/**
 * Tasks schema:
 * - text: String
 * - createdAt: Date
 * - owner: String
 * - username: String
 * - checked: Boolean (optional)
 * - expired: Boolean (optional)
 * - private: Boolean (optional)
 */

export {Tasks};
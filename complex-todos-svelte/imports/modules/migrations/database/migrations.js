const Migrations = new Mongo.Collection('_migrations');

/**
 * Migrations schema:
 * - version: String
 */

export {Migrations};
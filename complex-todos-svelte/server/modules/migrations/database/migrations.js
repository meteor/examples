import SimpleSchema from 'simpl-schema';

const Migrations = new Mongo.Collection('_migrations');

Migrations.attachSchema(
  new SimpleSchema({
    version: {
      type: String,
      defaultValue: 0
    }
  })
);

export {Migrations};
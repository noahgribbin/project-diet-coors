'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileSchema = Schema({
  userID: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, unique: false },
  characters: [{ type: Schema.Types.ObjectId, unique: false, ref: 'Character'}],
  dms: [{ type: Schema.Types.ObjectId, unique: false, ref: 'Dm'}]
});

module.exports = mongoose.model('Profile', profileSchema);

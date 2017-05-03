'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileSchema = Schema({
  userID: { type: Schema.Types.ObjectId, required: true, unique: true },
  name: { type: String, unique: true },
  characters: [{ type: Schema.Types.ObjectId, unique: true, ref: 'character'}],
  dms: [{ type: Schema.Types.ObjectId, unique: true, ref: 'dm'}]
});

module.exports = mongoose.model('profile', profileSchema);

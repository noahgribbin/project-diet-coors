'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileSchema = Schema({
  userID: { type: Schema.Types.ObjectId, required: true, unique: true },
  name: { type: String, unique: false },
  characters: [{ type: Schema.Types.ObjectId, unique: false, ref: 'character'}],
  dms: [{ type: Schema.Types.ObjectId, unique: false, ref: 'dm'}]
});

module.exports = mongoose.model('profile', profileSchema);

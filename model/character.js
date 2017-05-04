'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const characterSchema = Schema({
  profileId: { type: Schema.Types.ObjectId, required: true, unique: true },
  dmId: { type: Schema.Types.ObjectId },
  characterName: { type: String, unique: true },
  characterPicURI: {type: String }
});

module.exports = mongoose.model('character', characterSchema);
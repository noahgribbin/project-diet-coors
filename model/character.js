'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const characterSchema = Schema({
  profileID: { type: Schema.Types.ObjectId, required: true, unique: false },
  dmID: { type: Schema.Types.ObjectId },
  characterName: { type: String, unique: false },
  characterPicURI: {type: String }
});

module.exports = mongoose.model('character', characterSchema);

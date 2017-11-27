'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const spellSchema = Schema({
  characterID: { type: Schema.Types.ObjectId, ref: 'Character', required: true, unique: false },
  dmID: { type: Schema.Types.ObjectId, ref: 'Dm' },
  name: { type: String, unique: false },
  castingTime: { type: String, unique: false },
  range: { type: String, unique: false },
  duration: { type: String, unique: false },
  components: { type: String, unique: false },
  description: { type: String, unique: false }
});

module.exports = mongoose.model('Spell', spellSchema);

'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const characterSchema = Schema({
  profileID: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, unique: false },
  dmID: { type: Schema.Types.ObjectId, ref: 'Dm' },
  characterName: { type: String, unique: false },
  characterPicURI: {type: String },
  weapons: [{ type: Schema.Types.ObjectId, unique: false, ref: 'Weapon'}],
  armor: [{ type: Schema.Types.ObjectId, unique: false, ref: 'Armor'}],
  spells: [{ type: Schema.Types.ObjectId, unique: false, ref: 'Spell'}],
  lv: {type: Number, requred: true},
  ac: {type: Number, requred: true},
  hp: {type: Number, requred: true},
  strength: {type: Number, requred: true},
  dexterity: {type: Number, requred: true},
  constitution: {type: Number, requred: true},
  intelligence: {type: Number, requred: true},
  wisdom: {type: Number, requred: true},
  charisma: {type: Number, requred: true}
});

module.exports = mongoose.model('Character', characterSchema);

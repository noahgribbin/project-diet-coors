'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const armorSchema = Schema({
  characterID: {type: Schema.Types.ObjectId, ref: 'Character', required:true},
  name: {type: String, required: true},
  ac: {type: String},
  weight: {type: String}
})

module.exports = mongoose.model('Armor', armorSchema);

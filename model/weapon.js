'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const weaponSchema = Schema({
  characterID: {type: Schema.Types.ObjectId, required:true},
  name: {type: String},
  damage: {type: String},
  dice: {type: String},
  weight: {type: String}
})

module.exports = mongoose.model('Weapon', weaponSchema);

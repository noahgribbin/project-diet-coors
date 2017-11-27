'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dmSchema = Schema({
  profileID: { type: Schema.Types.ObjectId, required: true, ref: 'Profile' },
  campaignName: { type: String, unique: false, required: true },
  campaignMembers: [{ type: Schema.Types.ObjectId, ref: 'Character' }],
  campaignCode: { type: String, required: true, unique:true}
});

module.exports = mongoose.model('Dm', dmSchema);

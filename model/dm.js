'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dmSchema = Schema({
  profileID: { type: Schema.Types.ObjectId, required: true, unique: true },
  campaignName: { type: String, unique: true },
  campaignMembers: [{ type: Schema.Types.ObjectId, unique: true, ref: 'character' }]
});

module.exports = mongoose.model('dm', dmSchema);

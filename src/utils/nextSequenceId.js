// src/utils/nextSequenceId.js
const Counter = require('../models/counter');

async function getNextSequenceId(sequenceName) {
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

module.exports = getNextSequenceId;
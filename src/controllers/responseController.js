const Participant = require('../models/Participant');
const { hashAnonId } = require('../utils/hash');
const { maxSubmissionsPerParticipant } = require('../config/env');

// True if the person answered at least one question.
function hasAnyAnswer(data) {
  const choiceHasData = (c) => c.selected.length > 0 || c.other.length > 0;
  return Boolean(
    data.gender.choice ||
      data.gender.other ||
      data.moodActivities.length ||
      data.comfortSongs.length ||
      choiceHasData(data.listeningTimes) ||
      choiceHasData(data.platformIssues) ||
      choiceHasData(data.idealRecs) ||
      data.suggestion
  );
}

// POST /api/responses
async function createResponse(req, res, next) {
  try {
    const { anonId, hpCheck, ...answers } = req.body;

    // Honeypot filled in => a bot. Pretend it worked, store nothing.
    if (hpCheck) {
      return res.status(201).json({ success: true, message: 'Thank you!' });
    }

    if (!hasAnyAnswer(answers)) {
      return res.status(400).json({
        success: false,
        message: 'You have not answered anything yet. Even one tap helps!',
      });
    }

    const hashedId = hashAnonId(anonId);

    // Atomic "find this person, or create them, then add the response".
    // If the person already hit the per-person cap, the filter no longer matches,
    // Mongo tries to insert a duplicate anonId and throws error code 11000 (handled below).
    await Participant.findOneAndUpdate(
      { anonId: hashedId, submissionCount: { $lt: maxSubmissionsPerParticipant } },
      {
        $push: { submissions: { ...answers, submittedAt: new Date() } },
        $inc: { submissionCount: 1 },
      },
      { upsert: true, returnDocument: 'after', projection: { _id: 1 } }
    );

    return res.status(201).json({ success: true, message: 'Thank you! Your response has been saved.' });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(429).json({
        success: false,
        message: 'You have already shared plenty of responses. Thank you so much!',
      });
    }
    return next(err);
  }
}

module.exports = { createResponse };

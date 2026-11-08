const mongoose = require('mongoose');

const { Schema } = mongoose;

// A list of tapped options plus anything the person typed under "add your own".
const choiceSchema = new Schema(
  {
    selected: { type: [String], default: [] },
    other: { type: [String], default: [] },
  },
  { _id: false }
);

// One mood/activity (e.g. "Studying") and the optional song played in that situation.
const moodActivitySchema = new Schema(
  {
    label: { type: String, required: true },
    isCustom: { type: Boolean, default: false },
    song: { type: String, default: '' },
  },
  { _id: false }
);

// One filled-in form.
const submissionSchema = new Schema(
  {
    gender: {
      choice: { type: String, default: '' },
      other: { type: String, default: '' },
    },
    moodActivities: { type: [moodActivitySchema], default: [] },
    comfortSongs: { type: [String], default: [] },
    listeningTimes: { type: choiceSchema, default: () => ({}) },
    platformIssues: { type: choiceSchema, default: () => ({}) },
    idealRecs: { type: choiceSchema, default: () => ({}) },
    suggestion: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * One document per anonymous person (per browser).
 * `anonId` is a scrambled (HMAC) version of a random code kept in their browser,
 * so it cannot be traced back to a name, phone number or device.
 * Every new response by the same person is pushed into `submissions`.
 */
const participantSchema = new Schema(
  {
    anonId: { type: String, required: true, unique: true, index: true },
    submissionCount: { type: Number, default: 0 },
    submissions: { type: [submissionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Participant', participantSchema);

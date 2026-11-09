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

// A mood or activity (e.g. "Studying") linked to a song.
const tagSchema = new Schema(
  {
    label: { type: String, required: true },
    isCustom: { type: Boolean, default: false },
  },
  { _id: false }
);

// A song the person listens to, with every mood/activity they link to it (entered once per song).
// `externalId` is the music catalogue's id (empty if the song was typed in by hand).
const songSchema = new Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, default: '' },
    album: { type: String, default: '' },
    genre: { type: String, default: '' },
    year: { type: Number, default: null },
    externalId: { type: String, default: '' },
    source: { type: String, enum: ['search', 'manual'], default: 'manual' },
    tags: { type: [tagSchema], default: [] },
  },
  { _id: false }
);

// Older format: one mood/activity and the optional song played in that situation.
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
    songs: { type: [songSchema], default: [] },
    moodActivities: { type: [moodActivitySchema], default: [] }, // older format, kept so old responses stay readable
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

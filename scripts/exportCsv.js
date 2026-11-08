/**
 * Exports all collected responses to CSV files you can open in Excel / pandas.
 *   npm run export
 *
 * Creates (in ./exports):
 *   responses.csv        one row per submitted form
 *   mood_song_pairs.csv  one row per (mood/activity -> song) answer; handy for ML
 *
 * "participant" is a short piece of the scrambled anonymous id. Rows with the same
 * participant came from the same browser.
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('../src/config/env'); // loads .env and checks it
const connectDB = require('../src/config/db');
const Participant = require('../src/models/Participant');

// Quotes values for CSV, and defuses spreadsheet formulas (=, +, -, @) typed by respondents.
function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

const toRow = (cells) => cells.map(csvCell).join(',');
const joinList = (list) => (list || []).join(' | ');
const both = (c) => joinList([...(c?.selected || []), ...(c?.other || [])]);

async function run() {
  await connectDB();

  const wideHeader = [
    'participant', 'response_no', 'submitted_at', 'gender', 'moods_activities',
    'comfort_songs', 'listening_times', 'platform_issues', 'ideal_recommendations', 'suggestion',
  ];
  const pairHeader = ['participant', 'response_no', 'mood_or_activity', 'is_custom', 'song'];

  const wide = [toRow(wideHeader)];
  const pairs = [toRow(pairHeader)];

  const cursor = Participant.find().lean().cursor();
  for await (const person of cursor) {
    const participant = `P-${person.anonId.slice(0, 8)}`;
    person.submissions.forEach((sub, index) => {
      const responseNo = index + 1;
      const gender = [sub.gender?.choice, sub.gender?.other].filter(Boolean).join(' / ');
      const moods = (sub.moodActivities || []).map((m) => m.label).join(' | ');

      wide.push(
        toRow([
          participant, responseNo, sub.submittedAt ? new Date(sub.submittedAt).toISOString() : '',
          gender, moods, joinList(sub.comfortSongs), both(sub.listeningTimes),
          both(sub.platformIssues), both(sub.idealRecs), sub.suggestion,
        ])
      );

      (sub.moodActivities || []).forEach((m) => {
        pairs.push(toRow([participant, responseNo, m.label, m.isCustom, m.song]));
      });
    });
  }

  const outDir = path.join(__dirname, '..', 'exports');
  fs.mkdirSync(outDir, { recursive: true });
  // BOM so Excel shows Hindi / emoji text correctly
  fs.writeFileSync(path.join(outDir, 'responses.csv'), `\uFEFF${wide.join('\n')}\n`);
  fs.writeFileSync(path.join(outDir, 'mood_song_pairs.csv'), `\uFEFF${pairs.join('\n')}\n`);

  console.log(`Exported ${wide.length - 1} responses and ${pairs.length - 1} mood/song pairs to ./exports`);
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});

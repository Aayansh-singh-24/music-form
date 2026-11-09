const { z } = require('zod');

// Remove control characters and tidy whitespace. Newlines are kept only for long text.
function clean(value, multiline) {
  // eslint-disable-next-line no-control-regex
  const noControls = value.replace(multiline ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, ' ');
  const tidy = multiline
    ? noControls.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
    : noControls.replace(/\s+/g, ' ');
  return tidy.trim();
}

// Optional text: may be missing or empty.
const optionalText = (max, multiline = false) =>
  z.string().max(max).transform((v) => clean(v, multiline)).optional().default('');

// A label that must contain something (used inside lists).
const label = (max) =>
  z.string().max(max).transform((v) => clean(v, false)).refine((v) => v.length > 0, 'Cannot be empty');

const choices = z
  .object({
    selected: z.array(label(60)).max(20).default([]),
    other: z.array(label(60)).max(5).default([]),
  })
  .default({});

// One song (picked from the search, or typed in) plus the moods / activities linked to it.
const songWithTags = z.object({
  title: label(150),
  artist: optionalText(150),
  album: optionalText(150),
  genre: optionalText(60),
  year: z.number().int().min(1900).max(2100).nullable().optional().default(null),
  externalId: optionalText(30), // the music catalogue's id for the song (empty for typed songs)
  source: z.enum(['search', 'manual']).optional().default('manual'),
  tags: z
    .array(
      z.object({
        label: label(60),
        isCustom: z.boolean().optional().default(false),
      })
    )
    .max(40)
    .default([]),
});

const responseSchema = z.object({
  // Random code generated in the visitor's browser (a UUID). Never a name or number.
  anonId: z.string().regex(/^[A-Za-z0-9-]{16,64}$/, 'Invalid anonymous id'),

  // Honeypot: real people never see or fill this. Bots often do.
  hpCheck: z.string().max(200).optional().default(''),

  gender: z
    .object({
      choice: optionalText(40),
      other: optionalText(60),
    })
    .default({}),

  // Songs first, each with its moods / activities.
  songs: z.array(songWithTags).max(15).default([]),

  // Older format (mood first, song second). Still accepted so visitors whose browser has the old page cached are not lost.
  moodActivities: z
    .array(
      z.object({
        label: label(60),
        isCustom: z.boolean().optional().default(false),
        song: optionalText(100),
      })
    )
    .max(60)
    .default([]),

  comfortSongs: z.array(label(100)).max(5).default([]),

  listeningTimes: choices,
  platformIssues: choices,
  idealRecs: choices,

  suggestion: optionalText(600, true),
});

module.exports = { responseSchema };

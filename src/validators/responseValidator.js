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

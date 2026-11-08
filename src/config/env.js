require('dotenv').config();

const required = ['MONGODB_URI', 'HASH_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Create a .env file (see .env.example) or set them in your hosting dashboard.');
  process.exit(1);
}

if (process.env.HASH_SECRET.length < 16) {
  console.error('HASH_SECRET is too short. Use a long random string (see .env.example).');
  process.exit(1);
}

module.exports = {
  mongoUri: process.env.MONGODB_URI,
  hashSecret: process.env.HASH_SECRET,
  port: Number(process.env.PORT) || 3000,
  isProd: process.env.NODE_ENV === 'production',
  submitLimitPer15Min: Number(process.env.SUBMIT_LIMIT_PER_15_MIN) || 60,
  // One anonymous person may store at most this many responses (stops accidental/abusive floods).
  maxSubmissionsPerParticipant: 25,
};

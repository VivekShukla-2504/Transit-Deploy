const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadBackendEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const examplePath = path.join(__dirname, '..', '.env.example');

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  if (!process.env.MONGO_URI && fs.existsSync(examplePath)) {
    dotenv.config({ path: examplePath, override: false });

    if (process.env.MONGO_URI) {
      console.warn('MONGO_URI not found in backend/.env, falling back to backend/.env.example');
    }
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set. Create backend/.env from backend/.env.example and define MONGO_URI.');
  }

  return process.env.MONGO_URI;
}

module.exports = { loadBackendEnv };
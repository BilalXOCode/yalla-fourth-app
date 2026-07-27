// MongoDB Atlas connection.
// Prints clear, friendly messages so it is obvious in the terminal whether
// the database connected or not.
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('\n⚠️  No MONGODB_URI found in server/.env');
    console.warn('    The server will still start, but database features are OFF.');
    console.warn('    Paste your MongoDB Atlas connection string into server/.env, then restart.\n');
    return false;
  }

  try {
    // Fail fast if the cluster is unreachable instead of hanging.
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const { host, name } = mongoose.connection;
    console.log(`\n✅  MongoDB connected  →  database "${name}" on ${host}\n`);

    mongoose.connection.on('error', (err) => {
      console.error('❌  MongoDB connection error:', err.message);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected.');
    });

    return true;
  } catch (err) {
    console.error('\n❌  Could not connect to MongoDB.');
    console.error('    Check that your MONGODB_URI is correct and that your current');
    console.error('    IP is allowed in Atlas (Network Access).');
    console.error('    Details:', err.message, '\n');
    return false;
  }
}

module.exports = connectDB;

const fs = require('fs');
const mongoose = require('mongoose');

async function getMongoUri() {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const ex = '.env';
  if (fs.existsSync(ex)) {
    const lines = fs.readFileSync(ex, 'utf8').split(/\r?\n/);
    for (const l of lines) if (l.startsWith('MONGO_URI=')) return l.split('=')[1].trim();
  }
  const ex2 = '.env.example';
  if (fs.existsSync(ex2)) {
    const lines = fs.readFileSync(ex2, 'utf8').split(/\r?\n/);
    for (const l of lines) if (l.startsWith('MONGO_URI=')) return l.split('=')[1].trim();
  }
  throw new Error('MONGO_URI not found in environment or .env(.example)');
}

(async () => {
  try {
    const uri = await getMongoUri();
    console.log('Using MONGO_URI:', uri.split('@')[0] + '@...');
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    const admins = await mongoose.connection.db.collection('users').find({ role: 'admin' }).project({ password: 0 }).toArray();
    console.log('Admin users found:', admins.length);
    console.dir(admins, { depth: 2 });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

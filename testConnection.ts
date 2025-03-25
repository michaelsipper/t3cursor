import 'dotenv/config';
import dbConnect from './lib/mongodb';

async function testConnection() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB successfully!');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
  }
}

testConnection();

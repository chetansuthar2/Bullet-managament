#!/usr/bin/env node

/**
 * Production Database Setup Script
 * This script helps configure MongoDB Atlas for production deployment
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupProductionDB() {
  console.log('\n🚀 Vehicle Repair Management - Production Database Setup\n');
  
  console.log('This script will help you configure MongoDB Atlas for production deployment.\n');
  
  const hasAtlas = await question('Do you have a MongoDB Atlas account? (y/n): ');
  
  if (hasAtlas.toLowerCase() !== 'y') {
    console.log('\n📋 Please follow these steps to create MongoDB Atlas account:');
    console.log('1. Go to https://www.mongodb.com/atlas');
    console.log('2. Click "Try Free" and sign up');
    console.log('3. Create a free cluster (M0 tier)');
    console.log('4. Create database user with read/write permissions');
    console.log('5. Configure network access (allow 0.0.0.0/0)');
    console.log('6. Get connection string from "Connect" button');
    console.log('\nRun this script again after setting up Atlas.\n');
    rl.close();
    return;
  }
  
  const connectionString = await question('\nEnter your MongoDB Atlas connection string: ');
  
  if (!connectionString.includes('mongodb+srv://')) {
    console.log('❌ Invalid connection string. It should start with "mongodb+srv://"');
    rl.close();
    return;
  }
  
  // Validate connection string format
  if (!connectionString.includes('VehicleRepairDB')) {
    console.log('⚠️  Warning: Connection string should include database name "VehicleRepairDB"');
    const addDB = await question('Add VehicleRepairDB to connection string? (y/n): ');
    if (addDB.toLowerCase() === 'y') {
      // Add database name if not present
      const updatedString = connectionString.replace('mongodb.net/', 'mongodb.net/VehicleRepairDB');
      console.log('Updated connection string:', updatedString);
    }
  }
  
  // Create production environment file
  const envContent = `# Production Environment Variables
# Copy these to your deployment platform (Vercel, Netlify, etc.)

MONGODB_ATLAS_URI=${connectionString}
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'your_clerk_publishable_key'}
CLERK_SECRET_KEY=${process.env.CLERK_SECRET_KEY || 'your_clerk_secret_key'}
NEXT_PUBLIC_STORAGE_TYPE=mongodb

# For local testing with Atlas (optional)
# MONGODB_URI=${connectionString}
`;

  fs.writeFileSync('.env.production', envContent);
  
  console.log('\n✅ Production environment file created: .env.production');
  console.log('\n📋 Next steps:');
  console.log('1. Copy the environment variables from .env.production');
  console.log('2. Add them to your deployment platform (Vercel/Netlify)');
  console.log('3. Deploy your application');
  console.log('\n🔧 To test with Atlas locally, uncomment the last line in .env.production');
  console.log('   and copy it to your .env.local file');
  
  rl.close();
}

setupProductionDB().catch(console.error);

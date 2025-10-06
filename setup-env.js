#!/usr/bin/env node

// Interactive environment setup script
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '.env');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupEnv() {
  console.log('🔧 Setting up environment variables...\n');

  try {
    let envContent = '';

    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
    }

    // Ask for Supabase DATABASE_URL
    console.log('📋 Supabase Database URL Setup:');
    console.log('Go to: https://app.supabase.com');
    console.log('Select your project → Settings → Database → Connection String → URI');
    console.log('Copy the full connection string\n');

    const databaseUrl = await ask('Enter your DATABASE_URL: ');
    if (databaseUrl.trim()) {
      envContent = updateEnvVar(envContent, 'DATABASE_URL', databaseUrl.trim());
    }

    console.log('\n📋 Discord OAuth Setup:');
    console.log('Go to: https://discord.com/developers/applications');
    console.log('Create/select app → OAuth2 → General');
    console.log('Add redirect URLs:');
    console.log('  https://www.swivimedia.com/api/auth/callback/discord');
    console.log('  http://localhost:3000/api/auth/callback/discord\n');

    const discordClientId = await ask('Enter your DISCORD_CLIENT_ID: ');
    if (discordClientId.trim()) {
      envContent = updateEnvVar(envContent, 'DISCORD_CLIENT_ID', discordClientId.trim());
    }

    const discordClientSecret = await ask('Enter your DISCORD_CLIENT_SECRET: ');
    if (discordClientSecret.trim()) {
      envContent = updateEnvVar(envContent, 'DISCORD_CLIENT_SECRET', discordClientSecret.trim());
    }

    // Generate a better NEXTAUTH_SECRET if not set
    if (!envContent.includes('NEXTAUTH_SECRET=') || envContent.includes('your-secret-key-here')) {
      const secret = `secret-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      envContent = updateEnvVar(envContent, 'NEXTAUTH_SECRET', secret);
      console.log('\n✅ Generated new NEXTAUTH_SECRET');
    }

    // Write back to .env
    fs.writeFileSync(ENV_FILE, envContent);
    console.log('\n✅ Environment variables updated!');
    console.log('📁 Check your .env file');

  } catch (error) {
    console.error('❌ Error updating .env:', error);
  } finally {
    rl.close();
  }
}

function updateEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const newLine = `${key}="${value}"`;

  if (regex.test(content)) {
    return content.replace(regex, newLine);
  } else {
    return content + (content ? '\n' : '') + newLine;
  }
}

setupEnv();

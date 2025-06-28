#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import csv from 'csv-parser';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Import environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CsvRow {
  DONE: string;
  'DAY No': string;
  REF: string;
  SCRIPTURE: string;
  'CONTEXT (CI: REFLECTION)': string;
  'PROMPT (CI: QUOTE)': string;
  'REFLECTION (CI: LOOKING FORWARD)': string;
}

interface ChallengePrompt {
  challenge_id: string;
  day_number: number;
  scripture_reference: string | null;
  scripture_text: string | null;
  context_text: string | null;
  morning_prompt: string;
  evening_reflection: string | null;
}

async function parseCSV(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv({
        skipLinesWithError: true,
        skipEmptyLines: true,
      }))
      .on('data', (data) => {
        // Only add rows that have a valid DAY No field
        if (data['DAY No'] && data['DAY No'].trim() !== '') {
          results.push(data);
        }
      })
      .on('end', () => {
        console.log(`✅ Parsed ${results.length} valid rows from CSV`);
        resolve(results);
      })
      .on('error', reject);
  });
}

function cleanText(text: string): string {
  if (!text) return '';
  
  // Remove extra whitespace and normalize line breaks
  return text
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // Replace multiple line breaks with max 2
    .replace(/\s+$/gm, ''); // Remove trailing spaces from each line
}

function validateRow(row: CsvRow, index: number): boolean {
  const dayNo = parseInt(row['DAY No']);
  
  if (isNaN(dayNo) || dayNo < 1 || dayNo > 100) {
    console.error(`❌ Invalid day number at row ${index + 1}: ${row['DAY No']}`);
    return false;
  }
  
  // Check if this is a check-in day (7, 14, 21, etc.) - these might have different format
  const isCheckInDay = dayNo % 7 === 0;
  
  if (!row['PROMPT (CI: QUOTE)']?.trim()) {
    if (isCheckInDay) {
      console.warn(`⚠️  Day ${dayNo} (check-in day) has no prompt - will use default review prompt`);
      // Allow check-in days to have no prompt - we'll provide a default
    } else {
      console.error(`❌ Missing prompt at row ${index + 1}, day ${dayNo}`);
      return false;
    }
  }
  
  return true;
}

function transformRowToPrompt(row: CsvRow, challengeId: string): ChallengePrompt {
  const dayNumber = parseInt(row['DAY No']);
  const isCheckInDay = dayNumber % 7 === 0;
  
  // Default review prompt for check-in days if none provided
  const defaultReviewPrompt = `Take time today to reflect on your journey over the past week. Look back at your entries from days ${dayNumber - 6} through ${dayNumber - 1}. What patterns do you notice? What are you most grateful for from this week? How has your perspective on gratitude grown?`;
  
  return {
    challenge_id: challengeId,
    day_number: dayNumber,
    scripture_reference: cleanText(row.REF) || null,
    scripture_text: cleanText(row.SCRIPTURE) || null,
    context_text: cleanText(row['CONTEXT (CI: REFLECTION)']) || null,
    morning_prompt: cleanText(row['PROMPT (CI: QUOTE)']) || (isCheckInDay ? defaultReviewPrompt : ''),
    evening_reflection: cleanText(row['REFLECTION (CI: LOOKING FORWARD)']) || null,
  };
}

async function createOrGetChallenge(): Promise<string> {
  const challengeTitle = '100 Days of Gratitude';
  
  // Check if challenge already exists
  const { data: existing, error: fetchError } = await supabase
    .from('challenges')
    .select('id')
    .eq('title', challengeTitle)
    .single();
  
  if (existing) {
    console.log(`✅ Found existing challenge: ${challengeTitle} (${existing.id})`);
    return existing.id;
  }
  
  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
    throw fetchError;
  }
  
  // Create new challenge
  const { data: newChallenge, error: createError } = await supabase
    .from('challenges')
    .insert({
      title: challengeTitle,
      description: 'Transform your mindset and deepen your faith through 100 days of guided gratitude practice. Each day features scripture, reflection, and prompts designed to help you discover God\'s presence in every moment.',
      total_days: 100,
      category: 'spiritual',
      is_active: true,
    })
    .select('id')
    .single();
  
  if (createError) throw createError;
  
  console.log(`✅ Created new challenge: ${challengeTitle} (${newChallenge.id})`);
  return newChallenge.id;
}

async function clearExistingPrompts(challengeId: string): Promise<void> {
  const { error } = await supabase
    .from('challenge_prompts')
    .delete()
    .eq('challenge_id', challengeId);
  
  if (error) throw error;
  console.log('✅ Cleared existing prompts for challenge');
}

async function insertPrompts(prompts: ChallengePrompt[]): Promise<void> {
  const batchSize = 50;
  
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('challenge_prompts')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      throw error;
    }
    
    console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(prompts.length / batchSize)} (${batch.length} prompts)`);
  }
}

async function validateImportedData(challengeId: string): Promise<void> {
  const { data: prompts, error } = await supabase
    .from('challenge_prompts')
    .select('day_number, morning_prompt')
    .eq('challenge_id', challengeId)
    .order('day_number');
  
  if (error) throw error;
  
  console.log(`\n📊 Import Validation:`);
  console.log(`- Total prompts imported: ${prompts.length}`);
  
  // Check for missing days
  const dayNumbers = prompts.map(p => p.day_number).sort((a, b) => a - b);
  const missingDays = [];
  
  for (let day = 1; day <= 100; day++) {
    if (!dayNumbers.includes(day)) {
      missingDays.push(day);
    }
  }
  
  if (missingDays.length > 0) {
    console.error(`❌ Missing days: ${missingDays.join(', ')}`);
  } else {
    console.log(`✅ All 100 days present`);
  }
  
  // Check for empty prompts
  const emptyPrompts = prompts.filter(p => !p.morning_prompt?.trim());
  if (emptyPrompts.length > 0) {
    console.error(`❌ Empty prompts found for days: ${emptyPrompts.map(p => p.day_number).join(', ')}`);
  } else {
    console.log(`✅ All prompts have content`);
  }
  
  // Sample a few entries
  console.log(`\n📝 Sample entries:`);
  const sampleDays = [1, 25, 50, 75, 100];
  for (const day of sampleDays) {
    const prompt = prompts.find(p => p.day_number === day);
    if (prompt) {
      const preview = prompt.morning_prompt.substring(0, 80) + '...';
      console.log(`Day ${day}: ${preview}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting Gratitude Challenge Data Import\n');
  
  try {
    // 1. Parse CSV file
    const csvPath = path.join(process.cwd(), 'google2.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }
    
    const csvData = await parseCSV(csvPath);
    console.log(`📁 Found CSV with ${csvData.length} rows`);
    
    // 2. Validate data
    console.log('\n🔍 Validating data...');
    const validRows = csvData.filter((row, index) => validateRow(row, index));
    
    if (validRows.length !== csvData.length) {
      throw new Error(`Data validation failed. ${csvData.length - validRows.length} invalid rows found.`);
    }
    
    console.log(`✅ All ${validRows.length} rows are valid`);
    
    // 3. Create or get challenge
    console.log('\n📋 Setting up challenge...');
    const challengeId = await createOrGetChallenge();
    
    // 4. Clear existing prompts
    console.log('\n🧹 Clearing existing prompts...');
    await clearExistingPrompts(challengeId);
    
    // 5. Transform and insert data
    console.log('\n📝 Transforming and inserting prompts...');
    const prompts = validRows.map(row => transformRowToPrompt(row, challengeId));
    
    // Sort by day number to ensure proper order
    prompts.sort((a, b) => a.day_number - b.day_number);
    
    await insertPrompts(prompts);
    
    // 6. Validate imported data
    console.log('\n✅ Import completed! Validating...');
    await validateImportedData(challengeId);
    
    console.log('\n🎉 Successfully imported 100 Days of Gratitude challenge data!');
    console.log(`\nNext steps:`);
    console.log(`1. Review the imported data in your Supabase dashboard`);
    console.log(`2. Test the API endpoints to ensure data is accessible`);
    console.log(`3. Proceed to Step 3: Database Schema Implementation`);
    
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  main();
}

export { main as importChallengeData };
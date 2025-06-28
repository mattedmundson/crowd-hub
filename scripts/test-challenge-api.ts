#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getChallenges, getGratitudeChallenge } from '../lib/services/challenges';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Mock global fetch for the browser client
global.fetch = global.fetch || require('node-fetch');

async function testChallengeAPI() {
  console.log('🧪 Testing Challenge API Services\n');
  
  try {
    // Test 1: Get all challenges
    console.log('1️⃣ Testing getChallenges()...');
    const challenges = await getChallenges();
    console.log(`✅ Found ${challenges.length} challenge(s)`);
    challenges.forEach(challenge => {
      console.log(`   - ${challenge.title} (${challenge.total_days} days)`);
    });
    
    // Test 2: Get gratitude challenge specifically
    console.log('\n2️⃣ Testing getGratitudeChallenge()...');
    const gratitudeChallenge = await getGratitudeChallenge();
    if (gratitudeChallenge) {
      console.log(`✅ Found gratitude challenge: ${gratitudeChallenge.title}`);
      console.log(`   - ID: ${gratitudeChallenge.id}`);
      console.log(`   - Days: ${gratitudeChallenge.total_days}`);
      console.log(`   - Active: ${gratitudeChallenge.is_active}`);
    } else {
      console.log('❌ Gratitude challenge not found');
    }
    
    // Test 3: Check challenge prompts
    console.log('\n3️⃣ Testing challenge prompts...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    if (gratitudeChallenge) {
      const { data: prompts, error } = await supabase
        .from('challenge_prompts')
        .select('day_number, morning_prompt, scripture_reference')
        .eq('challenge_id', gratitudeChallenge.id)
        .in('day_number', [1, 7, 14, 50, 100])
        .order('day_number');
      
      if (error) {
        console.log(`❌ Error fetching prompts: ${error.message}`);
      } else {
        console.log(`✅ Sample prompts retrieved (${prompts.length} samples):`);
        prompts.forEach(prompt => {
          const preview = prompt.morning_prompt 
            ? prompt.morning_prompt.substring(0, 60) + '...'
            : '[Review day - no prompt]';
          console.log(`   Day ${prompt.day_number}: ${preview}`);
          if (prompt.scripture_reference) {
            console.log(`       Scripture: ${prompt.scripture_reference}`);
          }
        });
      }
    }
    
    // Test 4: Verify all 100 days have data
    console.log('\n4️⃣ Verifying complete dataset...');
    if (gratitudeChallenge) {
      const { data: allPrompts, error } = await supabase
        .from('challenge_prompts')
        .select('day_number')
        .eq('challenge_id', gratitudeChallenge.id)
        .order('day_number');
      
      if (error) {
        console.log(`❌ Error checking dataset: ${error.message}`);
      } else {
        const dayNumbers = allPrompts.map(p => p.day_number);
        const missingDays = [];
        
        for (let day = 1; day <= 100; day++) {
          if (!dayNumbers.includes(day)) {
            missingDays.push(day);
          }
        }
        
        if (missingDays.length === 0) {
          console.log(`✅ Complete dataset: All 100 days present`);
        } else {
          console.log(`❌ Missing days: ${missingDays.join(', ')}`);
        }
        
        console.log(`   Total prompts imported: ${allPrompts.length}`);
      }
    }
    
    console.log('\n🎉 API Testing Complete!');
    console.log('\nNext steps:');
    console.log('1. Build the frontend components');
    console.log('2. Create the challenge screens');
    console.log('3. Test the full user flow');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testChallengeAPI();
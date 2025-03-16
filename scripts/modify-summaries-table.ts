import fs from 'fs';
import path from 'path';

async function showSQLInstructions() {
  try {
    console.log('To modify the summaries table structure, please follow these steps:');
    console.log('1. Log in to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Create a new query and paste the following SQL:');
    console.log('---------------------------------------------------');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'modify-summaries-table.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log(sqlQuery);
    console.log('---------------------------------------------------');
    console.log('4. Run the query to update your summaries table structure');
    console.log('5. Once completed, regenerate any existing summaries to use the new structure');
  } catch (error) {
    console.error('Error reading SQL file:', error);
  }
}

showSQLInstructions(); 
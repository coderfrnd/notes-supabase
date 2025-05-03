const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to create table if it doesn't exist
// async function createTableIfNotExists() {
//   try {
//     // Check if table exists by trying to select from it
//     const { data, error } = await supabase
//       .from('notes')
//       .select('id')
//       .limit(1);

//     if (error && error.code === '42P01') { // Table doesn't exist
//       console.log('Table does not exist. Please create it in Supabase SQL Editor.');
//       console.log('Run this SQL in your Supabase SQL Editor:');
//       console.log(`
//         CREATE TABLE notes (
//           id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//           user_id UUID REFERENCES auth.users(id) NOT NULL,
//           title TEXT NOT NULL,
//           content TEXT,
//           created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
//           updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
//           is_archived BOOLEAN DEFAULT false,
//           tags TEXT[]
//         );

//         CREATE INDEX notes_user_id_idx ON notes(user_id);

//         CREATE OR REPLACE FUNCTION update_updated_at_column()
//         RETURNS TRIGGER AS $$
//         BEGIN
//           NEW.updated_at = timezone('utc'::text, now());
//           RETURN NEW;
//         END;
//         $$ language 'plpgsql';

//         CREATE TRIGGER update_notes_updated_at
//           BEFORE UPDATE ON notes
//           FOR EACH ROW
//           EXECUTE FUNCTION update_updated_at_column();
//       `);
//       return false;
//     }
    
//     return true;
//   } catch (error) {
//     console.error('Error checking table:', error);
//     return false;
//   }
// }

// // Initialize table on server start
// createTableIfNotExists();

// Health check endpoint
app.get('/check', async (req, res) => {
  try {
    // Check if Supabase client is properly initialized
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        status: 'error',
        message: 'Supabase credentials not configured',
        error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables'
      });
    }

    // Try to get the current user (this is a lightweight operation)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // If we get an auth error, it means the connection is working but we're not authenticated
      // This is expected since we're using the anon key
      console.log('Supabase connection check:', error.message);
      return res.json({
        status: 'ok',
        message: 'Supabase connection successful (anonymous)',
        supabase: {
          url: supabaseUrl,
          connected: true,
          authenticated: false
        }
      });
    }
    
    res.json({
      status: 'ok',
      message: 'Supabase connection successful',
      supabase: {
        url: supabaseUrl,
        connected: true,
        authenticated: true
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Express + Supabase server!' });
});

// Helper function to extract the token from the Authorization header
function getTokenFromHeader(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return null;
  return parts[1];
}

// Get all notes
app.get('/notes', async (req, res) => {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new note
app.post('/notes', async (req, res) => {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { title, content, tags } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          user_id: user.id,
          title,
          content: content || '',
          tags: tags || []
        }
      ])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: 'Signup successful. Please check your email for confirmation.', data });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });
  res.json({
    message: 'Login successful',
    access_token: data.session.access_token,
    user: data.user
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/check`);
}); 
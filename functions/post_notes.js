const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Parse the request body
    const body = JSON.parse(event.body);
    const { title, content, tags } = body;

    // Validate required fields
    if (!title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Title is required' })
      };
    }

    // Create the new note
    const { data: note, error: dbError } = await supabase
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

    if (dbError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: dbError.message })
      };
    }

    return {
      statusCode: 201,
      body: JSON.stringify(note)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 
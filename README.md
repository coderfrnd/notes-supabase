# Notes Service - Supabase Backend

A notes app using supabase which mentiond in assingnment

## Schema Design

### Notes Table Structure

```sql
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  --> unique primary key
    user_id UUID REFERENCES auth.users(id) NOT NULL, ---> auth
    title TEXT NOT NULL, 
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_archived BOOLEAN DEFAULT false,
    tags TEXT[]
);
```

### Design Choices

1. **Primary Key (UUID)**
   - Used UUID instead of auto-incrementing integers for better security and scalability
   - `gen_random_uuid()` ensures globally unique identifiers
   - Prevents enumeration attacks and makes it harder to guess note IDs

2. **User Reference**
   - `user_id` column references Supabase's built-in `auth.users` table
   - Ensures data isolation between users
   - Enables row-level security policies

3. **Timestamps**
   - `created_at` and `updated_at` track note creation and modification times
   - Automatic `updated_at` updates via trigger
   - UTC timezone for consistency across regions

4. **Content Fields**
   - `title` is required (NOT NULL) as every note needs a title
   - `content` is optional (NULL) to allow for quick note creation
   - `tags` as TEXT[] for flexible categorization

5. **Archiving**
   - `is_archived` boolean with default false
   - Allows for soft deletion/archiving of notes
   - Enables future features like archive management

6. **Indexing**
   - Created index on `user_id` for faster user-specific queries
   - Optimizes performance for the most common access pattern

## API Endpoints

### GET /notes
- Returns all notes for the authenticated user
- Orders notes by creation date (newest first)
- Requires authentication
- Returns 401 if not authenticated

### POST /notes
- Creates a new note for the authenticated user
- Required fields: title
- Optional fields: content, tags
- Returns 201 on success with the created note
- Returns 401 if not authenticated
- Returns 400 if title is missing

## Security Considerations

1. **Authentication**
   - All endpoints require user authentication
   - Uses Supabase's built-in auth system
   - Verifies user identity before any database operations

2. **Data Isolation**
   - Notes are strictly tied to user IDs
   - No cross-user data access possible
   - Database queries always include user_id filter

3. **Input Validation**
   - Required fields are validated
   - Optional fields have sensible defaults
   - Prevents malformed data from entering the system

## How to Log In and Get Your Access Token

After signing up, you can log in using the `/login` endpoint. Here is an example using Postman:

**POST** `https://notes-supabase.onrender.com/login`

Body (JSON):
```json
{
  "email": "your@email.com",
  "password": "yourpassword"
}
```

If successful, you will get a response like this (see screenshot below):

![Login in Postman](login_postman.png)

- Copy the `access_token` from the response.
- Use this token in the `Authorization` header for all protected endpoints (like `/notes`).

## Example API Usage with curl

### 1. Create a Note

```bash
curl -X POST https://notes-supabase.onrender.com/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d    `{
    "title" : "hhh",
    "content": "This is .",
    "tags": ["personal", "important"]
  }'
```

**Sample Output:**
```json
{
  "id": "b3b1c2e0-8c2a-4e2a-9b1a-2c3e4d5f6a7b",
  "user_id": "1a697ddc-69c4-4c4a-8f7e-9dba44aae9b2",
  "title": "Beat",
  "content": "This is the story.",
  "created_at": "2025-05-04T10:00:00.000Z",
  "updated_at": "2025-05-04T10:00:00.000Z",
  "is_archived": false,
  "tags": ["per", "important"]
}
```

### 2. Get All Notes

```bash
curl https://notes-supabase.onrender.com/notes \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Sample Output:**
```json
[
  {
    "id": "b3b1c2e0-8c2a-4e2a-9b1a-2c3e4d5f6a7b",
    "user_id": "1a697ddc-69c4-4c4a-8f7e-9dba44aae9b2",
    "title": "  Beat one ",
    "content": "This is the story",
    "created_at": "2025-05-04T10:00:00.000Z",
    "updated_at": "2025-05-04T10:00:00.000Z",
    "is_archived": false,
    "tags": ["pel", "important"]
  }
]
``` 
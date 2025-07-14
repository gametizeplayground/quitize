# Quitize Online Setup Guide

This guide will help you set up your quiz game to work online using Supabase instead of localStorage.

## Prerequisites

1. A Supabase account (free tier available at https://supabase.com)
2. Your existing quiz game files

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign up/login
2. Create a new project
3. Note down your project URL and anon key (you'll find these in Settings > API)

## Step 2: Set Up Database Tables

1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `supabase-schema.sql` into the editor
3. Run the SQL to create all necessary tables and policies

## Step 3: Configure Supabase Connection

1. Open `supabase-config.js`
2. Replace the placeholder values with your actual Supabase credentials:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key
```

You can find these values in your Supabase dashboard under Settings > API.

## Step 4: Update Your Files

The following files have been created for online functionality:

- `host-online.html` - Host dashboard with Supabase integration
- `player-online.html` - Player interface with Supabase integration
- `supabase-config.js` - Supabase configuration and database operations
- `supabase-schema.sql` - Database schema for Supabase

## Step 5: Test the Online Version

1. Open `host-online.html` in your browser
2. Create a new game
3. Share the game code with players
4. Players can join using `player-online.html`

## Key Differences from Local Version

### Real-time Communication
- **Local**: Uses localStorage and storage events
- **Online**: Uses Supabase real-time subscriptions

### Data Storage
- **Local**: Data stored in browser localStorage
- **Online**: Data stored in Supabase PostgreSQL database

### Scalability
- **Local**: Only works on same device/network
- **Online**: Works across the internet

## Database Schema

The online version uses these tables:

1. **game_sessions** - Stores game information and player lists
2. **players** - Individual player records
3. **answers** - Player answers to questions
4. **quiz_states** - Current quiz state for synchronization

## Real-time Features

The online version includes real-time updates for:
- Players joining/leaving
- Quiz state changes
- Answer submissions
- Score updates

## Deployment

To deploy your online quiz game:

1. Upload all files to your web server
2. Ensure `supabase-config.js` has the correct credentials
3. Make sure your Supabase project is accessible from your domain

## Troubleshooting

### Common Issues

1. **"Game not found" error**
   - Check that your Supabase credentials are correct
   - Ensure the database tables were created successfully

2. **Players not joining**
   - Check browser console for errors
   - Verify Supabase real-time is enabled in your project

3. **Real-time updates not working**
   - Check that Row Level Security (RLS) policies are set up correctly
   - Verify your Supabase project has real-time enabled

### Debug Mode

To enable debug logging, add this to your browser console:

```javascript
localStorage.setItem('debug', 'true');
```

## Security Considerations

The current setup allows all operations for simplicity. For production:

1. Implement proper authentication
2. Add rate limiting
3. Set up more restrictive RLS policies
4. Use environment variables for sensitive data

## Performance Tips

1. **Database Indexes**: The schema includes indexes for better performance
2. **Connection Pooling**: Supabase handles this automatically
3. **Real-time Optimization**: Only subscribe to necessary channels

## Cost Considerations

Supabase free tier includes:
- 500MB database
- 2GB bandwidth
- 50,000 monthly active users
- Real-time subscriptions

For most quiz games, this should be sufficient.

## Migration from Local Version

If you want to migrate from the local version:

1. Keep your existing `host.html` and `player.html` for local testing
2. Use `host-online.html` and `player-online.html` for online games
3. Update any shared assets or styles as needed

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Test with a simple game first
4. Check Supabase logs in the dashboard

## Next Steps

Once your online version is working, consider:

1. Adding user authentication
2. Implementing game history
3. Creating custom quiz content
4. Adding analytics and reporting
5. Implementing advanced features like teams or tournaments 
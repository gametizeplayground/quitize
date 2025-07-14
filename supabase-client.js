// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://flsbmusrqrypeadxywbv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc2JtdXNycXJ5cGVhZHh5d2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTkxODUsImV4cCI6MjA2ODAzNTE4NX0.8Dleg0TIJx1zPC10RbyTyq9HwdC1Cu7_BV-xfTQbkRU';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database functions to replace localStorage
class GameDatabase {
  
  // Get game session by code
  static async getGameSession(code) {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('game_code', code)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching game session:', error);
        return {};
      }
      
      return data || {};
    } catch (error) {
      console.error('Error in getGameSession:', error);
      return {};
    }
  }
  
  // Create or update game session
  static async saveGameSession(code, sessionData) {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .upsert({
          game_code: code,
          players: sessionData.players || [],
          scores: sessionData.scores || {},
          quiz: sessionData.quiz || {},
          status: sessionData.status || 'waiting'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving game session:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in saveGameSession:', error);
      return false;
    }
  }
  
  // Subscribe to real-time changes
  static subscribeToGameSession(code, callback) {
    const subscription = supabase
      .channel(`game_${code}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
        filter: `game_code=eq.${code}`
      }, (payload) => {
        if (payload.new) {
          callback(payload.new);
        }
      })
      .subscribe();
    
    return subscription;
  }
  
  // Unsubscribe from real-time changes
  static unsubscribeFromGameSession(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
  
  // Delete game session (optional cleanup)
  static async deleteGameSession(code) {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .delete()
        .eq('game_code', code);
      
      if (error) {
        console.error('Error deleting game session:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteGameSession:', error);
      return false;
    }
  }
}

// Helper functions that replace localStorage usage
async function getGameSession(code) {
  return await GameDatabase.getGameSession(code);
}

async function saveGameSession(code, sessionData) {
  return await GameDatabase.saveGameSession(code, sessionData);
}

// Real-time subscription management
let gameSubscription = null;

function startGameStateListener(code, callback) {
  if (gameSubscription) {
    GameDatabase.unsubscribeFromGameSession(gameSubscription);
  }
  
  gameSubscription = GameDatabase.subscribeToGameSession(code, callback);
}

function stopGameStateListener() {
  if (gameSubscription) {
    GameDatabase.unsubscribeFromGameSession(gameSubscription);
    gameSubscription = null;
  }
} 
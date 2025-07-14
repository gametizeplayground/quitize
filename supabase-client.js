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
          quiz: sessionData.quiz || sessionData.quizState || {},
          status: sessionData.status || sessionData.state || 'waiting'
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
    console.log('Setting up Supabase subscription for game code:', code);
    
    const subscription = supabase
      .channel(`game_${code}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
        filter: `game_code=eq.${code}`
      }, (payload) => {
        console.log('Supabase real-time payload received:', payload);
        if (payload.new) {
          console.log('Calling callback with payload.new:', payload.new);
          callback(payload.new);
        }
      })
      .subscribe((status) => {
        console.log('Supabase subscription status:', status);
      });
    
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
  console.log(`Getting game session for code: ${code}`);
  const result = await GameDatabase.getGameSession(code);
  console.log(`Retrieved session:`, result);
  return result;
}

async function saveGameSession(code, sessionData) {
  console.log(`Saving game session for code: ${code}`, sessionData);
  const result = await GameDatabase.saveGameSession(code, sessionData);
  console.log(`Save result: ${result}`);
  return result;
}

// Real-time subscription management
let gameSubscription = null;

function startGameStateListener(code, callback) {
  console.log(`Starting game state listener for: ${code}`);
  
  if (gameSubscription) {
    console.log('Stopping existing subscription...');
    GameDatabase.unsubscribeFromGameSession(gameSubscription);
  }
  
  // Add a small delay to ensure proper cleanup
  setTimeout(() => {
    console.log('Setting up new subscription...');
    gameSubscription = GameDatabase.subscribeToGameSession(code, callback);
    
    // Test the subscription after a short delay
    setTimeout(async () => {
      console.log('Testing if real-time is working by fetching initial data...');
      try {
        const currentData = await GameDatabase.getGameSession(code);
        console.log('Initial data for real-time test:', currentData);
        if (currentData && Object.keys(currentData).length > 0) {
          console.log('Calling callback with initial data...');
          callback(currentData);
        }
      } catch (error) {
        console.error('Error testing real-time subscription:', error);
      }
    }, 1000);
  }, 100);
}

function stopGameStateListener() {
  if (gameSubscription) {
    GameDatabase.unsubscribeFromGameSession(gameSubscription);
    gameSubscription = null;
  }
} 
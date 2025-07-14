// Supabase configuration
const SUPABASE_URL = 'https://idwxcdayhrajngnkehdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkd3hjZGF5aHJham5nbmtlaGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NjMwNTYsImV4cCI6MjA2ODAzOTA1Nn0.uC_1moEisN3Vh4dNeyOOAr-FdaoaNp1G_lkRGJoSxzY';

// Initialize Supabase client
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table names
const TABLES = {
    GAME_SESSIONS: 'game_sessions',
    PLAYERS: 'players',
    ANSWERS: 'answers',
    QUIZ_STATES: 'quiz_states'
};

// Real-time subscription handlers
let gameSessionSubscription = null;
let quizStateSubscription = null;

// Initialize real-time subscriptions for a game
function initializeGameSubscriptions(gameCode) {
    // Subscribe to game session changes
    gameSessionSubscription = window.supabaseClient
        .channel(`game_${gameCode}`)
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: TABLES.GAME_SESSIONS,
                filter: `game_code=eq.${gameCode}`
            }, 
            (payload) => {
                console.log('Game session updated:', payload);
                handleGameSessionUpdate(payload);
            }
        )
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: TABLES.PLAYERS,
                filter: `game_code=eq.${gameCode}`
            }, 
            (payload) => {
                console.log('Player updated:', payload);
                handlePlayerUpdate(payload);
            }
        )
        .subscribe();

    // Subscribe to quiz state changes
    quizStateSubscription = window.supabaseClient
        .channel(`quiz_${gameCode}`)
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: TABLES.QUIZ_STATES,
                filter: `game_code=eq.${gameCode}`
            }, 
            (payload) => {
                console.log('Quiz state updated:', payload);
                handleQuizStateUpdate(payload);
            }
        )
        .subscribe();
}

// Clean up subscriptions
function cleanupSubscriptions() {
    if (gameSessionSubscription) {
        window.supabaseClient.removeChannel(gameSessionSubscription);
        gameSessionSubscription = null;
    }
    if (quizStateSubscription) {
        window.supabaseClient.removeChannel(quizStateSubscription);
        quizStateSubscription = null;
    }
}

// Handle game session updates
function handleGameSessionUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
        // Update local game session data
        const gameSession = {
            gameCode: newRecord.game_code,
            players: newRecord.players || [],
            scores: newRecord.scores || {},
            lastUpdated: newRecord.updated_at
        };
        
        // Trigger custom event for UI updates
        window.dispatchEvent(new CustomEvent('gameSessionUpdated', {
            detail: { gameCode: newRecord.game_code, session: gameSession }
        }));
    }
}

// Handle player updates
function handlePlayerUpdate(payload) {
    console.log('handlePlayerUpdate called:', payload);
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT') {
        // New player joined
        window.dispatchEvent(new CustomEvent('playerJoined', {
            detail: { player: newRecord }
        }));
    } else if (eventType === 'DELETE') {
        // Player left
        window.dispatchEvent(new CustomEvent('playerLeft', {
            detail: { player: oldRecord }
        }));
    }
}

// Handle quiz state updates
function handleQuizStateUpdate(payload) {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
        // Update quiz state for players
        const quizState = {
            phase: newRecord.phase,
            currentQuestion: newRecord.current_question,
            questionData: newRecord.question_data,
            lastUpdated: newRecord.updated_at
        };
        
        window.dispatchEvent(new CustomEvent('quizStateUpdated', {
            detail: { gameCode: newRecord.game_code, quizState: quizState }
        }));
    }
}

// Database operations
const GameDB = {
    // Create a new game session
    async createGameSession(gameCode) {
        const { data, error } = await window.supabaseClient
            .from(TABLES.GAME_SESSIONS)
            .insert({
                game_code: gameCode,
                players: [],
                scores: {},
                status: 'waiting',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) {
            console.error('Error creating game session:', error);
            throw error;
        }
        
        return data;
    },

    // Get game session
    async getGameSession(gameCode) {
        const { data, error } = await window.supabaseClient
            .from(TABLES.GAME_SESSIONS)
            .select('*')
            .eq('game_code', gameCode)
            .single();
            
        if (error) {
            console.error('Error getting game session:', error);
            return null;
        }
        
        return data;
    },

    // Update game session
    async updateGameSession(gameCode, updates) {
        const { data, error } = await window.supabaseClient
            .from(TABLES.GAME_SESSIONS)
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('game_code', gameCode)
            .select()
            .single();
            
        if (error) {
            console.error('Error updating game session:', error);
            throw error;
        }
        
        return data;
    },

    // Add player to game
    async addPlayer(gameCode, player) {
        const { data, error } = await window.supabaseClient
            .from(TABLES.PLAYERS)
            .insert({
                game_code: gameCode,
                name: player.name,
                player_id: player.id,
                joined_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) {
            console.error('Error adding player:', error);
            throw error;
        }
        
        return data;
    },

    // Remove player from game
    async removePlayer(gameCode, playerId) {
        const { error } = await window.supabaseClient
            .from(TABLES.PLAYERS)
            .delete()
            .eq('game_code', gameCode)
            .eq('player_id', playerId);
            
        if (error) {
            console.error('Error removing player:', error);
            throw error;
        }
    },

    // Submit player answer
    async submitAnswer(gameCode, playerId, questionIndex, answer, timeTaken) {
        const { data, error } = await window.supabaseClient
            .from(TABLES.ANSWERS)
            .insert({
                game_code: gameCode,
                player_id: playerId,
                question_index: questionIndex,
                answer: answer,
                time_taken: timeTaken,
                submitted_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) {
            console.error('Error submitting answer:', error);
            throw error;
        }
        
        return data;
    },

    // Update quiz state
    async updateQuizState(gameCode, quizState) {
        const { data, error } = await window.supabaseClient
            .from(TABLES.QUIZ_STATES)
            .upsert({
                game_code: gameCode,
                phase: quizState.phase,
                current_question: quizState.currentQuestion,
                question_data: quizState.questionData,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) {
            console.error('Error updating quiz state:', error);
            throw error;
        }
        
        return data;
    },

    // Get answers for a question
    async getQuestionAnswers(gameCode, questionIndex) {
        const { data, error } = await window.supabaseClient
            .from(TABLES.ANSWERS)
            .select('*')
            .eq('game_code', gameCode)
            .eq('question_index', questionIndex);
            
        if (error) {
            console.error('Error getting answers:', error);
            return [];
        }
        
        return data;
    }
};

// Export for use in other files
window.GameDB = GameDB;
window.initializeGameSubscriptions = initializeGameSubscriptions;
window.cleanupSubscriptions = cleanupSubscriptions; 
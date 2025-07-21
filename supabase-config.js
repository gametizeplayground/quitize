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

// Expose subscriptions globally for debugging
window.gameSessionSubscription = null;
window.quizStateSubscription = null;

// Initialize real-time subscriptions for a game
function initializeGameSubscriptions(gameCode) {
    console.log('Initializing subscriptions for game:', gameCode);
    
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
        .subscribe((status) => {
            console.log('Game session subscription status:', status);
        });
    
    // Update global reference
    window.gameSessionSubscription = gameSessionSubscription;

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
        .subscribe((status) => {
            console.log('Quiz state subscription status:', status);
        });
    
    // Update global reference  
    window.quizStateSubscription = quizStateSubscription;
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
            status: newRecord.status || 'waiting',
            lastUpdated: newRecord.updated_at
        };
        
        console.log('Game session updated:', gameSession);
        console.log('Dispatching gameSessionUpdated event for game:', newRecord.game_code);
        
        // Trigger custom event for UI updates
        const event = new CustomEvent('gameSessionUpdated', {
            detail: { gameCode: newRecord.game_code, session: gameSession }
        });
        window.dispatchEvent(event);
        console.log('Event dispatched successfully');
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
            countdown: newRecord.question_data?.countdown,
            timeLeft: newRecord.question_data?.timeLeft,
            lastUpdated: newRecord.updated_at
        };
        
        console.log('Quiz state updated:', quizState);
        
        window.dispatchEvent(new CustomEvent('quizStateUpdated', {
            detail: { gameCode: newRecord.game_code, quizState: quizState }
        }));
    }
}

// Database operations
const GameDB = {
    // Create a new game session
    async createGameSession(gameCode) {
        // First, clean up any existing game with this code
        await this.cleanupExistingGame(gameCode);
        
        const { data, error } = await window.supabaseClient
            .from(TABLES.GAME_SESSIONS)
            .insert({
                game_code: gameCode,
                players: [],
                scores: {},
                status: 'waiting',
                start_time: null, // Add start_time field
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

    // Clean up existing game data for a game code
    async cleanupExistingGame(gameCode) {
        try {
            // Delete from all tables in correct order (due to foreign key constraints)
            await window.supabaseClient
                .from(TABLES.ANSWERS)
                .delete()
                .eq('game_code', gameCode);
                
            await window.supabaseClient
                .from(TABLES.QUIZ_STATES)
                .delete()
                .eq('game_code', gameCode);
                
            await window.supabaseClient
                .from(TABLES.PLAYERS)
                .delete()
                .eq('game_code', gameCode);
                
            await window.supabaseClient
                .from(TABLES.GAME_SESSIONS)
                .delete()
                .eq('game_code', gameCode);
                
            console.log(`Cleaned up existing game data for code: ${gameCode}`);
        } catch (error) {
            console.warn('Error during cleanup (this is usually fine):', error);
        }
    },

    // Check if a game code already exists
    async gameCodeExists(gameCode) {
        const { data, error } = await window.supabaseClient
            .from(TABLES.GAME_SESSIONS)
            .select('game_code')
            .eq('game_code', gameCode)
            .single();
            
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error('Error checking game code:', error);
            return false;
        }
        
        return !!data;
    },

    // Test real-time connection
    async testConnection(gameCode) {
        console.log('Testing real-time connection for game:', gameCode);
        try {
            // Make a simple update to test if subscriptions are working
            // Only update the updated_at timestamp which exists
            await this.updateGameSession(gameCode, {
                updated_at: new Date().toISOString()
            });
            console.log('Connection test update sent');
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    },

    // Clean up old games (older than 2 hours)
    async cleanupOldGames() {
        try {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
            
            // Get old game codes first
            const { data: oldGames } = await window.supabaseClient
                .from(TABLES.GAME_SESSIONS)
                .select('game_code')
                .lt('updated_at', twoHoursAgo);
                
            if (oldGames && oldGames.length > 0) {
                console.log(`Cleaning up ${oldGames.length} old games...`);
                
                for (const game of oldGames) {
                    await this.cleanupExistingGame(game.game_code);
                }
                
                console.log('Old games cleanup completed');
            }
        } catch (error) {
            console.warn('Error during old games cleanup:', error);
        }
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
        console.log('Updating game session:', gameCode, 'with updates:', updates);
        
        const updateData = {
            ...updates,
            updated_at: new Date().toISOString()
        };
        
        console.log('Final update data:', updateData);
        
        const { data, error } = await window.supabaseClient
            .from(TABLES.GAME_SESSIONS)
            .update(updateData)
            .eq('game_code', gameCode)
            .select()
            .single();
            
        if (error) {
            console.error('❌ Database update error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error details:', error.details);
            throw error;
        }
        
        console.log('✅ Game session updated successfully:', data);
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
        // Combine all quiz state data into question_data for storage
        const questionData = {
            ...(quizState.questionData || {}),
            countdown: quizState.countdown,
            timeLeft: quizState.timeLeft
        };
        
        const quizStateData = {
            game_code: gameCode,
            phase: quizState.phase,
            current_question: quizState.currentQuestion,
            question_data: questionData,
            updated_at: new Date().toISOString()
        };

        // Try upsert first
        let { data, error } = await window.supabaseClient
            .from(TABLES.QUIZ_STATES)
            .upsert(quizStateData, {
                onConflict: 'game_code'
            })
            .select()
            .single();
            
        // If upsert fails due to conflict, try update first then insert
        if (error && error.code === '23505') { // Unique constraint violation
            console.log('Quiz state conflict detected, attempting update...');
            
            // Try update first
            const { data: updateData, error: updateError } = await window.supabaseClient
                .from(TABLES.QUIZ_STATES)
                .update(quizStateData)
                .eq('game_code', gameCode)
                .select()
                .single();
                
            if (!updateError) {
                return updateData;
            }
            
            // If update fails, try delete then insert
            console.log('Update failed, cleaning up and inserting...');
            await window.supabaseClient
                .from(TABLES.QUIZ_STATES)
                .delete()
                .eq('game_code', gameCode);
                
            const { data: insertData, error: insertError } = await window.supabaseClient
                .from(TABLES.QUIZ_STATES)
                .insert(quizStateData)
                .select()
                .single();
                
            if (insertError) {
                console.error('Error inserting quiz state after cleanup:', insertError);
                throw insertError;
            }
            
            return insertData;
        }
        
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
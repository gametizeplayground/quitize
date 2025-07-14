-- Supabase Database Schema for Quitize Quiz Game

-- Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quiz_states ENABLE ROW LEVEL SECURITY;

-- Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_code VARCHAR(8) UNIQUE NOT NULL,
    players JSONB DEFAULT '[]',
    scores JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players Table
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_code VARCHAR(8) NOT NULL,
    player_id VARCHAR(50) NOT NULL,
    name VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_code, player_id),
    FOREIGN KEY (game_code) REFERENCES game_sessions(game_code) ON DELETE CASCADE
);

-- Add last_active column if it doesn't exist (for existing installations)
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Answers Table
CREATE TABLE IF NOT EXISTS answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_code VARCHAR(8) NOT NULL,
    player_id VARCHAR(50) NOT NULL,
    question_index INTEGER NOT NULL,
    answer VARCHAR(1) NOT NULL,
    time_taken INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (game_code) REFERENCES game_sessions(game_code) ON DELETE CASCADE
);

-- Quiz States Table
CREATE TABLE IF NOT EXISTS quiz_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_code VARCHAR(8) UNIQUE NOT NULL,
    phase VARCHAR(20) DEFAULT 'waiting',
    current_question INTEGER DEFAULT 0,
    question_data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (game_code) REFERENCES game_sessions(game_code) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_code ON game_sessions(game_code);
CREATE INDEX IF NOT EXISTS idx_players_game_code ON players(game_code);
CREATE INDEX IF NOT EXISTS idx_players_player_id ON players(player_id);
CREATE INDEX IF NOT EXISTS idx_players_last_active ON players(last_active);
CREATE INDEX IF NOT EXISTS idx_answers_game_code ON answers(game_code);
CREATE INDEX IF NOT EXISTS idx_answers_question_index ON answers(question_index);
CREATE INDEX IF NOT EXISTS idx_quiz_states_game_code ON quiz_states(game_code);

-- Row Level Security Policies

-- Game Sessions: Allow all operations for now (can be restricted later)
CREATE POLICY "Allow all operations on game_sessions" ON game_sessions
    FOR ALL USING (true);

-- Players: Allow all operations for now
CREATE POLICY "Allow all operations on players" ON players
    FOR ALL USING (true);

-- Answers: Allow all operations for now
CREATE POLICY "Allow all operations on answers" ON answers
    FOR ALL USING (true);

-- Quiz States: Allow all operations for now
CREATE POLICY "Allow all operations on quiz_states" ON quiz_states
    FOR ALL USING (true);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_game_sessions_updated_at 
    BEFORE UPDATE ON game_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_states_updated_at 
    BEFORE UPDATE ON quiz_states 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old game sessions (optional)
CREATE OR REPLACE FUNCTION cleanup_old_games()
RETURNS void AS $$
BEGIN
    -- Delete game sessions older than 24 hours
    DELETE FROM game_sessions 
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up a cron job to clean up old games (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-games', '0 2 * * *', 'SELECT cleanup_old_games();'); 
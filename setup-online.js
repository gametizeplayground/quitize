// Online Setup Helper Script
// Run this in your browser console to help configure the online version

const SetupHelper = {
    // Check if Supabase is properly configured
    checkSupabaseConfig() {
        console.log('🔍 Checking Supabase configuration...');
        
        // Check if supabase-config.js is loaded
        if (typeof GameDB === 'undefined') {
            console.error('❌ supabase-config.js not loaded. Make sure it\'s included in your HTML files.');
            return false;
        }
        
        // Check if Supabase client is available
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase client not loaded. Check your CDN link.');
            return false;
        }
        
        console.log('✅ Supabase client loaded successfully');
        return true;
    },
    
    // Test database connection
    async testDatabaseConnection() {
        console.log('🔍 Testing database connection...');
        
        try {
            // Try to create a test game session
            const testCode = 'TEST' + Date.now();
            const result = await GameDB.createGameSession(testCode);
            
            if (result) {
                console.log('✅ Database connection successful');
                
                // Clean up test data
                try {
                    await GameDB.updateGameSession(testCode, { status: 'deleted' });
                } catch (cleanupError) {
                    console.warn('⚠️ Could not clean up test data:', cleanupError);
                }
                
                return true;
            }
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            console.log('💡 Make sure you have:');
            console.log('   1. Created a Supabase project');
            console.log('   2. Run the SQL schema in your Supabase dashboard');
            console.log('   3. Updated supabase-config.js with your credentials');
            return false;
        }
    },
    
    // Validate configuration
    async validateSetup() {
        console.log('🚀 Starting setup validation...');
        
        const configOk = this.checkSupabaseConfig();
        if (!configOk) {
            return false;
        }
        
        const dbOk = await this.testDatabaseConnection();
        if (!dbOk) {
            return false;
        }
        
        console.log('🎉 Setup validation complete! Your online quiz game should work.');
        return true;
    },
    
    // Show setup instructions
    showInstructions() {
        console.log(`
📋 SETUP INSTRUCTIONS:

1. Create a Supabase project at https://supabase.com
2. Go to Settings > API and copy your URL and anon key
3. Open supabase-config.js and replace:
   - YOUR_SUPABASE_URL with your project URL
   - YOUR_SUPABASE_ANON_KEY with your anon key
4. In your Supabase dashboard, go to SQL Editor
5. Copy and paste the contents of supabase-schema.sql
6. Run the SQL to create the database tables
7. Run this validation again

For detailed instructions, see README-ONLINE-SETUP.md
        `);
    },
    
    // Quick test game
    async testGame() {
        console.log('🎮 Testing game functionality...');
        
        try {
            // Create a test game
            const gameCode = 'TEST' + Date.now();
            await GameDB.createGameSession(gameCode);
            console.log('✅ Test game created:', gameCode);
            
            // Add a test player
            await GameDB.addPlayer(gameCode, {
                id: 'test_player_' + Date.now(),
                name: 'TestPlayer'
            });
            console.log('✅ Test player added');
            
            // Update quiz state
            await GameDB.updateQuizState(gameCode, {
                phase: 'waiting',
                currentQuestion: 0
            });
            console.log('✅ Quiz state updated');
            
            console.log('🎉 Game functionality test successful!');
            return true;
            
        } catch (error) {
            console.error('❌ Game functionality test failed:', error);
            return false;
        }
    }
};

// Make it available globally
window.SetupHelper = SetupHelper;

// Auto-run validation if this script is loaded
if (typeof GameDB !== 'undefined') {
    console.log('🔧 Setup helper loaded. Run SetupHelper.validateSetup() to check your configuration.');
} else {
    console.log('⚠️ Setup helper loaded, but GameDB not available. Make sure supabase-config.js is loaded first.');
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SetupHelper;
} 
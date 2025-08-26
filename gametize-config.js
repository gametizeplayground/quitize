// Gametize API Configuration
// ===========================
// Change the topicId below to use different quiz topics
// You can find topic IDs in your Gametize dashboard or API responses

const GAMETIZE_CONFIG = {
    baseUrl: 'https://beta.gametize.com/api3',
    topicId: '83890', // Change this for different topics
    limit: 10,
    retryAttempts: 3,
    retryDelay: 2000
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAMETIZE_CONFIG;
} else {
    window.GAMETIZE_CONFIG = GAMETIZE_CONFIG;
}

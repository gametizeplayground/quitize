# Gametize API Integration

This document explains how to use the new Gametize API integration in Quitize.

## Overview

The quiz system now fetches questions automatically from the Gametize API instead of using hardcoded questions. This allows for:

- Dynamic question content
- Easy topic switching
- Centralized question management
- Real-time question updates

## Configuration

### 1. Topic ID Configuration

To change the quiz topic, edit the `gametize-config.js` file:

```javascript
const GAMETIZE_CONFIG = {
    baseUrl: 'https://beta.gametize.com/api3',
    topicId: '83890', // Change this for different topics
    limit: 10,
    retryAttempts: 3,
    retryDelay: 2000
};
```

**To find your topic ID:**
1. Go to your Gametize dashboard
2. Navigate to the topic you want to use
3. The topic ID is in the URL or API responses

### 2. API Endpoint

The system uses this endpoint format:
```
https://beta.gametize.com/api3/topics/{topicId}/challenges.json?limit={limit}
```

## How It Works

### 1. Question Fetching

- Questions are automatically fetched when the host page loads
- The system filters for quiz-type challenges only
- Questions are transformed to match the internal format

### 2. Correct Answer Detection

The system automatically determines correct answers by:
1. Checking if the `challengeDescription` contains any `optionTitle`
2. If a match is found, that option becomes the correct answer
3. If no match is found, the first option is used as default

**Example:**
```json
{
    "challengeTitle": "What is Gametize primarily used for?",
    "challengeDescription": "Select the correct answer that best describes Gametize's primary purpose.",
    "options": [
        {"optionTitle": "Online shopping", "id": 607043},
        {"optionTitle": "Social media networking", "id": 607044},
        {"optionTitle": "Gamification and engagement", "id": 607045},
        {"optionTitle": "Financial planning", "id": 607046}
    ]
}
```

In this case, since "Gamification and engagement" is mentioned in the description, it becomes the correct answer.

### 3. Dynamic Images

- Questions use the `challengeImage` field from the API
- If no image is provided, a fallback image is used
- Images are automatically loaded and displayed

### 4. Variable Option Counts

The system handles questions with 1-4 options:
- **1-2 options**: Centered in the first row
- **3-4 options**: Normal 2x2 grid layout
- Unused options are automatically hidden

## Error Handling

### 1. API Failures

If the API fails to load questions:
- An error screen is displayed
- A retry button allows manual retry
- Detailed error information is shown

### 2. Validation

Before starting a game, the system validates:
- Questions are loaded successfully
- Each question has required fields
- Options are properly formatted

### 3. Fallbacks

- If API fails, the game cannot start
- Users must resolve the issue before proceeding
- Refresh button allows manual question reloading

## User Interface

### 1. Host Interface

- **Refresh Button**: Manually reload questions from API
- **Loading Screen**: Shows while fetching questions
- **Error Screen**: Displays API errors with retry option
- **Dynamic Quiz Title**: Updates based on loaded questions

### 2. Player Interface

- Players automatically receive question data
- No changes needed to player interface
- Questions update automatically when host refreshes

## Troubleshooting

### Common Issues

1. **"No questions available"**
   - Check if the topic ID is correct
   - Verify the topic has quiz challenges
   - Check API endpoint accessibility

2. **"Invalid API response format"**
   - Verify the API endpoint is correct
   - Check if the topic exists
   - Ensure proper authentication if required

3. **"No correct answer found"**
   - Check if `challengeDescription` contains option text
   - Verify option titles match description content
   - System will default to first option

### Debug Information

The console shows detailed logging:
- API request URLs
- Raw API responses
- Question transformation details
- Error information

## API Response Format

The system expects this format:

```json
{
    "data": [
        {
            "challengeType": "quiz",
            "challengeTitle": "Question text",
            "challengeDescription": "Description with correct answer hint",
            "challengeImage": "https://example.com/image.png",
            "options": [
                {"optionTitle": "Option A", "id": 123},
                {"optionTitle": "Option B", "id": 124}
            ],
            "points": 10
        }
    ]
}
```

## Best Practices

1. **Topic Organization**: Use separate topics for different quiz types
2. **Question Descriptions**: Include clear hints for correct answer detection
3. **Image Quality**: Provide high-quality images for better user experience
4. **Option Count**: Aim for 2-4 options for optimal gameplay
5. **Testing**: Test with different topics before production use

## Migration from Hardcoded Questions

The old hardcoded questions have been completely replaced. If you need to:

1. **Add custom questions**: Create them in Gametize and use that topic ID
2. **Use local questions**: Modify the `fetchQuizQuestions` function
3. **Hybrid approach**: Combine API and local questions (requires code modification)

## Support

For issues with:
- **API Integration**: Check console logs and error messages
- **Gametize Platform**: Contact Gametize support
- **Quiz Functionality**: Review this documentation and console logs

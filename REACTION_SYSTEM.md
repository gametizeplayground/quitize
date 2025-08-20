# Live Reaction System

## Overview
The live reaction system allows players to send image-based reactions (clap, heart, confetti) that appear as floating animations on the host screen in real-time.

## Features

### Player Side
- **3 Reaction Buttons**: Located above the "Leave the room" button in the waiting room
  - **Clap** (`assets/livereaction/clap.png`)
  - **Heart** (`assets/livereaction/heart.png`) 
  - **Confetti** (`assets/livereaction/confetti.png`)
- **Visual Feedback**: Buttons pulse and scale when tapped with enhanced filter effects
- **Burst Effect**: Multiple quick taps create a burst animation
- **Throttling**: 200ms cooldown between reactions to prevent spam

### Host Side
- **Floating Animations**: Reaction images float up from bottom-left area with random drift
- **Burst Mode**: Larger images with enhanced effects for rapid-fire reactions
- **Performance Optimized**: Limited to 50 concurrent floating reactions
- **Real-time**: Uses Supabase broadcast channels for low-latency communication

## Technical Implementation

### Broadcasting System
- Uses Supabase real-time broadcast channels
- Channel name: `reactions_{gameCode}`
- Self-broadcasting disabled to prevent echoes
- Auto-cleanup of channels after use

### Performance Optimizations
1. **Player Throttling**: Minimum 200ms between reactions
2. **Host Rate Limiting**: Maximum 50 active floating reactions
3. **Memory Management**: Auto-cleanup of DOM elements after animation
4. **Non-blocking**: Reactions don't interfere with gameplay

### CSS Animations
- **floatUp**: Standard 3-second float animation for reaction images
- **floatUpBurst**: Enhanced 2.5-second animation with larger size for bursts
- **Random Drift**: Horizontal movement for visual variety
- **Image Effects**: Drop shadows and brightness filters for visual appeal
- **Responsive**: Smaller buttons on mobile devices

## Usage

### For Players
1. Join a game room
2. Wait in the waiting room
3. Tap any of the 3 reaction buttons (clap, heart, confetti)
4. Watch the host screen for your reactions!

### For Hosts
1. Start hosting a game
2. Reactions will automatically appear when players send them
3. Floating reaction images appear in the bottom-left area
4. Burst reactions have enhanced animations with larger size

## Performance Notes
- Reactions are throttled to maintain smooth gameplay
- System automatically limits concurrent animations
- Memory is cleaned up to prevent leaks
- Low CPU usage with CSS-based animations

## Future Enhancements
- Sound effects for reactions
- Custom reaction emojis
- Reaction statistics
- Player-specific reaction themes

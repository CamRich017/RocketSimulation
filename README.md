# Rocket Game Flavortown

A browser-based realistic rocket simulator where you can customize environmental factors and control a detailed rocket model.

## Features

- Realistic rocket physics simulation with detailed 3D-style model and animated thrust flames
- Planet selection with authentic gravity, atmosphere, and wind conditions:
  - **Earth**: Standard gravity, air density, and light wind
  - **Moon**: Low gravity, thin atmosphere, no wind
  - **Mars**: Moderate gravity, thin atmosphere, strong wind
  - **Venus**: High gravity, thick atmosphere, moderate wind
  - **Jupiter**: Very high gravity, low density, extreme wind
  - **Zero-G**: No gravity, atmosphere, or wind
- Advanced collision detection with realistic hitboxes for terrain and launch pad
- Launch pad structure with stricter landing requirements
- Dynamic terrain with hills and varied ground levels
- Multi-layer parallax background that creates depth as you ascend
- Particle effects for thrust exhaust, crashes, and atmospheric haze
- Real-time HUD displaying velocity, altitude, fuel, angle, and wind strength
- Visual altitude indicator bar
- Enhanced crash effects with debris particles
- Atmospheric visual effects based on planet density

## Controls

- **W / ↑**: Main upward thrust
- **A/D / ←/→**: Rotate left/right
- **S / ↓**: Downward thrust
- **Planet Select**: Choose different planets with unique gravity/atmosphere
- **Fuel Slider**: Set starting fuel capacity (50-500 units)
- **Launch Button**: Quick launch boost
- **Reset Button**: Reset rocket to starting position

## How to Run

1. (Optional) Install live-server for development:
   ```
   npm install
   npm start
   ```
   Then open `http://localhost:3000`

2. Or simply open `index.html` directly in your browser.

## Technologies Used

- Phaser.js for game engine and physics
- HTML5 Canvas for rendering
- JavaScript for game logic
- CSS for UI styling
- SVG for rocket and ground graphics

## Simulator Tips

- Adjust gravity to simulate different planets (e.g., 3.7 for Mars, 1.6 for Moon)
- Higher atmosphere density increases drag, making flight more challenging
- Wind affects horizontal movement - compensate with lateral thrust
- Monitor your velocity and angle for successful landings
- Fuel is consumed based on thrust usage - manage it carefully!
- Land gently (velocity < 50 m/s) to avoid crashes

Experiment with different combinations to master rocket flight!
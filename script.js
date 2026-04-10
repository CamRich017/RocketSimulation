// Advanced Canvas Rocket Simulator with Real Physics
window.onload = function() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        
        const gameCanvasDiv = document.getElementById('game-canvas');
        if (!gameCanvasDiv) {
            console.error('game-canvas div not found');
            return;
        }
        
        gameCanvasDiv.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }

    // Launch pad - sits on terrain at y=500
    const launchPad = {
        x: 350,
        y: 500,  // Top of launch pad at terrain level
        width: 100,
        height: 20
    };

    // Game state
    let rocket = {
        x: launchPad.x + launchPad.width / 2, // Center on launch pad
        y: launchPad.y - 45, // Position higher above launch pad to avoid clipping
        vx: 0,
        vy: 0,
        angle: 0,
        fuel: 100,
        mass: 10, // Game units
        thrust: 100, // Game units
        crashed: false,
        landed: false
    };

    let cameraY = 0; // For parallax
    const gravity = 9.8; // m/s²
    const airDensity = 1.225; // kg/m³
    const dragCoeff = 0.5;
    const frontalArea = 2; // m²
    const keys = {};
    let thrusting = false;
    let launchGracePeriod = 0; // Frames to ignore collision after launch

    // Stars with parallax (extended for infinite height)
    let stars = [];
    for (let i = 0; i < 500; i++) {
        stars.push({
            x: Math.random() * 800,
            y: Math.random() * 10000 - 5000, // Spread across huge range
            alpha: Math.random() * 0.5 + 0.3,
            parallax: Math.random() * 0.5 + 0.5 // Different speeds
        });
    }

    // Terrain variation - create a flat area for the launch pad
    let terrain = [];
    for (let i = 0; i < 800; i += 10) {
        let y = 500; // Base terrain level (lower so it's visible on 600px canvas)
        if (i < 340 || i > 460) {
            // Add variation outside the launch pad area
            y = 500 + Math.sin(i * 0.01) * 15 + Math.random() * 8;
        } else {
            // Keep launch pad area flat at y=500
            y = 500;
        }
        terrain.push({ x: i, y: y });
    }

    // Particles for thrust and effects
    let particles = [];

    // Background layers for more dynamic movement (extended for infinite height)
    let backgroundLayers = [];
    for (let i = 0; i < 50; i++) {
        backgroundLayers.push({
            y: 600 + i * 200,
            parallax: 0.1 + (i % 5) * 0.1,
            color: `hsl(${200 + (i % 5) * 20}, 70%, ${90 - (i % 5) * 10}%)`
        });
    }

    // Clouds
    const clouds = [];
    for (let i = 0; i < 10; i++) {
        clouds.push({
            x: Math.random() * 800,
            y: Math.random() * 400 + 200,
            size: Math.random() * 50 + 30
        });
    }

    // Input
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        keys[e.code] = true; // Also store by code for arrows
        e.preventDefault(); // Prevent default browser behavior
    });
    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
        keys[e.code] = false;
        e.preventDefault();
    });

    // Planet data with wind
    const planets = {
        earth: { name: 'Earth', gravity: 0.5, density: 1.0, wind: 0.1 },
        moon: { name: 'Moon', gravity: 0.1, density: 0.1, wind: 0.0 },
        mars: { name: 'Mars', gravity: 0.3, density: 0.7, wind: 0.3 },
        venus: { name: 'Venus', gravity: 0.4, density: 1.5, wind: 0.2 },
        jupiter: { name: 'Jupiter', gravity: 1.2, density: 0.5, wind: 0.5 },
        zero: { name: 'Zero-G', gravity: 0.0, density: 0.0, wind: 0.0 }
    };

    // UI
    let currentPlanet = 'earth';
    let gravityValue = planets.earth.gravity;
    let densityValue = planets.earth.density;
    let windValue = planets.earth.wind;
    
    const planetSelect = document.getElementById('planet-select');
    if (planetSelect) {
        planetSelect.addEventListener('change', (e) => {
            currentPlanet = e.target.value;
            const planet = planets[currentPlanet];
            gravityValue = planet.gravity;
            densityValue = planet.density;
            windValue = planet.wind;
            document.getElementById('planet-name').textContent = planet.name;
            
            // Update birds based on planet
            birds = [];
            if (currentPlanet === 'earth') {
                for (let i = 0; i < 3; i++) {
                    birds.push({
                        x: Math.random() * 800,
                        y: Math.random() * 300 + 100,
                        vx: (Math.random() - 0.5) * 2,
                        wingPhase: Math.random() * Math.PI * 2
                    });
                }
            }
        });
    }
    
    const fuelSlider = document.getElementById('fuel-slider');
    if (fuelSlider) {
        fuelSlider.addEventListener('input', (e) => {
            document.getElementById('fuel-value').textContent = e.target.value;
            rocket.fuel = parseInt(e.target.value);
        });
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => resetRocket());
    }
    
    const launchBtn = document.getElementById('launch-btn');
    if (launchBtn) {
        launchBtn.addEventListener('click', () => launchRocket());
    }

    // Birds for atmosphere (only on Earth-like planets) - initialize after currentPlanet is set
    let birds = [];
    if (currentPlanet === 'earth') {
        for (let i = 0; i < 3; i++) {
            birds.push({
                x: Math.random() * 800,
                y: Math.random() * 300 + 100,
                vx: (Math.random() - 0.5) * 2,
                wingPhase: Math.random() * Math.PI * 2
            });
        }
    }

    function resetRocket() {
        rocket.x = launchPad.x + launchPad.width / 2; // Center on launch pad
        rocket.y = launchPad.y - 45; // Position higher above launch pad
        rocket.vx = 0;
        rocket.vy = 0;
        rocket.angle = 0;
        rocket.fuel = parseInt(document.getElementById('fuel-slider').value);
        rocket.crashed = false;
        rocket.landed = false;
        cameraY = 0;
        // Clear particles and grace period on reset
        particles = [];
        launchGracePeriod = 0;
        // Update fuel display
        document.getElementById('fuel-value').textContent = rocket.fuel;
    }

    function launchRocket() {
        if (rocket.fuel > 10 && !rocket.crashed) {
            rocket.vy -= 5;
            rocket.fuel = Math.max(0, rocket.fuel - 10);
            launchGracePeriod = 30; // Ignore collisions for 15 frames after launch
        }
    }

    function update() {
        if (rocket.crashed) return;

        // Input
        let thrustX = 0;
        let thrustY = 0;
        thrusting = false;

        // Fuel management
        if ((keys['w'] || keys.ArrowUp) && rocket.fuel > 0) {
            const thrustForce = rocket.thrust;
            thrustX = Math.sin(rocket.angle) * thrustForce / rocket.mass;
            thrustY = -Math.cos(rocket.angle) * thrustForce / rocket.mass;
            thrusting = true;
            rocket.fuel = Math.max(0, rocket.fuel - 0.1);
            // Set grace period when thrusting from ground to prevent collision
            if (rocket.vy >= 0) launchGracePeriod = 30;

            // Thrust particles
            for (let i = 0; i < 3; i++) {
                particles.push({
                    x: rocket.x - Math.sin(rocket.angle) * 45,
                    y: rocket.y + Math.cos(rocket.angle) * 45,
                    vx: -Math.sin(rocket.angle) * 2 + (Math.random() - 0.5) * 4,
                    vy: Math.cos(rocket.angle) * 2 + (Math.random() - 0.5) * 4,
                    life: 30,
                    color: 'orange'
                });
            }
        }
        if (keys['a'] || keys.ArrowLeft) rocket.angle -= 0.02;
        if (keys['d'] || keys.ArrowRight) rocket.angle += 0.02;
        if ((keys['s'] || keys.ArrowDown) && rocket.fuel > 0) {
            thrustY += (rocket.thrust * 0.3) / rocket.mass;
            thrusting = true;
            rocket.fuel = Math.max(0, rocket.fuel - 0.05);
            // Set grace period for downward thrust too
            if (rocket.vy >= 0) launchGracePeriod = 30;

            // Downward thrust particles
            for (let i = 0; i < 2; i++) {
                particles.push({
                    x: rocket.x + (Math.random() - 0.5) * 20,
                    y: rocket.y + 45,
                    vx: (Math.random() - 0.5) * 2,
                    vy: 2 + Math.random() * 2,
                    life: 20,
                    color: 'yellow'
                });
            }
        }

        // Physics
        const speed = Math.sqrt(rocket.vx ** 2 + rocket.vy ** 2);
        const dragForce = 0.5 * densityValue * speed ** 2 * dragCoeff * frontalArea;
        const dragAccel = dragForce / rocket.mass;

        // Apply forces
        rocket.vx += thrustX - (rocket.vx / speed || 0) * dragAccel * 0.0001 + windValue * 0.01;
        rocket.vy += thrustY + gravityValue - (rocket.vy / speed || 0) * dragAccel * 0.0001;

        // Update position
        rocket.x += rocket.vx * 0.1;
        rocket.y += rocket.vy * 0.1;

        // Camera follow - always keep rocket centered vertically on screen
        cameraY = rocket.y - 300;

        // Decrement launch grace period
        if (launchGracePeriod > 0) {
            launchGracePeriod--;
        }

        // Realistic collision detection
        const rocketBottom = rocket.y + 40; // Rocket is 80 units tall, bottom is at y + 40
        const rocketLeft = rocket.x - 15;
        const rocketRight = rocket.x + 15;

        // Check collision with terrain (skip if in launch grace period)
        let onGround = false;
        if (launchGracePeriod === 0) {
            for (let i = 0; i < terrain.length - 1; i++) {
            const t1 = terrain[i];
            const t2 = terrain[i + 1];
            if (rocketRight > t1.x && rocketLeft < t2.x) {
                const groundY = t1.y + (t2.y - t1.y) * ((rocket.x - t1.x) / (t2.x - t1.x || 1));
                if (rocketBottom >= groundY - 5 && rocket.vy >= 0) { // Only collide when falling, 5 unit tolerance for landing
                    const landingSpeed = Math.abs(rocket.vy);
                    const angleDeg = Math.abs(rocket.angle * 180 / Math.PI) % 180;

                    if (landingSpeed > 8 || angleDeg > 30) {
                        rocket.crashed = true;
                        // Enhanced crash effect
                        for (let j = 0; j < 30; j++) {
                            particles.push({
                                x: rocket.x + (Math.random() - 0.5) * 60,
                                y: rocket.y + (Math.random() - 0.5) * 60,
                                vx: (Math.random() - 0.5) * 10,
                                vy: (Math.random() - 0.5) * 10,
                                life: 120,
                                color: ['orange', 'red', 'yellow'][Math.floor(Math.random() * 3)]
                            });
                        }
                    } else {
                        rocket.y = groundY - 40; // Position rocket on terrain
                        rocket.vy = 0;
                        rocket.vx *= 0.3; // More friction on landing
                        rocket.landed = true;
                        setTimeout(() => rocket.landed = false, 3000);
                    }
                    onGround = true;
                    break;
                }
            }
        }}

        // Check launch pad collision (only if not on terrain and not in grace period)
        if (launchGracePeriod === 0 && !onGround && rocketRight > launchPad.x && rocketLeft < launchPad.x + launchPad.width) {
            if (rocketBottom >= launchPad.y && rocket.vy >= 0) {
                const landingSpeed = Math.abs(rocket.vy);
                const angleDeg = Math.abs(rocket.angle * 180 / Math.PI) % 180;

                if (landingSpeed > 12 || angleDeg > 45) { // Stricter requirements for launch pad
                    rocket.crashed = true;
                    for (let j = 0; j < 20; j++) {
                        particles.push({
                            x: rocket.x + (Math.random() - 0.5) * 40,
                            y: rocket.y + (Math.random() - 0.5) * 40,
                            vx: (Math.random() - 0.5) * 8,
                            vy: (Math.random() - 0.5) * 8,
                            life: 90,
                            color: 'gray'
                        });
                    }
                } else {
                    rocket.y = launchPad.y - 40;
                    rocket.vy = 0;
                    rocket.vx *= 0.5;
                    rocket.landed = true;
                    setTimeout(() => rocket.landed = false, 3000);
                }
            }
        }

        // Side boundaries with terrain consideration
        if (rocket.x < 30) { rocket.x = 30; rocket.vx = Math.max(0, rocket.vx); }
        if (rocket.x > 770) { rocket.x = 770; rocket.vx = Math.min(0, rocket.vx); }

        // No altitude limit - go infinitely up!

        // Update stars (twinkle effect)
        stars.forEach(star => {
            star.alpha = 0.3 + Math.sin(Date.now() * 0.001 * star.parallax) * 0.2;
        });

        // Update particles
        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravity on particles
            particle.life--;
        });
        particles = particles.filter(particle => particle.life > 0);

        // Update birds
        birds.forEach(bird => {
            bird.x += bird.vx;
            bird.wingPhase += 0.2;
            if (bird.x < -50) bird.x = 850;
            if (bird.x > 850) bird.x = -50;
        });
    }

    function draw() {
        // Clear with gradient sky
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);

        // Background layers (moving atmosphere)
        backgroundLayers.forEach(layer => {
            const screenY = layer.y - cameraY * layer.parallax;
            if (screenY > -200 && screenY < 800) {
                ctx.fillStyle = layer.color;
                ctx.fillRect(0, screenY, 800, 200);
            }
        });

        // Stars (parallax)
        ctx.fillStyle = 'white';
        stars.forEach(star => {
            const screenY = star.y - cameraY * star.parallax;
            if (screenY > 0 && screenY < 600) {
                ctx.globalAlpha = star.alpha;
                ctx.fillRect(star.x, screenY, 1, 1);
            }
        });
        ctx.globalAlpha = 1;

        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        clouds.forEach(cloud => {
            const screenY = cloud.y - cameraY * 0.2;
            if (screenY > 0 && screenY < 600) {
                ctx.beginPath();
                ctx.arc(cloud.x, screenY, cloud.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Birds (only on Earth)
        if (currentPlanet === 'earth') {
            ctx.fillStyle = 'black';
            birds.forEach(bird => {
                const screenY = bird.y - cameraY * 0.3;
                if (screenY > 0 && screenY < 600) {
                    const wingOffset = Math.sin(bird.wingPhase) * 3;
                    ctx.fillRect(bird.x - 5, screenY, 10, 2);
                    ctx.fillRect(bird.x - 8, screenY - wingOffset, 6, 1);
                    ctx.fillRect(bird.x + 2, screenY - wingOffset, 6, 1);
                }
            });
        }

        // Terrain
        ctx.fillStyle = '#30c330';
        ctx.beginPath();
        ctx.moveTo(0, 700);
        terrain.forEach(point => {
            const screenY = point.y - cameraY;
            ctx.lineTo(point.x, screenY);
        });
        ctx.lineTo(800, 600);
        ctx.closePath();
        ctx.fill();

        // Launch pad
        const padScreenY = launchPad.y - cameraY;
        if (padScreenY < 600) {
            ctx.fillStyle = '#252525';
            ctx.fillRect(launchPad.x, padScreenY, launchPad.width, launchPad.height);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(launchPad.x + 40, padScreenY - 10, 20, 10);
        }

        // Particles
        particles.forEach(particle => {
            const screenY = particle.y - cameraY;
            if (screenY > 0 && screenY < 600) {
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.life / 30;
                ctx.fillRect(particle.x, screenY, 2, 2);
            }
        });
        ctx.globalAlpha = 1;

        // Rocket
        if (!rocket.crashed) {
            ctx.save();
            ctx.translate(rocket.x, rocket.y - cameraY);
            ctx.rotate(rocket.angle);

            // Rocket body
            ctx.fillStyle = 'blue';
            ctx.fillRect(-15, -40, 30, 80);

            // Rocket nose (triangle on top of body)
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.moveTo(0, -70);
            ctx.lineTo(-15, -40);
            ctx.lineTo(15, -40);
            ctx.closePath();
            ctx.fill();

            // Engine nozzle
            ctx.fillStyle = 'gray';
            ctx.fillRect(-5, 35, 10, 10);

            // Thrust flame (animated)
            if (thrusting) {
                const flameHeight = 20 + Math.sin(Date.now() * 0.01) * 5;
                ctx.fillStyle = 'orange';
                ctx.beginPath();
                ctx.moveTo(-8, 40);
                ctx.lineTo(0, 40 + flameHeight);
                ctx.lineTo(8, 40);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = 'yellow';
                ctx.beginPath();
                ctx.moveTo(-4, 40);
                ctx.lineTo(0, 40 + flameHeight * 0.7);
                ctx.lineTo(4, 40);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        } else {
            // Crash debris using particles
            ctx.fillStyle = 'white';
            ctx.font = '48px Arial';
            ctx.fillText('CRASH!', 350, 300);
        }

        if (rocket.landed) {
            ctx.fillStyle = 'green';
            ctx.font = '32px Arial';
            ctx.fillText('Safe Landing!', 320, 250);
        }

        // HUD
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText(`Velocity: ${Math.sqrt(rocket.vx**2 + rocket.vy**2).toFixed(1)} m/s`, 10, 20);
        ctx.fillText(`Altitude: ${Math.max(0, 500 - rocket.y).toFixed(0)} m`, 10, 40);
        ctx.fillText(`Fuel: ${rocket.fuel.toFixed(0)}`, 10, 60);
        ctx.fillText(`Angle: ${(rocket.angle * 180 / Math.PI).toFixed(0)}°`, 10, 80);
        ctx.fillText(`Wind: ${(windValue * 100).toFixed(0)}%`, 10, 100);
        if (rocket.crashed) {
            ctx.fillText('Crashed! Click Reset', 10, 120);
        }

        // Altitude indicator (maxes out at bar top for infinite height)
        const altitude = Math.max(0, 500 - rocket.y);
        const altitudePercent = Math.min(1, altitude / 5000); // Scale to 5000m max on bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(750, 50, 20, 200);
        ctx.fillStyle = 'green';
        ctx.fillRect(750, 250 - altitudePercent * 200, 20, altitudePercent * 200);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(750, 50, 20, 200);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText('ALT', 745, 270);
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
    console.log('Advanced canvas rocket simulator started');
    } catch (error) {
        console.error('Error initializing rocket game:', error);
    }
};
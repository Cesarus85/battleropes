// js/config/Config.js

export class Config {
    constructor() {
        // WebXR Settings
        this.xr = {
            sessionMode: 'immersive-ar',
            referenceSpace: 'local-floor',
            requiredFeatures: ['local-floor'],
            optionalFeatures: ['hand-tracking', 'dom-overlay', 'hit-test', 'anchors']
        };

        // Rendering Settings
        this.rendering = {
            antialias: true,
            alpha: true,
            shadowMapEnabled: true,
            shadowMapType: THREE.PCFSoftShadowMap,
            outputEncoding: THREE.sRGBEncoding,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
            pixelRatio: window.devicePixelRatio,
            targetFPS: 72  // Quest 3 Target
        };

        // Physics Settings (für später)
        this.physics = {
            gravity: -9.81,
            damping: 0.99,
            iterations: 3,
            timestep: 1/90,  // Fixed timestep für Quest 3
            ropeSegments: 20,
            ropeMass: 0.5,
            ropeStiffness: 0.8,
            ropeDamping: 0.95
        };

        // Game Settings
        this.game = {
            playArea: {
                width: 2,  // Meter
                height: 3,
                depth: 2
            },
            anchorDistance: 2,  // Meter vom Spieler
            anchorHeight: 0.8,  // Meter über dem Boden
            scoreMultiplier: {
                amplitude: 1.0,
                consistency: 1.5,
                combo: 2.0
            },
            intensityLevels: [
                { name: 'Warm-up', threshold: 0.2, color: 0x00ff00 },
                { name: 'Light', threshold: 0.4, color: 0xffff00 },
                { name: 'Moderate', threshold: 0.6, color: 0xffa500 },
                { name: 'Intense', threshold: 0.8, color: 0xff4500 },
                { name: 'Extreme', threshold: 1.0, color: 0xff0000 }
            ]
        };

        // Audio Settings
        this.audio = {
            enabled: true,
            masterVolume: 0.8,
            effects: {
                ropeSwing: 0.6,
                impact: 0.8,
                combo: 1.0,
                music: 0.5
            }
        };

        // Debug Settings
        this.debug = {
            showFPS: true,
            showHands: true,
            showVelocity: true,
            showGrid: true,
            showAnchors: true,
            logPerformance: false,
            verboseLogging: false
        };

        // Performance Settings für Quest 3
        this.performance = {
            maxParticles: 500,
            maxLights: 3,
            shadowResolution: 2048,
            lodBias: 1,
            adaptiveQuality: true,
            foveatedRendering: true,
            fixedFoveation: 1  // 0-3 für Quest
        };

        // Trainingsmodi
        this.workoutModes = {
            training: {
                name: 'Freies Training',
                duration: null,
                intervals: false,
                scoring: false
            },
            interval: {
                name: 'Intervall Training',
                workTime: 30,  // Sekunden
                restTime: 10,
                rounds: 8,
                scoring: true
            },
            endurance: {
                name: 'Ausdauer',
                duration: 300,  // 5 Minuten
                scoring: true,
                intensityIncrease: true
            },
            challenge: {
                name: 'Herausforderung',
                patterns: ['alternating', 'double', 'slam', 'wave'],
                scoring: true,
                timeLimit: 60
            }
        };

        // Hand Tracking Settings
        this.handTracking = {
            smoothing: 0.8,  // Glättung der Bewegungen
            velocityThreshold: 0.5,  // m/s für Bewegungserkennung
            slamThreshold: 3.0,  // m/s für Slam-Erkennung
            gripThreshold: 0.7,  // Für Grip-Erkennung
            releaseThreshold: 0.3
        };

        // Visual Effects
        this.visualEffects = {
            particlesEnabled: true,
            trailsEnabled: true,
            glowEnabled: true,
            shadowsEnabled: true,
            postProcessing: false  // Für Quest 3 deaktiviert
        };

        // Speicher Settings
        this.storage = {
            saveStats: true,
            saveHighscores: true,
            saveSettings: true,
            storageKey: 'battleRopesAR'
        };
    }

    // Lade gespeicherte Einstellungen
    load() {
        const saved = localStorage.getItem(this.storage.storageKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Merge saved settings
                Object.assign(this, data);
                console.log('✅ Einstellungen geladen');
            } catch (error) {
                console.error('Fehler beim Laden der Einstellungen:', error);
            }
        }
    }

    // Speichere Einstellungen
    save() {
        try {
            const data = {
                audio: this.audio,
                debug: this.debug,
                performance: this.performance,
                visualEffects: this.visualEffects,
                handTracking: this.handTracking
            };
            localStorage.setItem(this.storage.storageKey, JSON.stringify(data));
            console.log('✅ Einstellungen gespeichert');
        } catch (error) {
            console.error('Fehler beim Speichern der Einstellungen:', error);
        }
    }

    // Quest-spezifische Optimierungen
    optimizeForQuest() {
        this.performance.shadowResolution = 1024;
        this.performance.maxParticles = 200;
        this.visualEffects.postProcessing = false;
        this.visualEffects.glowEnabled = false;
        this.rendering.pixelRatio = 1.2;  // Reduziert für Performance
        console.log('⚡ Quest-Optimierungen aktiviert');
    }

    // Debug-Modus umschalten
    toggleDebug() {
        this.debug.showFPS = !this.debug.showFPS;
        this.debug.showHands = !this.debug.showHands;
        this.debug.showVelocity = !this.debug.showVelocity;
        this.save();
    }
}

// js/App.js

import { XRManager } from './core/XRManager.js';
import { SceneManager } from './core/SceneManager.js';
import { HandTracker } from './input/HandTracker.js';
import { DebugUI } from './ui/DebugUI.js';
import { Config } from './config/Config.js';

export class App {
    constructor() {
        this.config = new Config();
        this.isRunning = false;
        this.frameCount = 0;
        
        this.init();
    }

    async init() {
        console.log('🎮 Battle Ropes AR - Initialisierung...');
        
        // Canvas Element
        this.canvas = document.getElementById('webxr-canvas');
        
        // Manager initialisieren
        this.sceneManager = new SceneManager(this.canvas);
        this.xrManager = new XRManager(this.canvas, this.sceneManager.renderer);
        this.handTracker = new HandTracker();
        this.debugUI = new DebugUI();
        
        // Event Listener
        this.setupEventListeners();
        
        // WebXR Support Check
        this.checkXRSupport();
    }

    setupEventListeners() {
        const startButton = document.getElementById('start-ar-button');
        
        startButton.addEventListener('click', async () => {
            await this.startAR();
        });

        // Debug Toggle mit 'D' Taste
        window.addEventListener('keydown', (e) => {
            if (e.key === 'd' || e.key === 'D') {
                this.debugUI.toggle();
            }
        });
    }

    async checkXRSupport() {
        const supported = await this.xrManager.checkSupport();
        const startButton = document.getElementById('start-ar-button');
        
        if (!supported) {
            startButton.textContent = 'WebXR nicht unterstützt';
            startButton.disabled = true;
            console.error('❌ WebXR wird auf diesem Gerät nicht unterstützt');
        } else {
            console.log('✅ WebXR unterstützt');
        }
    }

    async startAR() {
        console.log('🚀 Starte AR Session...');
        
        try {
            // Hide start overlay
            document.getElementById('start-overlay').classList.add('hidden');
            
            // Start XR Session
            const session = await this.xrManager.startSession();
            
            if (session) {
                this.isRunning = true;
                this.debugUI.show();
                this.debugUI.updateSessionStatus('Aktiv');
                
                // Setup Hand Tracking
                this.handTracker.initialize(session);
                
                // Start render loop
                this.startRenderLoop();
                
                console.log('✅ AR Session gestartet');
            }
        } catch (error) {
            console.error('❌ Fehler beim Starten der AR Session:', error);
            this.debugUI.updateSessionStatus('Fehler: ' + error.message);
        }
    }

    startRenderLoop() {
        const session = this.xrManager.session;
        if (!session) return;

        // XR Render Loop
        session.requestAnimationFrame((time, frame) => this.render(time, frame));
    }

    render(time, frame) {
        if (!this.isRunning) return;

        this.frameCount++;
        
        // Update Debug Info
        this.debugUI.updateFPS(time);
        this.debugUI.updateFrameCount(this.frameCount);

        // Update Hand Tracking
        const handData = this.handTracker.update(frame);
        this.debugUI.updateHandsStatus(handData);

        // Update Scene (Lichter, Objekte, etc.)
        this.sceneManager.update(time, handData);

        // Render Scene
        this.xrManager.render(frame, this.sceneManager.scene, this.sceneManager.camera);

        // Continue loop
        if (this.xrManager.session) {
            this.xrManager.session.requestAnimationFrame((time, frame) => this.render(time, frame));
        }
    }

    stop() {
        this.isRunning = false;
        this.xrManager.endSession();
        this.debugUI.updateSessionStatus('Beendet');
        console.log('🛑 AR Session beendet');
    }
}

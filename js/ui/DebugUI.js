// js/ui/DebugUI.js

export class DebugUI {
    constructor() {
        this.panel = document.getElementById('debug-overlay');
        this.fpsCounter = document.getElementById('fps-counter');
        this.handsStatus = document.getElementById('hands-status');
        this.sessionStatus = document.getElementById('session-status');
        this.frameCounter = document.getElementById('frame-counter');
        
        this.visible = false;
        this.fpsHistory = [];
        this.lastFPSUpdate = 0;
        this.frameTimestamps = [];
    }

    show() {
        this.visible = true;
        this.panel.classList.remove('hidden');
    }

    hide() {
        this.visible = false;
        this.panel.classList.add('hidden');
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    updateFPS(timestamp) {
        // Sammle Timestamps für FPS-Berechnung
        this.frameTimestamps.push(timestamp);
        
        // Behalte nur die letzten 60 Frames
        if (this.frameTimestamps.length > 60) {
            this.frameTimestamps.shift();
        }
        
        // Update FPS alle 250ms
        if (timestamp - this.lastFPSUpdate > 250) {
            if (this.frameTimestamps.length > 1) {
                const timeDiff = this.frameTimestamps[this.frameTimestamps.length - 1] - this.frameTimestamps[0];
                const fps = Math.round((this.frameTimestamps.length - 1) / (timeDiff / 1000));
                
                this.fpsCounter.textContent = fps;
                
                // Farbcodierung
                this.fpsCounter.className = '';
                if (fps >= 70) {
                    this.fpsCounter.classList.add('good');
                } else if (fps >= 45) {
                    this.fpsCounter.classList.add('warning');
                } else {
                    this.fpsCounter.classList.add('bad');
                }
            }
            
            this.lastFPSUpdate = timestamp;
        }
    }

    updateHandsStatus(handData) {
        if (!handData) {
            this.handsStatus.textContent = 'Keine Daten';
            return;
        }

        const leftStatus = handData.left.detected ? 'L✓' : 'L✗';
        const rightStatus = handData.right.detected ? 'R✓' : 'R✗';
        
        // Zeige Geschwindigkeit wenn Hände erkannt
        let statusText = `${leftStatus} ${rightStatus}`;
        
        if (handData.left.detected) {
            const leftSpeed = handData.left.velocity.length().toFixed(2);
            statusText += ` (L:${leftSpeed}m/s)`;
        }
        
        if (handData.right.detected) {
            const rightSpeed = handData.right.velocity.length().toFixed(2);
            statusText += ` (R:${rightSpeed}m/s)`;
        }
        
        this.handsStatus.textContent = statusText;
    }

    updateSessionStatus(status) {
        this.sessionStatus.textContent = status;
    }

    updateFrameCount(count) {
        this.frameCounter.textContent = count;
    }

    addCustomDebugValue(label, value) {
        // Prüfe ob bereits vorhanden
        let debugItem = document.getElementById(`debug-${label}`);
        
        if (!debugItem) {
            debugItem = document.createElement('div');
            debugItem.className = 'debug-item';
            debugItem.id = `debug-${label}`;
            debugItem.innerHTML = `${label}: <span></span>`;
            this.panel.appendChild(debugItem);
        }
        
        debugItem.querySelector('span').textContent = value;
    }

    removeCustomDebugValue(label) {
        const debugItem = document.getElementById(`debug-${label}`);
        if (debugItem) {
            debugItem.remove();
        }
    }
}

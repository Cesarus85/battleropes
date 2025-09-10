// js/core/XRManager.js

export class XRManager {
    constructor(canvas, renderer) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.session = null;
        this.referenceSpace = null;
        this.glBinding = null;
    }

    async checkSupport() {
        if (!navigator.xr) {
            console.warn('WebXR nicht verfügbar');
            return false;
        }

        try {
            // Check for immersive-ar support
            const supported = await navigator.xr.isSessionSupported('immersive-ar');
            
            if (supported) {
                // Check for hand-tracking support
                const handTrackingSupported = await this.checkHandTrackingSupport();
                console.log('Hand-Tracking Support:', handTrackingSupported);
            }
            
            return supported;
        } catch (error) {
            console.error('Fehler beim Prüfen der WebXR-Unterstützung:', error);
            return false;
        }
    }

    async checkHandTrackingSupport() {
        try {
            // Temporäre Session zum Feature-Check
            const testSession = await navigator.xr.requestSession('immersive-ar', {
                optionalFeatures: ['hand-tracking']
            });
            
            const supported = testSession.inputSources ? true : false;
            await testSession.end();
            return supported;
        } catch (error) {
            return false;
        }
    }

    async startSession() {
        try {
            // Request AR session with hand-tracking
            const sessionInit = {
                requiredFeatures: ['local-floor'],
                optionalFeatures: [
                    'hand-tracking',
                    'dom-overlay',
                    'hit-test',
                    'anchors'
                ]
            };

            // Add DOM overlay for UI elements
            if (window.XRDOMOverlayState) {
                sessionInit.domOverlay = { root: document.body };
            }

            this.session = await navigator.xr.requestSession('immersive-ar', sessionInit);
            
            // Setup WebGL context
            await this.setupWebGL();
            
            // Setup reference space
            this.referenceSpace = await this.session.requestReferenceSpace('local-floor');
            
            // Session event listeners
            this.setupSessionEventListeners();
            
            return this.session;
        } catch (error) {
            console.error('Fehler beim Starten der XR-Session:', error);
            throw error;
        }
    }

    async setupWebGL() {
        const gl = this.canvas.getContext('webgl2', {
            xrCompatible: true,
            alpha: true,
            antialias: true
        });

        if (!gl) {
            throw new Error('WebGL2 nicht verfügbar');
        }

        // Configure Three.js renderer
        await this.renderer.setContext(gl);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        this.renderer.xr.setReferenceSpaceType('local-floor');
        this.renderer.xr.setSession(this.session);

        // Create XR WebGL binding
        this.glBinding = new XRWebGLBinding(this.session, gl);
    }

    setupSessionEventListeners() {
        this.session.addEventListener('end', () => {
            console.log('XR Session beendet');
            this.session = null;
            this.referenceSpace = null;
            this.glBinding = null;
        });

        this.session.addEventListener('inputsourceschange', (event) => {
            console.log('Input Sources geändert:', {
                added: event.added.length,
                removed: event.removed.length
            });
        });

        this.session.addEventListener('visibilitychange', (event) => {
            console.log('Sichtbarkeit geändert:', this.session.visibilityState);
        });
    }

    render(frame, scene, camera) {
        if (!this.session || !frame) return;

        const pose = frame.getViewerPose(this.referenceSpace);
        
        if (pose) {
            // Update camera from XR pose
            const view = pose.views[0];
            
            if (view) {
                const viewport = this.session.renderState.baseLayer.getViewport(view);
                this.renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
                
                // Update camera matrices
                camera.matrix.fromArray(view.transform.matrix);
                camera.projectionMatrix.fromArray(view.projectionMatrix);
                camera.updateMatrixWorld(true);
                
                // Render scene
                this.renderer.render(scene, camera);
            }
        }
    }

    async endSession() {
        if (this.session) {
            await this.session.end();
        }
    }

    getInputSources() {
        return this.session ? this.session.inputSources : [];
    }

    getReferenceSpace() {
        return this.referenceSpace;
    }
}

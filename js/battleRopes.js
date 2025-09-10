class BattleRopesAR {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrSession = null;
        
        this.controllers = [];
        this.controllerGrips = [];
        
        this.isXRSupported = false;
        this.isSessionActive = false;
        
        this.init();
    }
    
    async init() {
        await this.checkXRSupport();
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLighting();
        this.setupEventListeners();
        this.updateStatus();
        
        this.animate();
    }
    
    async checkXRSupport() {
        if ('xr' in navigator) {
            try {
                this.isXRSupported = await navigator.xr.isSessionSupported('immersive-ar');
                console.log('WebXR AR Support:', this.isXRSupported);
            } catch (error) {
                console.error('Error checking WebXR support:', error);
                this.isXRSupported = false;
            }
        } else {
            console.log('WebXR not supported in this browser');
            this.isXRSupported = false;
        }
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.xr.enabled = true;
        
        document.body.appendChild(this.renderer.domElement);
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = null; // Transparent for AR
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            70, 
            window.innerWidth / window.innerHeight, 
            0.01, 
            20
        );
        this.camera.position.set(0, 1.6, 1);
    }
    
    setupLighting() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light for shadows and definition
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 0.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        this.scene.add(directionalLight);
        
        // Point light for dynamic lighting
        const pointLight = new THREE.PointLight(0xff6b00, 0.3, 10);
        pointLight.position.set(0, 2, 0);
        this.scene.add(pointLight);
    }
    
    setupControllers() {
        // Controller 1 (Right Hand)
        const controller1 = this.renderer.xr.getController(0);
        controller1.addEventListener('connected', (event) => {
            this.onControllerConnected(event, 0);
        });
        controller1.addEventListener('disconnected', () => {
            this.onControllerDisconnected(0);
        });
        this.scene.add(controller1);
        this.controllers.push(controller1);
        
        // Controller 2 (Left Hand)  
        const controller2 = this.renderer.xr.getController(1);
        controller2.addEventListener('connected', (event) => {
            this.onControllerConnected(event, 1);
        });
        controller2.addEventListener('disconnected', () => {
            this.onControllerDisconnected(1);
        });
        this.scene.add(controller2);
        this.controllers.push(controller2);
        
        // Controller grips for hand models
        const grip1 = this.renderer.xr.getControllerGrip(0);
        this.scene.add(grip1);
        this.controllerGrips.push(grip1);
        
        const grip2 = this.renderer.xr.getControllerGrip(1);
        this.scene.add(grip2);
        this.controllerGrips.push(grip2);
        
        // Add visual indicators for controllers
        this.addControllerModels();
    }
    
    addControllerModels() {
        // Simple sphere models for controllers
        const geometry = new THREE.SphereGeometry(0.02, 16, 16);
        const material1 = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red for right
        const material2 = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue for left
        
        const controllerModel1 = new THREE.Mesh(geometry, material1);
        const controllerModel2 = new THREE.Mesh(geometry, material2);
        
        this.controllers[0].add(controllerModel1);
        this.controllers[1].add(controllerModel2);
    }
    
    onControllerConnected(event, index) {
        const controller = this.controllers[index];
        const handedness = index === 0 ? 'right' : 'left';
        console.log(`Controller ${index} (${handedness}) connected:`, event.data);
        
        // Store controller data
        controller.userData.handedness = handedness;
        controller.userData.connected = true;
        
        this.updateStatus();
    }
    
    onControllerDisconnected(index) {
        const handedness = index === 0 ? 'right' : 'left';
        console.log(`Controller ${index} (${handedness}) disconnected`);
        
        this.controllers[index].userData.connected = false;
        this.updateStatus();
    }
    
    setupEventListeners() {
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => this.startXRSession());
        
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    async startXRSession() {
        if (!this.isXRSupported) {
            alert('WebXR AR is not supported on this device/browser');
            return;
        }
        
        try {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('ui').style.display = 'none';
            
            const sessionInit = {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['hand-tracking', 'hit-test']
            };
            
            this.xrSession = await navigator.xr.requestSession('immersive-ar', sessionInit);
            
            this.renderer.xr.setSession(this.xrSession);
            this.isSessionActive = true;
            
            this.setupControllers();
            
            this.xrSession.addEventListener('end', () => {
                this.onXRSessionEnd();
            });
            
            console.log('AR Session started successfully');
            document.getElementById('loading').style.display = 'none';
            
        } catch (error) {
            console.error('Failed to start AR session:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('ui').style.display = 'block';
            alert('Failed to start AR session: ' + error.message);
        }
    }
    
    onXRSessionEnd() {
        this.isSessionActive = false;
        this.xrSession = null;
        
        document.getElementById('ui').style.display = 'block';
        console.log('AR Session ended');
        this.updateStatus();
    }
    
    updateStatus() {
        const statusElement = document.getElementById('status');
        const startButton = document.getElementById('startButton');
        
        if (!this.isXRSupported) {
            statusElement.textContent = 'WebXR Status: Not Supported';
            startButton.disabled = true;
            startButton.textContent = 'WebXR Not Available';
        } else if (this.isSessionActive) {
            statusElement.textContent = 'WebXR Status: Active AR Session';
            startButton.style.display = 'none';
        } else {
            statusElement.textContent = 'WebXR Status: Ready';
            startButton.disabled = false;
            startButton.textContent = 'Start Battle Ropes AR';
        }
        
        // Show controller status
        let controllerStatus = '';
        this.controllers.forEach((controller, index) => {
            if (controller.userData && controller.userData.connected) {
                const hand = controller.userData.handedness;
                controllerStatus += ` ${hand} controller connected`;
            }
        });
        
        if (controllerStatus) {
            statusElement.textContent += ' |' + controllerStatus;
        }
    }
    
    animate() {
        this.renderer.setAnimationLoop(() => {
            this.render();
        });
    }
    
    render() {
        if (this.isSessionActive) {
            this.updateControllers();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateControllers() {
        this.controllers.forEach((controller, index) => {
            if (controller.userData && controller.userData.connected) {
                // Here we'll add hand tracking and rope physics later
                // For now, just log position for debugging
                const position = controller.position;
                const rotation = controller.rotation;
                
                // Store previous position for velocity calculation
                if (!controller.userData.previousPosition) {
                    controller.userData.previousPosition = position.clone();
                    controller.userData.velocity = new THREE.Vector3();
                } else {
                    controller.userData.velocity.subVectors(position, controller.userData.previousPosition);
                    controller.userData.previousPosition.copy(position);
                }
            }
        });
    }
}

// Initialize the application when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.battleRopesAR = new BattleRopesAR();
});
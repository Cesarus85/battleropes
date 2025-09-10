import * as THREE from 'three';
import { VerletPhysicsEngine } from './verletPhysics.js';

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
        
        // Physics and ropes
        this.physicsEngine = null;
        this.leftRope = null;
        this.rightRope = null;
        this.ropeLength = 2.0;
        this.ropeSegments = 25;
        this.anchorHeight = 1.5;
        
        // Clock for physics timing
        this.clock = new THREE.Clock();
        
        this.init();
    }
    
    async init() {
        await this.checkXRSupport();
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLighting();
        this.setupPhysics();
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
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
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
    
    setupPhysics() {
        this.physicsEngine = new VerletPhysicsEngine(this.scene);
        this.physicsEngine.setGravity(0, -9.81, 0);
    }
    
    createBattleRopes() {
        // Remove existing ropes if any
        if (this.leftRope) this.removeRope(this.leftRope);
        if (this.rightRope) this.removeRope(this.rightRope);
        
        // Create anchor points (fixed points where ropes are attached)
        const leftAnchor = { x: -0.3, y: this.anchorHeight, z: 0 };
        const rightAnchor = { x: 0.3, y: this.anchorHeight, z: 0 };
        
        // Create left rope
        this.leftRope = this.physicsEngine.createRope(
            leftAnchor.x, leftAnchor.y, leftAnchor.z,
            leftAnchor.x, leftAnchor.y - this.ropeLength, leftAnchor.z,
            this.ropeSegments,
            0.05 // mass per segment
        );
        
        // Create right rope  
        this.rightRope = this.physicsEngine.createRope(
            rightAnchor.x, rightAnchor.y, rightAnchor.z,
            rightAnchor.x, rightAnchor.y - this.ropeLength, rightAnchor.z,
            this.ropeSegments,
            0.05 // mass per segment
        );
        
        // Pin the top particles (anchor points)
        this.leftRope.particles[0].pin();
        this.rightRope.particles[0].pin();
        
        // Add visual anchors
        this.addAnchorVisuals(leftAnchor, rightAnchor);
        
        console.log('Battle ropes created with', this.ropeSegments, 'segments each');
    }
    
    addAnchorVisuals(leftAnchor, rightAnchor) {
        const anchorGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8);
        const anchorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        // Left anchor
        const leftAnchorMesh = new THREE.Mesh(anchorGeometry, anchorMaterial);
        leftAnchorMesh.position.set(leftAnchor.x, leftAnchor.y, leftAnchor.z);
        leftAnchorMesh.rotation.z = Math.PI / 2;
        this.scene.add(leftAnchorMesh);
        
        // Right anchor
        const rightAnchorMesh = new THREE.Mesh(anchorGeometry, anchorMaterial);
        rightAnchorMesh.position.set(rightAnchor.x, rightAnchor.y, rightAnchor.z);
        rightAnchorMesh.rotation.z = Math.PI / 2;
        this.scene.add(rightAnchorMesh);
        
        // Add a crossbeam connecting the anchors
        const beamGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
        const beamMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(0, leftAnchor.y, leftAnchor.z);
        beam.rotation.z = Math.PI / 2;
        this.scene.add(beam);
    }
    
    removeRope(rope) {
        if (!rope) return;
        
        // Remove visual elements
        rope.particles.forEach(particle => {
            if (particle.mesh) {
                this.scene.remove(particle.mesh);
            }
        });
        
        if (rope.visual) {
            this.scene.remove(rope.visual);
        }
        
        // Remove from physics engine
        rope.particles.forEach(particle => {
            const index = this.physicsEngine.particles.indexOf(particle);
            if (index > -1) this.physicsEngine.particles.splice(index, 1);
        });
        
        rope.constraints.forEach(constraint => {
            const index = this.physicsEngine.constraints.indexOf(constraint);
            if (index > -1) this.physicsEngine.constraints.splice(index, 1);
        });
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
            this.createBattleRopes();
            
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
        const deltaTime = this.clock.getDelta();
        
        if (this.isSessionActive) {
            this.updateControllers();
            
            // Update physics
            if (this.physicsEngine) {
                this.physicsEngine.update(deltaTime);
                this.updateRopeVisuals();
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateRopeVisuals() {
        // Update rope line visuals
        if (this.leftRope && this.leftRope.visual) {
            const points = this.leftRope.particles.map(p => p.position.clone());
            this.leftRope.visual.geometry.setFromPoints(points);
        }
        
        if (this.rightRope && this.rightRope.visual) {
            const points = this.rightRope.particles.map(p => p.position.clone());
            this.rightRope.visual.geometry.setFromPoints(points);
        }
    }
    
    updateControllers() {
        this.controllers.forEach((controller, index) => {
            if (controller.userData && controller.userData.connected) {
                const position = controller.position;
                const handedness = controller.userData.handedness;
                
                // Store previous position for velocity calculation
                if (!controller.userData.previousPosition) {
                    controller.userData.previousPosition = position.clone();
                    controller.userData.velocity = new THREE.Vector3();
                    controller.userData.acceleration = new THREE.Vector3();
                } else {
                    const newVelocity = new THREE.Vector3().subVectors(position, controller.userData.previousPosition);
                    controller.userData.acceleration.subVectors(newVelocity, controller.userData.velocity);
                    controller.userData.velocity.copy(newVelocity);
                    controller.userData.previousPosition.copy(position);
                }
                
                // Apply hand movement to rope end
                this.applyHandToRope(controller, handedness);
            }
        });
    }
    
    applyHandToRope(controller, handedness) {
        if (!this.leftRope || !this.rightRope) return;
        
        const rope = handedness === 'left' ? this.leftRope : this.rightRope;
        const ropeEndIndex = rope.particles.length - 1;
        const ropeEnd = rope.particles[ropeEndIndex];
        
        // Get hand position and apply to rope end with some offset
        const handPosition = controller.position.clone();
        const targetPosition = new THREE.Vector3(
            handPosition.x,
            handPosition.y - 0.1, // Small offset below hand
            handPosition.z
        );
        
        // Apply force based on hand movement
        if (controller.userData.acceleration) {
            const force = controller.userData.acceleration.clone().multiplyScalar(100);
            ropeEnd.addForce(force);
        }
        
        // Constrain rope end to follow hand position (not too rigidly)
        const distance = ropeEnd.position.distanceTo(targetPosition);
        if (distance > 0.2) { // Max distance before rope "snaps" to hand
            const direction = new THREE.Vector3().subVectors(targetPosition, ropeEnd.position).normalize();
            ropeEnd.position.copy(targetPosition.clone().sub(direction.multiplyScalar(0.2)));
        } else {
            // Gentle pull towards hand
            const pullForce = new THREE.Vector3().subVectors(targetPosition, ropeEnd.position).multiplyScalar(50);
            ropeEnd.addForce(pullForce);
        }
    }
}

// Initialize the application when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.battleRopesAR = new BattleRopesAR();
});
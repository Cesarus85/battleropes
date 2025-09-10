// js/core/SceneManager.js

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.setupScene();
        this.setupRenderer();
        this.setupLights();
        this.createTestObjects();
    }

    setupScene() {
        // Three.js Scene
        this.scene = new THREE.Scene();
        
        // Camera (wird von WebXR überschrieben)
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.01,
            100
        );
        this.camera.position.set(0, 1.6, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            logarithmicDepthBuffer: true
        });
        
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    setupLights() {
        // Ambiente Beleuchtung
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional Light (Sonne)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(2, 5, 2);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.camera.near = 0.1;
        this.directionalLight.shadow.camera.far = 20;
        this.directionalLight.shadow.camera.left = -5;
        this.directionalLight.shadow.camera.right = 5;
        this.directionalLight.shadow.camera.top = 5;
        this.directionalLight.shadow.camera.bottom = -5;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(this.directionalLight);

        // Hemisphere Light für natürlichere Beleuchtung
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.4);
        this.scene.add(hemiLight);
    }

    createTestObjects() {
        // Referenz-Grid am Boden (2x2m)
        const gridHelper = new THREE.GridHelper(2, 20, 0x00ff00, 0x404040);
        gridHelper.position.y = 0;
        this.scene.add(gridHelper);

        // Ankerpunkt-Marker (wo die Seile befestigt werden)
        const anchorGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3);
        const anchorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0x440000
        });
        this.anchorPoint = new THREE.Mesh(anchorGeometry, anchorMaterial);
        this.anchorPoint.position.set(0, 0.15, -2);
        this.anchorPoint.castShadow = true;
        this.scene.add(this.anchorPoint);

        // Test-Kugeln für Hand-Positionen
        this.handMarkers = {
            left: this.createHandMarker(0x00ff00),
            right: this.createHandMarker(0x0000ff)
        };
    }

    createHandMarker(color) {
        const geometry = new THREE.SphereGeometry(0.05, 16, 16);
        const material = new THREE.MeshPhongMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.2
        });
        const marker = new THREE.Mesh(geometry, material);
        marker.visible = false;
        marker.castShadow = true;
        this.scene.add(marker);
        return marker;
    }

    update(time, handData) {
        // Animiere Ankerpunkt
        if (this.anchorPoint) {
            this.anchorPoint.rotation.y = time * 0.001;
        }

        // Update Hand-Marker
        if (handData) {
            // Linke Hand
            if (handData.left && handData.left.detected) {
                this.handMarkers.left.visible = true;
                this.handMarkers.left.position.copy(handData.left.position);
            } else {
                this.handMarkers.left.visible = false;
            }

            // Rechte Hand
            if (handData.right && handData.right.detected) {
                this.handMarkers.right.visible = true;
                this.handMarkers.right.position.copy(handData.right.position);
            } else {
                this.handMarkers.right.visible = false;
            }
        }
    }

    addObject(object) {
        this.scene.add(object);
    }

    removeObject(object) {
        this.scene.remove(object);
    }

    clear() {
        while(this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
    }
}

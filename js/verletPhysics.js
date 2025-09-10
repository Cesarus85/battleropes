import * as THREE from 'three';

class VerletParticle {
    constructor(x, y, z, mass = 1.0) {
        this.position = new THREE.Vector3(x, y, z);
        this.previousPosition = new THREE.Vector3(x, y, z);
        this.acceleration = new THREE.Vector3();
        this.mass = mass;
        this.pinned = false;
        this.radius = 0.01;
        
        // Visual representation
        this.mesh = null;
    }
    
    update(deltaTime) {
        if (this.pinned) return;
        
        // Verlet integration
        const velocity = new THREE.Vector3()
            .subVectors(this.position, this.previousPosition)
            .multiplyScalar(0.99); // Damping
            
        this.previousPosition.copy(this.position);
        
        this.position
            .add(velocity)
            .add(this.acceleration.clone().multiplyScalar(deltaTime * deltaTime));
            
        // Reset acceleration
        this.acceleration.set(0, 0, 0);
    }
    
    addForce(force) {
        this.acceleration.add(force.clone().divideScalar(this.mass));
    }
    
    pin() {
        this.pinned = true;
    }
    
    unpin() {
        this.pinned = false;
    }
    
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this.previousPosition.set(x, y, z);
    }
}

class VerletConstraint {
    constructor(particleA, particleB, restLength = null) {
        this.particleA = particleA;
        this.particleB = particleB;
        this.restLength = restLength || particleA.position.distanceTo(particleB.position);
        this.stiffness = 1.0;
    }
    
    satisfy() {
        const delta = new THREE.Vector3().subVectors(this.particleB.position, this.particleA.position);
        const currentDistance = delta.length();
        
        if (currentDistance === 0) return;
        
        const difference = (this.restLength - currentDistance) / currentDistance;
        const correction = delta.multiplyScalar(difference * 0.5 * this.stiffness);
        
        if (!this.particleA.pinned) {
            this.particleA.position.sub(correction);
        }
        if (!this.particleB.pinned) {
            this.particleB.position.add(correction);
        }
    }
}

class VerletPhysicsEngine {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.constraints = [];
        this.gravity = new THREE.Vector3(0, -9.81, 0);
        this.iterations = 3; // Constraint solver iterations
        this.groundY = 0;
        
        // Materials for visualization
        this.particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.8 
        });
        this.constraintMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff6b00, 
            linewidth: 3 
        });
    }
    
    createParticle(x, y, z, mass = 1.0) {
        const particle = new VerletParticle(x, y, z, mass);
        
        // Create visual representation
        const geometry = new THREE.SphereGeometry(particle.radius, 8, 6);
        particle.mesh = new THREE.Mesh(geometry, this.particleMaterial);
        particle.mesh.position.copy(particle.position);
        this.scene.add(particle.mesh);
        
        this.particles.push(particle);
        return particle;
    }
    
    createConstraint(particleA, particleB, restLength = null) {
        const constraint = new VerletConstraint(particleA, particleB, restLength);
        this.constraints.push(constraint);
        return constraint;
    }
    
    createRope(startX, startY, startZ, endX, endY, endZ, segments = 20, mass = 0.1) {
        const rope = {
            particles: [],
            constraints: [],
            visual: null
        };
        
        // Create particles along the rope
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = THREE.MathUtils.lerp(startX, endX, t);
            const y = THREE.MathUtils.lerp(startY, endY, t);
            const z = THREE.MathUtils.lerp(startZ, endZ, t);
            
            const particle = this.createParticle(x, y, z, mass);
            rope.particles.push(particle);
            
            // Connect to previous particle
            if (i > 0) {
                const constraint = this.createConstraint(rope.particles[i-1], particle);
                rope.constraints.push(constraint);
            }
        }
        
        // Create visual line for rope
        this.updateRopeVisual(rope);
        
        return rope;
    }
    
    updateRopeVisual(rope) {
        // Remove old visual if exists
        if (rope.visual) {
            this.scene.remove(rope.visual);
        }
        
        // Create new line geometry
        const points = rope.particles.map(p => p.position.clone());
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        rope.visual = new THREE.Line(geometry, this.constraintMaterial);
        this.scene.add(rope.visual);
    }
    
    update(deltaTime) {
        // Apply gravity to all particles
        this.particles.forEach(particle => {
            particle.addForce(this.gravity.clone().multiplyScalar(particle.mass));
        });
        
        // Update particles
        this.particles.forEach(particle => {
            particle.update(deltaTime);
            
            // Ground collision
            if (particle.position.y < this.groundY + particle.radius) {
                particle.position.y = this.groundY + particle.radius;
                particle.previousPosition.y = particle.position.y + (particle.position.y - particle.previousPosition.y) * 0.8;
            }
            
            // Update visual representation
            if (particle.mesh) {
                particle.mesh.position.copy(particle.position);
            }
        });
        
        // Satisfy constraints (multiple iterations for stability)
        for (let i = 0; i < this.iterations; i++) {
            this.constraints.forEach(constraint => {
                constraint.satisfy();
            });
        }
    }
    
    updateRopeVisuals() {
        // Update all rope line visuals
        this.scene.traverse((child) => {
            if (child instanceof THREE.Line && child.geometry) {
                // Find corresponding rope particles and update points
                // This is a simplified approach - in practice you'd want to track rope-visual relationships
                child.geometry.dispose();
            }
        });
    }
    
    addWind(windForce) {
        this.particles.forEach(particle => {
            if (!particle.pinned) {
                particle.addForce(windForce);
            }
        });
    }
    
    setGravity(x, y, z) {
        this.gravity.set(x, y, z);
    }
    
    reset() {
        // Clear all particles and constraints
        this.particles.forEach(particle => {
            if (particle.mesh) {
                this.scene.remove(particle.mesh);
            }
        });
        
        this.particles = [];
        this.constraints = [];
    }
}

export { VerletPhysicsEngine, VerletParticle, VerletConstraint };
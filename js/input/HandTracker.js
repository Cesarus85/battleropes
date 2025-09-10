// js/input/HandTracker.js

import * as THREE from 'three';

export class HandTracker {
    constructor() {
        this.session = null;
        this.hands = {
            left: {
                detected: false,
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                acceleration: new THREE.Vector3(),
                prevPosition: new THREE.Vector3(),
                prevVelocity: new THREE.Vector3(),
                joints: {},
                inputSource: null
            },
            right: {
                detected: false,
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                acceleration: new THREE.Vector3(),
                prevPosition: new THREE.Vector3(),
                prevVelocity: new THREE.Vector3(),
                joints: {},
                inputSource: null
            }
        };
        
        this.deltaTime = 0;
        this.lastTime = 0;
        
        // Joint Namen für Hand-Tracking
        this.jointNames = [
            'wrist',
            'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip',
            'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 
            'index-finger-phalanx-distal', 'index-finger-tip',
            'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate',
            'middle-finger-phalanx-distal', 'middle-finger-tip',
            'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate',
            'ring-finger-phalanx-distal', 'ring-finger-tip',
            'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate',
            'pinky-finger-phalanx-distal', 'pinky-finger-tip'
        ];
    }

    initialize(session) {
        this.session = session;
        console.log('Hand Tracker initialisiert');
        
        // Input Source Events
        session.addEventListener('inputsourceschange', (event) => {
            this.handleInputSourcesChange(event);
        });
    }

    handleInputSourcesChange(event) {
        // Neue Input Sources
        for (const inputSource of event.added) {
            if (inputSource.hand) {
                const handedness = inputSource.handedness;
                console.log(`Hand erkannt: ${handedness}`);
                
                if (handedness === 'left' || handedness === 'right') {
                    this.hands[handedness].inputSource = inputSource;
                    this.hands[handedness].detected = true;
                }
            }
        }

        // Entfernte Input Sources
        for (const inputSource of event.removed) {
            if (inputSource.hand) {
                const handedness = inputSource.handedness;
                console.log(`Hand verloren: ${handedness}`);
                
                if (handedness === 'left' || handedness === 'right') {
                    this.hands[handedness].inputSource = null;
                    this.hands[handedness].detected = false;
                }
            }
        }
    }

    update(frame) {
        if (!frame || !this.session) return this.hands;

        // Calculate delta time
        const currentTime = performance.now();
        this.deltaTime = this.lastTime ? (currentTime - this.lastTime) / 1000 : 0.016;
        this.lastTime = currentTime;

        // Get input sources
        const inputSources = this.session.inputSources;

        for (const inputSource of inputSources) {
            if (inputSource.hand && inputSource.handedness !== 'none') {
                const handedness = inputSource.handedness;
                const hand = this.hands[handedness];
                
                if (!hand) continue;

                // Get hand pose
                const referenceSpace = frame.session.requestedReferenceSpace || frame.session.referenceSpace;
                
                if (inputSource.gripSpace && referenceSpace) {
                    const pose = frame.getPose(inputSource.gripSpace, referenceSpace);
                    
                    if (pose) {
                        // Update position (use wrist as main position)
                        const wristJoint = inputSource.hand.get('wrist');
                        if (wristJoint) {
                            const wristPose = frame.getJointPose(wristJoint, referenceSpace);
                            if (wristPose) {
                                // Store previous values
                                hand.prevPosition.copy(hand.position);
                                hand.prevVelocity.copy(hand.velocity);
                                
                                // Update position
                                hand.position.set(
                                    wristPose.transform.position.x,
                                    wristPose.transform.position.y,
                                    wristPose.transform.position.z
                                );
                                
                                // Calculate velocity
                                if (this.deltaTime > 0) {
                                    hand.velocity.subVectors(hand.position, hand.prevPosition);
                                    hand.velocity.divideScalar(this.deltaTime);
                                    
                                    // Calculate acceleration
                                    hand.acceleration.subVectors(hand.velocity, hand.prevVelocity);
                                    hand.acceleration.divideScalar(this.deltaTime);
                                }
                                
                                hand.detected = true;
                            }
                        }
                        
                        // Update all joint positions
                        this.updateJoints(inputSource.hand, frame, referenceSpace, hand);
                    }
                }
            }
        }

        return this.hands;
    }

    updateJoints(handObject, frame, referenceSpace, handData) {
        for (const jointName of this.jointNames) {
            const joint = handObject.get(jointName);
            
            if (joint) {
                const jointPose = frame.getJointPose(joint, referenceSpace);
                
                if (jointPose) {
                    if (!handData.joints[jointName]) {
                        handData.joints[jointName] = {
                            position: new THREE.Vector3(),
                            radius: jointPose.radius || 0.01
                        };
                    }
                    
                    handData.joints[jointName].position.set(
                        jointPose.transform.position.x,
                        jointPose.transform.position.y,
                        jointPose.transform.position.z
                    );
                }
            }
        }
    }

    getHandSpeed(handedness) {
        return this.hands[handedness].velocity.length();
    }

    getHandAcceleration(handedness) {
        return this.hands[handedness].acceleration.length();
    }

    isHandDetected(handedness) {
        return this.hands[handedness].detected;
    }

    reset() {
        for (const hand of Object.values(this.hands)) {
            hand.detected = false;
            hand.position.set(0, 0, 0);
            hand.velocity.set(0, 0, 0);
            hand.acceleration.set(0, 0, 0);
            hand.prevPosition.set(0, 0, 0);
            hand.prevVelocity.set(0, 0, 0);
            hand.joints = {};
            hand.inputSource = null;
        }
    }
}

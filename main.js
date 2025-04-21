// main.js - NASA SUITS WebXR Application

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Main application class
class NASASuitsApp {
  constructor() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // Stars background
    this.addStars();
    
    // Earth and moon elements
    this.addEnvironment();
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
    this.camera.position.set(0, 1.6, 3);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);
    
    // XR session setup
    document.body.appendChild(VRButton.createButton(this.renderer));
    
    // Controls for non-VR mode
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.6, 0);
    this.controls.update();
    
    // Lighting
    this.setupLighting();
    
    // Hand tracking setup
    this.setupHandTracking();
    
    // User interface elements
    this.setupUI();
    
    // Window resize handling
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Start animation loop
    this.renderer.setAnimationLoop(this.animate.bind(this));
    
    // Pinch state tracking
    this.isPinching = false;
    this.lastPinchTime = 0;
    
    console.log('NASA SUITS Application initialized');
  }
  
  // Add stars to the background
  addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.02,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
      const x = THREE.MathUtils.randFloatSpread(2000);
      const y = THREE.MathUtils.randFloatSpread(2000);
      const z = THREE.MathUtils.randFloatSpread(2000);
      
      // Keep stars away from the center area
      if (Math.abs(x) < 100 && Math.abs(y) < 100 && Math.abs(z) < 100) continue;
      
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.stars);
  }
  
  // Add earth and moon environment
  addEnvironment() {
    // Earth
    const earthGeometry = new THREE.SphereGeometry(10, 64, 64);
    const earthTexture = new THREE.TextureLoader().load('assets/earth.jpg');
    const earthMaterial = new THREE.MeshPhongMaterial({ map: earthTexture });
    this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
    this.earth.position.set(0, 0, -30);
    this.scene.add(this.earth);
    
    // Moon surface (ground plane)
    const moonGroundGeometry = new THREE.PlaneGeometry(100, 100, 128, 128);
    const moonTexture = new THREE.TextureLoader().load('assets/moon_surface.jpg');
    moonTexture.wrapS = THREE.RepeatWrapping;
    moonTexture.wrapT = THREE.RepeatWrapping;
    moonTexture.repeat.set(4, 4);
    
    const moonDisplacementMap = new THREE.TextureLoader().load('assets/moon_displacement.jpg');
    const moonNormalMap = new THREE.TextureLoader().load('assets/moon_normal.jpg');
    
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: moonTexture,
      displacementMap: moonDisplacementMap,
      displacementScale: 0.4,
      normalMap: moonNormalMap,
      roughness: 0.8,
      metalness: 0.2
    });
    
    this.moonGround = new THREE.Mesh(moonGroundGeometry, moonMaterial);
    this.moonGround.rotation.x = -Math.PI / 2;
    this.moonGround.position.y = -1.5;
    this.scene.add(this.moonGround);
  }
  
  // Setup lighting
  setupLighting() {
    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    sunLight.position.set(10, 20, 10);
    this.scene.add(sunLight);
    
    // Earth glow (ambient light)
    const earthLight = new THREE.HemisphereLight(0x0044FF, 0x111111, 0.4);
    this.scene.add(earthLight);
    
    // General ambient light
    const ambientLight = new THREE.AmbientLight(0x111111, 0.4);
    this.scene.add(ambientLight);
  }
  
  // Setup hand tracking
  setupHandTracking() {
    // XR Controllers for hand tracking
    this.controller1 = this.renderer.xr.getController(0);
    this.controller2 = this.renderer.xr.getController(1);
    this.scene.add(this.controller1);
    this.scene.add(this.controller2);
    
    // Hand models
    const handModelFactory = new XRHandModelFactory();
    
    // Left hand
    this.handLeft = this.renderer.xr.getHand(0);
    this.handModelLeft = handModelFactory.createHandModel(this.handLeft, 'mesh');
    this.handLeft.add(this.handModelLeft);
    this.scene.add(this.handLeft);
    
    // Right hand
    this.handRight = this.renderer.xr.getHand(1);
    this.handModelRight = handModelFactory.createHandModel(this.handRight, 'mesh');
    this.handRight.add(this.handModelRight);
    this.scene.add(this.handRight);
    
    // Visual indicator for pinch gesture
    const pinchIndicatorGeometry = new THREE.SphereGeometry(0.01, 16, 16);
    const pinchIndicatorMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00FF00, 
      transparent: true,
      opacity: 0.7
    });
    
    this.pinchIndicatorLeft = new THREE.Mesh(pinchIndicatorGeometry, pinchIndicatorMaterial.clone());
    this.pinchIndicatorRight = new THREE.Mesh(pinchIndicatorGeometry, pinchIndicatorMaterial.clone());
    this.pinchIndicatorLeft.visible = false;
    this.pinchIndicatorRight.visible = false;
    this.scene.add(this.pinchIndicatorLeft);
    this.scene.add(this.pinchIndicatorRight);
  }
  
  // Setup UI elements
  setupUI() {
    this.ui = {
      panels: {},
      texts: {},
      initialized: false
    };
    
    // Load font for text rendering
    const fontLoader = new FontLoader();
    fontLoader.load('https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_regular.typeface.json', (font) => {
      this.ui.font = font;
      this.ui.initialized = true;
      
      // Create all UI panels
      this.createUIElements();
    });
  }
  
  // Create UI panels and elements
  createUIElements() {
    if (!this.ui.initialized) return;
    
    // Parent group for all UI elements (attached to camera)
    this.uiGroup = new THREE.Group();
    this.camera.add(this.uiGroup);
    this.uiGroup.position.set(0, 0, -1); // 1 meter in front of the camera
    
    // Create the top status panels
    this.createStatusPanel('battery', '75%', 'Battery', 'Secondary', -0.4, 0.2);
    this.createStatusPanel('oxygen', '75%', 'O2', 'Oxygen', 0, 0.2);
    this.createStatusPanel('pressure', '14.3psi', 'Pressure', 'Secondary', 0.4, 0.2);
    
    // Create the navigation info panels
    this.createInfoPanel('distance', '100m remaining', -0.3, 0.05);
    this.createInfoPanel('time', '15:00 min to Destination', 0.3, 0.05);
    
    // Create the bottom status panel
    this.createInfoPanel('walked', 'Walked 500m', 0, -0.2);
    
    // Create the pilot name panel (bottom left)
    this.createInfoPanel('pilot', 'Pilot Neil Armstrong', -0.4, -0.3);
    
    // Create the navigation mode panel (bottom center)
    this.createInfoPanel('navMode', 'Navigation Mode', 0, -0.3, true);
  }
  
  // Create a status panel with title, value, and subtitle
  createStatusPanel(id, value, title, subtitle, x, y) {
    // Create panel container
    const panel = new THREE.Group();
    panel.position.set(x, y, 0);
    
    // Create background panel
    const bgGeometry = new RoundedBoxGeometry(0.3, 0.15, 0.01, 8, 0.02);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x1A1A1A,
      transparent: true,
      opacity: 0.8
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    panel.add(background);
    
    // Add time display
    this.addText(panel, '11:23:24', 0, 0.045, 0.012, 0xAAAAAA);
    
    // Add value display
    this.addText(panel, value, 0, 0.015, 0.025, 0xFFFFFF);
    
    // Add title
    this.addText(panel, title, 0, -0.015, 0.015, 0xFFFFFF);
    
    // Add subtitle
    this.addText(panel, subtitle, 0, -0.04, 0.012, 0x888888);
    
    this.uiGroup.add(panel);
    this.ui.panels[id] = panel;
    
    return panel;
  }
  
  // Create an info panel for other data
  createInfoPanel(id, text, x, y, highlighted = false) {
    // Create panel container
    const panel = new THREE.Group();
    panel.position.set(x, y, 0);
    
    // Create background panel
    const width = text.length * 0.015 + 0.1; // Adjust width based on text length
    const bgGeometry = new RoundedBoxGeometry(width, 0.06, 0.01, 8, 0.02);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: highlighted ? 0x333333 : 0x1A1A1A,
      transparent: true,
      opacity: 0.8
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    panel.add(background);
    
    // Add icon (simplified as a small cube for now)
    const iconGeometry = new THREE.BoxGeometry(0.015, 0.015, 0.01);
    const iconMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const icon = new THREE.Mesh(iconGeometry, iconMaterial);
    icon.position.set(-width/2 + 0.04, 0, 0.01);
    panel.add(icon);
    
    // Add text
    this.addText(panel, text, 0.02, 0, 0.012, 0xFFFFFF);
    
    this.uiGroup.add(panel);
    this.ui.panels[id] = panel;
    
    return panel;
  }
  
  // Utility method to add text to a panel
  addText(parent, text, x, y, size, color) {
    if (!this.ui.font) return null;
    
    const textGeometry = new TextGeometry(text, {
      font: this.ui.font,
      size: size,
      height: 0.001,
      curveSegments: 4,
    });
    
    textGeometry.computeBoundingBox();
    const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
    
    const material = new THREE.MeshBasicMaterial({ color: color });
    const textMesh = new THREE.Mesh(textGeometry, material);
    textMesh.position.set(x + centerOffset, y, 0.01);
    parent.add(textMesh);
    
    return textMesh;
  }
  
  // Update the UI with telemetry values
  updateTelemetry(data) {
    // Implementation would update specific panels with new data
    // This would replace text meshes with new values
  }
  
  // Window resize handler
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  // Detect pinch gesture between thumb and index finger
  detectPinchGesture(hand) {
    if (!hand || !hand.joints) return false;
    
    const indexTip = hand.joints['index-finger-tip'];
    const thumbTip = hand.joints['thumb-tip'];
    
    if (!indexTip || !thumbTip) return false;
    
    const indexPos = indexTip.position;
    const thumbPos = thumbTip.position;
    
    // Calculate distance between tips
    const distance = indexPos.distanceTo(thumbPos);
    
    // Distance threshold for pinch (in meters)
    return distance < 0.02; // 2cm threshold
  }
  
  // Handle pinch events
  handlePinchGesture(hand, isPinching, isLeft) {
    const indicator = isLeft ? this.pinchIndicatorLeft : this.pinchIndicatorRight;
    
    if (isPinching) {
      // Show indicator at midpoint of thumb and index
      const indexTip = hand.joints['index-finger-tip'];
      const thumbTip = hand.joints['thumb-tip'];
      
      if (indexTip && thumbTip) {
        const midpoint = new THREE.Vector3().addVectors(
          indexTip.position,
          thumbTip.position
        ).multiplyScalar(0.5);
        
        indicator.position.copy(midpoint);
        indicator.visible = true;
        
        // Only trigger a single pinch event on initial pinch detection
        const now = Date.now();
        if (!this.isPinching && now - this.lastPinchTime > 500) {
          // Pinch started
          console.log('Pinch detected');
          this.isPinching = true;
          
          // TODO: Implement UI interaction based on pinch location
          // E.g., check if pinch is near an interactive element
        }
      }
    } else {
      indicator.visible = false;
      
      if (this.isPinching) {
        // Pinch ended
        console.log('Pinch released');
        this.isPinching = false;
        this.lastPinchTime = Date.now();
      }
    }
  }
  
  // Animation loop
  animate() {
    // Earth slow rotation
    if (this.earth) {
      this.earth.rotation.y += 0.0001;
    }
    
    // Update controls (when not in VR)
    if (this.controls) {
      this.controls.update();
    }
    
    // Hand tracking and gesture detection
    const session = this.renderer.xr.getSession();
    if (session) {
      // Check for pinch gesture on left hand
      if (this.handLeft && this.handLeft.joints) {
        const leftPinch = this.detectPinchGesture(this.handLeft);
        this.handlePinchGesture(this.handLeft, leftPinch, true);
      }
      
      // Check for pinch gesture on right hand
      if (this.handRight && this.handRight.joints) {
        const rightPinch = this.detectPinchGesture(this.handRight);
        this.handlePinchGesture(this.handRight, rightPinch, false);
      }
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new NASASuitsApp();
});
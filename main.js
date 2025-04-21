// main.js - NASA SUITS WebXR Application - Moon Surface Simulator

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// Main application class
class NASASuitsApp {
  constructor() {
    // Initialize application
    this.initializeApp();
    this.addEventListeners();
    
    // Start animation loop
    this.renderer.setAnimationLoop(this.animate.bind(this));
    
    // Hide loading indicator
    this.hideLoading();
    
    console.log('NASA SUITS Application initialized');
  }
  
  // Initialize the application
  initializeApp() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
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
    
    // Add environment
    this.setupMoonEnvironment();
    
    // Setup lighting
    this.setupLighting();
    
    // Hand tracking setup
    this.setupHandTracking();
    
    // Initialize UI
    this.initializeUI();
    
    // Pinch state tracking
    this.isPinching = false;
    this.lastPinchTime = 0;
  }
  
  // Add event listeners
  addEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  // Setup moon environment (stars, earth, moon surface)
  setupMoonEnvironment() {
    // Stars background
    this.addStars();
    
    // Earth in the distance
    this.addEarth();
    
    // Moon surface (ground)
    this.addMoonSurface();
    
    // Add some moon craters and rocks
    this.addMoonFeatures();
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
  
  // Add earth in the background
  addEarth() {
    // Create procedural earth texture
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 512;
    earthCanvas.height = 256;
    const context = earthCanvas.getContext('2d');
    
    // Fill with gradient blue
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#1E4877');
    gradient.addColorStop(0.5, '#4584b4');
    gradient.addColorStop(1, '#83B8DE');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 256);
    
    // Add some "clouds" and "land"
    context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const radius = 10 + Math.random() * 50;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    
    context.fillStyle = 'rgba(0, 128, 0, 0.5)';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const radius = 5 + Math.random() * 30;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    
    // Create texture from canvas
    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    
    // Create earth sphere
    const earthGeometry = new THREE.SphereGeometry(10, 64, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({ 
      map: earthTexture,
      specular: 0x333333,
      shininess: 5
    });
    
    this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
    this.earth.position.set(0, 20, -30);
    this.scene.add(this.earth);
  }
  
  // Add moon surface as ground
  addMoonSurface() {
    // Create procedural moon texture
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 1024;
    moonCanvas.height = 1024;
    const context = moonCanvas.getContext('2d');
    
    // Fill with light gray
    context.fillStyle = '#777777';
    context.fillRect(0, 0, 1024, 1024);
    
    // Add noise for texture
    for (let i = 0; i < 30000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 3;
      const brightness = 120 + Math.random() * 135; // 120-255
      
      context.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    // Create low contrast crater patterns
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const radius = 10 + Math.random() * 80;
      const brightness = 150 + Math.random() * 30; // 150-180
      
      // Crater rim (slightly brighter)
      context.fillStyle = `rgb(${brightness + 20}, ${brightness + 20}, ${brightness + 20})`;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.stroke();
      
      // Crater floor (slightly darker)
      context.fillStyle = `rgb(${brightness - 20}, ${brightness - 20}, ${brightness - 20})`;
      context.beginPath();
      context.arc(x, y, radius - 2, 0, Math.PI * 2);
      context.fill();
    }
    
    // Create texture from canvas
    const moonTexture = new THREE.CanvasTexture(moonCanvas);
    moonTexture.wrapS = THREE.RepeatWrapping;
    moonTexture.wrapT = THREE.RepeatWrapping;
    moonTexture.repeat.set(4, 4);
    
    // Create bump map for terrain variations
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 1024;
    bumpCanvas.height = 1024;
    const bumpContext = bumpCanvas.getContext('2d');
    
    // Fill with medium gray (neutral bump)
    bumpContext.fillStyle = '#777777';
    bumpContext.fillRect(0, 0, 1024, 1024);
    
    // Add random bumps
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const radius = 5 + Math.random() * 50;
      
      // Create radial gradient for each bump
      const gradient = bumpContext.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#777777');
      
      bumpContext.fillStyle = gradient;
      bumpContext.beginPath();
      bumpContext.arc(x, y, radius, 0, Math.PI * 2);
      bumpContext.fill();
    }
    
    // Create texture from canvas
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.repeat.set(4, 4);
    
    // Create moon ground
    const moonGroundGeometry = new THREE.PlaneGeometry(100, 100, 64, 64);
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: moonTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.1,
      roughness: 0.9,
      metalness: 0.1,
      color: 0x888888
    });
    
    this.moonGround = new THREE.Mesh(moonGroundGeometry, moonMaterial);
    this.moonGround.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.moonGround.position.y = -1.5; // Position below the user
    this.scene.add(this.moonGround);
  }
  
  // Add moon features (craters, rocks)
  addMoonFeatures() {
    // Add some craters
    for (let i = 0; i < 20; i++) {
      const radius = 1 + Math.random() * 5;
      const segments = 32;
      const depth = 0.1 + Math.random() * 0.5;
      
      // Create crater geometry (ring)
      const craterGeometry = new THREE.RingGeometry(radius - 0.2, radius, segments);
      const craterMaterial = new THREE.MeshStandardMaterial({
        color: 0x999999,
        roughness: 0.8,
        metalness: 0.1
      });
      
      const crater = new THREE.Mesh(craterGeometry, craterMaterial);
      
      // Position randomly on the ground
      crater.position.x = (Math.random() - 0.5) * 80;
      crater.position.z = (Math.random() - 0.5) * 80;
      crater.position.y = -1.5 + 0.01; // Just above the ground
      crater.rotation.x = -Math.PI / 2; // Align with the ground
      
      this.scene.add(crater);
      
      // Create crater inner part (slightly darker)
      const craterInnerGeometry = new THREE.CircleGeometry(radius - 0.2, segments);
      const craterInnerMaterial = new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 0.9,
        metalness: 0.1
      });
      
      const craterInner = new THREE.Mesh(craterInnerGeometry, craterInnerMaterial);
      craterInner.position.x = crater.position.x;
      craterInner.position.z = crater.position.z;
      craterInner.position.y = -1.5 + 0.005; // Slightly above the ground, below the rim
      craterInner.rotation.x = -Math.PI / 2; // Align with the ground
      
      this.scene.add(craterInner);
    }
    
    // Add some rocks
    for (let i = 0; i < 50; i++) {
      const rockGeometry = new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.4, 0);
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.9,
        metalness: 0.1
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      
      // Position randomly on the ground, but avoid the center area
      let x, z;
      do {
        x = (Math.random() - 0.5) * 80;
        z = (Math.random() - 0.5) * 80;
      } while (Math.sqrt(x * x + z * z) < 5); // Keep rocks away from the center
      
      rock.position.set(x, -1.5 + rock.geometry.parameters.radius / 2, z);
      
      // Random rotation
      rock.rotation.x = Math.random() * Math.PI;
      rock.rotation.y = Math.random() * Math.PI;
      rock.rotation.z = Math.random() * Math.PI;
      
      this.scene.add(rock);
    }
    
    // Add a few larger boulders
    for (let i = 0; i < 5; i++) {
      const boulderGeometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 1.5, 1);
      const boulderMaterial = new THREE.MeshStandardMaterial({
        color: 0x999999,
        roughness: 0.9,
        metalness: 0.1
      });
      
      const boulder = new THREE.Mesh(boulderGeometry, boulderMaterial);
      
      // Position randomly on the ground, but keep them far away
      let x, z;
      do {
        x = (Math.random() - 0.5) * 80;
        z = (Math.random() - 0.5) * 80;
      } while (Math.sqrt(x * x + z * z) < 20); // Keep boulders far from the center
      
      boulder.position.set(x, -1.5 + boulder.geometry.parameters.radius / 2, z);
      
      // Random rotation
      boulder.rotation.x = Math.random() * Math.PI;
      boulder.rotation.y = Math.random() * Math.PI;
      boulder.rotation.z = Math.random() * Math.PI;
      
      this.scene.add(boulder);
    }
    
    // Add some footprints near the user
    this.addFootprints();
  }
  
  // Add astronaut footprints
  addFootprints() {
    // Create footprint texture
    const footprintCanvas = document.createElement('canvas');
    footprintCanvas.width = 64;
    footprintCanvas.height = 128;
    const context = footprintCanvas.getContext('2d');
    
    // Draw a simple boot shape
    context.fillStyle = '#555555';
    context.fillRect(16, 32, 32, 64); // Main boot rectangle
    context.beginPath();
    context.arc(32, 32, 16, 0, Math.PI, true); // Rounded top
    context.fill();
    context.beginPath();
    context.arc(32, 96, 16, 0, Math.PI, false); // Rounded bottom
    context.fill();
    
    const footprintTexture = new THREE.CanvasTexture(footprintCanvas);
    
    // Create footprints
    for (let i = 0; i < 20; i++) {
      const footprintGeometry = new THREE.PlaneGeometry(0.2, 0.4);
      const footprintMaterial = new THREE.MeshBasicMaterial({
        map: footprintTexture,
        transparent: true,
        opacity: 0.7,
        alphaTest: 0.1,
        side: THREE.DoubleSide
      });
      
      const footprint = new THREE.Mesh(footprintGeometry, footprintMaterial);
      
      // Create a walking path starting from the user
      const angle = i * 0.3; // Gentle curve
      const distance = i * 0.5; // Increasing distance
      
      const x = Math.sin(angle) * distance;
      const z = -Math.cos(angle) * distance;
      
      footprint.position.set(x, -1.49, z); // Just above the ground
      footprint.rotation.x = -Math.PI / 2; // Lay flat on the ground
      footprint.rotation.z = angle + (i % 2 ? 0.3 : -0.3); // Alternate left/right feet
      
      this.scene.add(footprint);
    }
  }
  
  // Setup lighting
  setupLighting() {
    // Harsh directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    sunLight.position.set(10, 20, 10);
    this.scene.add(sunLight);
    
    // Earth glow (subtle blue ambient)
    const earthLight = new THREE.HemisphereLight(0x0044FF, 0x000000, 0.2);
    this.scene.add(earthLight);
    
    // General ambient light
    const ambientLight = new THREE.AmbientLight(0x222222, 0.5);
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
  
  // Initialize UI
  initializeUI() {
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
    const bgGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.01);
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
    const bgGeometry = new THREE.BoxGeometry(width, 0.06, 0.01);
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
  
  // Hide loading indicator
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
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

// Continued from previous file

  // Initialize the application when the DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    // Check if WebXR is supported
    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        if (supported) {
          // Initialize the app
          new NASASuitsApp();
        } else {
          // WebXR supported but immersive-vr not available
          showWebXRWarning('Your browser supports WebXR, but VR mode is not available on this device.');
        }
      });
    } else {
      // WebXR not supported
      showWebXRWarning('Your browser does not support WebXR. Please use a WebXR-compatible browser.');
    }
  });

  // Show warning for WebXR compatibility issues
  function showWebXRWarning(message) {
    // Hide loading indicator
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    
    // Create warning element
    const warning = document.createElement('div');
    warning.className = 'webxr-warning';
    warning.innerHTML = `
      <h2>WebXR Not Available</h2>
      <p>${message}</p>
      <p>You can still view a non-VR version of this application.</p>
      <button id="continue-anyway">Continue Anyway</button>
    `;
    
    document.body.appendChild(warning);
    
    // Add event listener to button
    document.getElementById('continue-anyway').addEventListener('click', () => {
      warning.style.display = 'none';
      new NASASuitsApp();
    });
  }
// main.js - NASA SUITS WebXR Application - Moon Surface Simulator

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';

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
    
    // Initialize UI - as a separate group in the scene
    this.createNASASuitsUI();
    
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
    
    // Add some "clouds"
    context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const radius = 10 + Math.random() * 50;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    
    // Add some "land" (green continents)
    context.fillStyle = 'rgba(76, 175, 80, 0.5)';
    for (let i = 0; i < 7; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const size = 20 + Math.random() * 60;
      
      // Draw irregular continent shape
      context.beginPath();
      context.moveTo(x, y);
      for (let j = 0; j < 10; j++) {
        const angle = Math.PI * 2 * j / 10;
        const radius = size * (0.5 + Math.random() * 0.5);
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        context.lineTo(px, py);
      }
      context.closePath();
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
    
    // Add some crater patterns
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = 20 + Math.random() * 100;
      
      // Crater rim (slightly brighter)
      context.strokeStyle = '#AAAAAA';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.stroke();
      
      // Crater floor (slightly darker)
      context.fillStyle = '#666666';
      context.beginPath();
      context.arc(x, y, size - 2, 0, Math.PI * 2);
      context.fill();
    }
    
    // Create texture from canvas
    const moonTexture = new THREE.CanvasTexture(moonCanvas);
    moonTexture.wrapS = THREE.RepeatWrapping;
    moonTexture.wrapT = THREE.RepeatWrapping;
    moonTexture.repeat.set(4, 4);
    
    // Create moon ground
    const moonGroundGeometry = new THREE.PlaneGeometry(100, 100, 64, 64);
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.9,
      metalness: 0.1,
      color: 0x888888
    });
    
    this.moonGround = new THREE.Mesh(moonGroundGeometry, moonMaterial);
    this.moonGround.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.moonGround.position.y = -1.5; // Position below the user
    this.scene.add(this.moonGround);
    
    // Add some 3D terrain features
    this.addMoonFeatures();
  }
  
  // Add 3D moon terrain features
  addMoonFeatures() {
    // Add some craters as actual geometry
    for (let i = 0; i < 20; i++) {
      const radius = 1 + Math.random() * 5;
      const segments = 32;
      
      // Create crater geometry (rim)
      const craterRimGeometry = new THREE.TorusGeometry(radius, 0.2, 8, 32);
      const craterRimMaterial = new THREE.MeshStandardMaterial({
        color: 0x999999,
        roughness: 0.8,
        metalness: 0.1
      });
      
      const craterRim = new THREE.Mesh(craterRimGeometry, craterRimMaterial);
      
      // Position randomly on the ground
      craterRim.position.x = (Math.random() - 0.5) * 80;
      craterRim.position.z = (Math.random() - 0.5) * 80;
      craterRim.position.y = -1.5 + 0.01; // Just above the ground
      craterRim.rotation.x = Math.PI / 2; // Align with the ground
      
      this.scene.add(craterRim);
      
      // Create crater floor (slightly recessed)
      const craterFloorGeometry = new THREE.CircleGeometry(radius - 0.3, segments);
      const craterFloorMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.9,
        metalness: 0.1
      });
      
      const craterFloor = new THREE.Mesh(craterFloorGeometry, craterFloorMaterial);
      craterFloor.position.x = craterRim.position.x;
      craterFloor.position.z = craterRim.position.z;
      craterFloor.position.y = -1.52; // Slightly below the ground
      craterFloor.rotation.x = -Math.PI / 2; // Align with the ground
      
      this.scene.add(craterFloor);
    }
    
    // Add some rocks
    for (let i = 0; i < 100; i++) {
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
    
    // Add footprints near the user
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
  
  // Create NASA SUITS UI
  createNASASuitsUI() {
    // Create UI group - NOT attached to camera
    this.uiGroup = new THREE.Group();
    this.scene.add(this.uiGroup);
    
    // Create status panels (top row)
    this.createStatusPanel(-0.4, 0.2, 0, "75%", "Battery", "Secondary");
    this.createStatusPanel(0, 0.2, 0, "75%", "O2", "Oxygen");
    this.createStatusPanel(0.4, 0.2, 0, "14.3psi", "Pressure", "Secondary");
    
    // Create info panels (middle row)
    this.createInfoPanel(-0.3, 0.05, 0, "100m", "remaining", false);
    this.createInfoPanel(0.3, 0.05, 0, "15:00 min", "to Destination", false);
    
    // Create bottom status panels
    this.createInfoPanel(0, -0.2, 0, "Walked 500m", "", false);
    
    // Create bottom controls
    this.createInfoPanel(-0.4, -0.3, 0, "Pilot Neil Armstrong", "", false);
    this.createInfoPanel(0, -0.3, 0, "Navigation Mode", "", true);
    
    console.log("UI panels created");
  }
  
  // Create a status panel with title, value, and subtitle
  createStatusPanel(x, y, z, value, title, subtitle) {
    // Create panel group
    const panel = new THREE.Group();
    panel.position.set(x, y, z);
    
    // Create background with rounded corners
    const panelWidth = 0.3;
    const panelHeight = 0.15;
    
    // Simple box geometry for the panel
    const bgGeometry = new THREE.BoxGeometry(panelWidth, panelHeight, 0.01);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x1A1A1A,
      transparent: true,
      opacity: 0.8
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    panel.add(background);
    
    // Add time at top
    this.addTextToPanel(panel, "11:23:24", 0, 0.045, 0.012, "#AAAAAA");
    
    // Add value
    this.addTextToPanel(panel, value, 0, 0.015, 0.025, "#FFFFFF");
    
    // Add title
    this.addTextToPanel(panel, title, 0, -0.015, 0.015, "#FFFFFF");
    
    // Add subtitle
    this.addTextToPanel(panel, subtitle, 0, -0.04, 0.012, "#888888");
    
    this.uiGroup.add(panel);
    return panel;
  }
  
  // Create an info panel with icon and text
  createInfoPanel(x, y, z, text, subtext = "", highlighted = false) {
    // Calculate width based on text length
    const panelWidth = Math.max(0.3, (text.length + subtext.length) * 0.015 + 0.1);
    const panelHeight = 0.06;
    
    // Create panel group
    const panel = new THREE.Group();
    panel.position.set(x, y, z);
    
    // Create background
    const bgGeometry = new THREE.BoxGeometry(panelWidth, panelHeight, 0.01);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: highlighted ? 0x333333 : 0x1A1A1A,
      transparent: true,
      opacity: 0.8
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    panel.add(background);
    
    // Add icon (grid pattern)
    const iconSize = 0.02;
    const iconCanvas = document.createElement('canvas');
    iconCanvas.width = 64;
    iconCanvas.height = 64;
    const iconContext = iconCanvas.getContext('2d');
    
    // Draw grid icon
    iconContext.fillStyle = '#FFFFFF';
    iconContext.fillRect(12, 12, 18, 18);
    iconContext.fillRect(34, 12, 18, 18);
    iconContext.fillRect(12, 34, 18, 18);
    iconContext.fillRect(34, 34, 18, 18);
    
    const iconTexture = new THREE.CanvasTexture(iconCanvas);
    const iconMaterial = new THREE.MeshBasicMaterial({
      map: iconTexture,
      transparent: true
    });
    
    const iconGeometry = new THREE.PlaneGeometry(iconSize, iconSize);
    const icon = new THREE.Mesh(iconGeometry, iconMaterial);
    icon.position.set(-panelWidth/2 + 0.04, 0, 0.001);
    panel.add(icon);
    
    // Add text
    if (subtext) {
      // If we have subtext, the first part might be colored
      const textColor = text.includes("100m") ? "#FFCC00" : text.includes("15:00") ? "#00FF66" : "#FFFFFF";
      this.addTextToPanel(panel, text, -panelWidth/2 + 0.07, 0, 0.014, textColor);
      this.addTextToPanel(panel, subtext, -panelWidth/2 + 0.07 + text.length * 0.014, 0, 0.014, "#FFFFFF");
    } else {
      // Regular text
      this.addTextToPanel(panel, text, -panelWidth/2 + 0.07, 0, 0.014, "#FFFFFF");
    }
    
    this.uiGroup.add(panel);
    return panel;
  }
  
  // Add text to a panel using canvas texture
  addTextToPanel(parent, text, x, y, size, color) {
    // Create canvas for text
    const canvas = document.createElement('canvas');
    const textWidth = text.length * 25;
    canvas.width = textWidth;
    canvas.height = 50;
    
    const context = canvas.getContext('2d');
    context.fillStyle = 'transparent';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set font and draw text
    const fontSize = Math.floor(size * 1000);
    context.font = `${fontSize}px Arial, sans-serif`;
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.fillStyle = color || '#FFFFFF';
    context.fillText(text, 0, canvas.height / 2);
    
    // Create texture and mesh
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });
    
    const aspectRatio = canvas.width / canvas.height;
    const height = size * 1.5;
    const width = height * aspectRatio;
    
    const geometry = new THREE.PlaneGeometry(width, height);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x + width/2, y, 0.001);
    
    parent.add(mesh);
    return mesh;
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
    
    // Update UI position to follow camera in VR
    if (this.uiGroup) {
      // Get camera position and direction
      const cameraPosition = this.camera.position.clone();
      const cameraDirection = new THREE.Vector3(0, 0, -1);
      cameraDirection.applyQuaternion(this.camera.quaternion);
      
      // Position UI in front of camera at fixed distance
      const uiDistance = 1; // 1 meter in front
      const uiPosition = cameraPosition.clone().add(
        cameraDirection.multiplyScalar(uiDistance)
      );
      
      this.uiGroup.position.copy(uiPosition);
      
      // Make UI face the camera
      this.uiGroup.quaternion.copy(this.camera.quaternion);
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new NASASuitsApp();
});
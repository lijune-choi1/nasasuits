import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
import SpaceUI from './SpaceUI.js';

class SpaceEnvironment {
  constructor(scene, camera, renderer) {
    console.log('Initializing SpaceEnvironment with UI library');
    
    // Use provided scene, camera, renderer or create new ones
    this.scene = scene || new THREE.Scene();
    this.camera = camera || new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
    this.renderer = renderer;
    
    if (!this.renderer) {
      // Only create a renderer if one wasn't provided
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.xr.enabled = true;
      document.body.appendChild(this.renderer.domElement);
    }
    
    // Controls for non-VR mode (only if not provided)
    if (!this.controls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.target.set(0, 1.6, 0);
      this.controls.update();
    }
    
    // Initialize the UI library
    this.ui = new SpaceUI(this.scene, this.camera, this.renderer);
    
    // Add environment elements
    this.setupMoonEnvironment();
    
    // Setup lighting
    this.setupLighting();
    
    // Setup hand tracking
    this.setupHandTracking();
    
    // Init UI elements
    this.initializeUI();
    
    // Pinch state tracking
    this.isPinching = false;
    this.lastPinchTime = 0;
    
    // Add keyboard listeners
    this.addKeyboardListeners();
    
    console.log('SpaceEnvironment initialized successfully');
  }
  
  // Initialize UI elements using our UI library
  initializeUI() {
    console.log('Initializing UI components');
    
    // Create top status panels
    this.statusPanel = this.ui.createStatusPanels('status-panels', {
      position: new THREE.Vector3(0, 0.3, -0.5),
      panels: [
        { title: 'Battery', value: '75%', position: new THREE.Vector3(-0.5, 0, 0) },
        { title: 'O2', value: '75%', position: new THREE.Vector3(0, 0, 0) },
        { title: 'Pressure', value: '14.3psi', position: new THREE.Vector3(0.5, 0, 0) }
      ]
    });
    
    // Create middle info panels
    this.ui.createPanel('distance-panel', {
      position: new THREE.Vector3(-0.3, 0, -0.5),
      texts: [
        { text: "100m", color: "#FFCC00", yOffset: 0.02 },
        { text: "remaining", color: "#FFFFFF", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    this.ui.createPanel('time-panel', {
      position: new THREE.Vector3(0.3, 0, -0.5),
      texts: [
        { text: "15:00 min", color: "#00FF66", yOffset: 0.02 },
        { text: "to Destination", color: "#FFFFFF", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    // Create bottom panels
    this.ui.createPanel('progress-panel', {
      position: new THREE.Vector3(0, -0.2, -0.5),
      texts: [
        { text: "Walked 500m", color: "#FFFFFF" }
      ]
    });
    
    this.ui.createPanel('user-panel', {
      position: new THREE.Vector3(-0.4, -0.3, -0.5),
      texts: [
        { text: "Pilot Neil Armstrong", color: "#FFFFFF" }
      ]
    });
    
    this.ui.createPanel('mode-panel', {
      position: new THREE.Vector3(0.4, -0.3, -0.5),
      texts: [
        { text: "Navigation Mode", color: "#FFFFFF" }
      ],
      highlighted: true
    });
    
    // Create action buttons (initially hidden)
    this.actionButtons = this.ui.createActionButtons('action-buttons', {
      position: new THREE.Vector3(0, -0.1, -0.4),
      visible: false
    });
    
    // Create map modal (initially hidden)
    this.mapModal = this.ui.createMapModal('map-modal', {
      title: 'Maps',
      visible: false
    });
    
    console.log('UI components initialized');
  }
  
  // Add environment elements
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
    
    // Add some basic terrain
    this.addRocks();
  }
  
  // Add rocks to terrain
  addRocks() {
    // Add some rocks
    for (let i = 0; i < 30; i++) {
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
  
  // Handle pinch events with improved UI integration
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
          console.log('Pinch detected from ' + (isLeft ? 'LEFT' : 'RIGHT') + ' hand');
          this.isPinching = true;
          
          // Handle gestures based on which hand
          if (isLeft) {
            // Left hand pinch toggles action buttons
            this.toggleActionButtons();
          } else {
            // Right hand pinch toggles map
            this.toggleMapModal();
          }
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
  
  // Keyboard event listener for UI control
  addKeyboardListeners() {
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyM') {
        console.log('Map key (M) pressed - toggling map modal');
        this.toggleMapModal();
      } else if (event.code === 'KeyA') {
        console.log('Action key (A) pressed - toggling action buttons');
        this.toggleActionButtons();
      } else if (event.code === 'KeyU') {
        console.log('Update key (U) pressed - updating stats');
        this.updateStats();
      }
    });
  }
  
  // Toggle action buttons visibility
  toggleActionButtons() {
    if (this.actionButtons) {
      const isVisible = this.actionButtons.toggle();
      console.log('Action buttons visibility:', isVisible ? 'visible' : 'hidden');
    }
  }
  
  // Toggle map modal visibility
  toggleMapModal() {
    if (this.mapModal) {
      const isVisible = this.mapModal.toggle();
      console.log('Map modal visibility:', isVisible ? 'visible' : 'hidden');
    }
  }
  
  // Update stats display (example to demonstrate dynamic updates)
  updateStats() {
    if (this.statusPanel) {
      // Randomly update a stat
      const stats = ['Battery', 'O2', 'Pressure'];
      const stat = stats[Math.floor(Math.random() * stats.length)];
      
      let value;
      if (stat === 'Battery') {
        value = Math.floor(Math.random() * 100) + '%';
      } else if (stat === 'O2') {
        value = Math.floor(Math.random() * 100) + '%';
      } else if (stat === 'Pressure') {
        value = (13 + Math.random() * 2).toFixed(1) + 'psi';
      }
      
      console.log(`Updating ${stat} to ${value}`);
      this.statusPanel.updatePanel(stat, value);
    }
  }
  
  // Main update loop
  update() {
    // Earth slow rotation
    if (this.earth) {
      this.earth.rotation.y += 0.0001;
    }
    
    // Update controls (when not in VR)
    if (this.controls) {
      this.controls.update();
    }
    
    // Update UI position to follow camera
    const isVR = this.renderer.xr.isPresenting;
    this.ui.updatePosition(isVR);
    
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

export default SpaceEnvironment;
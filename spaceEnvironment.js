import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';

class SpaceEnvironment {
  constructor(scene, camera, renderer) {
    console.log('Initializing SpaceEnvironment with integrated UI');
    
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
    
    // Initialize UI elements
    this.initializeUI();
    
    // Add environment elements
    this.setupMoonEnvironment();
    
    // Setup lighting
    this.setupLighting();
    
    // Hand tracking setup
    this.setupHandTracking();
    
    // Pinch state tracking
    this.isPinching = false;
    this.lastPinchTime = 0;
    
    console.log('SpaceEnvironment initialized successfully');
  }
  
  // Initialize UI elements
  initializeUI() {
    // Create UI container that will be in front of everything
    this.uiRoot = new THREE.Group();
    this.scene.add(this.uiRoot);

    // Flag for map window visibility
    this.mapWindowVisible = false;
    
    // Create main UI panels
    this.createUIPanels();
    
    // Create map window (initially hidden)
    this.createMapWindow();

    // Create action buttons menu (initially hidden)
    this.createActionButtons();
    
    // Set high render order for all UI elements
    this.uiRoot.traverse((obj) => {
      if (obj.isMesh) {
        obj.renderOrder = 9999;
        if (obj.material) {
          // Ensure UI renders on top
          obj.material.depthTest = false;
          obj.material.depthWrite = false;
          obj.material.transparent = true;
          obj.material.side = THREE.DoubleSide;
        }
      }
    });
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

  // -------------------- UI FUNCTIONS --------------------

  // Create text texture for UI panels
  createTextTexture(text, options = {}) {
    const {
      fontSize = 64,
      fontFamily = 'Arial',
      textColor = '#FFFFFF',
      backgroundColor = 'rgba(0,0,0,0.5)', // Adding semi-transparent background for better visibility
      width = 512,
      height = 128
    } = options;
    
    // Create canvas for text
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background
    if (backgroundColor !== 'transparent') {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Configure text rendering with shadow for better visibility
    context.font = `bold ${fontSize}px ${fontFamily}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = textColor;
    
    // Add shadow for better contrast
    context.shadowColor = 'rgba(0, 0, 0, 0.8)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    
    // Draw text
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create and return texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true; // Ensure texture updates
    return texture;
  }
  
  // Create a panel with text
  createPanel(config) {
    const {
      width = 0.4,
      height = 0.1,
      position = new THREE.Vector3(0, 0, 0),
      backgroundColor = 0x1A1A1A,
      texts = [],
      highlighted = false
    } = config;
    
    // Create panel group
    const panel = new THREE.Group();
    panel.position.copy(position);
    
    // Create background
    const bgGeometry = new THREE.BoxGeometry(width, height, 0.02);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: highlighted ? 0x333333 : backgroundColor,
      transparent: true,
      opacity: 0.8,
      depthTest: false  // Don't test depth to ensure it renders on top
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.renderOrder = 9000;  // High render order
    panel.add(background);
    
    // Add texts to panel
    texts.forEach((textConfig) => {
      const {
        text,
        color = '#FFFFFF',
        fontSize = 0.03,
        yOffset = 0
      } = textConfig;
      
      // Create text texture
      const texture = this.createTextTexture(text, { 
        textColor: color,
        fontSize: 64
      });
      
      // Create text mesh
      const textGeometry = new THREE.PlaneGeometry(width * 0.8, height * 0.5);
      const textMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: false  // Don't test depth to ensure it renders on top
      });
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, yOffset, 0.01);
      textMesh.renderOrder = 9001;  // Higher than background
      
      panel.add(textMesh);
    });
    
    this.uiRoot.add(panel);
    return panel;
  }
  
  // Create UI panels
  createUIPanels() {
    // Top status panels
    this.createPanel({
      position: new THREE.Vector3(-0.5, 0.3, -0.5),
      texts: [
        { text: "75%", color: "#FFFFFF", yOffset: 0.02 },
        { text: "Battery", color: "#AAAAAA", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    this.createPanel({
      position: new THREE.Vector3(0, 0.3, -0.5),
      texts: [
        { text: "75%", color: "#FFFFFF", yOffset: 0.02 },
        { text: "O2", color: "#AAAAAA", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    this.createPanel({
      position: new THREE.Vector3(0.5, 0.3, -0.5),
      texts: [
        { text: "14.3psi", color: "#FFFFFF", yOffset: 0.02 },
        { text: "Pressure", color: "#AAAAAA", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    // Middle info panels
    this.createPanel({
      position: new THREE.Vector3(-0.3, 0, -0.5),
      texts: [
        { text: "100m", color: "#FFCC00", yOffset: 0.02 },
        { text: "100m", color: "#FFCC00", yOffset: 0.02 },
        { text: "remaining", color: "#FFFFFF", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    this.createPanel({
      position: new THREE.Vector3(0.3, 0, -0.5),
      texts: [
        { text: "15:00 min", color: "#00FF66", yOffset: 0.02 },
        { text: "to Destination", color: "#FFFFFF", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    // Bottom panels
    this.createPanel({
      position: new THREE.Vector3(0, -0.2, -0.5),
      texts: [
        { text: "Walked 500m", color: "#FFFFFF" }
      ]
    });
    
    this.createPanel({
      position: new THREE.Vector3(-0.4, -0.3, -0.5),
      texts: [
        { text: "Pilot Neil Armstrong", color: "#FFFFFF" }
      ]
    });
    
    this.createPanel({
      position: new THREE.Vector3(0.4, -0.3, -0.5),
      texts: [
        { text: "Navigation Mode", color: "#FFFFFF" }
      ],
      highlighted: true
    });
  }
  
  // Create map texture
  createMapTexture() {
    // Create canvas for map
    const canvas = document.createElement('canvas');
    canvas.width = 512; // Smaller texture
    canvas.height = 512;
    
    const context = canvas.getContext('2d');
    
    // Fill with dark background
    context.fillStyle = '#1e2d3b';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw a grid
    context.strokeStyle = '#3a5c6e';
    context.lineWidth = 2;
    
    // Grid lines
    const gridSize = 50;
    for (let i = 0; i <= canvas.width; i += gridSize) {
      // Vertical line
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, canvas.height);
      context.stroke();
      
      // Horizontal line
      context.beginPath();
      context.moveTo(0, i);
      context.lineTo(canvas.width, i);
      context.stroke();
    }
    
    // Add a path line
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(canvas.width * 0.8, canvas.height * 0.8);
    context.lineTo(canvas.width * 0.6, canvas.height * 0.6);
    context.lineTo(canvas.width * 0.3, canvas.height * 0.5);
    context.stroke();
    
    // Add start point (blue dot)
    context.fillStyle = '#3498db';
    context.beginPath();
    context.arc(canvas.width * 0.8, canvas.height * 0.8, 10, 0, Math.PI * 2);
    context.fill();
    
    // Add end point (yellow dot)
    context.fillStyle = '#f1c40f';
    context.beginPath();
    context.arc(canvas.width * 0.3, canvas.height * 0.5, 10, 0, Math.PI * 2);
    context.fill();
    
    // Add current position (white dot)
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(canvas.width * 0.6, canvas.height * 0.6, 8, 0, Math.PI * 2);
    context.fill();
    
    // Add some text labels directly on the map
    context.font = 'bold 20px Arial';
    context.fillStyle = '#FFFFFF';
    context.fillText('START', canvas.width * 0.8, canvas.height * 0.8 - 20);
    context.fillText('END', canvas.width * 0.3, canvas.height * 0.5 - 20);
    context.fillText('YOU ARE HERE', canvas.width * 0.6, canvas.height * 0.6 - 20);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }
  
  // Create the map window
  createMapWindow() {
    console.log('Creating map window');
    
    // Create container for map window
    this.mapWindow = new THREE.Group();
    this.mapWindow.visible = false; // Initially hidden
    this.uiRoot.add(this.mapWindow);
    
    // Create map background panel - SIMPLER VERSION
    const windowWidth = 1.0;  // Smaller width
    const windowHeight = 0.8; // Smaller height
    
    // Create a simple colored background
    const bgGeometry = new THREE.PlaneGeometry(windowWidth, windowHeight);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x0a1525,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const windowBg = new THREE.Mesh(bgGeometry, bgMaterial);
    windowBg.renderOrder = 10000;
    this.mapWindow.add(windowBg);
    
    // Add simple title text 
    const titleTexture = this.createTextTexture('MAP VIEW', { 
      textColor: '#FFFFFF',
      fontSize: 48,
      backgroundColor: 'rgba(0,0,0,0.5)',
      width: 512,
      height: 96
    });
    
    const titleGeometry = new THREE.PlaneGeometry(0.6, 0.12);
    const titleMaterial = new THREE.MeshBasicMaterial({
      map: titleTexture,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
    titleMesh.position.set(0, windowHeight/2 - 0.1, 0.01);
    titleMesh.renderOrder = 10001;
    this.mapWindow.add(titleMesh);
    
    // Add close button
    const closeTexture = this.createTextTexture('CLOSE ×', { 
      textColor: '#FF5555',
      fontSize: 48,
      backgroundColor: 'rgba(0,0,0,0.5)',
      width: 256,
      height: 96
    });
    
    const closeGeometry = new THREE.PlaneGeometry(0.2, 0.1);
    const closeMaterial = new THREE.MeshBasicMaterial({
      map: closeTexture,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const closeMesh = new THREE.Mesh(closeGeometry, closeMaterial);
    closeMesh.position.set(windowWidth/2 - 0.15, windowHeight/2 - 0.1, 0.01);
    closeMesh.renderOrder = 10001;
    this.mapWindow.add(closeMesh);
    
    // Add simple map texture
    const mapTexture = this.createMapTexture();
    
    const mapGeometry = new THREE.PlaneGeometry(windowWidth - 0.2, windowHeight - 0.3);
    const mapMaterial = new THREE.MeshBasicMaterial({
      map: mapTexture,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const mapMesh = new THREE.Mesh(mapGeometry, mapMaterial);
    mapMesh.position.set(0, -0.05, 0.01);
    mapMesh.renderOrder = 10001;
    this.mapWindow.add(mapMesh);
    
    // Position the map window in front of the user
    this.mapWindow.position.set(0, 0, -0.3);
    
    console.log(`Created map window with ${this.mapWindow.children.length} elements`);
    
    return this.mapWindow;
  }
  
  // Toggle map window visibility
  toggleMapWindow(visible = null) {
    if (visible === null) {
      // Toggle if no specific state provided
      this.mapWindowVisible = !this.mapWindowVisible;
    } else {
      // Set to specific state
      this.mapWindowVisible = visible;
    }
    
    // Update visibility
    if (this.mapWindow) {
      this.mapWindow.visible = this.mapWindowVisible;
      console.log('Map window visibility set to:', this.mapWindowVisible ? 'visible' : 'hidden');
      
      // Force rendering options to ensure visibility
      this.mapWindow.traverse((obj) => {
        if (obj.isMesh) {
          obj.renderOrder = 10000;
          if (obj.material) {
            obj.material.depthTest = false;
            obj.material.depthWrite = false;
            obj.material.needsUpdate = true;
          }
        }
      });
      
      // Position in front of user - helps with visibility
      if (this.mapWindowVisible) {
        this.updateUIPosition();
      }
    } else {
      console.error('Map window does not exist!');
    }
    
    return this.mapWindowVisible;
  }
  
  // Update UI position to follow the camera in both VR and non-VR modes
updateUIPosition() {
    if (!this.uiRoot) return;
    
    if (this.renderer.xr.isPresenting) {
      // When in VR mode, use the XR camera specifically
      const xrCamera = this.renderer.xr.getCamera();
      
      // Get the current XR headset position and orientation
      const vrCameraPos = new THREE.Vector3();
      xrCamera.getWorldPosition(vrCameraPos);
      
      // Get a vector pointing forward from the VR headset
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(xrCamera.quaternion);
      
      // Position UI directly in front of the VR headset at fixed distance
      const uiPosition = vrCameraPos.clone().add(forward.multiplyScalar(0.5));
      this.uiRoot.position.copy(uiPosition);
      
      // Make the UI always face the user by matching the XR camera orientation
      this.uiRoot.quaternion.copy(xrCamera.quaternion);
      
      // Force high render order and material settings in VR
      this.uiRoot.traverse((obj) => {
        if (obj.isMesh) {
          obj.renderOrder = 10000;
          if (obj.material) {
            obj.material.depthTest = false;
            obj.material.depthWrite = false;
            obj.material.side = THREE.DoubleSide;
            obj.material.needsUpdate = true;
          }
        }
      });
    } else {
      // Non-VR mode - use regular camera
      const cameraPosition = this.camera.position.clone();
      const cameraDirection = new THREE.Vector3(0, 0, -1);
      cameraDirection.applyQuaternion(this.camera.quaternion);
      
      // Position UI in front of camera
      const uiPosition = cameraPosition.clone().add(
        cameraDirection.multiplyScalar(0.3)
      );
      
      // Update UI position
      this.uiRoot.position.copy(uiPosition);
      
      // Make UI face the camera
      this.uiRoot.quaternion.copy(this.camera.quaternion);
    }
  }

  // Add this to your SpaceEnvironment class to create the action buttons menu
createActionButtons() {
    // Create a container for the action buttons
    this.actionButtonsMenu = new THREE.Group();
    this.actionButtonsMenu.visible = false; // Initially hidden
    this.uiRoot.add(this.actionButtonsMenu);
    
    // Define the buttons
    const buttons = [
      { icon: "⊞", label: "Maps", id: "maps" },
      { icon: "≡", label: "Procedures", id: "procedures" },
      { icon: "⛶", label: "Pictures", id: "pictures" },
      { icon: "⏺", label: "Recording", id: "recording" }
    ];
    
    // Create the background panel for buttons
    const panelWidth = 0.8;
    const panelHeight = 0.15;
    
    const bgGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
    const bgMaterial = new THREE.MeshBasicMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const panel = new THREE.Mesh(bgGeometry, bgMaterial);
    panel.renderOrder = 11000;
    this.actionButtonsMenu.add(panel);
    
    // Create the individual buttons
    const buttonWidth = 0.15;
    const buttonSpacing = 0.17;
    let startX = -buttonSpacing * 1.5; // Center the buttons
    
    buttons.forEach((button, index) => {
      // Create button background
      const buttonGeometry = new THREE.PlaneGeometry(buttonWidth, buttonWidth);
      const buttonMaterial = new THREE.MeshBasicMaterial({
        color: button.id === "maps" ? 0x444444 : 0x333333, // Highlight the Maps button
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        side: THREE.DoubleSide
      });
      
      const buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
      buttonMesh.position.set(startX + (buttonSpacing * index), 0, 0.01);
      buttonMesh.renderOrder = 11001;
      this.actionButtonsMenu.add(buttonMesh);
      
      // Add icon to button
      const iconTexture = this.createTextTexture(button.icon, {
        textColor: '#FFFFFF',
        fontSize: 36,
        backgroundColor: 'transparent',
        width: 128,
        height: 128
      });
      
      const iconGeometry = new THREE.PlaneGeometry(buttonWidth * 0.6, buttonWidth * 0.6);
      const iconMaterial = new THREE.MeshBasicMaterial({
        map: iconTexture,
        transparent: true,
        depthTest: false,
        side: THREE.DoubleSide
      });
      
      const iconMesh = new THREE.Mesh(iconGeometry, iconMaterial);
      iconMesh.position.set(0, 0.02, 0.01);
      iconMesh.renderOrder = 11002;
      buttonMesh.add(iconMesh);
      
      // Add label under the icon
      const labelTexture = this.createTextTexture(button.label, {
        textColor: '#FFFFFF',
        fontSize: 24,
        backgroundColor: 'transparent',
        width: 128,
        height: 64
      });
      
      const labelGeometry = new THREE.PlaneGeometry(buttonWidth, buttonWidth * 0.3);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        depthTest: false,
        side: THREE.DoubleSide
      });
      
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
      labelMesh.position.set(0, -0.05, 0.01);
      labelMesh.renderOrder = 11002;
      buttonMesh.add(labelMesh);
      
      // Store a reference to each button for interaction
      buttonMesh.userData.id = button.id;
      buttonMesh.userData.isActionButton = true;
    });
    
    // Position the menu in a good location
    this.actionButtonsMenu.position.set(0, -0.1, -0.4);
    console.log('actionbuttonsaremade');
    return this.actionButtonsMenu;
  }
  
  // Add this method to toggle the action buttons
  toggleActionButtons(visible = null) {
    if (!this.actionButtonsMenu) {
      this.createActionButtons();
    }
    
    if (visible === null) {
      // Toggle if no specific state provided
      this.actionButtonsMenu.visible = !this.actionButtonsMenu.visible;
    } else {
      // Set to specific state
      this.actionButtonsMenu.visible = visible;
    }
    
    console.log('Action buttons visibility:', this.actionButtonsMenu.visible ? 'visible' : 'hidden');
    
    // If showing, make sure they're positioned properly
    if (this.actionButtonsMenu.visible) {
      this.updateUIPosition();
    }
    console.log('toggleactionbuttons');

    return this.actionButtonsMenu.visible;
  }
  
  // Enhanced handlePinchGesture with extra logging
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
          
          // Toggle action buttons on left hand pinch
          if (isLeft) {
            console.log('LEFT hand pinch - attempting to toggle action buttons');
            // Force the creation of action buttons if they don't exist
            if (!this.actionButtonsMenu) {
              console.log('Creating action buttons for the first time');
              this.createActionButtons();
            }
            
            // Toggle visibility directly
            if (this.actionButtonsMenu) {
              this.actionButtonsMenu.visible = !this.actionButtonsMenu.visible;
              console.log('Action buttons visibility manually set to: ' + 
                         (this.actionButtonsMenu.visible ? 'VISIBLE' : 'HIDDEN'));
              
              // Force position update
              this.updateUIPosition();
            } else {
              console.error('Action buttons menu still not created!');
            }
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
  // Add this to your SpaceEnvironment class

// Keyboard event listener for map modal
addKeyboardListeners() {
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyM') {
        console.log('Map key (M) pressed - toggling map modal');
        this.toggleMapModal();
      }
    });
  }
  
  // Create the map modal
  createMapModal() {
    console.log('Creating map modal window');
    
    // Create container for map modal
    this.mapModal = new THREE.Group();
    this.mapModal.visible = false; // Initially hidden
    this.uiRoot.add(this.mapModal);
    
    // Modal dimensions
    const modalWidth = 1.2;
    const modalHeight = 0.9;
    
    // Create modal background with a dark blue color
    const bgGeometry = new THREE.PlaneGeometry(modalWidth, modalHeight);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x1a2736,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const modalBg = new THREE.Mesh(bgGeometry, bgMaterial);
    modalBg.renderOrder = 20000;
    this.mapModal.add(modalBg);
    
    // Add header with title
    this.addModalHeader(modalWidth, modalHeight);
    
    // Add sidebar with points
    this.addModalSidebar(modalWidth, modalHeight);
    
    // Add main map area
    this.addModalMap(modalWidth, modalHeight);
    
    // Add footer with stats
    this.addModalFooter(modalWidth, modalHeight);
    
    // Position the modal in front of the user
    this.mapModal.position.set(0, 0, -0.5);
    
    // Make sure every element renders on top
    this.mapModal.traverse((obj) => {
      if (obj.isMesh) {
        obj.renderOrder = 20000;
        if (obj.material) {
          obj.material.depthTest = false;
          obj.material.depthWrite = false;
          obj.material.needsUpdate = true;
        }
      }
    });
    
    console.log(`Created map modal with ${this.mapModal.children.length} elements`);
    
    return this.mapModal;
  }
  
  // Add header section to modal
  addModalHeader(modalWidth, modalHeight) {
    // Title
    const titleTexture = this.createTextTexture('Maps', { 
      textColor: '#FFFFFF',
      fontSize: 32,
      backgroundColor: 'transparent',
      width: 256,
      height: 64
    });
    
    const titleGeometry = new THREE.PlaneGeometry(0.3, 0.06);
    const titleMaterial = new THREE.MeshBasicMaterial({
      map: titleTexture,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
    titleMesh.position.set(0, modalHeight/2 - 0.05, 0.01);
    titleMesh.renderOrder = 20001;
    this.mapModal.add(titleMesh);
    
    // Close button
    const closeTexture = this.createTextTexture('×', { 
      textColor: '#FFFFFF',
      fontSize: 48,
      backgroundColor: 'rgba(0,0,0,0.3)',
      width: 64,
      height: 64
    });
    
    const closeGeometry = new THREE.PlaneGeometry(0.05, 0.05);
    const closeMaterial = new THREE.MeshBasicMaterial({
      map: closeTexture,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const closeMesh = new THREE.Mesh(closeGeometry, closeMaterial);
    closeMesh.position.set(modalWidth/2 - 0.07, modalHeight/2 - 0.05, 0.01);
    closeMesh.renderOrder = 20001;
    this.mapModal.add(closeMesh);
    
    // Minimize button
    const minTexture = this.createTextTexture('−', { 
      textColor: '#FFFFFF',
      fontSize: 48,
      backgroundColor: 'rgba(0,0,0,0.3)',
      width: 64,
      height: 64
    });
    
    const minGeometry = new THREE.PlaneGeometry(0.05, 0.05);
    const minMaterial = new THREE.MeshBasicMaterial({
      map: minTexture,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const minMesh = new THREE.Mesh(minGeometry, minMaterial);
    minMesh.position.set(modalWidth/2 - 0.14, modalHeight/2 - 0.05, 0.01);
    minMesh.renderOrder = 20001;
    this.mapModal.add(minMesh);
  }
  
  // Add sidebar with points to modal
  addModalSidebar(modalWidth, modalHeight) {
    // Sidebar background
    const sidebarWidth = 0.3;
    const sidebarGeometry = new THREE.PlaneGeometry(sidebarWidth, modalHeight - 0.1);
    const sidebarMaterial = new THREE.MeshBasicMaterial({
      color: 0x1e2d3b,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const sidebarMesh = new THREE.Mesh(sidebarGeometry, sidebarMaterial);
    sidebarMesh.position.set(-modalWidth/2 + sidebarWidth/2, -0.05, 0.005);
    sidebarMesh.renderOrder = 20002;
    this.mapModal.add(sidebarMesh);
    
    // Add location points
    const points = [
      { icon: "◉", label: "Point A" },
      { icon: "◉", label: "Point B" },
      { icon: "+", label: "Add Point" }
    ];
    
    points.forEach((point, index) => {
      // Point item background
      const itemGeometry = new THREE.PlaneGeometry(sidebarWidth - 0.04, 0.06);
      const itemMaterial = new THREE.MeshBasicMaterial({
        color: 0x2c3e50,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        side: THREE.DoubleSide
      });
      
      const itemMesh = new THREE.Mesh(itemGeometry, itemMaterial);
      itemMesh.position.set(-modalWidth/2 + sidebarWidth/2, modalHeight/2 - 0.15 - (index * 0.08), 0.01);
      itemMesh.renderOrder = 20003;
      this.mapModal.add(itemMesh);
      
      // Point label
      const pointTexture = this.createTextTexture(`${point.icon} ${point.label}`, { 
        textColor: '#FFFFFF',
        fontSize: 24,
        backgroundColor: 'transparent',
        width: 256,
        height: 48
      });
      
      const pointGeometry = new THREE.PlaneGeometry(sidebarWidth - 0.06, 0.05);
      const pointMaterial = new THREE.MeshBasicMaterial({
        map: pointTexture,
        transparent: true,
        depthTest: false,
        side: THREE.DoubleSide
      });
      
      const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
      pointMesh.position.set(0, 0, 0.005);
      pointMesh.renderOrder = 20004;
      itemMesh.add(pointMesh);
    });
  }
  
  // Add main map area to modal
  addModalMap(modalWidth, modalHeight) {
    // Create topographic map texture
    const mapTexture = this.createTopographicMapTexture();
    
    // Map area
    const mapWidth = modalWidth - 0.35;
    const mapHeight = modalHeight - 0.2;
    const mapGeometry = new THREE.PlaneGeometry(mapWidth, mapHeight);
    const mapMaterial = new THREE.MeshBasicMaterial({
      map: mapTexture,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const mapMesh = new THREE.Mesh(mapGeometry, mapMaterial);
    mapMesh.position.set(modalWidth/2 - mapWidth/2 - 0.025, 0, 0.01);
    mapMesh.renderOrder = 20003;
    this.mapModal.add(mapMesh);
    
    // Add zoom controls
    this.addZoomControls(modalWidth, modalHeight);
  }
  
  // Create topographic map texture
  createTopographicMapTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#1e3040';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw topographic lines
    ctx.strokeStyle = '#38586c';
    ctx.lineWidth = 1;
    
    // Create contour lines
    for (let i = 0; i < 30; i++) {
      const yOffset = i * 35;
      
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 5) {
        // Create wavy contour lines
        const noise1 = Math.sin(x * 0.01) * 20;
        const noise2 = Math.cos(x * 0.05) * 10;
        const noise3 = Math.sin(x * 0.002 + i * 0.5) * 40;
        
        const y = yOffset + noise1 + noise2 + noise3;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    
    // Draw a path line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.8, canvas.height * 0.8);
    ctx.lineTo(canvas.width * 0.6, canvas.height * 0.6);
    ctx.lineTo(canvas.width * 0.3, canvas.height * 0.5);
    ctx.stroke();
    
    // Draw dotted future path
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.3, canvas.height * 0.5);
    ctx.bezierCurveTo(
      canvas.width * 0.2, canvas.height * 0.4,
      canvas.width * 0.15, canvas.height * 0.3, 
      canvas.width * 0.2, canvas.height * 0.2
    );
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Add destinations
    // Start point (blue dot)
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, canvas.height * 0.8, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Current point (white dot)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(canvas.width * 0.6, canvas.height * 0.6, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Next point (blue dot)
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(canvas.width * 0.3, canvas.height * 0.5, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // End point (yellow dot)
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(canvas.width * 0.2, canvas.height * 0.2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Add NASA Base label
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('NASA Base', canvas.width * 0.2, canvas.height * 0.2 - 15);
    
    // Add Start Point label
    ctx.font = '14px Arial';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('Start Point', canvas.width * 0.8, canvas.height * 0.8 - 15);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Point A', canvas.width * 0.8, canvas.height * 0.8 - 30);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  // Add zoom controls to map
  addZoomControls(modalWidth, modalHeight) {
    // Zoom in button
    const zoomInTexture = this.createTextTexture('+', { 
      textColor: '#FFFFFF',
      fontSize: 32,
      backgroundColor: 'rgba(0,0,0,0.5)',
      width: 48,
      height: 48
    });
    
    const zoomInGeometry = new THREE.PlaneGeometry(0.04, 0.04);
    const zoomInMaterial = new THREE.MeshBasicMaterial({
      map: zoomInTexture,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const zoomInMesh = new THREE.Mesh(zoomInGeometry, zoomInMaterial);
    zoomInMesh.position.set(modalWidth/2 - 0.07, modalHeight/2 - 0.2, 0.01);
    zoomInMesh.renderOrder = 20005;
    this.mapModal.add(zoomInMesh);
    
    // Zoom out button
    const zoomOutTexture = this.createTextTexture('-', { 
      textColor: '#FFFFFF',
      fontSize: 32,
      backgroundColor: 'rgba(0,0,0,0.5)',
      width: 48,
      height: 48
    });
    
    const zoomOutGeometry = new THREE.PlaneGeometry(0.04, 0.04);
    const zoomOutMaterial = new THREE.MeshBasicMaterial({
      map: zoomOutTexture,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const zoomOutMesh = new THREE.Mesh(zoomOutGeometry, zoomOutMaterial);
    zoomOutMesh.position.set(modalWidth/2 - 0.07, modalHeight/2 - 0.25, 0.01);
    zoomOutMesh.renderOrder = 20005;
    this.mapModal.add(zoomOutMesh);
  }
  
  // Add footer with stats to modal
  addModalFooter(modalWidth, modalHeight) {
    // Footer background
    const footerGeometry = new THREE.PlaneGeometry(modalWidth - 0.05, 0.06);
    const footerMaterial = new THREE.MeshBasicMaterial({
      color: 0x2c3e50,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const footerMesh = new THREE.Mesh(footerGeometry, footerMaterial);
    footerMesh.position.set(0, -modalHeight/2 + 0.04, 0.01);
    footerMesh.renderOrder = 20002;
    this.mapModal.add(footerMesh);
    
    // Add stats
    const stats = [
      { label: 'Total Distance', value: '50m' },
      { label: 'Remaining Distance', value: '20m' },
      { label: 'Expected Duration', value: '00:02:03' },
      { label: 'Time Left', value: '11:00:48' }
    ];
    
    stats.forEach((stat, index) => {
      const offset = ((index - 1.5) * 0.25);
      
      // Label
      const labelTexture = this.createTextTexture(stat.label, { 
        textColor: '#AAAAAA',
        fontSize: 14,
        backgroundColor: 'transparent',
        width: 200,
        height: 24
      });
      
      const labelGeometry = new THREE.PlaneGeometry(0.2, 0.02);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        depthTest: false,
        side: THREE.DoubleSide
      });
      
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
      labelMesh.position.set(offset, -modalHeight/2 + 0.05, 0.01);
      labelMesh.renderOrder = 20003;
      this.mapModal.add(labelMesh);
      
      // Value
      const valueTexture = this.createTextTexture(stat.value, { 
        textColor: '#FFFFFF',
        fontSize: 16,
        backgroundColor: 'transparent',
        width: 120,
        height: 24
      });
      
      const valueGeometry = new THREE.PlaneGeometry(0.1, 0.02);
      const valueMaterial = new THREE.MeshBasicMaterial({
        map: valueTexture,
        transparent: true,
        depthTest: false,
        side: THREE.DoubleSide
      });
      
      const valueMesh = new THREE.Mesh(valueGeometry, valueMaterial);
      valueMesh.position.set(offset, -modalHeight/2 + 0.03, 0.01);
      valueMesh.renderOrder = 20003;
      this.mapModal.add(valueMesh);
    });
  }
  
  // Toggle map modal visibility
  toggleMapModal() {
    // Create map modal if it doesn't exist yet
    if (!this.mapModal) {
      this.createMapModal();
    }
    
    // Toggle visibility
    this.mapModal.visible = !this.mapModal.visible;
    console.log('Map modal visibility:', this.mapModal.visible ? 'visible' : 'hidden');
    
    // If showing, update position
    if (this.mapModal.visible) {
      this.updateUIPosition();
    }
  }
  
  update() {
    // Earth slow rotation
    if (this.earth) {
      this.earth.rotation.y += 0.0001;
    }
    
    // Update controls (when not in VR)
    if (this.controls) {
      this.controls.update();
    }
    
    // Make sure action buttons are created
    if (!this.actionButtonsMenu) {
      console.log('Creating action buttons in update loop');
      this.createActionButtons();
    }
    
    // Update UI position to follow camera
    this.updateUIPosition();
    
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
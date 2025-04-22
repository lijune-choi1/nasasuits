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
  
  // Update UI position
  updateUIPosition() {
    if (!this.uiRoot) return;
    
    // Get camera position and direction
    const cameraPosition = this.camera.position.clone();
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(this.camera.quaternion);
    
    // Position UI in front of camera
    const uiDistance = 0.3; // 30cm in front (closer for better visibility)
    const uiPosition = cameraPosition.clone().add(
      cameraDirection.multiplyScalar(uiDistance)
    );
    
    // Update UI position
    this.uiRoot.position.copy(uiPosition);
    
    // Make UI face the camera
    this.uiRoot.quaternion.copy(this.camera.quaternion);
  }
  
  // Debug UI function
  debugUI() {
    console.log('*** UI DEBUG INFO ***');
    console.log('UI root exists:', !!this.uiRoot);
    console.log('UI root visible:', this.uiRoot ? this.uiRoot.visible : 'N/A');
    console.log('UI root children count:', this.uiRoot ? this.uiRoot.children.length : 'N/A');
    console.log('UI root position:', this.uiRoot ? this.uiRoot.position : 'N/A');
    
    console.log('Map window exists:', !!this.mapWindow);
    console.log('Map window visible:', this.mapWindow ? this.mapWindow.visible : 'N/A');
    console.log('Map window children count:', this.mapWindow ? this.mapWindow.children.length : 'N/A');
    console.log('Map window position:', this.mapWindow ? this.mapWindow.position : 'N/A');
    
    console.log('Forcing UI to be visible...');
    
    // Force UI to be visible
    if (this.uiRoot) {
      this.uiRoot.visible = true;
      this.uiRoot.traverse((obj) => {
        if (obj.isMesh) {
          obj.renderOrder = 10000;
          if (obj.material) {
            obj.material.depthTest = false;
            obj.material.depthWrite = false;
            obj.material.transparent = true;
            obj.material.opacity = 1.0;
            obj.material.needsUpdate = true;
          }
        }
      });
      
      // Force map window to be visible
      if (this.mapWindow) {
        this.mapWindow.visible = true;
        this.mapWindowVisible = true;
      }
      
      // Update position
      this.updateUIPosition();
    }
    
    console.log('*** END DEBUG INFO ***');
  }
  
  // Main update method called each frame
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
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';

class SpaceEnvironment {
  constructor() {
    // Initialize application
    this.initializeApp();
    this.addEventListeners();
    
    // Create UI elements
    this.initializeUI();
    
    // Start animation loop
    this.renderer.setAnimationLoop(this.animate.bind(this));
    
    // Hide loading indicator
    this.hideLoading();
    
    console.log('NASA SUITS Space Environment initialized');
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
    
    // Pinch state tracking
    this.isPinching = false;
    this.lastPinchTime = 0;
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
    
    // Setup UI update method to follow camera
    this.setupUITracking();
  }
  
  // Add event listeners
  addEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Map key shortcut
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyM') {
        console.log('Map key pressed');
        this.toggleMapWindow();
      }
    });
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

  // Create text texture for UI panels
  createTextTexture(text, options = {}) {
    const {
      fontSize = 64,
      fontFamily = 'Arial',
      textColor = '#FFFFFF',
      backgroundColor = 'transparent',
      width = 512,
      height = 128
    } = options;
    
    // Create canvas for text
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background if not transparent
    if (backgroundColor !== 'transparent') {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Configure text rendering
    context.font = `bold ${fontSize}px ${fontFamily}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = textColor;
    
    // Draw text
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create and return texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
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
      depthTest: false  // Important: don't test depth to ensure rendering on top
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
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
        depthTest: false  // Important: don't test depth to ensure rendering on top
      });
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, yOffset, 0.01);
      
      panel.add(textMesh);
    });
    
    this.uiRoot.add(panel);
    return panel;
  }
  
  // Create a map or topographic texture
  createMapTexture(options = {}) {
    const {
      width = 1024,
      height = 1024
    } = options;
    
    // Create canvas for map
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const context = canvas.getContext('2d');
    
    // Fill with dark background
    context.fillStyle = '#1e2d3b';
    context.fillRect(0, 0, width, height);
    
    // Draw topographic contour lines
    context.strokeStyle = '#3a5c6e';
    context.lineWidth = 2;
    
    // Create random topographic pattern
    for (let i = 0; i < 20; i++) {
      const offset = i * 40;
      
      context.beginPath();
      
      // Create a wavy line pattern for contours
      for (let x = 0; x < width; x += 10) {
        const y = offset + Math.sin(x / 100) * 30 + Math.cos(x / 50) * 20 + (Math.random() * 5);
        
        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      
      context.stroke();
    }
    
    // Add a path line
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(width * 0.8, height * 0.8);
    context.quadraticCurveTo(width * 0.6, height * 0.6, width * 0.3, height * 0.5);
    context.stroke();
    
    // Add start point (blue dot)
    context.fillStyle = '#3498db';
    context.beginPath();
    context.arc(width * 0.8, height * 0.8, 10, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.stroke();
    
    // Add end point (yellow dot)
    context.fillStyle = '#f1c40f';
    context.beginPath();
    context.arc(width * 0.3, height * 0.5, 10, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.stroke();
    
    // Add current position (white dot with pulse)
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(width * 0.6, height * 0.6, 8, 0, Math.PI * 2);
    context.fill();
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }
  
  // Create main UI panels
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
  
  // Create the map window interface
  createMapWindow() {
    // Create container for map window
    this.mapWindow = new THREE.Group();
    this.mapWindow.visible = false; // Initially hidden
    this.uiRoot.add(this.mapWindow);
    
    // Create map background panel
    const windowWidth = 1.5;
    const windowHeight = 1.2;
    
    const bgGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, 0.02);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x1a2736,
      transparent: true,
      opacity: 0.9,
      depthTest: false  // Important: don't test depth to ensure rendering on top
    });
    
    const windowBg = new THREE.Mesh(bgGeometry, bgMaterial);
    this.mapWindow.add(windowBg);
    
   // Add window header with title
   const headerGeometry = new THREE.BoxGeometry(windowWidth, 0.1, 0.03);
   const headerMaterial = new THREE.MeshBasicMaterial({ 
     color: 0x2c3e50,
     transparent: true,
     opacity: 0.9,
     depthTest: false
   });
   
   const windowHeader = new THREE.Mesh(headerGeometry, headerMaterial);
   windowHeader.position.set(0, windowHeight/2 - 0.05, 0.01);
   this.mapWindow.add(windowHeader);
   
   // Add title text
   const titleTexture = this.createTextTexture('Maps', { 
     textColor: '#FFFFFF',
     fontSize: 40
   });
   
   const titleGeometry = new THREE.PlaneGeometry(0.4, 0.08);
   const titleMaterial = new THREE.MeshBasicMaterial({
     map: titleTexture,
     transparent: true,
     depthTest: false
   });
   
   const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
   titleMesh.position.set(0, windowHeight/2 - 0.05, 0.02);
   this.mapWindow.add(titleMesh);
   
   // Add close button
   const closeTexture = this.createTextTexture('×', { 
     textColor: '#FFFFFF',
     fontSize: 60
   });
   
   const closeGeometry = new THREE.PlaneGeometry(0.08, 0.08);
   const closeMaterial = new THREE.MeshBasicMaterial({
     map: closeTexture,
     transparent: true,
     depthTest: false
   });
   
   const closeMesh = new THREE.Mesh(closeGeometry, closeMaterial);
   closeMesh.position.set(windowWidth/2 - 0.1, windowHeight/2 - 0.05, 0.02);
   this.mapWindow.add(closeMesh);
   
   // Add click detection for close button
   closeMesh.userData.isClickable = true;
   closeMesh.userData.clickHandler = () => {
     this.toggleMapWindow(false);
   };
   
   // Add minimize button
   const minimizeTexture = this.createTextTexture('−', { 
     textColor: '#FFFFFF',
     fontSize: 60
   });
   
   const minimizeGeometry = new THREE.PlaneGeometry(0.08, 0.08);
   const minimizeMaterial = new THREE.MeshBasicMaterial({
     map: minimizeTexture,
     transparent: true,
     depthTest: false
   });
   
   const minimizeMesh = new THREE.Mesh(minimizeGeometry, minimizeMaterial);
   minimizeMesh.position.set(windowWidth/2 - 0.2, windowHeight/2 - 0.05, 0.02);
   this.mapWindow.add(minimizeMesh);
   
   // Add map view
   const mapTexture = this.createMapTexture();
   
   const mapGeometry = new THREE.PlaneGeometry(windowWidth - 0.6, windowHeight - 0.3);
   const mapMaterial = new THREE.MeshBasicMaterial({
     map: mapTexture,
     transparent: true,
     depthTest: false
   });
   
   const mapMesh = new THREE.Mesh(mapGeometry, mapMaterial);
   mapMesh.position.set(0.1, -0.02, 0.02);
   this.mapWindow.add(mapMesh);
   
   // Add sidebar
   const sidebarGeometry = new THREE.BoxGeometry(0.4, windowHeight - 0.15, 0.01);
   const sidebarMaterial = new THREE.MeshBasicMaterial({ 
     color: 0x2c3e50,
     transparent: true,
     opacity: 0.8,
     depthTest: false
   });
   
   const sidebarMesh = new THREE.Mesh(sidebarGeometry, sidebarMaterial);
   sidebarMesh.position.set(-windowWidth/2 + 0.2, -0.05, 0.015);
   this.mapWindow.add(sidebarMesh);
   
   // Add location items to sidebar
   const locations = [
     { name: 'Point A', icon: '📍' },
     { name: 'Point B', icon: '📍' },
     { name: 'Add Point', icon: '➕' }
   ];
   
   locations.forEach((location, index) => {
     // Location button
     const locBgGeometry = new THREE.PlaneGeometry(0.35, 0.08);
     const locBgMaterial = new THREE.MeshBasicMaterial({ 
       color: 0x34495e,
       transparent: true,
       opacity: 0.9,
       depthTest: false
     });
     
     const locButton = new THREE.Mesh(locBgGeometry, locBgMaterial);
     locButton.position.set(-windowWidth/2 + 0.2, windowHeight/2 - 0.25 - (index * 0.12), 0.02);
     this.mapWindow.add(locButton);
     
     // Location text
     const locTexture = this.createTextTexture(`${location.icon} ${location.name}`, { 
       textColor: '#FFFFFF',
       fontSize: 32
     });
     
     const locTextGeometry = new THREE.PlaneGeometry(0.33, 0.07);
     const locTextMaterial = new THREE.MeshBasicMaterial({
       map: locTexture,
       transparent: true,
       depthTest: false
     });
     
     const locTextMesh = new THREE.Mesh(locTextGeometry, locTextMaterial);
     locTextMesh.position.set(-windowWidth/2 + 0.2, windowHeight/2 - 0.25 - (index * 0.12), 0.025);
     this.mapWindow.add(locTextMesh);
   });
   
   // Add stats at bottom
   const statsData = [
     { label: 'Total Distance', value: '50m' },
     { label: 'Remaining Distance', value: '20m' },
     { label: 'Expected Duration', value: '00:02:03' },
     { label: 'Time Left', value: '11:00:48' }
   ];
   
   // Stats container
   const statsBgGeometry = new THREE.PlaneGeometry(windowWidth - 0.1, 0.1);
   const statsBgMaterial = new THREE.MeshBasicMaterial({ 
     color: 0x2c3e50,
     transparent: true,
     opacity: 0.7,
     depthTest: false
   });
   
   const statsBg = new THREE.Mesh(statsBgGeometry, statsBgMaterial);
   statsBg.position.set(0, -windowHeight/2 + 0.09, 0.02);
   this.mapWindow.add(statsBg);
   
   // Add each stat
   statsData.forEach((stat, index) => {
     const offset = (index - 1.5) * (windowWidth - 0.3) / 4;
     
     // Create label
     const labelTexture = this.createTextTexture(stat.label, { 
       textColor: '#AAAAAA',
       fontSize: 24,
       width: 256,
       height: 64
     });
     
     const labelGeometry = new THREE.PlaneGeometry(0.3, 0.04);
     const labelMaterial = new THREE.MeshBasicMaterial({
       map: labelTexture,
       transparent: true,
       depthTest: false
     });
     
     const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
     labelMesh.position.set(offset, -windowHeight/2 + 0.12, 0.025);
     this.mapWindow.add(labelMesh);
     
     // Create value
     const valueTexture = this.createTextTexture(stat.value, { 
       textColor: '#FFFFFF',
       fontSize: 28,
       width: 256,
       height: 64
     });
     
     const valueGeometry = new THREE.PlaneGeometry(0.15, 0.04);
     const valueMaterial = new THREE.MeshBasicMaterial({
       map: valueTexture,
       transparent: true,
       depthTest: false
     });
     
     const valueMesh = new THREE.Mesh(valueGeometry, valueMaterial);
     valueMesh.position.set(offset, -windowHeight/2 + 0.07, 0.025);
     this.mapWindow.add(valueMesh);
   });
   
   // Add interaction helpers (zoom in/out buttons)
   const zoomInTexture = this.createTextTexture('➕', { 
     textColor: '#FFFFFF',
     fontSize: 48
   });
   
   const zoomInGeometry = new THREE.PlaneGeometry(0.08, 0.08);
   const zoomInMaterial = new THREE.MeshBasicMaterial({
     map: zoomInTexture,
     transparent: true,
     depthTest: false
   });
   
   const zoomInMesh = new THREE.Mesh(zoomInGeometry, zoomInMaterial);
   zoomInMesh.position.set(windowWidth/2 - 0.1, 0.2, 0.02);
   this.mapWindow.add(zoomInMesh);
   
   const zoomOutTexture = this.createTextTexture('➖', { 
     textColor: '#FFFFFF',
     fontSize: 48
   });
   
   const zoomOutGeometry = new THREE.PlaneGeometry(0.08, 0.08);
   const zoomOutMaterial = new THREE.MeshBasicMaterial({
     map: zoomOutTexture,
     transparent: true,
     depthTest: false
   });
   
   const zoomOutMesh = new THREE.Mesh(zoomOutGeometry, zoomOutMaterial);
   zoomOutMesh.position.set(windowWidth/2 - 0.1, 0.1, 0.02);
   this.mapWindow.add(zoomOutMesh);
   
   // Position the map window in front of the user
   this.mapWindow.position.set(0, 0, -0.5);
   
   // Set renderOrder to ensure it renders on top
   this.mapWindow.traverse(object => {
     if (object.isMesh) {
       object.renderOrder = 1000;  // Very high render order
     }
   });
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
   this.mapWindow.visible = this.mapWindowVisible;
   
   console.log('Map window visibility:', this.mapWindowVisible ? 'visible' : 'hidden');
   
   return this.mapWindowVisible;
 }
 
 // Setup UI tracking to follow camera
 setupUITracking() {
   // No implementation needed here as we'll update in the animate method
 }
 
 // Update UI position to follow camera/user
 updateUI() {
   if (!this.uiRoot) return;
   
   // Get camera position and direction
   const cameraPosition = this.camera.position.clone();
   const cameraDirection = new THREE.Vector3(0, 0, -1);
   cameraDirection.applyQuaternion(this.camera.quaternion);
   
   // Position UI in front of camera
   const uiDistance = 0.5; // 0.5 meters in front (closer than before)
   const uiPosition = cameraPosition.clone().add(
     cameraDirection.multiplyScalar(uiDistance)
   );
   
   // Update UI position
   this.uiRoot.position.copy(uiPosition);
   
   // Make UI face the camera
   this.uiRoot.quaternion.copy(this.camera.quaternion);
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
   
   // Update UI position to follow camera
   this.updateUI();
   
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

// Export the class for potential module usage
export default SpaceEnvironment;
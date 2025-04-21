import * as THREE from 'three';

class UIManager {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // Create a separate UI scene that will be rendered after the main scene
    this.uiScene = new THREE.Scene();
    
    // Create UI container
    this.uiGroup = new THREE.Group();
    this.uiScene.add(this.uiGroup);
    
    // Flag for map window visibility
    this.mapWindowVisible = false;
    
    // Create main panels
    this.createPanels();
    
    // Create map window (initially hidden)
    this.createMapWindow();
    
    // Setup UI update method
    this.setupUITracking();
    
    // Override the renderer's render method to include our UI scene
    this.setupUIRendering();
  }
  
  // Override the renderer's render method to include UI rendering
  setupUIRendering() {
    // Store the original render method
    const originalRenderMethod = this.renderer.render;
    
    // Create a new render method that renders both scenes
    this.renderer.render = (scene, camera) => {
      // First, render the main scene
      originalRenderMethod.call(this.renderer, scene, camera);
      
      // Then, render the UI scene without clearing the buffer
      this.renderer.autoClear = false;
      originalRenderMethod.call(this.renderer, this.uiScene, camera);
      this.renderer.autoClear = true;
    };
  }
  
  // Create text texture for 3D panels
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
      opacity: 0.8
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
        transparent: true
      });
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, yOffset, 0.01);
      
      panel.add(textMesh);
    });
    
    this.uiGroup.add(panel);
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
  
  // Create the map window interface
  createMapWindow() {
    // Create container for map window
    this.mapWindow = new THREE.Group();
    this.mapWindow.visible = false; // Initially hidden
    this.uiGroup.add(this.mapWindow);
    
    // Create map background panel
    const windowWidth = 1.5;
    const windowHeight = 1.2;
    
    const bgGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, 0.02);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x1a2736,
      transparent: true,
      opacity: 0.9
    });
    
    const windowBg = new THREE.Mesh(bgGeometry, bgMaterial);
    this.mapWindow.add(windowBg);
    
    // Add window header with title
    const headerGeometry = new THREE.BoxGeometry(windowWidth, 0.1, 0.03);
    const headerMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x2c3e50,
      transparent: true,
      opacity: 0.9
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
      transparent: true
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
      transparent: true
    });
    
    const closeMesh = new THREE.Mesh(closeGeometry, closeMaterial);
    closeMesh.position.set(windowWidth/2 - 0.1, windowHeight/2 - 0.05, 0.02);
    this.mapWindow.add(closeMesh);
    closeMesh.userData.clickable = true;
    closeMesh.userData.onClick = () => this.toggleMapWindow(false);
    
    // Add minimize button
    const minimizeTexture = this.createTextTexture('−', { 
      textColor: '#FFFFFF',
      fontSize: 60
    });
    
    const minimizeGeometry = new THREE.PlaneGeometry(0.08, 0.08);
    const minimizeMaterial = new THREE.MeshBasicMaterial({
      map: minimizeTexture,
      transparent: true
    });
    
    const minimizeMesh = new THREE.Mesh(minimizeGeometry, minimizeMaterial);
    minimizeMesh.position.set(windowWidth/2 - 0.2, windowHeight/2 - 0.05, 0.02);
    this.mapWindow.add(minimizeMesh);
    
    // Add map view
    const mapTexture = this.createMapTexture();
    
    const mapGeometry = new THREE.PlaneGeometry(windowWidth - 0.6, windowHeight - 0.3);
    const mapMaterial = new THREE.MeshBasicMaterial({
      map: mapTexture,
      transparent: true
    });
    
    const mapMesh = new THREE.Mesh(mapGeometry, mapMaterial);
    mapMesh.position.set(0.1, -0.02, 0.02);
    this.mapWindow.add(mapMesh);
    
    // Add sidebar
    const sidebarGeometry = new THREE.BoxGeometry(0.4, windowHeight - 0.15, 0.01);
    const sidebarMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x2c3e50,
      transparent: true,
      opacity: 0.8
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
        opacity: 0.9
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
        transparent: true
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
      opacity: 0.7
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
        transparent: true
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
        transparent: true
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
      transparent: true
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
      transparent: true
    });
    
    const zoomOutMesh = new THREE.Mesh(zoomOutGeometry, zoomOutMaterial);
    zoomOutMesh.position.set(windowWidth/2 - 0.1, 0.1, 0.02);
    this.mapWindow.add(zoomOutMesh);
    
    // Position the map window in front of the user
    this.mapWindow.position.set(0, 0, -1);
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
  
  // Create all UI panels
  createPanels() {
    // Top status panels
    this.createPanel({
      position: new THREE.Vector3(-0.5, 0.3, -2),
      texts: [
        { text: "75%", color: "#FFFFFF", yOffset: 0.02 },
        { text: "Battery", color: "#AAAAAA", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    this.createPanel({
      position: new THREE.Vector3(0, 0.3, -2),
      texts: [
        { text: "75%", color: "#FFFFFF", yOffset: 0.02 },
        { text: "O2", color: "#AAAAAA", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    this.createPanel({
      position: new THREE.Vector3(0.5, 0.3, -2),
      texts: [
        { text: "14.3psi", color: "#FFFFFF", yOffset: 0.02 },
        { text: "Pressure", color: "#AAAAAA", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    // Middle info panels
    this.createPanel({
      position: new THREE.Vector3(-0.3, 0, -2),
      texts: [
        { text: "100m", color: "#FFCC00", yOffset: 0.02 },
        { text: "remaining", color: "#FFFFFF", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    this.createPanel({
      position: new THREE.Vector3(0.3, 0, -2),
      texts: [
        { text: "15:00 min", color: "#00FF66", yOffset: 0.02 },
        { text: "to Destination", color: "#FFFFFF", yOffset: -0.02, fontSize: 0.02 }
      ]
    });
    
    // Bottom panels
    this.createPanel({
      position: new THREE.Vector3(0, -0.2, -2),
      texts: [
        { text: "Walked 500m", color: "#FFFFFF" }
      ]
    });
    
    this.createPanel({
      position: new THREE.Vector3(-0.4, -0.3, -2),
      texts: [
        { text: "Pilot Neil Armstrong", color: "#FFFFFF" }
      ]
    });
    
    this.createPanel({
      position: new THREE.Vector3(0.4, -0.3, -2),
      texts: [
        { text: "Navigation Mode", color: "#FFFFFF" }
      ],
      highlighted: true
    });
  }
  
  // Update UI position to follow camera
  setupUITracking() {
    this.updateUI = () => {
      if (!this.uiGroup) return;
      
      // Get camera position and direction
      const cameraPosition = this.camera.position.clone();
      const cameraDirection = new THREE.Vector3(0, 0, -1);
      cameraDirection.applyQuaternion(this.camera.quaternion);
      
      // Position UI in front of camera
      const uiDistance = 2; // 2 meters in front
      const uiPosition = cameraPosition.clone().add(
        cameraDirection.multiplyScalar(uiDistance)
      );
      
      this.uiGroup.position.copy(uiPosition);
      
      // Make UI face the camera
      this.uiGroup.quaternion.copy(this.camera.quaternion);
    };
  }
  
  // Method to be called in animation loop
  update() {
    if (this.updateUI) {
      this.updateUI();
    }
  }
}

export default UIManager;
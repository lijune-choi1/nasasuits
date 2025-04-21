import * as THREE from 'three';

class UIManager {
  constructor(scene, camera, renderer) {
    console.log('UIManager script loaded');
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // Create UI container
    this.uiGroup = new THREE.Group();
    this.scene.add(this.uiGroup);
    
    // Create panels
    this.createPanels();
    
    // Setup UI update method
    this.setupUITracking();
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
    texts.forEach((textConfig, index) => {
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

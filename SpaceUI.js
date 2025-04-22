import * as THREE from 'three';

/**
 * SpaceUI - A flexible UI component library for Three.js applications
 */
class SpaceUI {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // Main UI container
    this.root = new THREE.Group();
    this.scene.add(this.root);
    
    // Component registry
    this.components = new Map();
    
    // Default settings
    this.settings = {
      fontFamily: 'Arial',
      fontSize: 64,
      textColor: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.5)',
      renderOrder: 9999,
      depthTest: false
    };
    
    console.log('SpaceUI initialized');
  }
  
  /**
   * Create a text texture
   * @param {string} text - The text to render
   * @param {Object} options - Texture options
   * @returns {THREE.CanvasTexture} - The generated texture
   */
  createTextTexture(text, options = {}) {
    const {
      fontSize = this.settings.fontSize,
      fontFamily = this.settings.fontFamily,
      textColor = this.settings.textColor,
      backgroundColor = this.settings.backgroundColor,
      width = 512,
      height = 128,
      textAlign = 'center',
      textBaseline = 'middle',
      shadow = true
    } = options;
    
    // Create canvas for text
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    
    // Set background
    if (backgroundColor !== 'transparent') {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);
    }
    
    // Configure text rendering
    context.font = `bold ${fontSize}px ${fontFamily}`;
    context.textAlign = textAlign;
    context.textBaseline = textBaseline;
    context.fillStyle = textColor;
    
    // Add shadow for better contrast
    if (shadow) {
      context.shadowColor = 'rgba(0, 0, 0, 0.8)';
      context.shadowBlur = 4;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
    }
    
    // Draw text
    context.fillText(text, width / 2, height / 2);
    
    // Create and return texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }
  
  /**
   * Update text on an existing texture
   * @param {THREE.CanvasTexture} texture - The texture to update
   * @param {string} text - New text to display
   * @param {Object} options - Texture options
   */
  updateTextTexture(texture, text, options = {}) {
    const canvas = texture.image;
    const context = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const {
      fontSize = this.settings.fontSize,
      fontFamily = this.settings.fontFamily,
      textColor = this.settings.textColor,
      backgroundColor = this.settings.backgroundColor,
      textAlign = 'center',
      textBaseline = 'middle',
      shadow = true
    } = options;
    
    // Clear canvas
    context.clearRect(0, 0, width, height);
    
    // Set background
    if (backgroundColor !== 'transparent') {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);
    }
    
    // Configure text rendering
    context.font = `bold ${fontSize}px ${fontFamily}`;
    context.textAlign = textAlign;
    context.textBaseline = textBaseline;
    context.fillStyle = textColor;
    
    // Add shadow for better contrast
    if (shadow) {
      context.shadowColor = 'rgba(0, 0, 0, 0.8)';
      context.shadowBlur = 4;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
    }
    
    // Draw text
    context.fillText(text, width / 2, height / 2);
    
    // Update texture
    texture.needsUpdate = true;
  }

  /**
   * Create a basic UI component
   * @param {string} id - Unique identifier for the component
   * @param {Object} options - Component options
   * @returns {THREE.Group} - The component container
   */
  createComponent(id, options = {}) {
    // Delete existing component with the same ID if it exists
    if (this.components.has(id)) {
      this.removeComponent(id);
    }
    
    // Create component container
    const component = new THREE.Group();
    component.name = id;
    
    // Set position
    if (options.position) {
      component.position.copy(options.position);
    }
    
    // Set rotation
    if (options.rotation) {
      component.rotation.copy(options.rotation);
    }
    
    // Set scale
    if (options.scale) {
      component.scale.copy(options.scale);
    }
    
    // Add to component registry
    this.components.set(id, component);
    
    // Add to UI root
    this.root.add(component);
    
    return component;
  }
  
  /**
   * Remove a component
   * @param {string} id - Component ID to remove
   */
  removeComponent(id) {
    if (this.components.has(id)) {
      const component = this.components.get(id);
      this.root.remove(component);
      
      // Dispose of any textures or geometries
      component.traverse(child => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        }
      });
      
      this.components.delete(id);
    }
  }
  
  /**
   * Get a component by ID
   * @param {string} id - Component ID
   * @returns {THREE.Group|null} - The component or null if not found
   */
  getComponent(id) {
    return this.components.get(id) || null;
  }
  
  /**
   * Create a panel with text
   * @param {string} id - Unique identifier for the panel
   * @param {Object} options - Panel options
   * @returns {THREE.Group} - The panel container
   */
  createPanel(id, options = {}) {
    const {
      width = 0.4,
      height = 0.1,
      position = new THREE.Vector3(0, 0, 0),
      backgroundColor = 0x1A1A1A,
      opacity = 0.8,
      renderOrder = this.settings.renderOrder,
      depthTest = this.settings.depthTest,
      texts = [],
      highlighted = false
    } = options;
    
    // Create panel container
    const panel = this.createComponent(id, { position });
    
    // Create background
    const bgGeometry = new THREE.BoxGeometry(width, height, 0.01);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: highlighted ? 0x333333 : backgroundColor,
      transparent: true,
      opacity: opacity,
      depthTest: depthTest
    });
    
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.renderOrder = renderOrder;
    panel.add(background);
    
    // Add texts to panel
    texts.forEach((textConfig, index) => {
      const {
        text,
        color = '#FFFFFF',
        fontSize = this.settings.fontSize,
        yOffset = 0,
        textId = `${id}-text-${index}`
      } = textConfig;
      
      // Create text texture
      const texture = this.createTextTexture(text, { 
        textColor: color,
        fontSize: fontSize
      });
      
      // Create text mesh
      const textGeometry = new THREE.PlaneGeometry(width * 0.8, height * 0.5);
      const textMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: depthTest
      });
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, yOffset, 0.01);
      textMesh.renderOrder = renderOrder + 1;
      textMesh.name = textId;
      
      panel.add(textMesh);
    });
    
    // Update textures method
    panel.updateText = (textIndex, newText, options = {}) => {
      const textMesh = panel.children.find(child => child.name === `${id}-text-${textIndex}`);
      if (textMesh && textMesh.material.map) {
        this.updateTextTexture(textMesh.material.map, newText, options);
      }
    };
    
    return panel;
  }
  
  /**
   * Create a button
   * @param {string} id - Unique identifier for the button
   * @param {Object} options - Button options
   * @returns {THREE.Group} - The button container
   */
  createButton(id, options = {}) {
    const {
      width = 0.2,
      height = 0.1,
      position = new THREE.Vector3(0, 0, 0),
      backgroundColor = 0x2980b9,
      hoverColor = 0x3498db,
      activeColor = 0x1c638d,
      opacity = 0.9,
      text = 'Button',
      fontSize = this.settings.fontSize,
      textColor = '#FFFFFF',
      renderOrder = this.settings.renderOrder,
      depthTest = this.settings.depthTest,
      onClick = null
    } = options;
    
    // Create button container
    const button = this.createComponent(id, { position });
    
    // Create background
    const bgGeometry = new THREE.BoxGeometry(width, height, 0.01);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: backgroundColor,
      transparent: true,
      opacity: opacity,
      depthTest: depthTest
    });
    
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.renderOrder = renderOrder;
    button.add(background);
    
    // Create text texture
    const texture = this.createTextTexture(text, { 
      textColor: textColor,
      fontSize: fontSize
    });
    
    // Create text mesh
    const textGeometry = new THREE.PlaneGeometry(width * 0.8, height * 0.7);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: depthTest
    });
    
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 0, 0.01);
    textMesh.renderOrder = renderOrder + 1;
    button.add(textMesh);
    
    // Store original colors and state
    button.userData = {
      bgMaterial: bgMaterial,
      colors: { normal: backgroundColor, hover: hoverColor, active: activeColor },
      state: 'normal',
      onClick: onClick
    };
    
    // Update text method
    button.updateText = (newText, options = {}) => {
      this.updateTextTexture(textMesh.material.map, newText, options);
    };
    
    // Set state method
    button.setState = (state) => {
      if (state === button.userData.state) return;
      
      button.userData.state = state;
      
      // Update button appearance based on state
      switch (state) {
        case 'hover':
          bgMaterial.color.setHex(button.userData.colors.hover);
          break;
        case 'active':
          bgMaterial.color.setHex(button.userData.colors.active);
          break;
        case 'normal':
        default:
          bgMaterial.color.setHex(button.userData.colors.normal);
          break;
      }
    };
    
    return button;
  }
  
  /**
   * Create a modal window
   * @param {string} id - Unique identifier for the modal
   * @param {Object} options - Modal options
   * @returns {THREE.Group} - The modal container
   */
  createModal(id, options = {}) {
    const {
      width = 1.0,
      height = 0.8,
      position = new THREE.Vector3(0, 0, -0.5),
      backgroundColor = 0x0a1525,
      opacity = 0.9,
      title = 'Modal Window',
      titleColor = '#FFFFFF',
      renderOrder = this.settings.renderOrder + 1000,
      depthTest = this.settings.depthTest,
      visible = false,
      content = null
    } = options;
    
    // Create modal container
    const modal = this.createComponent(id, { position });
    modal.visible = visible;
    
    // Create background
    const bgGeometry = new THREE.PlaneGeometry(width, height);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: backgroundColor,
      transparent: true,
      opacity: opacity,
      depthTest: depthTest,
      side: THREE.DoubleSide
    });
    
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.renderOrder = renderOrder;
    modal.add(background);
    
    // Add title
    const titleTexture = this.createTextTexture(title, { 
      textColor: titleColor,
      fontSize: 48,
      backgroundColor: 'rgba(0,0,0,0.5)',
      width: 512,
      height: 96
    });
    
    const titleGeometry = new THREE.PlaneGeometry(0.6, 0.12);
    const titleMaterial = new THREE.MeshBasicMaterial({
      map: titleTexture,
      transparent: true,
      depthTest: depthTest,
      side: THREE.DoubleSide
    });
    
    const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
    titleMesh.position.set(0, height/2 - 0.1, 0.01);
    titleMesh.renderOrder = renderOrder + 1;
    titleMesh.name = `${id}-title`;
    modal.add(titleMesh);
    
    // Add close button
    const closeTexture = this.createTextTexture('×', { 
      textColor: '#FF5555',
      fontSize: 48,
      backgroundColor: 'rgba(0,0,0,0.5)',
      width: 96,
      height: 96
    });
    
    const closeGeometry = new THREE.PlaneGeometry(0.08, 0.08);
    const closeMaterial = new THREE.MeshBasicMaterial({
      map: closeTexture,
      transparent: true,
      depthTest: depthTest,
      side: THREE.DoubleSide
    });
    
    const closeMesh = new THREE.Mesh(closeGeometry, closeMaterial);
    closeMesh.position.set(width/2 - 0.08, height/2 - 0.08, 0.01);
    closeMesh.renderOrder = renderOrder + 1;
    closeMesh.name = `${id}-close`;
    modal.add(closeMesh);
    
    // Add content container
    const contentContainer = new THREE.Group();
    contentContainer.position.set(0, 0, 0.01);
    contentContainer.name = `${id}-content`;
    modal.add(contentContainer);
    
    // Add provided content if any
    if (content) {
      contentContainer.add(content);
    }
    
    // Update title method
    modal.updateTitle = (newTitle, options = {}) => {
      const titleMesh = modal.children.find(child => child.name === `${id}-title`);
      if (titleMesh && titleMesh.material.map) {
        this.updateTextTexture(titleMesh.material.map, newTitle, options);
      }
    };
    
    // Toggle visibility method
    modal.toggle = () => {
      modal.visible = !modal.visible;
      return modal.visible;
    };
    
    // Set content method
    modal.setContent = (content) => {
      const contentContainer = modal.children.find(child => child.name === `${id}-content`);
      if (contentContainer) {
        // Remove existing content
        while (contentContainer.children.length > 0) {
          contentContainer.remove(contentContainer.children[0]);
        }
        
        // Add new content
        if (content) {
          contentContainer.add(content);
        }
      }
    };
    
    return modal;
  }
  
  /**
   * Create a map texture
   * @param {Object} options - Map options
   * @returns {THREE.CanvasTexture} - The generated map texture
   */
  createMapTexture(options = {}) {
    const {
      width = 512,
      height = 512,
      backgroundColor = '#1e2d3b',
      gridColor = '#3a5c6e',
      pathColor = '#FFFFFF',
      startColor = '#3498db',
      endColor = '#f1c40f',
      currentColor = '#FFFFFF',
      gridSize = 50
    } = options;
    
    // Create canvas for map
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const context = canvas.getContext('2d');
    
    // Fill with background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
    
    // Draw a grid
    context.strokeStyle = gridColor;
    context.lineWidth = 2;
    
    // Grid lines
    for (let i = 0; i <= width; i += gridSize) {
      // Vertical line
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, height);
      context.stroke();
      
      // Horizontal line
      context.beginPath();
      context.moveTo(0, i);
      context.lineTo(width, i);
      context.stroke();
    }
    
    // Add a path line
    context.strokeStyle = pathColor;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(width * 0.8, height * 0.8);
    context.lineTo(width * 0.6, height * 0.6);
    context.lineTo(width * 0.3, height * 0.5);
    context.stroke();
    
    // Add start point
    context.fillStyle = startColor;
    context.beginPath();
    context.arc(width * 0.8, height * 0.8, 10, 0, Math.PI * 2);
    context.fill();
    
    // Add end point
    context.fillStyle = endColor;
    context.beginPath();
    context.arc(width * 0.3, height * 0.5, 10, 0, Math.PI * 2);
    context.fill();
    
    // Add current position
    context.fillStyle = currentColor;
    context.beginPath();
    context.arc(width * 0.6, height * 0.6, 8, 0, Math.PI * 2);
    context.fill();
    
    // Add some text labels
    context.font = 'bold 20px Arial';
    context.fillStyle = '#FFFFFF';
    context.fillText('START', width * 0.8, height * 0.8 - 20);
    context.fillText('END', width * 0.3, height * 0.5 - 20);
    context.fillText('YOU ARE HERE', width * 0.6, height * 0.6 - 20);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }
  
  /**
   * Create a topographic map texture
   * @param {Object} options - Map options
   * @returns {THREE.CanvasTexture} - The generated map texture
   */
  createTopographicMapTexture(options = {}) {
    const {
      width = 1024,
      height = 1024,
      backgroundColor = '#1e3040',
      contourColor = '#38586c',
      pathColor = '#FFFFFF',
      startColor = '#3498db',
      endColor = '#f1c40f',
      currentColor = '#FFFFFF',
      contourLines = 30
    } = options;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw topographic lines
    ctx.strokeStyle = contourColor;
    ctx.lineWidth = 1;
    
    // Create contour lines
    for (let i = 0; i < contourLines; i++) {
      const yOffset = i * (height / contourLines);
      
      ctx.beginPath();
      for (let x = 0; x < width; x += 5) {
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
    ctx.strokeStyle = pathColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.8, height * 0.8);
    ctx.lineTo(width * 0.6, height * 0.6);
    ctx.lineTo(width * 0.3, height * 0.5);
    ctx.stroke();
    
    // Draw dotted future path
    ctx.strokeStyle = pathColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 10]);
    ctx.beginPath();
    ctx.moveTo(width * 0.3, height * 0.5);
    ctx.bezierCurveTo(
      width * 0.2, height * 0.4,
      width * 0.15, height * 0.3, 
      width * 0.2, height * 0.2
    );
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Add destinations
    // Start point (blue dot)
    ctx.fillStyle = startColor;
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.8, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Current point (white dot)
    ctx.fillStyle = currentColor;
    ctx.beginPath();
    ctx.arc(width * 0.6, height * 0.6, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Next point (blue dot)
    ctx.fillStyle = startColor;
    ctx.beginPath();
    ctx.arc(width * 0.3, height * 0.5, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // End point (yellow dot)
    ctx.fillStyle = endColor;
    ctx.beginPath();
    ctx.arc(width * 0.2, height * 0.2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Add NASA Base label
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('NASA Base', width * 0.2, height * 0.2 - 15);
    
    // Add Start Point label
    ctx.font = '14px Arial';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('Start Point', width * 0.8, height * 0.8 - 15);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Point A', width * 0.8, height * 0.8 - 30);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  /**
   * Create a map modal
   * @param {string} id - Unique identifier for the map modal
   * @param {Object} options - Modal options
   * @returns {THREE.Group} - The map modal container
   */
  createMapModal(id, options = {}) {
    const {
      width = 1.2,
      height = 0.9,
      position = new THREE.Vector3(0, 0, -0.5),
      backgroundColor = 0x1a2736,
      opacity = 0.95,
      title = 'Maps',
      visible = false,
      mapType = 'topographic', // 'basic' or 'topographic'
      renderOrder = this.settings.renderOrder + 20000
    } = options;
    
    // Create modal
    const mapModal = this.createModal(id, {
      width,
      height,
      position,
      backgroundColor,
      opacity,
      title,
      visible,
      renderOrder
    });
    
    // Add map content
    const contentGroup = new THREE.Group();
    
    // Create map texture based on type
    const mapTexture = mapType === 'topographic' ? 
      this.createTopographicMapTexture() : 
      this.createMapTexture();
    
    // Map area
    const mapWidth = width - 0.35;
    const mapHeight = height - 0.2;
    const mapGeometry = new THREE.PlaneGeometry(mapWidth, mapHeight);
    const mapMaterial = new THREE.MeshBasicMaterial({
      map: mapTexture,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const mapMesh = new THREE.Mesh(mapGeometry, mapMaterial);
    mapMesh.position.set(width/2 - mapWidth/2 - 0.025, 0, 0);
    mapMesh.renderOrder = renderOrder + 3;
    contentGroup.add(mapMesh);
    
    // Add zoom controls
    this.addZoomControlsToMap(contentGroup, width, height, renderOrder);
    
    // Add map points sidebar
    this.addMapSidebar(contentGroup, width, height, renderOrder);
    
    // Add footer with stats
    this.addMapFooter(contentGroup, width, height, renderOrder);
    
    // Set modal content
    mapModal.setContent(contentGroup);
    
    return mapModal;
  }
  
  /**
   * Add zoom controls to map container
   * @private
   */
  addZoomControlsToMap(container, width, height, renderOrder) {
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
    zoomInMesh.position.set(width/2 - 0.07, height/2 - 0.2, 0.01);
    zoomInMesh.renderOrder = renderOrder + 5;
    container.add(zoomInMesh);
    
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
    zoomOutMesh.position.set(width/2 - 0.07, height/2 - 0.25, 0.01);
    zoomOutMesh.renderOrder = renderOrder + 5;
    container.add(zoomOutMesh);
  }
  
  /**
   * Add sidebar with points to map container
   * @private
   */
  /**
   * Add sidebar with points to map container
   * @private
   */
  addMapSidebar(container, width, height, renderOrder) {
    // Sidebar background
    const sidebarWidth = 0.3;
    const sidebarGeometry = new THREE.PlaneGeometry(sidebarWidth, height - 0.1);
    const sidebarMaterial = new THREE.MeshBasicMaterial({
      color: 0x1e2d3b,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const sidebarMesh = new THREE.Mesh(sidebarGeometry, sidebarMaterial);
    sidebarMesh.position.set(-width/2 + sidebarWidth/2, -0.05, 0.005);
    sidebarMesh.renderOrder = renderOrder + 2;
    container.add(sidebarMesh);
    
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
      itemMesh.position.set(-width/2 + sidebarWidth/2, height/2 - 0.15 - (index * 0.08), 0.01);
      itemMesh.renderOrder = renderOrder + 3;
      container.add(itemMesh);
      
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
      pointMesh.renderOrder = renderOrder + 4;
      itemMesh.add(pointMesh);
    });
  }
  
  /**
   * Add footer with stats to map container
   * @private
   */
  addMapFooter(container, width, height, renderOrder) {
    // Footer background
    const footerGeometry = new THREE.PlaneGeometry(width - 0.05, 0.06);
    const footerMaterial = new THREE.MeshBasicMaterial({
      color: 0x2c3e50,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    const footerMesh = new THREE.Mesh(footerGeometry, footerMaterial);
    footerMesh.position.set(0, -height/2 + 0.04, 0.01);
    footerMesh.renderOrder = renderOrder + 2;
    container.add(footerMesh);
    
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
      labelMesh.position.set(offset, -height/2 + 0.05, 0.01);
      labelMesh.renderOrder = renderOrder + 3;
      container.add(labelMesh);
      
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
      valueMesh.position.set(offset, -height/2 + 0.03, 0.01);
      valueMesh.renderOrder = renderOrder + 3;
      container.add(valueMesh);
    });
  }
  
  /**
   * Create an action buttons menu
   * @param {string} id - Unique identifier for the component
   * @param {Object} options - Component options
   * @returns {THREE.Group} - The action buttons container
   */
  createActionButtons(id, options = {}) {
    const {
      position = new THREE.Vector3(0, -0.1, -0.4),
      buttons = [
        { icon: "⊞", label: "Maps", id: "maps" },
        { icon: "≡", label: "Procedures", id: "procedures" },
        { icon: "⛶", label: "Pictures", id: "pictures" },
        { icon: "⏺", label: "Recording", id: "recording" }
      ],
      visible = false,
      renderOrder = this.settings.renderOrder + 11000
    } = options;
    
    // Create container
    const actionButtonsMenu = this.createComponent(id, { position });
    actionButtonsMenu.visible = visible;
    
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
    panel.renderOrder = renderOrder;
    actionButtonsMenu.add(panel);
    
    // Create the individual buttons
    const buttonWidth = 0.15;
    const buttonSpacing = 0.17;
    let startX = -buttonSpacing * 1.5; // Center the buttons
    
    buttons.forEach((button, index) => {
      // Create button background
      const buttonGeometry = new THREE.PlaneGeometry(buttonWidth, buttonWidth);
      const buttonMaterial = new THREE.MeshBasicMaterial({
        color: button.id === "maps" ? 0x444444 : 0x333333, // Highlight the first button
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        side: THREE.DoubleSide
      });
      
      const buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
      buttonMesh.position.set(startX + (buttonSpacing * index), 0, 0.01);
      buttonMesh.renderOrder = renderOrder + 1;
      buttonMesh.name = `${id}-button-${button.id}`;
      actionButtonsMenu.add(buttonMesh);
      
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
      iconMesh.renderOrder = renderOrder + 2;
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
      labelMesh.renderOrder = renderOrder + 2;
      buttonMesh.add(labelMesh);
      
      // Store button data
      buttonMesh.userData = {
        id: button.id,
        isActionButton: true
      };
    });
    
    // Toggle visibility method
    actionButtonsMenu.toggle = () => {
      actionButtonsMenu.visible = !actionButtonsMenu.visible;
      return actionButtonsMenu.visible;
    };
    
    return actionButtonsMenu;
  }
  
  /**
   * Create a status panel group
   * @param {string} id - Unique identifier for the component
   * @param {Object} options - Status panel options
   * @returns {THREE.Group} - The status panel container
   */
  createStatusPanels(id, options = {}) {
    const {
      position = new THREE.Vector3(0, 0.3, -0.5),
      panels = [
        { title: 'Battery', value: '75%', position: new THREE.Vector3(-0.5, 0, 0) },
        { title: 'O2', value: '75%', position: new THREE.Vector3(0, 0, 0) },
        { title: 'Pressure', value: '14.3psi', position: new THREE.Vector3(0.5, 0, 0) }
      ],
      renderOrder = this.settings.renderOrder
    } = options;
    
    // Create container
    const statusGroup = this.createComponent(id, { position });
    
    // Create panels
    panels.forEach((panel, index) => {
      const panelId = `${id}-panel-${index}`;
      
      this.createPanel(panelId, {
        position: panel.position,
        texts: [
          { text: panel.value, color: "#FFFFFF", yOffset: 0.02 },
          { text: panel.title, color: "#AAAAAA", yOffset: -0.02, fontSize: 0.02 }
        ],
        renderOrder
      });
      
      // Add panel to group
      const panelObj = this.getComponent(panelId);
      if (panelObj) {
        // Remove from root but keep in registry
        this.root.remove(panelObj);
        statusGroup.add(panelObj);
        
        // Store reference to easily update
        panelObj.userData = {
          id: panelId,
          title: panel.title,
          updateValue: (value) => {
            panelObj.updateText(0, value);
          }
        };
      }
    });
    
    // Method to update panel values
    statusGroup.updatePanel = (title, value) => {
      const panel = statusGroup.children.find(child => 
        child.userData && child.userData.title === title
      );
      
      if (panel && panel.userData.updateValue) {
        panel.userData.updateValue(value);
      }
    };
    
    return statusGroup;
  }
  // Add this to your main.js or wherever you handle keyboard events

// Function to create and handle procedure panel
setupProcedurePanel() {
    // Create procedure modal (initially hidden)
    const procedureModal = ui.createProcedureModal('procedure-modal', {
      title: 'EVA Egress',
      subtitle: 'Connect UIA to DCU and Start Depress',
      tasks: [
        { id: 'task1', label: 'EV1 connect UIA', category: 'UIA', completed: false },
        { id: 'task2', label: 'EV2 connect UIA', category: 'UIA', completed: false },
        { id: 'task3', label: 'EV1 connect DCU', category: 'DCU', completed: false },
        { id: 'task4', label: 'EV2 connect DCU', category: 'DCU', completed: false }
      ],
      visible: false
    });
    
    // Create notification popup (initially hidden)
    const notification = ui.createNotification('completion-notification', {
      text: 'Task Completed',
      backgroundColor: 0x2ecc71,
      icon: '✓',
      duration: 3000
    });
    
    // Add keyboard listener for 'P' key to toggle procedure panel
    window.addEventListener('keydown', (event) => {
      // 'P' key toggles procedure panel
      if (event.code === 'KeyP') {
        console.log('Procedure key (P) pressed - toggling procedure panel');
        procedureModal.toggle();
      }
      
      // For testing: Complete tasks with number keys 1-4
      if (event.code >= 'Digit1' && event.code <= 'Digit4') {
        const taskIndex = parseInt(event.code.replace('Digit', '')) - 1;
        const taskId = `task${taskIndex + 1}`;
        
        if (procedureModal.completeTask(taskId)) {
          notification.show(`Task ${taskIndex + 1} Completed`);
        }
      }
    });
    
    return { procedureModal, notification };
  }
  /**
   * Update the UI position to follow the camera
   * @param {boolean} isVR - Whether currently in VR mode
   */
  updatePosition(isVR = false) {
    if (!this.root) return;
    
    if (isVR || this.renderer.xr.isPresenting) {
      // In VR mode, use the XR camera
      const xrCamera = this.renderer.xr.getCamera();
      
      // Get current XR headset position and orientation
      const vrCameraPos = new THREE.Vector3();
      xrCamera.getWorldPosition(vrCameraPos);
      
      // Get forward vector from VR headset
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(xrCamera.quaternion);
      
      // Position UI in front of the headset
      const uiPosition = vrCameraPos.clone().add(forward.multiplyScalar(0.5));
      this.root.position.copy(uiPosition);
      
      // Make UI face the user
      this.root.quaternion.copy(xrCamera.quaternion);
    } else {
      // Non-VR mode - use regular camera
      const cameraPosition = this.camera.position.clone();
      const cameraDirection = new THREE.Vector3(0, 0, -1);
      cameraDirection.applyQuaternion(this.camera.quaternion);
      
      // Position UI in front of camera
      const uiPosition = cameraPosition.clone().add(
        cameraDirection.multiplyScalar(0.3)
      );
      
      // Update UI position and rotation
      this.root.position.copy(uiPosition);
      this.root.quaternion.copy(this.camera.quaternion);
    }
    
    // Force high render order for all UI elements
    this.root.traverse((obj) => {
      if (obj.isMesh) {
        if (obj.renderOrder === undefined) {
          obj.renderOrder = this.settings.renderOrder;
        }
        
        if (obj.material) {
          obj.material.depthTest = false;
          obj.material.depthWrite = false;
          obj.material.side = THREE.DoubleSide;
          obj.material.needsUpdate = true;
        }
      }
    });
  }
}

export default SpaceUI;
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { XRHandModelFactory } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/XRHandModelFactory.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/VRButton.js';

let scene, camera, renderer;
let controller1, controller2;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    100
  );
  camera.position.set(0, 1.6, 3);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.getElementById('xr-canvas'),
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(VRButton.createButton(renderer));

  // Lighting
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0, 1, 0);
  scene.add(light);

  // Floor Grid
  const grid = new THREE.GridHelper(4, 20, 0x888888, 0x444444);
  grid.position.y = 0;
  scene.add(grid);

  // Test Cube
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x00ffcc })
  );
  cube.position.set(0, 1.5, -1);
  scene.add(cube);

  // Hand Tracking Setup
  const handFactory = new XRHandModelFactory();

  controller1 = renderer.xr.getController(0);
  scene.add(controller1);

  const hand1 = renderer.xr.getHand(0);
  hand1.add(handFactory.createHandModel(hand1, 'mesh'));
  scene.add(hand1);

  controller2 = renderer.xr.getController(1);
  scene.add(controller2);

  const hand2 = renderer.xr.getHand(1);
  hand2.add(handFactory.createHandModel(hand2, 'mesh'));
  scene.add(hand2);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

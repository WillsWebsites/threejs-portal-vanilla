import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import firefliesVertexShader from "./shaders/fireflies/vertex.glsl";
import firefliesFragmentShader from "./shaders/fireflies/fragment.glsl";
import portalVertexShader from "./shaders/portal/vertex.glsl";
import portalFragmentShader from "./shaders/portal/fragment.glsl";

/**
 * Base
 */
// Debug
const debug = {};
const gui = new GUI({
  width: 400,
});

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Texture
const bakedTexture = textureLoader.load("baked-final-5.jpg");
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * Materials
 */
debug.portalColorStart = "#201919";
debug.portalColorEnd = "#fff9f0";

gui.addColor(debug, "portalColorStart").onChange(() => {
  portalMaterial.uniforms.uColorStart.value.set(debug.portalColorStart);
});

gui.addColor(debug, "portalColorEnd").onChange(() => {
  portalMaterial.uniforms.uColorEnd.value.set(debug.portalColorEnd);
});

const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });
const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });
const portalMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColorStart: { value: new THREE.Color(debug.portalColorStart) },
    uColorEnd: { value: new THREE.Color(debug.portalColorEnd) },
    uTime: { value: 0 },
  },
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
  transparent: true,
});

/**
 * Portal
 */
gltfLoader.load("portal-final-4.glb", (gltf) => {
  const baked = gltf.scene.children.find((child) => child.name === "baked");
  baked.material = bakedMaterial;

  const portalLight = gltf.scene.children.find(
    (child) => child.name === "portalLight"
  );
  const lampLight1 = gltf.scene.children.find(
    (child) => child.name === "lampLight1"
  );
  const lampLight2 = gltf.scene.children.find(
    (child) => child.name === "lampLight2"
  );

  lampLight1.material = lampMaterial;
  portalLight.material = portalMaterial;
  lampLight2.material = lampMaterial;

  scene.add(gltf.scene);
});

/**
 * Fireflies
 */
// Geometry
const firefliesGeometry = new THREE.BufferGeometry();
const FIREFLIES_COUNT = 30;
const positionsArr = new Float32Array(FIREFLIES_COUNT * 3);
const scalesArr = new Float32Array(FIREFLIES_COUNT);

for (let i = 0; i < FIREFLIES_COUNT; i++) {
  positionsArr[i * 3] = (Math.random() - 0.5) * 4;
  positionsArr[i * 3 + 1] = Math.random() * 1.5;
  positionsArr[i * 3 + 2] = (Math.random() - 0.5) * 4;
  scalesArr[i] = Math.random();
}

firefliesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionsArr, 3)
);
firefliesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scalesArr, 1)
);

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uSize: { value: 100 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  },
  blending: THREE.AdditiveBlending,
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  transparent: true,
  depthWrite: false,
});

gui
  .add(firefliesMaterial.uniforms.uSize, "value")
  .min(1)
  .max(400)
  .step(1)
  .name("firefliesSize");

// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update fireflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

debug.clearColor = "#201919";
renderer.setClearColor(debug.clearColor);
gui.addColor(debug, "clearColor").onChange(() => {
  renderer.setClearColor(debug.clearColor);
});

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Materials
  firefliesMaterial.uniforms.uTime.value = elapsedTime;
  portalMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

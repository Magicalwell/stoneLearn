import * as THREE from 'three';
console.log(1111111111, THREE);
let container, camera, scene, renderer, cube
init()
animate()
function init() {
  container = document.getElementById('model_container')
  camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 5, 3500)
  camera.position.z = 50;
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x050505);


  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  container.appendChild(renderer.domElement);
}

function animate() {

  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  render();
  // stats.update();

}

function render() {

  const time = Date.now() * 0.001;

  // points.rotation.x = time * 0.25;
  // points.rotation.y = time * 0.5;

  renderer.render(scene, camera);

  window.addEventListener('resize', onWindowResize);

}
function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}
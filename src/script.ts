import './style.css';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from 'gsap';
import cv, { Mat, MatVector } from "opencv-ts";
import { generateGeometries } from "./detectionToGeometry";
import { createSelect, createImages } from "./generateHTMLElements";
import { getThreshold } from "./flagsConfig";
// Scene
const scene = new THREE.Scene();
// Sizes
const sizes = {
    width: 500, //window.innerWidth,
    height: 500, //window.innerHeight
}
// Axe Helper
const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.z = 3;
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas.webgl')
});

renderer.setSize(sizes.width, sizes.height);

// Controls
const controls = new OrbitControls( camera, renderer.domElement );
controls.enablePan = true;

/**
 * Animate
 */
//gsap.to(mesh.rotation, { duration: 1, x: 5, repeat:-1 });
function tick()
{
    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}


window.onload = () => {
  cv.onRuntimeInitialized = () => {
    const selectContainer = document.getElementById("select-container");
    if(selectContainer) {
      const selectElement = createSelect(selectContainer);
      selectElement.addEventListener('change', (e : any) => {
        if(e && e.target) {
            const countryName = e.target.value;
            const { min, max } = getThreshold(countryName)
            loadImage(countryName, min, max);
        }
      }, false);
    }

    const imagesContainer = document.getElementById("image-container");
    if(imagesContainer) {
      createImages(imagesContainer);
    }
  }

  tick();
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})

window.addEventListener('dblclick', () =>
{
    const fullscreenElement = document.fullscreenElement;
    const canvas = document.querySelector('canvas.webgl');

    if(!canvas) {
        return;
    }

    if(!fullscreenElement)
    {
        if(canvas.requestFullscreen)
        {
            canvas.requestFullscreen()
        }
    }
    else
    {
        if(document.exitFullscreen)
        {
            document.exitFullscreen()
        }
        
    }
})

function loadImage(imageDomId :string, minThreshold: number, maxThreshold: number) {
  const src = cv.imread(imageDomId);
  const greyScaleImage: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
  const binaryThreshold: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
  const inverseBinaryThreshold: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
  const dst: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);

  cv.cvtColor(src, greyScaleImage, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(greyScaleImage, binaryThreshold, minThreshold, maxThreshold, cv.THRESH_BINARY);
  cv.threshold(greyScaleImage, inverseBinaryThreshold, minThreshold, maxThreshold, cv.THRESH_BINARY_INV);

  let contours : MatVector = new cv.MatVector();
  let hierarchy : Mat = new cv.Mat();
  cv.findContours(binaryThreshold, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
  let meshes = generateGeometries(contours, hierarchy, src);
  scene.add(...meshes);

  contours.delete();
  hierarchy.delete();

  contours = new cv.MatVector();
  hierarchy = new cv.Mat();
  cv.findContours(inverseBinaryThreshold, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
  meshes = generateGeometries(contours, hierarchy, src);
  scene.add(...meshes);


  // draw contours with random Scalar
  for (let i = 0; i < contours.size(); ++i) {
  const color = new cv.Scalar(
      Math.round(Math.random() * 255),
      Math.round(Math.random() * 255),
      Math.round(Math.random() * 255)
  );
  cv.drawContours(dst, contours, i, color, 5, cv.LINE_8, hierarchy, 100);
  }
  //cv.imshow('canvasTest', binaryThreshold);
  src.delete();
  dst.delete();
  contours.delete();
  hierarchy.delete();
}
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from 'gsap';
import cv, { Mat, MatVector } from "opencv-ts";
// Scene
const scene = new THREE.Scene();
// Object
/*const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00Afff });
const mesh = new THREE.Mesh(geometry, material);*/
//scene.add(mesh);

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


cv.onRuntimeInitialized = () => {
  const imgElement = document.getElementById('imageSrc') as HTMLImageElement;
  const inputElement = document.getElementById('fileInput');

  if(inputElement && imgElement) {

    inputElement.addEventListener('change', (e : any) => {
      if(e && e.target && e.target.files) {
        (imgElement as HTMLImageElement).src = URL.createObjectURL(e.target.files[0]);
      }
    }, false);

    imgElement.onload = () => {
      const src = cv.imread(imgElement);
      const { width, height } = imgElement;
      const greyScaleImage: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
      const binaryThreshold: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
      const inverseBinaryThreshold: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
      const dst: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
      
      cv.cvtColor(src, greyScaleImage, cv.COLOR_RGBA2GRAY, 0);
      cv.threshold(greyScaleImage, binaryThreshold, 100, 200, cv.THRESH_BINARY);
      cv.threshold(greyScaleImage, inverseBinaryThreshold, 100, 200, cv.THRESH_BINARY_INV);
      
      let contours : MatVector = new cv.MatVector();
      let hierarchy : Mat = new cv.Mat();
      cv.findContours(binaryThreshold, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
      generateGeometries(contours, hierarchy, src);
      console.log(hierarchy.channels())
      /*contours.delete();
      hierarchy.delete();
      
      contours = new cv.MatVector();
      hierarchy = new cv.Mat();
      cv.findContours(inverseBinaryThreshold, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
      generateGeometries(contours, hierarchy, src);*/

      // draw contours with random Scalar
      for (let i = 0; i < contours.size(); ++i) {
        const color = new cv.Scalar(
            Math.round(Math.random() * 255),
            Math.round(Math.random() * 255),
            Math.round(Math.random() * 255)
        );
        cv.drawContours(dst, contours, i, color, 5, cv.LINE_8, hierarchy, 100);
      }
      cv.imshow('canvasOutput', binaryThreshold);
      src.delete();
      dst.delete();
      contours.delete();
      hierarchy.delete();
    };
  }
};

function fromContoursToGeometryVertices(contour: Mat, width: number, height: number) : THREE.Vector2[] {
    const coords = contour.data32S;
    let geometryPoints : THREE.Vector2[] = [];
    for(let index = 0; index < coords.length; index += 2) {
        geometryPoints.push(new THREE.Vector2(coords[index] / width ,coords[index + 1] / height ));
    }
    return geometryPoints;
}

function getHierarchyForContours(hierarchy : Mat, index: number): [number, number, number, number] {
    const next = hierarchy.data32S[index * hierarchy.channels()    ];
    const previous = hierarchy.data32S[index * hierarchy.channels() + 1];
    const child = hierarchy.data32S[index * hierarchy.channels() + 2];
    const parent = hierarchy.data32S[index * hierarchy.channels() + 3];
    return [
        next,
        previous,
        child,
        parent
    ];
    
}
function getParent(hierarchy : Mat, index: number) : number {
    return getHierarchyForContours(hierarchy, index)[3];
}

function geneterateColour(contour: Mat, image: Mat): THREE.Color {
    const { data, cols } = image;
    const channels = image.channels();

    const centroid : any = cv.moments(contour);
    const cX = Math.ceil(centroid["m10"] / centroid["m00"]);
    const cY = Math.ceil(centroid["m01"] / centroid["m00"]);

    const R = data[cY * cols * channels + cX * channels];
    const G = data[cY * cols * channels + cX * channels + 1];
    const B = data[cY * cols * channels + cX * channels + 2];
    return new THREE.Color(R/255, G/255, B/255);
}

function generateGeometries(contours : MatVector, hierarchy: Mat, image: Mat) {
    const offset = 0.001;
    const { rows, cols } =  image;
    for (let i = 0; i < contours.size(); ++i) {
        const contour = contours.get(i);
        const vertices = fromContoursToGeometryVertices(contour, rows, cols);
        const geometry = generateGeometry(vertices);
        const color = geneterateColour(contour, image);
        const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0x0FF05F, wireframe:false, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        const child = getParent(hierarchy, i);
        mesh.position.z = child * offset;
        scene.add(mesh);
    }
}

function generateGeometry(vertices: THREE.Vector2[]) : THREE.BufferGeometry {
    const shape = new THREE.Shape(vertices);
    const geometry = new THREE.ShapeGeometry(shape);
    return geometry;
}

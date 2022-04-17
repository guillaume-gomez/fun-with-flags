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
      cv.resize(src,src, new cv.Size(1200, 700), 0, 0, cv.INTER_LINEAR)
      const { width, height } = imgElement;
      const dst: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
      cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
      //can be optional for now
      cv.threshold(src, src, 100, 200, cv.THRESH_BINARY_INV);
      const canny : Mat = new cv.Mat();
      let contours : MatVector = new cv.MatVector();
      let hierarchy : Mat = new cv.Mat();
      // You can try more different parameters
      cv.Canny(src, canny, 125, 255);
      //cv.findContours(canny, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      for (let i = 0; i < contours.size(); ++i) {
            let hier = hierarchy.intPtr(0, i)
          console.log(hier)
      }
      generateGeometries(contours, width, height);
      // draw contours with random Scalar
      for (let i = 0; i < contours.size(); ++i) {
          let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                                    Math.round(Math.random() * 255));
          cv.drawContours(dst, contours, i, color, 5, cv.LINE_8, hierarchy, 100);
      }
      cv.imshow('canvasOutput', dst);
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

function generateGeometries(contours : MatVector, width: number, height: number) {
    for (let i = 0; i < contours.size(); ++i) {
        const vertices = fromContoursToGeometryVertices(contours.get(i), width, height);
        console.log(vertices)
        const geometry = generateGeometry(vertices);
        const material = new THREE.MeshBasicMaterial({ color: 0x404040, wireframe:false, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    }
}

function generateGeometry(vertices: THREE.Vector2[]) : THREE.BufferGeometry {
    const shape = new THREE.Shape(vertices);
    const geometry = new THREE.ShapeGeometry(shape);
    return geometry;
}
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Mat, MatVector } from "opencv-ts";
import { computePalette } from "../palette";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { generateGeometries, generateGeometriesByColor } from "../detectionToGeometry";
import useOpenCV from "../customHooks/useOpenCV";
import useAnimationFrame from "../customHooks/useAnimationFrame";


export interface SceneParam {
  min: number | null;
  max: number | null;
  countryCode: string | null;
}


interface ThreeCanvasProps {
 params: SceneParam;
 velocity: number;
}

const MAX_Z = 1;
const MIN_Z = -1;
const MOVE_VELOCITY =  0.001;


function ThreeCanvas({params: { min, max, countryCode }, velocity} : ThreeCanvasProps) {
  const { cv } = useOpenCV();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = useRef(new THREE.Scene());
  const groupRef = useRef<THREE.Group|null>(null);
  const groupRefDirections = useRef<number[]>([]);
  const camera = useRef<THREE.PerspectiveCamera | null>(null);
  const renderer = useRef<THREE.WebGLRenderer| null>(null);
  const { play, stop } = useAnimationFrame(animate);

  useEffect(() => {
    if(canvasRef.current) {
      // Sizes
      const sizes = {
          width: 500, //window.innerWidth,
          height: 500, //window.innerHeight
      }

      scene.current.background = new THREE.Color( 0x3c3c3c );

      addHelpers();

      // Camera
      camera.current = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
      camera.current.position.set( 0, 0.75, 3 );
      scene.current.add(camera.current);


      // Renderer
      renderer.current = new THREE.WebGLRenderer({
          canvas: canvasRef.current
      });

      renderer.current.setSize(sizes.width, sizes.height);

      // Controls
      const controls = new OrbitControls( camera.current, renderer.current.domElement );
      controls.enablePan = true;
    }
  }, [canvasRef]);

  useEffect(() => {
    if(min && max && countryCode) {
      // clear scenes
      while(scene.current.children.length > 0) {
        scene.current.remove(scene.current.children[0]);
      }
      groupRef.current = null;


      generateFlagsByPixelsColorOccurance(countryCode);
      addLights();
      addHelpers();
    }
  }, [min, max, countryCode]);

  useEffect(() => {
    stop();
    play();
  }, [velocity])

  function addLights() {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
      scene.current.add(ambientLight);


      const spotLight = new THREE.SpotLight(0xffffff, 0.5, 10, Math.PI * 0.1, 0.25, 1)
      spotLight.position.set(0, -5, 0)
      scene.current.add(spotLight)

      const pointLight = new THREE.PointLight(0xff9000, 0.25)
      pointLight.position.set(-1, 0, 1)
      scene.current.add(pointLight)

      const pointLight2 = new THREE.PointLight(0xff9000, 0.25)
      pointLight2.position.set(0, 0, 1)
      scene.current.add(pointLight2)


      const pointLight3 = new THREE.PointLight(0xff9000, 0.25)
      pointLight2.position.set(1, 0, 1)
      scene.current.add(pointLight3)

/*      const pointLightHelper = new THREE.PointLightHelper(pointLight)
      scene.current.add(pointLightHelper)

      const rectAreaLightHelper = new THREE.SpotLightHelper(spotLight)
      scene.current.add(rectAreaLightHelper)*/
  }

  function addHelpers() {
    // Axe Helper
    const axesHelper = new THREE.AxesHelper(2);
    scene.current.add(axesHelper);

    const gridHelper = new THREE.GridHelper();
    scene.current.add(gridHelper);
  }


  function animate(deltaTime: number) {
    if(renderer.current && scene.current && camera.current) {
      renderer.current.render(scene.current, camera.current);
      if(groupRef.current) {
        groupRef.current.children.forEach((flagItem, index) => {
          if(flagItem.position.z > MAX_Z) {
            groupRefDirections.current[index] = -1;
          }
          if(flagItem.position.z < MIN_Z) {
            groupRefDirections.current[index] = 1;
          }
          flagItem.position.z += groupRefDirections.current[index] * velocity;
        });
      }
      //console.log(groupRef.current)
    }
  }

  // find all the colors in the image and run findcountours based on this colors
  function generateFlagsByPixelsColorOccurance(imageDomId: string) {
    const src = cv.imread(imageDomId);
    const colorPixels = computePalette(src);
    console.log(colorPixels)


    let group = new THREE.Group();
    group.name = "MY_FLAG_GROUP";

    let binaryThreshold: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    colorPixels.forEach(([r, g, b], index) => {
      let low = new cv.Mat(src.rows, src.cols, src.type(), [r - 1, g - 1, b -1, 255]);
      let high = new cv.Mat(src.rows, src.cols, src.type(), [r + 1, g + 1, b + 1, 255]);

      let contours : MatVector = new cv.MatVector();
      let hierarchy : Mat = new cv.Mat();

      cv.inRange(src, low, high, binaryThreshold);
      cv.findContours(binaryThreshold, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

      let meshes = generateGeometriesByColor(contours, hierarchy, src, [r,g,b], index);
      group.add(...meshes);


      contours.delete();
      hierarchy.delete();
    });

    const bbox = new THREE.Box3().setFromObject(group);
    group.position.set(-(bbox.min.x + bbox.max.x) / 2, -(bbox.min.y + bbox.max.y) / 2, -(bbox.min.z + bbox.max.z) / 2);
    scene.current.add(group);
    // add ref for the render
    groupRef.current = group;
    // store the direction for move
    groupRefDirections.current = group.children.map(flagItem => 1);
  }

  //use threshold to detect colors and shape with a binarythreshold and its opposite
  function generateFlagsByThreshold(imageDomId :string, minThreshold: number, maxThreshold: number) {
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
    scene.current.add(...meshes);

    contours.delete();
    hierarchy.delete();

    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(inverseBinaryThreshold, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
    meshes = generateGeometries(contours, hierarchy, src);
    scene.current.add(...meshes);


    // draw contours with random Scalar
    for (let i = 0; i < contours.size(); ++i) {
        const color = new cv.Scalar(
            Math.round(Math.random() * 255),
            Math.round(Math.random() * 255),
            Math.round(Math.random() * 255)
        );
        cv.drawContours(dst, contours, i, color, 5, cv.LINE_8, hierarchy, 100);
    }
    cv.imshow('canvasTest', binaryThreshold);
    cv.imshow('canvasTest2', inverseBinaryThreshold);
    cv.imshow('contours', dst);
    src.delete();
    dst.delete();
    contours.delete();
    hierarchy.delete();
  }

  return (
    <canvas ref={canvasRef} className="webgl"></canvas>
  );
}

export default ThreeCanvas;

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Mat, MatVector } from "opencv-ts";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { generateGeometries } from "../detectionToGeometry";
import useOpenCV from "../customHooks/useOpenCV";
import useAnimationFrame from "../customHooks/useAnimationFrame";


export interface SceneParam {
  min: number | null;
  max: number | null;
  countryCode: string | null;
}


interface ThreeCanvasProps {
 params: SceneParam;
}

function ThreeCanvas({params: { min, max, countryCode }} : ThreeCanvasProps) {
  const { cv } = useOpenCV();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = useRef(new THREE.Scene());
  const camera = useRef<THREE.PerspectiveCamera | null>(null);
  const renderer = useRef<THREE.WebGLRenderer| null>(null);
  const { play } = useAnimationFrame(animate);

  useEffect(() => {
    if(canvasRef.current) {
      // Sizes
      const sizes = {
          width: 500, //window.innerWidth,
          height: 500, //window.innerHeight
      }
      // Axe Helper
      const axesHelper = new THREE.AxesHelper(2);
      scene.current.add(axesHelper);

      // Camera
      camera.current = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
      camera.current.position.z = 3;
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
      // Axe Helper
      const axesHelper = new THREE.AxesHelper(2);
      scene.current.add(axesHelper);

      loadImage(countryCode, min, max);
    }
  }, [min, max, countryCode])


  function animate(deltaTime: number) {
    if(renderer.current && scene.current && camera.current) {
      renderer.current.render(scene.current, camera.current);
    }
  }

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
    /*cv.imshow('canvasTest', binaryThreshold);
    cv.imshow('canvasTest2', inverseBinaryThreshold);
    cv.imshow('contours', dst);*/
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

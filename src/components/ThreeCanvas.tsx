import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  generateFlagsByPixelsColorOccurance as utilGenerateFlagsByPixelsColorOccurance
 } from "../lib/detectionToGeometryRange";
 import {
  generateFlagsByThreshold as utilGenerateFlagsByThreshold,
 } from "../lib/detectionToGeometryThreshold";
import useOpenCV from "../customHooks/useOpenCV";
import useAnimationFrame from "../customHooks/useAnimationFrame";
import useWindowSize from "../customHooks/useWindowSize";
import { create3dPointLighting, createPlane, createHelpers, createLights } from "./threejsUtils";

export interface SceneParam {
  min: number | null;
  max: number | null;
  countryCode: string | null;
}


interface ThreeCanvasProps {
 params: SceneParam;
 velocity: number;
}

const MAX_Z = 0.3;
const MIN_Z = 0;

function ThreeCanvas({params: { min, max, countryCode }, velocity} : ThreeCanvasProps) {
  const { cv } = useOpenCV();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = useRef(new THREE.Scene());
  const groupRef = useRef<THREE.Group|null>(null);
  const groupRefDirections = useRef<number[]>([]);
  const camera = useRef<THREE.PerspectiveCamera | null>(null);
  const renderer = useRef<THREE.WebGLRenderer| null>(null);
  const { play, stop } = useAnimationFrame(animate);

  useWindowSize((width: number, height: number) => {
    if(canvasRef.current && camera.current && renderer.current) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.current.aspect = width / height;
      camera.current.updateProjectionMatrix();
      //magic number here
      renderer.current.setSize(width - 50, height - 50);
    }
  });

  useEffect(() => {
    if(canvasRef.current) {
      // Sizes
      const sizes = {
          width: window.innerWidth - 50,
          height: window.innerHeight - 50
      }

      scene.current.background = new THREE.Color( 0x3c3c3c );


      // Camera
      camera.current = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
      camera.current.position.set( 0, 0.75, 2 );
      scene.current.add(camera.current);


      // Renderer
      renderer.current = new THREE.WebGLRenderer({
          canvas: canvasRef.current
      });

      renderer.current.setSize(sizes.width, sizes.height);

      // Controls
      const controls = new OrbitControls( camera.current, renderer.current.domElement );
      controls.enablePan = true;

      scene.current.add(createPlane());
      //scene.current.add(create3dPointLighting());
      scene.current.add(createLights());
      scene.current.add(...createHelpers());
    }
  }, [canvasRef]);

  useEffect(() => {
    if(min && max && countryCode) {
      // clear scenes
      while(scene.current.children.length > 0) {
        scene.current.remove(scene.current.children[0]);
      }
      groupRef.current = null;

      scene.current.add(createPlane());
      //scene.current.add(create3dPointLighting());
      scene.current.add(createLights());
      //scene.current.add(...createHelpers());
      scene.current.add(generateFlagsByPixelsColorOccurance(countryCode));

    }
  }, [min, max, countryCode]);

  useEffect(() => {
    stop();
    play();
  }, [velocity])

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
  function generateFlagsByPixelsColorOccurance(imageDomId: string) : THREE.Group {
    const meshes = utilGenerateFlagsByPixelsColorOccurance(cv, imageDomId);
    let group = new THREE.Group();
    group.name = "MY_FLAG_GROUP";
    group.add(...meshes);

    const bbox = new THREE.Box3().setFromObject(group);
    console.log(bbox)
    group.position.set(-(bbox.min.x + bbox.max.x) / 2, -(bbox.min.y + bbox.max.y), -(bbox.min.z + bbox.max.z) / 2);

    // add ref for the render
    groupRef.current = group;
    // store the direction for move
    groupRefDirections.current = group.children.map(flagItem => 1);

    return group;
  }

  //use threshold to detect colors and shape with a binarythreshold and its opposite
  // deprecated :)
  function generateFlagsByThreshold(imageDomId :string, minThreshold: number, maxThreshold: number) {
    const meshes = utilGenerateFlagsByThreshold(cv, imageDomId, minThreshold, maxThreshold);
    scene.current.add(...meshes);
  }

  return (
    <canvas ref={canvasRef} className="webgl"></canvas>
  );
}

export default ThreeCanvas;

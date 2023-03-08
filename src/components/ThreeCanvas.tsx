import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
 import {
  generateGeometriesByNumberOfColors as utilGenerateFlagsByPixelsColorOccurance,
  originalPositionMeshes
} from "colors2geometries";
import useAnimationFrame from "../customHooks/useAnimationFrame";
import { useFullscreen } from "rooks";
import { createPlane, createLights } from "./threejsUtils";

export interface SceneParam {
  min: number | null;
  max: number | null;
  countryCode: string | null;
  alignMeshes: boolean;
}


interface ThreeCanvasProps {
  params: SceneParam;
  width: number;
  height: number;
  velocity: number;
}

const MAX_Z = 0.3;
const MIN_Z = 0;

function ThreeCanvas({params: { min, max, countryCode, alignMeshes }, velocity, width, height} : ThreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = useRef(new THREE.Scene());
  const groupRef = useRef<THREE.Group|null>(null);
  const groupRefDirections = useRef<number[]>([]);
  const camera = useRef<THREE.PerspectiveCamera | null>(null);
  const renderer = useRef<THREE.WebGLRenderer| null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [originalPositions, setOriginalPositions] = useState<THREE.Vector3[]>([]);
  const { play, stop } = useAnimationFrame(animate);
  const {
    toggle
  } = useFullscreen();


  useEffect(() => {
    if(canvasRef.current && camera.current && renderer.current && width && height) {
      camera.current.aspect = width / height;
      camera.current.updateProjectionMatrix();
      //magic number here
      renderer.current.setSize(width, height);
    }
  }, [width, height]);



  useEffect(() => {
    if(canvasRef.current) {
      // Sizes
      const sizes = {
          width: window.innerWidth,
          height: window.innerHeight
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
      scene.current.add(createLights());
    }
  }, [canvasRef]);

  useEffect(() => {
    if(min && max && countryCode) {
      setLoading(true);
      // clear scenes
      while(scene.current.children.length > 0) {
        scene.current.remove(scene.current.children[0]);
      }
      groupRef.current = null;

      scene.current.add(createPlane());
      scene.current.add(createLights());
      scene.current.add(generateFlagsByPixelsColorOccurance(countryCode));
      setLoading(false);

    }
  }, [min, max, countryCode, setLoading]);

/*  useEffect(() => {
    if(alignMeshes) {
      group.children.map((child : any, index: number) => {
        child.position = index * 0.001;
      });
    } else {
      group.children.map((child : any, index: number) => {
        child.position = originalPositions[index];
      });
    }
  }, [alignMeshes])*/

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
    }
  }

  // find all the colors in the image and run findcountours based on this colors
  function generateFlagsByPixelsColorOccurance(imageDomId: string) : THREE.Group {
    const meshes = utilGenerateFlagsByPixelsColorOccurance(imageDomId);
    setOriginalPositions(originalPositionMeshes(meshes));

    let group = new THREE.Group();
    group.name = "MY_FLAG_GROUP";

    //debug to remove
    meshes.forEach((mesh, index) => {
      mesh.position.z = 0.001 * index;
    });

    group.add(...meshes);

    const bbox = new THREE.Box3().setFromObject(group);
    group.position.set(-(bbox.min.x + bbox.max.x) / 2, -(bbox.min.y + bbox.max.y), -(bbox.min.z + bbox.max.z) / 2);

    // add ref for the render
    groupRef.current = group;
    // store the direction for move
    groupRefDirections.current = group.children.map(flagItem => 1);

    return group;
  }

  return (
    <div>
      { loading ? <button className="btn loading lg:absolute md:static lg:top-1/2 lg:left-1/2">loading</button> : <></> }
      <canvas ref={canvasRef} className="webgl" onDoubleClick={e => toggle(e.target as any)}></canvas>
    </div>
  );
}

export default ThreeCanvas;

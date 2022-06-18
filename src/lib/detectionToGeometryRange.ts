import { Mat, MatVector } from "opencv-ts";
import { computePalette } from "./palette";
import { getParent } from "./hierarchyUtils";
import { generateGeometry, fromContoursToGeometryVertices } from "./common";
import * as THREE from 'three';

function generateGeometries(contours : MatVector, hierarchy: Mat, image: Mat, [R, G, B]: [number, number, number], index: number) : THREE.Mesh[] {
    let meshes : THREE.Mesh[] = [];
    //const offset = 0.001;
    const offset = 0.1;
    const { rows, cols } =  image;
    for (let i = 0; i < contours.size(); ++i) {
        const contour = contours.get(i);
        const vertices = fromContoursToGeometryVertices(contour, rows, cols);
        const geometry = generateGeometry(vertices);
        const color = new THREE.Color(R/255, G/255, B/255) //geneterateColour(contours, hierarchy, i, image);
        const material = new THREE.MeshStandardMaterial({ color/*: Math.random() * 0x0FF05F*/, wireframe:false/*, side: THREE.DoubleSide*/ });
        const mesh = new THREE.Mesh(geometry, material);
        const child = getParent(hierarchy, i);
        mesh.position.z = index *  offset/* * child*/;
        meshes.push(mesh);
    }
    return meshes;
}


// find all the colors in the image and run findcountours based on this colors
export function generateFlagsByPixelsColorOccurance(cv: any, imageDomId: string) : THREE.Mesh[] {
    const src = cv.imread(imageDomId);
    const colorPixels = computePalette(src);
    let meshes : THREE.Mesh[] = [];
    console.log(colorPixels)


    let binaryThreshold: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    colorPixels.forEach(([r, g, b], index) => {
      let low = new cv.Mat(src.rows, src.cols, src.type(), [r - 1, g - 1, b -1, 255]);
      let high = new cv.Mat(src.rows, src.cols, src.type(), [r + 1, g + 1, b + 1, 255]);

      let contours : MatVector = new cv.MatVector();
      let hierarchy : Mat = new cv.Mat();

      cv.inRange(src, low, high, binaryThreshold);
      cv.findContours(binaryThreshold, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

        //DEBUG
        /*const dst: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        cv.findContours(binaryThreshold, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
        meshes = [...meshes, ...generateGeometries(contours, hierarchy, src, [r,g,b], index)];

        // draw contours with random Scalar
        for (let i = 0; i < contours.size(); ++i) {
            const color = new cv.Scalar(
                Math.round(r),
                Math.round(g),
                Math.round(b)
            );
            cv.drawContours(dst, contours, i, color, 5, cv.LINE_8, hierarchy, 100);
        }
        cv.imshow(`canvasTest${index+1}`, dst);*/


      meshes = [...meshes, ...generateGeometries(contours, hierarchy, src, [r,g,b], index)];


      contours.delete();
      hierarchy.delete();
    });

    src.delete();
    return meshes;
}
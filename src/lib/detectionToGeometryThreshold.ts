import cv, { Mat, MatVector } from "opencv-ts";
import { getColor, getRandomColors } from "./palette";
import { getParent } from "./hierarchyUtils";
import { generateGeometry, fromContoursToGeometryVertices } from "./common";
import * as THREE from 'three';


interface Dic {
    [key: string]: number
}
function geneterateColour(contours: MatVector, hierarchy: Mat, contourIndex: number, image: Mat): THREE.Color {
    const contour = contours.get(contourIndex);
    const randomColors = getRandomColors(contours, hierarchy, contourIndex, image);

    const centroid : any = cv.moments(contour);
    const cX = Math.ceil(centroid["m10"] / centroid["m00"]);
    const cY = Math.ceil(centroid["m01"] / centroid["m00"]);
    const centroidColor = getColor(image, cX, cY);

    const reduced = [...randomColors, centroidColor].reduce(function (acc: Dic, curr : [number, number, number]) {
         return acc[curr.toString()] ? ++acc[curr.toString()] : acc[curr.toString()] = 1, acc
    }, {});

    // get the most occurs colors among the array of random colors + the middle point
    let max = -1;
    let colorChoosedStringified = "-1,-1,-1";
    Object.entries(reduced).forEach(([colorStringified, occurences]) => {
        if(max < occurences) {
            max = occurences;
            colorChoosedStringified = colorStringified;
        }
    });
    const [R, G, B] = colorChoosedStringified.split(",").map(color => parseInt(color));

    return new THREE.Color(R/255, G/255, B/255);
}

function generateGeometries(contours : MatVector, hierarchy: Mat, image: Mat) : THREE.Mesh[] {
    let meshes : THREE.Mesh[] = [];
    const offset = 0.001;
    const { rows, cols } =  image;
    for (let i = 0; i < contours.size(); ++i) {
        const contour = contours.get(i);
        const vertices = fromContoursToGeometryVertices(contour, rows, cols);
        const geometry = generateGeometry(vertices);
        const color = geneterateColour(contours, hierarchy, i, image);
        const material = new THREE.MeshBasicMaterial({ color/*: Math.random() * 0x0FF05F*/, wireframe:false/*, side: THREE.DoubleSide*/ });
        const mesh = new THREE.Mesh(geometry, material);
        const child = getParent(hierarchy, i);
        mesh.position.z = child * offset;
        meshes.push(mesh);
    }
    return meshes;
}

//use threshold to detect colors and shape with a binarythreshold and its opposite
export function generateFlagsByThreshold(cv: any, imageDomId :string, minThreshold: number, maxThreshold: number) : THREE.Mesh[] {
    const src = cv.imread(imageDomId);
    const greyScaleImage: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    const binaryThreshold: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    const inverseBinaryThreshold: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    const dst: Mat = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    let meshes : THREE.Mesh[] = [];

    cv.cvtColor(src, greyScaleImage, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(greyScaleImage, binaryThreshold, minThreshold, maxThreshold, cv.THRESH_BINARY);
    cv.threshold(greyScaleImage, inverseBinaryThreshold, minThreshold, maxThreshold, cv.THRESH_BINARY_INV);

    let contours : MatVector = new cv.MatVector();
    let hierarchy : Mat = new cv.Mat();
    cv.findContours(binaryThreshold, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
    meshes = [...meshes, ...generateGeometries(contours, hierarchy, src)];

    contours.delete();
    hierarchy.delete();

    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    /*
        DEBUG
        cv.findContours(inverseBinaryThreshold, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
        meshes = [...meshes, ...generateGeometries(contours, hierarchy, src)];

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
    */
    src.delete();
    dst.delete();
    contours.delete();
    hierarchy.delete();

    return meshes;
}
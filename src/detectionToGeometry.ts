import cv, { Mat, MatVector } from "opencv-ts";
import { getColor, computePalette } from "./palette";
import * as THREE from 'three';

function getRandomArbitrary(min: number, max: number) : number {
  return Math.random() * (max - min) + min;
}

function fromContoursToGeometryVertices(contour: Mat, width: number, height: number) : THREE.Vector2[] {
    const coords = contour.data32S;
    let geometryPoints : THREE.Vector2[] = [];
    for(let index = 0; index < coords.length; index += 2) {
        geometryPoints.push(
            new THREE.Vector2(
                coords[index] / width
               ,-coords[index + 1] / height
            )
        );
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

function getChild(hierarchy: Mat, index: number) : number {
    return getHierarchyForContours(hierarchy, index)[2];
}


function getChildren(hierarchy: Mat, parentIndex: number) {
    let currentChild = getChild(hierarchy, parentIndex);
    let children : number[] = [];

    while(currentChild !== -1) {
        children.push(currentChild);
        currentChild = getChild(hierarchy, currentChild);
    }

    return children;
}

// use montecarlo (pick random point in the shape to detect the color)
// the problem can be the shape has children on it
function getRandomColors(contours: MatVector, hierarchy: Mat, contourIndex: number, image: Mat) : Array<[number, number, number]> {
    let colors : Array<[number, number, number]> = [];
    const coords = contours.get(contourIndex).data32S;
    const childrenIndexes = getChildren(hierarchy, contourIndex);

    const XPoints : number[] = coords.filter((coord, index) => index % 2 === 0);
    const YPoints : number[] = coords.filter((coord, index) => index % 2 === 1);

    const minX = Math.min(...XPoints);
    const maxX = Math.max(...XPoints);

    const minY = Math.min(...YPoints);
    const maxY = Math.max(...YPoints);

    while(colors.length <= 20) {
        const middleCoordX = Math.floor(getRandomArbitrary(minX, maxX));
        const middleCoordY = Math.floor(getRandomArbitrary(minY, maxY));

        
        if(isPointValid(contours, contourIndex, middleCoordX, middleCoordY, childrenIndexes)) {
            colors.push(getColor(image, middleCoordX, middleCoordY));
        }
    }
    return colors;
}

function isInPolygon(contour: Mat, x: number, y : number) : boolean {
    return cv.pointPolygonTest(contour, new cv.Point(x, y), false) > 0;
}


function isNotInChildPolygon(contours: MatVector, x: number, y: number, childrenIndexes: number[]) {
    const child = childrenIndexes.find(childIndex => isInPolygon(contours.get(childIndex), x, y));
    return !child;
}

function isPointValid(contours: MatVector, contourIndex: number, x: number, y: number, childrenIndexes?: number[]) : boolean {
    if(!childrenIndexes || childrenIndexes.length === 0) {
        return isInPolygon(contours.get(contourIndex), x, y);
    } else {
        return isInPolygon(contours.get(contourIndex), x, y) && isNotInChildPolygon(contours, x, y, childrenIndexes);
    }
}

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


function generateGeometriesByColor(contours : MatVector, hierarchy: Mat, image: Mat, [R, G, B]: [number, number, number], index: number) : THREE.Mesh[] {
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
        mesh.position.z = index *  offset;//child * offset * Math.random();
        meshes.push(mesh);
    }
    return meshes;
}

function generateGeometry(vertices: THREE.Vector2[]) : THREE.BufferGeometry {
    const shape = new THREE.Shape(vertices);
    const geometry = new THREE.ExtrudeGeometry(shape, {depth: 0.5, bevelEnabled: false, /*bevelSegments: 1, steps: 1, bevelSize: 0.1, bevelThickness: 0.1*/});
    return geometry;
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

      meshes = [...meshes, ...generateGeometriesByColor(contours, hierarchy, src, [r,g,b], index)];


      contours.delete();
      hierarchy.delete();
    });

    src.delete();
    return meshes;
}
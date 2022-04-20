import cv, { Mat, MatVector } from "opencv-ts";
import * as THREE from 'three';

function fromContoursToGeometryVertices(contour: Mat, width: number, height: number) : THREE.Vector2[] {
    const coords = contour.data32S;
    let geometryPoints : THREE.Vector2[] = [];
    for(let index = 0; index < coords.length; index += 2) {
        geometryPoints.push(new THREE.Vector2(coords[index] / width ,-coords[index + 1] / height ));
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

function getColor(image: Mat, x: number, y: number) : [number, number, number] {
    const { data, cols } = image;
    const channels = image.channels();

    const R = data[y * cols * channels + x * channels];
    const G = data[y * cols * channels + x * channels + 1];
    const B = data[y * cols * channels + x * channels + 2];
    return [R, G, B];
}

function getRandomColors(contour: Mat, image: Mat) : Array<[number, number, number]> {
    let colors : Array<[number, number, number]> = [];
    const coords = contour.data32S;


    for(let i = 0; i < 20; i++) {
        const indexX1 = Math.floor( Math.random() * (coords.length-1) / 2 ) * 2;
        const coordX1 = coords[indexX1];
        const coordY1 = coords[indexX1 + 1];

        const indexX2 = Math.floor( Math.random() * (coords.length-1) / 2 ) * 2;
        const coordX2 = coords[indexX2]
        const coordY2 = coords[indexX2 + 1];

        const middleCoordX = Math.floor((coordX1 + coordX2) / 2);
        const middleCoordY = Math.floor((coordY1 + coordY2) / 2);

/*        console.log(coordX1, coordY1)
        console.log(coordX2, coordY2)
        console.log("-----ýýýýý---------")
        console.log(middleCoordX, middleCoordY)
        console.log(getColor(image, middleCoordX, middleCoordY))
        console.log("------------------")*/
        colors.push(getColor(image, middleCoordX, middleCoordY));
    }
    return colors;
}

interface Dic {
    [key: string]: number
}
function geneterateColour(contour: Mat, image: Mat): THREE.Color {
    //console.log("SHAPE", contour.data32S)
    const randomColors = getRandomColors(contour, image);
    
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

    //console.log(reduced)
    //console.log(colorChoosedStringified)
    const [R, G, B] = colorChoosedStringified.split(",").map(color => parseInt(color));

    return new THREE.Color(R/255, G/255, B/255);
}

export function generateGeometries(contours : MatVector, hierarchy: Mat, image: Mat) : THREE.Mesh[] {
    let meshes : THREE.Mesh[] = [];
    const offset = 0.001;
    const { rows, cols } =  image;
    for (let i = 0; i < contours.size(); ++i) {
        const contour = contours.get(i);
        const vertices = fromContoursToGeometryVertices(contour, rows, cols);
        const geometry = generateGeometry(vertices);
        const color = geneterateColour(contour, image);
        const material = new THREE.MeshBasicMaterial({ color/*: Math.random() * 0x0FF05F*/, wireframe:false/*, side: THREE.DoubleSide*/ });
        const mesh = new THREE.Mesh(geometry, material);
        const child = getParent(hierarchy, i);
        mesh.position.z = child * offset;
        meshes.push(mesh);
    }
    return meshes;
}

function generateGeometry(vertices: THREE.Vector2[]) : THREE.BufferGeometry {
    const shape = new THREE.Shape(vertices);
    const geometry = new THREE.ShapeGeometry(shape);
    return geometry;
}

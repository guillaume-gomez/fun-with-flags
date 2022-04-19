import cv, { Mat, MatVector } from "opencv-ts";
import * as THREE from 'three';

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

export function generateGeometries(contours : MatVector, hierarchy: Mat, image: Mat) : THREE.Mesh[] {
    let meshes : THREE.Mesh[] = [];
    const offset = 0.001;
    const { rows, cols } =  image;
    for (let i = 0; i < contours.size(); ++i) {
        const contour = contours.get(i);
        const vertices = fromContoursToGeometryVertices(contour, rows, cols);
        const geometry = generateGeometry(vertices);
        const color = geneterateColour(contour, image);
        const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0x0FF05F, wireframe:false/*, side: THREE.DoubleSide*/ });
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

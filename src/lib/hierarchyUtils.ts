import { Mat } from "opencv-ts";

function getHierarchyForContours(hierarchy : Mat, index: number): [number, number, number, number] {
    const next = hierarchy.data32S[index * hierarchy.channels()];
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


export function getParent(hierarchy : Mat, index: number) : number {
    return getHierarchyForContours(hierarchy, index)[3];
}

function getChild(hierarchy: Mat, index: number) : number {
    return getHierarchyForContours(hierarchy, index)[2];
}


export function getChildren(hierarchy: Mat, parentIndex: number) {
    let currentChild = getChild(hierarchy, parentIndex);
    let children : number[] = [];

    while(currentChild !== -1) {
        children.push(currentChild);
        currentChild = getChild(hierarchy, currentChild);
    }

    return children;
}
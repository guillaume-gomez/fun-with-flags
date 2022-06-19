import cv, { Mat, MatVector } from "opencv-ts";
import { getChildren } from "./hierarchyUtils";

export type pixel = [number, number, number];

// todo remove colors that occurs less than 1%
// + sort by proportion of colors desc

interface ColorInImage {
  [key:string]: number;
}

export function computePalette(image: Mat) : pixel[] {
  // loop through pixels to determine colors
  let colorsInImage : ColorInImage = {};
  for(let x = 0; x < image.cols; x++) {
    for (let y = 0; y < image.rows; y++) {
      const key = getColor(image, x, y).toString();
      if(colorsInImage[key]) {
        colorsInImage[key] += 1;
      } else {
        colorsInImage[key] = 1;
      }
    }
  }

  const filteredColorInImage : Array<[string, number]> = filterColorInImageTo(colorsInImage, image.cols * image.rows, .01);

  const palette : pixel[] = filteredColorInImage.map(([pixel, _]) => convertPixelStringToPixelNumber(pixel));
  return palette;
}

function filterColorInImageTo(colorsInImage: ColorInImage, nbPixel: number, keepPercentage: number) : Array<[string, number]> {
  const result = Object.entries(colorsInImage).filter(([colorString, nbOccurence]) => (nbOccurence/nbPixel) >= keepPercentage);
  return result.sort(function([_pixelStringA, occurenceA], [_pixelStringB, occurenceB]) { return occurenceA - occurenceB});
}

 function convertPixelStringToPixelNumber(pixelString: string ) : pixel {
  const pixel = (pixelString.split(",").map(colorString => parseInt(colorString, 10)) as pixel);
  return pixel;
 }

export function getColor(image: Mat, x: number, y: number) : [number, number, number] {
    const { data, cols } = image;
    const channels = image.channels();

    const R = data[y * cols * channels + x * channels];
    const G = data[y * cols * channels + x * channels + 1];
    const B = data[y * cols * channels + x * channels + 2];
    return [R, G, B];
}

function getRandomArbitrary(min: number, max: number) : number {
  return Math.random() * (max - min) + min;
}


// use montecarlo (pick random point in the shape to detect the color)
// the problem can be the shape has children on it
export function getRandomColors(contours: MatVector, hierarchy: Mat, contourIndex: number, image: Mat, nbColors: number = 20) : Array<[number, number, number]> {
    let colors : Array<[number, number, number]> = [];
    const coords = contours.get(contourIndex).data32S;
    const childrenIndexes = getChildren(hierarchy, contourIndex);

    const XPoints : number[] = coords.filter((coord, index) => index % 2 === 0);
    const YPoints : number[] = coords.filter((coord, index) => index % 2 === 1);

    const minX = Math.min(...XPoints);
    const maxX = Math.max(...XPoints);

    const minY = Math.min(...YPoints);
    const maxY = Math.max(...YPoints);

    let exponentialBackoff = 50;

    while(colors.length <= nbColors && exponentialBackoff >= 0 ) {
        const middleCoordX = Math.floor(getRandomArbitrary(minX, maxX));
        const middleCoordY = Math.floor(getRandomArbitrary(minY, maxY));


        if(isPointValid(contours, contourIndex, middleCoordX, middleCoordY, childrenIndexes)) {
            colors.push(getColor(image, middleCoordX, middleCoordY));
            exponentialBackoff = 50;
        } else {
            exponentialBackoff--
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

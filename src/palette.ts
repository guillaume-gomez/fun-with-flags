import cv, { Mat } from "opencv-ts";
//import ColorThief from 'colorthief';


const PALETTE_BASE_COLOR = 20;
export type pixel = [number, number, number];

/*export function generateColorPalette(image: HTMLImageElement, paletteSize: number  = PALETTE_BASE_COLOR) : pixel[] {
  let colorThief = new ColorThief();
  return colorThief.getPalette(image, paletteSize);
}
*/
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

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
export function computePalette(image: Mat) : pixel[] {
  // nested tool function to convert string pixel
  function convertPixelStringToPixelNumber(pixelString: string ) : pixel {
    const pixel = (pixelString.split(",").map(colorString => parseInt(colorString, 10)) as pixel);
    return pixel;
  }
  // loop through pixels to determine colors
  const colorsSet : Set<string> = new Set();
  for(let x = 0; x < image.cols; x++) {
    for (let y = 0; y < image.rows; y++) {
      colorsSet.add(getColor(image, x, y).toString());
    }
  }

  const colorsPixels : pixel[] = Array.from(colorsSet).map(pixelColor => convertPixelStringToPixelNumber(pixelColor));
  return colorsPixels;
}



function getColor(image: Mat, x: number, y: number) : [number, number, number] {
    const { data, cols } = image;
    const channels = image.channels();

    const R = data[y * cols * channels + x * channels];
    const G = data[y * cols * channels + x * channels + 1];
    const B = data[y * cols * channels + x * channels + 2];
    return [R, G, B];
}

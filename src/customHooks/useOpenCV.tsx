import cv from "opencv-ts";
import { useEffect, useState } from 'react';

interface UseOpenCVInterface {
  openCVLoaded : boolean;
  cv: any;
}

function useOpenCV(): UseOpenCVInterface {
  const [openCVLoaded, setOpenCVLoaded] = useState<boolean>(false);
  
  useEffect(() => {
    cv.onRuntimeInitialized = () => setOpenCVLoaded(true)
  }, [setOpenCVLoaded]);

  return { openCVLoaded, cv };
}

export default useOpenCV;
import { useState, useEffect } from 'react';

const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState<number>(1500);

  const getWidth = () => {
    setWindowWidth(window.innerWidth);
  };

  useEffect(() => {
    getWidth();

    window.addEventListener('resize', getWidth);

    return () => window.removeEventListener('resize', getWidth);
  }, []);

  return windowWidth;
};

export default useWindowWidth;

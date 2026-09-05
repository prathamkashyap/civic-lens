import React from 'react';
import Lottie from 'lottie-react';
import transitionAnimation from '../assets/page-transition.json';

const PageTransition = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm" role="status" aria-label="Loading page">
      <Lottie
        animationData={transitionAnimation}
        loop={false}
        autoplay
        className="route-transition-animation h-32 w-32"
      />
    </div>
  );
};

export default PageTransition;
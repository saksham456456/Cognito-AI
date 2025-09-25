
import React from 'react';
import { CognitoLogo } from './Logo';

const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-background dark:bg-[#141414]">
      <div className="flex flex-col items-center space-y-6">
        <CognitoLogo className="h-24 w-24" />
        <h1 className="text-4xl font-bold tracking-widest text-primary dark:text-yellow-400" style={{ textShadow: '0 0 10px hsl(45 90% 60% / 0.6)'}}>
            COGNITO
        </h1>
      </div>
      <div className="w-64 mt-8 bg-card dark:bg-[#1f1f1f] rounded-full h-2 overflow-hidden">
          <div className="bg-primary dark:bg-yellow-400 h-2 rounded-full animate-pulse"></div>
      </div>
       <p className="text-card-foreground/60 dark:text-gray-400 mt-4">Initializing assistant...</p>
    </div>
  );
};

export default LoadingScreen;
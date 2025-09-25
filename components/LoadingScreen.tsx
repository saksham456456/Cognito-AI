
import React from 'react';
import { CognitoLogo } from './Logo';

const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-background dark:bg-[#141414]">
      <div className="flex flex-col items-center space-y-6">
        <CognitoLogo className="h-24 w-24" />
        <h1 className="text-4xl font-bold tracking-widest text-primary dark:text-yellow-400 animate-text-glow">
            COGNITO
        </h1>
      </div>
      <div className="w-64 mt-8 bg-card dark:bg-[#1f1f1f] rounded-full h-2.5 overflow-hidden relative border border-card-border dark:border-zinc-800">
          <div className="absolute inset-0 h-full w-full bg-primary/20 dark:bg-yellow-400/10"></div>
          <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-primary dark:via-yellow-400 to-transparent animate-shimmer-load"></div>
      </div>
       <p className="text-card-foreground/60 dark:text-gray-400 mt-4 animate-subtle-fade">Initializing assistant...</p>
    </div>
  );
};

export default LoadingScreen;
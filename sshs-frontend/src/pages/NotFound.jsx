import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div
        className="
          mx-auto max-w-lg text-center
          rounded-[2rem]
          border border-white/25
          bg-white/[0.04]
          px-8 py-10
          backdrop-blur-[18px]
          shadow-[inset_0_0_26px_rgba(255,255,255,0.28)]
        "
      >
        <div className="mb-4 text-[72px] md:text-[96px] font-semibold leading-none tracking-tight">
          <span
            className="
              bg-gradient-to-b from-white to-white/40
              bg-clip-text text-transparent
            "
          >
            404
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-semibold text-white">
          Page Not Found
        </h2>
        <p className="mt-3 text-sm md:text-base text-white/70">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>

        <Link
          to="/"
          className="
            mt-8 inline-flex h-11 items-center justify-center
            rounded-full border border-white/30
            bg-white/[0.24] px-6
            text-xs md:text-sm font-semibold text-white
            shadow-[inset_0_0_18px_rgba(255,255,255,0.3)]
            hover:bg-white/[0.34]
            transition-all
          "
        >
          Go back home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

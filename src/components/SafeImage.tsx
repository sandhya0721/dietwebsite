import { useState } from 'react';
import { Leaf } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export function SafeImage({ src, alt, className = '' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-[#EEF2EC] text-[#4D5E53] p-4 text-center ${className}`}
      >
        <Leaf className="w-7 h-7 text-[#1B5E37]/60 mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium text-[#4D5E53] line-clamp-2 max-w-[160px]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

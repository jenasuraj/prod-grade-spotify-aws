interface SplashProps {
  src: string;
  alt: string;
}

export default function Splash({ src, alt }: SplashProps) {
  return (
    <div role="status" className="fixed inset-0 z-50 grid place-items-center bg-zinc-950 p-4">
      <img
        src={src}
        alt={alt}
        className="max-h-[80vh] w-full max-w-3xl animate-pulse object-contain"
      />
    </div>
  );
}

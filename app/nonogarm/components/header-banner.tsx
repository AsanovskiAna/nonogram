import { Star } from "lucide-react";

export function HeaderBanner() {
  return (
    <header className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="border-4 border-black bg-[#ff3f9a] px-5 py-3 shadow-[8px_8px_0_#000] sm:px-7">
        <h1 className="font-mono text-5xl font-black leading-none tracking-normal sm:text-7xl lg:text-8xl">
          NONOGARM
        </h1>
      </div>
      <div className="flex items-center gap-4 border-4 border-black bg-[#ffd60a] px-5 py-3 font-mono font-black uppercase shadow-[8px_8px_0_#000]">
        <Star className="size-10 fill-black stroke-black" aria-hidden="true" />
        <p className="text-lg leading-tight">Solve puzzles. Reveal the star. Guess &amp; score!</p>
      </div>
    </header>
  );
}

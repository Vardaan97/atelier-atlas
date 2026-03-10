export default function Loading() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#0A0A1A]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 border-2 border-[#E94560]/30 border-t-[#E94560] rounded-full animate-spin" />
        <p className="text-[#8B8FA3] text-sm font-mono tracking-wider">
          LOADING ATLAS...
        </p>
      </div>
    </div>
  );
}

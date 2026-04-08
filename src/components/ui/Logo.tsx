interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={className}>
      <p className="font-display text-[1.125rem] font-bold tracking-[0.06em] leading-none">
        MIKE&apos;S CLEAN CUT
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="w-5 h-0.5 bg-brand rounded-full" />
        <p className="text-[0.55rem] font-medium tracking-[0.25em] leading-none opacity-50">
          LANDSCAPING
        </p>
      </div>
    </div>
  );
}

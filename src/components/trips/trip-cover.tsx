import { MapPin, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CoverPlaceholder } from "@/lib/validation/trips";

const coverStyles: Record<CoverPlaceholder, string> = {
  sunset:
    "bg-[radial-gradient(circle_at_70%_25%,#f1ca78_0,transparent_18%),radial-gradient(circle_at_30%_70%,#9c3c69_0,transparent_38%),linear-gradient(145deg,#071a15,#17483d_55%,#6b294e)]",
  sea: "bg-[radial-gradient(circle_at_25%_20%,#d9bd78_0,transparent_16%),radial-gradient(circle_at_80%_70%,#236f69_0,transparent_42%),linear-gradient(145deg,#071711,#153c35_55%,#3a2451)]",
  forest:
    "bg-[radial-gradient(circle_at_68%_18%,#e1c879_0,transparent_14%),radial-gradient(circle_at_20%_78%,#367354_0,transparent_40%),linear-gradient(150deg,#06120d,#15372a_55%,#69472c)]",
  night:
    "bg-[radial-gradient(circle_at_72%_20%,#f0cf77_0,transparent_7%),radial-gradient(circle_at_24%_74%,#703663_0,transparent_40%),linear-gradient(150deg,#050d14,#111d35_55%,#153b34)]",
};

export function TripCover({
  className,
  cover,
  label,
}: {
  className?: string;
  cover: string | null;
  label?: string;
}) {
  const normalizedCover =
    cover && cover in coverStyles ? (cover as CoverPlaceholder) : "sunset";

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-cover bg-center",
        coverStyles[normalizedCover],
        className,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,18,16,.38),transparent_60%)]" />
      <Sparkles className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-white/20" />
      <div className="absolute -bottom-12 -right-10 size-44 rounded-full border border-white/20" />
      <div className="absolute -bottom-20 -right-2 size-44 rounded-full border border-white/15" />
      {label && (
        <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 text-xs text-white backdrop-blur-md">
          <MapPin className="size-3" /> {label}
        </span>
      )}
    </div>
  );
}

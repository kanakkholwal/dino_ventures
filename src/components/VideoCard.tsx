import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { VideoWithCategory } from "@/lib/data";
import { usePlayerStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface VideoCardProps {
    video: VideoWithCategory;
}

export function VideoCard({ video }: VideoCardProps) {
    const { play } = usePlayerStore();
    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleLoad = useCallback(() => setLoaded(true), []);

    const handleError = useCallback(() => {
        setLoaded(true); // remove skeleton even on error
        if (imgRef.current) {
            imgRef.current.src = `https://placehold.co/600x400/1a1a2e/eee?text=${encodeURIComponent(video.title.slice(0, 20))}`;
        }
    }, [video.title]);

    return (
        <Card
            className="group cursor-pointer overflow-hidden border-0 bg-transparent shadow-none w-full"
            onClick={() => play(video)}
        >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                {/* Skeleton shimmer */}
                {!loaded && (
                    <div className="absolute inset-0 z-1 animate-pulse">
                        <div className="h-full w-full bg-linear-to-r from-muted via-muted-foreground/10 to-muted bg-size-[200%_100%] animate-shimmer rounded-xl" />
                    </div>
                )}

                <img
                    ref={imgRef}
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className={cn(
                        "h-full w-full object-cover transition-all duration-500 group-hover:scale-105",
                        loaded ? "opacity-100" : "opacity-0"
                    )}
                    loading="lazy"
                    decoding="async"
                    onLoad={handleLoad}
                    onError={handleError}
                />

                {/* overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs">
                        <Play className="size-6 fill-white text-white" />
                    </div>
                </div>

                {video.duration && (
                    <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums">
                        {video.duration}
                    </div>
                )}

                <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 bg-black/60 text-white border-0 text-[10px] backdrop-blur-xs"
                >
                    {video.category}
                </Badge>
            </div>

            <CardContent className="p-3">
                <div className="flex flex-col gap-1">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                        {video.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{video.duration}</p>
                </div>
            </CardContent>
        </Card>
    );
}

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { VideoWithCategory } from "@/lib/data";
import { usePlayerStore } from "@/lib/store";
import { Play } from "lucide-react";

interface VideoCardProps {
    video: VideoWithCategory;
}

export function VideoCard({ video }: VideoCardProps) {
    const { play } = usePlayerStore();

    return (
        <Card
            className="group cursor-pointer overflow-hidden border-0 bg-transparent shadow-none w-full"
            onClick={() => play(video)}
        >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/600x400/1a1a2e/eee?text=${encodeURIComponent(video.title.slice(0, 20))}`;
                    }}
                />

                {/* Play overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <Play className="h-6 w-6 fill-white text-white" />
                    </div>
                </div>

                {/* Duration Badge */}
                {video.duration && (
                    <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums">
                        {video.duration}
                    </div>
                )}

                {/* Category Badge */}
                <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 bg-black/60 text-white border-0 text-[10px] backdrop-blur-sm"
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

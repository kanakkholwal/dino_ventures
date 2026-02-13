import { CategoryPill } from "@/components/CategoryPill";
import { VideoCard } from "@/components/VideoCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DATASET, getAllVideos } from "@/lib/data";
import { useState } from "react";

export default function Home() {
    const [activeCategory, setActiveCategory] = useState("all");

    const allVideos = getAllVideos();

    const filteredVideos =
        activeCategory === "all"
            ? allVideos
            : allVideos.filter((v) => v.categorySlug === activeCategory);

    const categories = [
        { slug: "all", name: "All", iconUrl: "" },
        ...DATASET.map((d) => d.category),
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Categories Bar */}
            <div className="sticky top-14 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 border-b">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max space-x-2 px-4">
                        {categories.map((cat) => (
                            <CategoryPill
                                key={cat.slug}
                                label={cat.name}
                                isActive={activeCategory === cat.slug}
                                onClick={() => setActiveCategory(cat.slug)}
                                iconUrl={cat.iconUrl || undefined}
                            />
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 pb-8">
                {filteredVideos.map((video) => (
                    <VideoCard key={video.slug} video={video} />
                ))}
            </div>
        </div>
    );
}

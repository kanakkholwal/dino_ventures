import { CategoryPill } from "@/components/CategoryPill";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button"; // Assuming ShadCN Button exists
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Category, DATASET, getAllVideos } from "@/lib/data";
import { ChevronRight, Layers, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";


export default function Home() {
    const [activeCategory, setActiveCategory] = useState("all");

    const allVideos = useMemo(() => getAllVideos(), []);

    const categories = useMemo<Category[]>(
        () => [
            { slug: "all", name: "Discover", iconUrl: "" },
            ...DATASET.map((d) => d.category),
        ],
        []
    );

    const handleCategorySelect = (slug: string) => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setActiveCategory(slug);
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/10">
            <CategoryNav
                categories={categories}
                activeSlug={activeCategory}
                onSelect={handleCategorySelect}
            />

            <main className="container max-w-(--breakpoint-2xl) mx-auto min-h-[calc(100vh-4rem)] pt-6 pb-20">
                {activeCategory === "all" ? (
                    <DiscoverFeed onCategoryClick={handleCategorySelect} />
                ) : (
                    <CategoryGrid
                        categorySlug={activeCategory}
                        allVideos={allVideos}
                    />
                )}
            </main>
        </div>
    );
}


const CategoryNav = ({
    categories,
    activeSlug,
    onSelect,
}: {
    categories: Category[];
    activeSlug: string;
    onSelect: (slug: string) => void;
}) => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
            <div className="container max-w-(--breakpoint-2xl) mx-auto">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max items-center gap-2 px-4 py-3 md:px-0">
                        {categories.map((cat) => (
                            <CategoryPill
                                key={cat.slug}
                                label={cat.name}
                                isActive={activeSlug === cat.slug}
                                onClick={() => onSelect(cat.slug)}
                                iconUrl={cat.iconUrl}
                                className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            />
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="invisible" />

                    {/* Visual gradient mask for scroll hints */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-background to-transparent md:hidden" />
                </ScrollArea>
            </div>
        </header>
    );
};

const DiscoverFeed = ({
    onCategoryClick,
}: {
    onCategoryClick: (slug: string) => void;
}) => {
    return (
        <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

            {DATASET.map((section) => (
                <section key={section.category.slug} className="group/section flex flex-col gap-5">
                    {/* Section Header */}
                    <div className="flex items-center justify-between px-4 md:px-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 border border-border/50">
                                {section.category.iconUrl ? (
                                    <img
                                        src={section.category.iconUrl}
                                        alt=""
                                        className="h-5 w-5 object-contain opacity-90"
                                    />
                                ) : (
                                    <Layers className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                                    {section.category.name}
                                </h2>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {section.contents.length} Videos
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCategoryClick(section.category.slug)}
                            className="text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors -mr-2"
                        >
                            View All
                            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/section:translate-x-0.5" />
                        </Button>
                    </div>

                    {/* Horizontal Scroll Row with Snap Logic */}
                    <ScrollArea className="w-full pb-2 -mx-4 md:mx-0">
                        <div className="flex gap-4 px-4 md:px-0 snap-x snap-mandatory">
                            {section.contents.map((video) => (
                                <div
                                    key={video.slug}
                                    className="w-[280px] sm:w-[340px] shrink-0 snap-start first:pl-0 last:pr-4"
                                >
                                    <VideoCard
                                        video={{
                                            ...video,
                                            category: section.category.name,
                                            categorySlug: section.category.slug,
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" className="hidden" />
                    </ScrollArea>
                </section>
            ))}
        </div>
    );
};

const CategoryGrid = ({
    categorySlug,
    allVideos,
}: {
    categorySlug: string;
    allVideos: ReturnType<typeof getAllVideos>;
}) => {
    const currentCategory = DATASET.find((d) => d.category.slug === categorySlug);

    const filteredVideos = useMemo(
        () => allVideos.filter((v) => v.categorySlug === categorySlug),
        [allVideos, categorySlug]
    );

    if (!currentCategory) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-muted p-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">Category not found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 px-4 md:px-0 animate-in fade-in zoom-in-[0.98] duration-500">
            <div className="flex flex-col gap-4 border-b border-border/40 pb-8 pt-2">
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-muted to-background border border-border shadow-xs">
                        {currentCategory.category.iconUrl ? (
                            <img
                                src={currentCategory.category.iconUrl}
                                alt=""
                                className="h-8 w-8 object-contain"
                            />
                        ) : (
                            <Layers className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            {currentCategory.category.name}
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                            Explore our curated collection of {filteredVideos.length} videos.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredVideos.map((video, idx) => (
                    <div
                        key={video.slug}
                        className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <VideoCard video={video} />
                    </div>
                ))}
            </div>
        </div>
    );
};
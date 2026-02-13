import { Button } from "@/components/ui/button";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { getVideoBySlug, getVideosByCategory } from "@/lib/data";
import { usePlayerStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import {
    ChevronDown,
    Pause,
    Play,
    RotateCcw,
    RotateCw,
    SkipForward
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Drawer } from "vaul";


function formatTime(s: number): string {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

const Scrubber = ({
    currentTime,
    duration,
    onSeek,
}: {
    currentTime: number;
    duration: number;
    onSeek: (t: number) => void;
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="group/scrubber relative flex items-center h-6 cursor-pointer touch-none select-none">
            <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="absolute inset-0 z-20 w-full h-full opacity-0 cursor-pointer"
            />
            {/* Track */}
            <div className="relative w-full h-[3px] bg-white/20 rounded-full group-hover/scrubber:h-[5px] transition-all duration-300">
                <div
                    className="absolute left-0 top-0 h-full bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                    style={{ width: `${progress}%` }}
                />
                {/* Thumb */}
                <div
                    className={cn(
                        "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 bg-red-600 rounded-full shadow-md scale-0 group-hover/scrubber:scale-100 transition-transform duration-200",
                        isDragging && "scale-100 ring-4 ring-white/10"
                    )}
                    style={{ left: `${progress}%` }}
                />
            </div>
        </div>
    );
};


export function PlayerOverlay() {
    const {
        activeVideo,
        isMinimized,
        isExpanded,
        minimize,
        maximize,
        play,
    } = usePlayerStore();

    const navigate = useNavigate();
    const location = useLocation();

    // Local State
    const [controlsVisible, setControlsVisible] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [doubleTapFeedback, setDoubleTapFeedback] = useState<{ side: 'left' | 'right' } | null>(null);
    const [videoIsVertical, setVideoIsVertical] = useState(false);

    // Refs
    const hideTimer = useRef<NodeJS.Timeout>();
    const lastTap = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);


    const isShorts = activeVideo?.category === "Shorts" || videoIsVertical;

    useEffect(() => {
        if (activeVideo && isExpanded) {
            const target = `/watch/${activeVideo.slug}`;
            if (location.pathname !== target) {
                navigate(target, { replace: location.pathname.startsWith("/watch/") });
            }
        } else if (location.pathname.startsWith("/watch/")) {
            const slug = location.pathname.split("/")[2];
            const video = getVideoBySlug(slug);
            if (!video) navigate("/", { replace: true, viewTransition: true });
            else play(video);
        }
    }, [activeVideo?.slug, isExpanded]);


    useEffect(() => {
        setVideoIsVertical(false);
    }, [activeVideo?.slug]);

    const relatedVideos = activeVideo
        ? getVideosByCategory(activeVideo.category).filter((v) => v.slug !== activeVideo.slug)
        : [];

    const handleVideoEnd = useCallback(() => {
        if (relatedVideos[0]) play(relatedVideos[0]);
    }, [relatedVideos, play]);

    const ytPlayer = useYouTubePlayer({
        videoId: activeVideo?.mediaType === "YOUTUBE" ? activeVideo.slug : null,
        onEnd: handleVideoEnd,
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const [mp4State, setMp4State] = useState({ time: 0, duration: 0, playing: false, loading: true });

    const isYT = activeVideo?.mediaType === "YOUTUBE";
    const currentTime = isYT ? ytPlayer.currentTime : mp4State.time;
    const duration = isYT ? ytPlayer.duration : mp4State.duration;
    const isPlaying = isYT ? ytPlayer.playing : mp4State.playing;

    // Controls Logic
    const togglePlay = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (isYT) ytPlayer.togglePlay();
        else if (videoRef.current) {
            videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
        }
        showControls();
    }, [isYT, ytPlayer]);

    const seekTo = useCallback((t: number) => {
        if (isYT) ytPlayer.seekTo(t);
        else if (videoRef.current) videoRef.current.currentTime = t;
    }, [isYT, ytPlayer]);

    const skip = useCallback((seconds: number) => {
        seekTo(Math.max(0, Math.min(currentTime + seconds, duration)));
        showControls();
    }, [currentTime, duration, seekTo]);

    const showControls = useCallback(() => {
        setControlsVisible(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }, []);

    // Gesture Logic 
    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = isShorts ? 150 : 100;
        // Swipe down to minimize
        if (info.offset.y > threshold && info.velocity.y > 0) minimize();
        // Swipe up to reveal drawer (only in full screen mode)
        else if (info.offset.y < -50 && !isMinimized && !isShorts) setDrawerOpen(true);
    };

    const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
        const now = Date.now();
        const isDouble = now - lastTap.current < 300;
        lastTap.current = now;

        if (isDouble) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width / 3) {
                skip(-10);
                setDoubleTapFeedback({ side: 'left' });
            } else if (x > (rect.width * 2) / 3) {
                skip(10);
                setDoubleTapFeedback({ side: 'right' });
            } else {
                togglePlay();
            }
            setTimeout(() => setDoubleTapFeedback(null), 500);
        } else {
            setTimeout(() => {
                if (Date.now() - lastTap.current >= 300) {
                    if (isMinimized) maximize();
                    else showControls();
                }
            }, 310);
        }
    };

    if (!activeVideo) return null;

    // Progress for mini-player visual
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <AnimatePresence mode="wait">
            {isExpanded && (
                <motion.div
                    layout
                    key="player-overlay"
                    initial={isMinimized ? { opacity: 0, y: 50, scale: 0.95 } : { opacity: 0, y: "100%", scale: 1 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: "100%", transition: { duration: 0.25 } }}
                    transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                    className={cn(
                        "fixed z-50 overflow-hidden shadow-2xl bg-black origin-bottom",
                        isMinimized
                            ? "bottom-6 left-4 right-4 h-20 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-black/80 supports-[backdrop-filter]:bg-black/40"
                            : "inset-0 w-full h-full rounded-none"
                    )}
                    ref={containerRef}
                >
                    <motion.div
                        layout
                        className={cn(
                            "flex w-full h-full overflow-hidden",
                            isMinimized ? "flex-row items-center" : "flex-col bg-black"
                        )}
                    >
                        <motion.div
                            layout
                            className={cn(
                                "relative shrink-0 overflow-hidden z-20 transition-all duration-300",
                                isMinimized
                                    ? "w-28 h-full rounded-l-2xl" 
                                    : isShorts
                                        ? "w-full h-full"
                                        : "w-full aspect-video"
                            )}
                            drag={!isMinimized ? "y" : false}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.2}
                            onDragEnd={handleDragEnd}
                            onClick={handleDoubleTap}
                        >
                            {/* Video Wrapper */}
                            <div className={cn(
                                "absolute inset-0 w-full h-full",
                                isMinimized && isShorts && "scale-150"
                            )}>
                                {isYT ? (
                                    <div ref={ytPlayer.containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                                ) : (
                                    <video
                                        ref={videoRef}
                                        src={activeVideo.mediaUrl}
                                        className={cn(
                                            "absolute inset-0 w-full h-full",
                                            isMinimized ? "object-cover" : (isShorts ? "object-cover" : "object-contain")
                                        )}
                                        autoPlay
                                        playsInline
                                        onTimeUpdate={() => setMp4State(p => ({ ...p, time: videoRef.current?.currentTime || 0 }))}
                                        onLoadedMetadata={(e) => {
                                            const video = e.currentTarget;
                                            setMp4State(p => ({ ...p, duration: video.duration || 0, loading: false }));
                                            if (video.videoHeight > video.videoWidth) setVideoIsVertical(true);
                                        }}
                                        onPlay={() => setMp4State(p => ({ ...p, playing: true }))}
                                        onPause={() => setMp4State(p => ({ ...p, playing: false }))}
                                        onEnded={handleVideoEnd}
                                    />
                                )}
                            </div>

                            {isMinimized && (
                                <div className="absolute inset-0 bg-transparent z-30 cursor-pointer" onClick={maximize} />
                            )}

                            <AnimatePresence>
                                {doubleTapFeedback && !isMinimized && (
                                    <div className={cn(
                                        "absolute inset-y-0 w-1/3 z-30 flex items-center justify-center bg-white/10 backdrop-blur-[2px]",
                                        doubleTapFeedback.side === 'left' ? "left-0 rounded-r-[40px]" : "right-0 rounded-l-[40px]"
                                    )}>
                                        <div className="flex flex-col items-center text-white/90">
                                            {doubleTapFeedback.side === 'left' ? <RotateCcw size={32} /> : <RotateCw size={32} />}
                                            <span className="text-xs font-bold mt-2">10s</span>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* FULL SCREEN CONTROLS OVERLAY */}
                            {!isMinimized && (
                                <AnimatePresence>
                                    {controlsVisible && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-b from-black/60 via-transparent to-black/80"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div id="video-top-bar" className="flex items-center justify-between p-4 pt-12 md:pt-4">
                                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full transition-colors" onClick={minimize}>
                                                    <ChevronDown />
                                                </Button>
                                            
                                            </div>

                                            <div id="video-controls" className="absolute inset-0 flex items-center justify-center gap-12 pointer-events-none">
                                                <Button variant="ghost" size="icon" className="w-14 h-14 text-white/90 hover:bg-white/10 rounded-full pointer-events-auto transition-transform active:scale-90" onClick={() => skip(-10)}>
                                                    <RotateCcw size={32} strokeWidth={1.5} />
                                                </Button>
                                                <button
                                                    onClick={togglePlay}
                                                    className="pointer-events-auto flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:scale-105 hover:bg-white/20 transition-all active:scale-95 shadow-lg"
                                                >
                                                    {isPlaying ? <Pause size={36} fill="white" /> : <Play size={36} fill="white" className="ml-1" />}
                                                </button>
                                                <Button variant="ghost" size="icon" className="w-14 h-14 text-white/90 hover:bg-white/10 rounded-full pointer-events-auto transition-transform active:scale-90" onClick={() => skip(10)}>
                                                    <RotateCw size={32} strokeWidth={1.5} />
                                                </Button>
                                            </div>

                                            {!isShorts ? (
                                                <div className="p-6 space-y-3 pb-10 md:pb-6">
                                                    <div className="flex justify-between text-xs font-medium text-white/80 tabular-nums px-1 tracking-wide">
                                                        <span>{formatTime(currentTime)}</span>
                                                        <span>{formatTime(duration)}</span>
                                                    </div>
                                                    <Scrubber currentTime={currentTime} duration={duration} onSeek={seekTo} />
                                                </div>
                                            ) : (
                                                <div className="p-6 pb-16 bg-gradient-to-t from-black via-black/40 to-transparent">
                                                    <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">{activeVideo.title}</h2>
                                                    <Scrubber currentTime={currentTime} duration={duration} onSeek={seekTo} />
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </motion.div>

                        {/*  MINI PLAYER INFO & CONTROLS  */}
                        {isMinimized && (
                            <motion.div layout className="flex-1 flex flex-col h-full justify-center min-w-0 px-4 relative group">
                                <div className="flex items-center justify-between h-full" onClick={maximize}>
                                    <div className="flex flex-col justify-center min-w-0 mr-4 cursor-pointer">
                                        <span className="text-[15px] font-semibold text-white/95 truncate leading-tight">
                                            {activeVideo.title}
                                        </span>
                                        <span className="text-xs text-white/60 truncate mt-0.5">
                                            {activeVideo.category} • {activeVideo.duration}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 z-40">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                        >
                                            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); if (relatedVideos[0]) play(relatedVideos[0]); }}
                                        >
                                            <SkipForward size={22} fill="currentColor" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="absolute bottom-[1px] left-4 right-4 h-[2px] bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                        style={{ width: `${progressPercent}%` }}
                                        layoutId="progress-bar"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {!isMinimized && !isShorts && (
                            <motion.div
                                layout
                                className="flex-1 bg-background overflow-y-auto"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >


                                <div className="px-5 pb-10 space-y-4 pt-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">Up Next</h3>
                                    {relatedVideos.map(v => (
                                        <div key={v.slug} className="flex gap-4 cursor-pointer group rounded-xl p-2 -mx-2 hover:bg-accent/40 transition-colors" onClick={() => play(v)}>
                                            <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-muted shrink-0 shadow-sm">
                                                <img src={v.thumbnailUrl} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-[2px] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                                    {v.duration}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <h4 className="text-sm font-semibold line-clamp-2 leading-snug text-foreground group-hover:text-primary transition-colors">{v.title}</h4>
                                                <p className="text-xs text-muted-foreground mt-1 font-medium">{v.category}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    {!isShorts && (
                        <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
                            <Drawer.Portal>
                                <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" />
                                <Drawer.Content className="bg-background flex flex-col rounded-t-[24px] h-[75vh] fixed bottom-0 left-0 right-0 z-[70] outline-none shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                                    <div className="p-2 pt-3 flex justify-center">
                                        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                                    </div>
                                    <div className="px-6 pb-4 border-b">
                                        <h2 className="text-lg font-bold">Up Next</h2>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 pt-4">
                                        {relatedVideos.map((v) => (
                                            <div key={v.slug} onClick={() => { play(v); setDrawerOpen(false); }} className="flex gap-4 mb-5 active:opacity-60 cursor-pointer">
                                                <div className="w-36 rounded-xl aspect-video bg-muted overflow-hidden shrink-0 relative shadow-sm">
                                                    <img src={v.thumbnailUrl} className="object-cover w-full h-full" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-sm line-clamp-2 leading-snug">{v.title}</h4>
                                                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">{v.category}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Drawer.Content>
                            </Drawer.Portal>
                        </Drawer.Root>
                    )}

                </motion.div>
            )}
        </AnimatePresence>
    );
}
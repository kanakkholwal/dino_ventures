import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { getVideosByCategory } from "@/lib/data";
import { usePlayerStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
    Loader2,
    Minimize2,
    Pause,
    Play,
    RotateCcw,
    RotateCw,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function formatTime(s: number): string {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export function PlayerOverlay() {
    const {
        activeVideo,
        isMinimized,
        isExpanded,
        minimize,
        maximize,
        close,
        play,
    } = usePlayerStore();

    const navigate = useNavigate();
    const location = useLocation();

    /* ---- sync URL with player state ---- */
    useEffect(() => {
        if (activeVideo && isExpanded) {
            const target = `/watch/${activeVideo.slug}`;
            if (location.pathname !== target) {
                navigate(target, { replace: false });
            }
        } else if (!activeVideo && location.pathname.startsWith("/watch/")) {
            navigate("/", { replace: true });
        }
    }, [activeVideo?.slug, isExpanded]);

    /* ---- related / next video (same category) ---- */
    const relatedVideos = activeVideo
        ? getVideosByCategory(activeVideo.category).filter(
            (v) => v.slug !== activeVideo.slug
        )
        : [];

    const nextVideo = relatedVideos.length > 0 ? relatedVideos[0] : null;

    /* ---- auto-play next ---- */
    const [autoPlay, setAutoPlay] = useState<{
        show: boolean;
        countdown: number;
    }>({ show: false, countdown: 3 });

    const handleVideoEnd = useCallback(() => {
        if (nextVideo) setAutoPlay({ show: true, countdown: 3 });
    }, [nextVideo]);

    // countdown timer
    useEffect(() => {
        if (!autoPlay.show || autoPlay.countdown <= 0) return;
        const t = setTimeout(
            () => setAutoPlay((p) => ({ ...p, countdown: p.countdown - 1 })),
            1000
        );
        return () => clearTimeout(t);
    }, [autoPlay]);

    // fire when countdown hits 0
    useEffect(() => {
        if (autoPlay.show && autoPlay.countdown === 0 && nextVideo) {
            setAutoPlay({ show: false, countdown: 3 });
            play(nextVideo);
        }
    }, [autoPlay, nextVideo, play]);

    // reset auto-play state on video change
    useEffect(() => {
        setAutoPlay({ show: false, countdown: 3 });
    }, [activeVideo?.slug]);

    /* ---- YouTube player ---- */
    const ytPlayer = useYouTubePlayer({
        videoId:
            activeVideo?.mediaType === "YOUTUBE" ? activeVideo.slug : null,
        onEnd: handleVideoEnd,
    });

    /* ---- MP4 refs ---- */
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mp4Time, setMp4Time] = useState(0);
    const [mp4Duration, setMp4Duration] = useState(0);
    const [mp4Playing, setMp4Playing] = useState(false);
    const [mp4Loading, setMp4Loading] = useState(true);

    /* ---- unified player abstraction ---- */
    const isYT = activeVideo?.mediaType === "YOUTUBE";
    const currentTime = isYT ? ytPlayer.currentTime : mp4Time;
    const duration = isYT ? ytPlayer.duration : mp4Duration;
    const isPlaying = isYT ? ytPlayer.playing : mp4Playing;

    const togglePlay = useCallback(() => {
        if (isYT) {
            ytPlayer.togglePlay();
        } else if (videoRef.current) {
            if (videoRef.current.paused) videoRef.current.play();
            else videoRef.current.pause();
        }
    }, [isYT, ytPlayer]);

    const skip = useCallback(
        (seconds: number) => {
            if (isYT) {
                ytPlayer.seekTo(Math.max(0, ytPlayer.currentTime + seconds));
            } else if (videoRef.current) {
                videoRef.current.currentTime = Math.max(
                    0,
                    videoRef.current.currentTime + seconds
                );
            }
            // visual feedback
            setSkipFeedback(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
            setTimeout(() => setSkipFeedback(null), 600);
        },
        [isYT, ytPlayer]
    );

    const seekTo = useCallback(
        (t: number) => {
            if (isYT) ytPlayer.seekTo(t);
            else if (videoRef.current) videoRef.current.currentTime = t;
        },
        [isYT, ytPlayer]
    );

    /* ---- controls visibility (auto-hide after 3 s) ---- */
    const [controlsVisible, setControlsVisible] = useState(true);
    const hideTimer = useRef<ReturnType<typeof setTimeout>>();

    const showControls = useCallback(() => {
        setControlsVisible(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }, []);

    // Show controls initially, then auto-hide
    useEffect(() => {
        showControls();
        return () => clearTimeout(hideTimer.current);
    }, [activeVideo?.slug, showControls]);

    /* ---- skip visual feedback ---- */
    const [skipFeedback, setSkipFeedback] = useState<string | null>(null);

    /* ---- drag-to-minimize ---- */
    const handleDragEnd = (_: unknown, info: PanInfo) => {
        if (info.offset.y > 120) minimize();
    };

    /* ---- mini-player tap ---- */
    const handleMiniClick = () => {
        if (isMinimized) maximize();
    };

    if (!activeVideo) return null;

    /* ---------------------------------------------------------------- */
    /*  RENDER                                                          */
    /* ---------------------------------------------------------------- */
    return (
        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    key="player-shell"
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{
                        y: 0,
                        opacity: 1,
                        ...(isMinimized
                            ? {
                                top: "auto",
                                bottom: 12,
                                left: 8,
                                right: 8,
                                width: "auto",
                                height: 64,
                                borderRadius: 14,
                            }
                            : {
                                top: 0,
                                bottom: 0,
                                left: 0,
                                right: 0,
                                width: "100%",
                                height: "100%",
                                borderRadius: 0,
                            }),
                    }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    drag={!isMinimized ? "y" : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    className={cn(
                        "fixed z-50 overflow-hidden shadow-2xl bg-black",
                        isMinimized && "cursor-pointer ring-1 ring-white/10"
                    )}
                    onClick={handleMiniClick}
                >
                    <div
                        className={cn(
                            "h-full",
                            isMinimized ? "flex flex-row" : "flex flex-col"
                        )}
                    >
                        {/* ============ VIDEO AREA ============ */}
                        <div
                            className={cn(
                                "relative bg-black shrink-0 overflow-hidden",
                                isMinimized
                                    ? "w-28 h-full"
                                    : "w-full aspect-video"
                            )}
                            onClick={(e) => {
                                if (!isMinimized) {
                                    e.stopPropagation();
                                    showControls();
                                }
                            }}
                        >
                            {/* YouTube or MP4 */}
                            {isYT ? (
                                <div
                                    ref={ytPlayer.containerRef}
                                    className="yt-container absolute inset-0 w-full h-full"
                                />
                            ) : (
                                <video
                                    ref={videoRef}
                                    src={activeVideo.mediaUrl}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    autoPlay
                                    playsInline
                                    onTimeUpdate={() =>
                                        setMp4Time(videoRef.current?.currentTime ?? 0)
                                    }
                                    onLoadedMetadata={() => {
                                        setMp4Duration(videoRef.current?.duration ?? 0);
                                        setMp4Loading(false);
                                    }}
                                    onWaiting={() => setMp4Loading(true)}
                                    onCanPlay={() => setMp4Loading(false)}
                                    onPlay={() => setMp4Playing(true)}
                                    onPause={() => setMp4Playing(false)}
                                    onEnded={handleVideoEnd}
                                />
                            )}

                            {/* ------- LOADING SPINNER ------- */}
                            {((isYT && !ytPlayer.ready) || (!isYT && mp4Loading)) && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                                    {/* Blurred thumbnail background */}
                                    <img
                                        src={activeVideo.thumbnailUrl}
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md scale-110"
                                    />
                                    <div className="relative flex flex-col items-center gap-3">
                                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                                        <p className="text-sm text-white/70 font-medium">Loading video…</p>
                                    </div>
                                </div>
                            )}

                            {/* ------- CUSTOM CONTROLS OVERLAY (full mode only) ------- */}
                            {!isMinimized && (
                                <AnimatePresence>
                                    {controlsVisible && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute inset-0 z-10 flex flex-col justify-between bg-gradient-to-b from-black/50 via-transparent to-black/70"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Top bar */}
                                            <div className="flex items-center justify-between px-3 pt-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-white hover:bg-white/20 h-9 w-9"
                                                    onClick={minimize}
                                                >
                                                    <Minimize2 className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-white hover:bg-white/20 h-9 w-9"
                                                    onClick={close}
                                                >
                                                    <X className="h-5 w-5" />
                                                </Button>
                                            </div>

                                            {/* Centre – play / skip */}
                                            <div className="flex items-center justify-center gap-8">
                                                <button
                                                    onClick={() => skip(-10)}
                                                    className="relative text-white/90 hover:text-white active:scale-90 transition-transform p-2"
                                                >
                                                    <RotateCcw className="h-7 w-7" />
                                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold">
                                                        10
                                                    </span>
                                                </button>

                                                <button
                                                    onClick={togglePlay}
                                                    className="flex items-center justify-center h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 active:scale-90 transition-transform"
                                                >
                                                    {isPlaying ? (
                                                        <Pause className="h-7 w-7" />
                                                    ) : (
                                                        <Play className="h-7 w-7 ml-1" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => skip(10)}
                                                    className="relative text-white/90 hover:text-white active:scale-90 transition-transform p-2"
                                                >
                                                    <RotateCw className="h-7 w-7" />
                                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold">
                                                        10
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Bottom – seekbar + time */}
                                            <div className="px-4 pb-4 space-y-1">
                                                {/* Seekbar */}
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={duration || 100}
                                                    step={0.5}
                                                    value={currentTime}
                                                    onChange={(e) => seekTo(Number(e.target.value))}
                                                    className="seekbar w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer accent-red-500"
                                                />
                                                {/* Time labels */}
                                                <div className="flex justify-between text-[11px] text-white/80 tabular-nums font-medium">
                                                    <span>{formatTime(currentTime)}</span>
                                                    <span>{formatTime(duration)}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}

                            {/* Skip visual feedback */}
                            <AnimatePresence>
                                {skipFeedback && !isMinimized && (
                                    <motion.div
                                        key="skip-fb"
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.4 }}
                                        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                                    >
                                        <span className="text-white text-3xl font-black drop-shadow-lg">
                                            {skipFeedback}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Auto-play countdown overlay */}
                            {autoPlay.show && nextVideo && !isMinimized && (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                                    <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 max-w-xs">
                                        <p className="text-white/60 text-sm mb-1">Up Next</p>
                                        <h3 className="text-base font-bold text-white mb-3 line-clamp-2">
                                            {nextVideo.title}
                                        </h3>
                                        <div className="text-5xl font-black text-red-500 mb-5 tabular-nums">
                                            {autoPlay.countdown}
                                        </div>
                                        <div className="flex gap-3 justify-center">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setAutoPlay({ show: false, countdown: 3 })
                                                }
                                                className="border-white/20 text-white hover:bg-white/10"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setAutoPlay({ show: false, countdown: 3 });
                                                    play(nextVideo);
                                                }}
                                            >
                                                Play Now
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ============ FULL-MODE CONTENT (below video) ============ */}
                        {!isMinimized && (
                            <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
                                {/* Title bar */}
                                <div className="px-4 py-3 border-b shrink-0">
                                    <h2 className="text-base font-semibold text-foreground line-clamp-2 leading-tight">
                                        {activeVideo.title}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <Badge variant="secondary" className="text-[10px]">
                                            {activeVideo.category}
                                        </Badge>
                                        {activeVideo.duration && (
                                            <span className="text-xs text-muted-foreground tabular-nums">
                                                {activeVideo.duration}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Related videos – same category */}
                                <div className="flex-1 overflow-y-auto overscroll-contain">
                                    <h3 className="text-sm font-semibold px-4 pt-3 pb-2 text-muted-foreground sticky top-0 bg-background z-10">
                                        Up Next · {activeVideo.category}
                                    </h3>
                                    <div className="px-4 pb-6 space-y-2">
                                        {relatedVideos.map((v) => (
                                            <div
                                                key={v.slug}
                                                className="flex gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors active:scale-[0.98]"
                                                onClick={() => play(v)}
                                            >
                                                <img
                                                    src={v.thumbnailUrl}
                                                    alt={v.title}
                                                    className="w-28 h-16 object-cover rounded-md shrink-0 bg-muted"
                                                    loading="lazy"
                                                />
                                                <div className="min-w-0 flex flex-col justify-center">
                                                    <h4 className="text-sm font-medium line-clamp-2 leading-tight">
                                                        {v.title}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {v.duration}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {relatedVideos.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-8">
                                                No more videos in this category
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ============ MINI-PLAYER CONTENT ============ */}
                        {isMinimized && (
                            <div className="flex-1 flex items-center gap-2 px-3 min-w-0 bg-zinc-900">
                                <p className="flex-1 text-sm font-medium text-white truncate">
                                    {activeVideo.title}
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        togglePlay();
                                    }}
                                    className="shrink-0 p-1.5 text-white hover:bg-white/10 rounded-full transition-colors"
                                >
                                    {isPlaying ? (
                                        <Pause className="h-5 w-5" />
                                    ) : (
                                        <Play className="h-5 w-5 ml-0.5" />
                                    )}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        close();
                                    }}
                                    className="shrink-0 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

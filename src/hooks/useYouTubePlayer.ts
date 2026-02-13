import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  YouTube IFrame Player API – React hook                            */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: (() => void) | undefined;
    }
}

let apiPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
    if (window.YT?.Player) return Promise.resolve();
    if (apiPromise) return apiPromise;

    apiPromise = new Promise<void>((resolve) => {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            prev?.();
            resolve();
        };
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
    });
    return apiPromise;
}

interface Options {
    videoId: string | null;
    onEnd?: () => void;
}

export function useYouTubePlayer({ videoId, onEnd }: Options) {
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null);
    const onEndRef = useRef(onEnd);
    onEndRef.current = onEnd;

    const [ready, setReady] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const pollRef = useRef<ReturnType<typeof setInterval>>();

    /* ---- create / update player ---- */
    useEffect(() => {
        if (!videoId) {
            setReady(false);
            setPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            return;
        }

        let cancelled = false;

        const init = async () => {
            await loadApi();
            if (cancelled || !containerRef.current) return;

            // If player already exists, just cue a new video
            if (playerRef.current) {
                try {
                    playerRef.current.loadVideoById(videoId);
                    return;
                } catch {
                    /* recreate below */
                }
            }

            // Create a fresh div (YT replaces the element)
            const el = document.createElement("div");
            containerRef.current.innerHTML = "";
            containerRef.current.appendChild(el);

            playerRef.current = new window.YT.Player(el, {
                videoId,
                width: "100%",
                height: "100%",
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1,
                    showinfo: 0,
                    iv_load_policy: 3,
                    fs: 0,
                    disablekb: 1,
                },
                events: {
                    onReady: (e: any) => {
                        if (cancelled) return;
                        setReady(true);
                        setDuration(e.target.getDuration?.() ?? 0);
                        e.target.playVideo();
                    },
                    onStateChange: (e: any) => {
                        if (cancelled) return;
                        const st = e.data;
                        setPlaying(st === window.YT.PlayerState.PLAYING);
                        if (st === window.YT.PlayerState.PLAYING) {
                            setDuration(e.target.getDuration?.() ?? 0);
                        }
                        if (st === window.YT.PlayerState.ENDED) {
                            onEndRef.current?.();
                        }
                    },
                },
            });
        };

        init();
        return () => {
            cancelled = true;
        };
    }, [videoId]);

    /* ---- poll current time ---- */
    useEffect(() => {
        clearInterval(pollRef.current);
        if (ready && playing && playerRef.current) {
            pollRef.current = setInterval(() => {
                try {
                    setCurrentTime(playerRef.current.getCurrentTime?.() ?? 0);
                } catch {
                    /* ignore */
                }
            }, 250);
        }
        return () => clearInterval(pollRef.current);
    }, [ready, playing]);

    /* ---- cleanup ---- */
    useEffect(() => {
        return () => {
            clearInterval(pollRef.current);
            try {
                playerRef.current?.destroy();
            } catch {
                /* ignore */
            }
            playerRef.current = null;
        };
    }, []);

    /* ---- controls ---- */
    const playVideo = useCallback(() => playerRef.current?.playVideo(), []);
    const pauseVideo = useCallback(() => playerRef.current?.pauseVideo(), []);
    const togglePlay = useCallback(() => {
        if (playing) pauseVideo();
        else playVideo();
    }, [playing, playVideo, pauseVideo]);

    const seekTo = useCallback(
        (t: number) => {
            playerRef.current?.seekTo(t, true);
            setCurrentTime(t);
        },
        []
    );

    return {
        containerRef,
        ready,
        playing,
        currentTime,
        duration,
        playVideo,
        pauseVideo,
        togglePlay,
        seekTo,
    };
}

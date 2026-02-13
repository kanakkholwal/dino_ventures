import { getVideoBySlug } from "@/lib/data";
import { usePlayerStore } from "@/lib/store";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

/**
 * Route: /watch/:slug
 *
 * When a user navigates directly to this URL (e.g. refresh, shared link),
 * this page looks up the video and opens it in the player overlay.
 * The Home feed is still rendered underneath via the Layout.
 */
export default function Watch() {
    const { slug } = useParams<{ slug: string }>();
    const { play, activeVideo } = usePlayerStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!slug) return;

        // If the player is already showing this video, nothing to do
        if (activeVideo?.slug === slug) return;

        const video = getVideoBySlug(slug);
        if (video) {
            play(video);
        } else {
            // Video not found — redirect home
            navigate("/", { replace: true });
        }
    }, [slug, activeVideo?.slug, play, navigate]);

    // This page doesn't render its own UI — the PlayerOverlay handles everything.
    // We just return null so the Home feed (from the Layout Outlet) stays visible.
    return null;
}

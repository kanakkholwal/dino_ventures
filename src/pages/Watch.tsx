import { getVideoBySlug } from "@/lib/data";
import { usePlayerStore } from "@/lib/store";
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Home from "./Home";



export default function Watch() {
    const { slug } = useParams<{ slug: string }>();
    const { play, activeVideo, close } = usePlayerStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!location.pathname.startsWith("/watch/") && activeVideo) {
            close();
        }
        if (!slug) return;

        if (activeVideo?.slug === slug) return;

        const video = getVideoBySlug(slug);
        if (video) {
            play(video);
        } else {
            navigate("/", { replace: true });
        }
    }, [slug, activeVideo?.slug, play, navigate, location.pathname]);

    return <Home />;
}

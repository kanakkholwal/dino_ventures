import { PlayerOverlay } from "@/components/player/PlayerOverlay"
import { usePlayerStore } from "@/lib/store"
import { Outlet, useNavigate } from "react-router-dom"

export default function Layout() {
    const { activeVideo, close } = usePlayerStore()
    const navigate = useNavigate()

    const handleLogoClick = () => {
        close()
        navigate("/")
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <div className="mr-4 flex">
                        <button
                            onClick={handleLogoClick}
                            className="text-xl font-bold font-mono tracking-tight hover:opacity-80 transition-opacity"
                        >
                            DinoTV
                        </button>
                    </div>
                
                </div>
            </header>

            <main className={`flex-1 ${activeVideo ? 'pb-24' : ''}`}>
                <Outlet />
            </main>

            <PlayerOverlay />
        </div>
    )
}

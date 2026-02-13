import { Route, Routes } from "react-router-dom"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import Watch from "./pages/Watch"

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="watch/:slug" element={<><Home /><Watch /></>} />
            </Route>
        </Routes>
    )
}

export default App

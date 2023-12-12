import { BrowserRouter as Router, Route, Routes } from "react-router-dom";


import Header from "./components/layout/Header/Header";
import Home from "./components/pages/Home/Home";
import About from "./components/pages/About/About";
import Test from "./components/pages/Test/Test";

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </Router>
  )
}
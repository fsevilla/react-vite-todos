import { Provider } from "react-redux";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { store } from "./store/api-store";

import Header from "./components/layout/Header/Header";
import Home from "./components/pages/Home/Home";
import About from "./components/pages/About/About";

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Router>
    </Provider>
  )
}
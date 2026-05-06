import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PolicyImpact from "./pages/PolicyImpact";
import Schemes from "./pages/Schemes";
import Posters from "./pages/Posters";
import Transparency from "./pages/Transparency";
import { LanguageProvider } from "./context/LanguageContext";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/policy-impact" element={<PolicyImpact />} />
          <Route path="/schemes" element={<Schemes />} />
          <Route path="/posters" element={<Posters />} />
          <Route path="/transparency" element={<Transparency />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;

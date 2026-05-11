import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from '../Home';
import SellPage from '../Sell';
import ProductDetail from '../ProductDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        {/* Navbar */}
        <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-orange-500 tracking-tight italic">MarketX</Link>
            <div className="flex gap-4">
              <Link 
                to="/sell" 
                className="bg-orange-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-orange-600 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                + Đăng tin bán
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="min-h-[calc(100vh-160px)]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sell" element={<SellPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t py-8 text-center text-gray-500 text-sm">
          <p>© 2024 MarketX - Nền tảng mua bán đồ cũ mượt mà</p>
        </footer>
      </div>
    </Router>
  );
}

export default App

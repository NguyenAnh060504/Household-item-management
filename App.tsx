import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import SellPage from './Sell';
import ProductDetail from './ProductDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Simple Navbar */}
        <nav className="bg-white border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-orange-500">MarketX</Link>
            <div className="flex gap-4">
              <Link 
                to="/sell" 
                className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                + Đăng tin
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sell" element={<SellPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-20 py-8 text-center text-gray-400 text-sm">
          © 2024 MarketX - Chợ đồ cũ của bạn
        </footer>
      </div>
    </Router>
  );
}

export default App;
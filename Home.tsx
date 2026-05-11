import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { Product } from './database';
import ProductCard from './ProductCard';

const CATEGORIES = ['Tất cả', 'Điện tử', 'Thời trang', 'Nhà bếp', 'Sách', 'Khác'];
const PAGE_SIZE = 12;

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters & Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearch, setDisplaySearch] = useState(''); // Cho debounce
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 1. Debounce Search: Đợi 300ms sau khi dừng gõ mới thực hiện search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(displaySearch);
      setPage(0); // Reset về trang đầu khi search
    }, 300);
    return () => clearTimeout(timer);
  }, [displaySearch]);

  // 2. Fetch Data Logic
  const fetchProducts = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('products')
        .select('*, seller:users(name, avatar_url)', { count: 'exact' })
        .eq('status', 'available') // Chỉ lấy hàng đang bán
        .order('created_at', { ascending: false })
        .range(from, to);

      if (selectedCategory !== 'Tất cả') {
        query = query.eq('category', selectedCategory);
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      const newProducts = data as Product[] || [];
      setProducts(prev => isLoadMore ? [...prev, ...newProducts] : newProducts);
      setHasMore(count ? (from + newProducts.length) < count : false);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, selectedCategory, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // UI Helper: Loading Skeleton
  const SkeletonGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
      {[...Array(PAGE_SIZE)].map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 h-72">
          <div className="bg-gray-200 aspect-square rounded-t-xl" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <div className="max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={displaySearch}
            onChange={(e) => setDisplaySearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setPage(0); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg text-center">
          {error} <button onClick={() => fetchProducts()} className="underline font-bold">Thử lại</button>
        </div>
      )}
      
      {loading && page === 0 ? (
        <SkeletonGrid />
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                price={product.price}
                images={product.images}
                condition={mapCondition(product.condition)}
                created_at={product.created_at}
                seller={{
                  name: product.seller?.name || null,
                  avatar_url: product.seller?.avatar_url || null,
                }}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={loadingMore}
                className="px-8 py-2 bg-white border border-orange-500 text-orange-500 rounded-lg font-semibold hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Đang tải...' : 'Xem thêm'}
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-700">Không tìm thấy sản phẩm nào</h2>
          <p className="text-gray-500">Hãy thử đổi từ khóa hoặc danh mục khác nhé!</p>
        </div>
      )}
    </div>
  );
};

// Helper map condition (Giữ nguyên logic từ file cũ của bạn)
const mapCondition = (cond: string): 'new' | 'like_new' | 'good' | 'fair' => {
  switch (cond) {
    case 'new': return 'new';
    case 'used_like_new': return 'like_new';
    case 'used': return 'good';
    default: return 'fair';
  }
};

export default Home;
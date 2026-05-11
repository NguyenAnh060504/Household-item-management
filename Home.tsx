import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';
import ProductCard from './ProductCard';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Lấy danh sách sản phẩm mới nhất, kèm theo thông tin người bán
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*, seller:users(name, avatar_url)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Helper để map condition từ DB sang props của ProductCard
  const mapCondition = (cond: string): 'new' | 'like_new' | 'good' | 'fair' => {
    switch (cond) {
      case 'new':
        return 'new';
      case 'used_like_new':
        return 'like_new';
      case 'used':
        return 'good';
      default:
        return 'fair';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
        {error}
        <button onClick={fetchProducts} className="ml-2 underline font-bold">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Tin đăng mới nhất</h1>
      
      {/* Responsive Grid: Mobile 2 cột, Desktop 3-4-5 cột tùy màn hình */}
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
    </div>
  );
};

export default Home;
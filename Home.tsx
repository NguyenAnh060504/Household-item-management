import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              <img 
                src={product.images[0] || 'https://via.placeholder.com/300'} 
                alt={product.title}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-3">
              <h3 className="text-sm text-gray-700 line-clamp-2 h-10 mb-2 font-medium">
                {product.title}
              </h3>
              <p className="text-red-600 font-bold">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
              </p>
              <p className="text-xs text-gray-400 mt-2">{new Date(product.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
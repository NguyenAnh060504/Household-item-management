import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './supabase';
import { Product } from './database';
import ChatBox from './ChatBox';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*, seller:users(name, avatar_url)')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        setProduct(data);
      } catch (err: any) {
        setError(err.message || 'Không tìm thấy sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-500 text-xl">Đang tải sản phẩm...</div>;
  if (error || !product) return <div className="p-20 text-center text-red-500">{error || 'Sản phẩm không tồn tại'}</div>;

  const conditionLabels = {
    new: 'Mới',
    used_like_new: 'Như mới',
    used: 'Tốt',
    fair: 'Khá',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Hình ảnh và Nội dung */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-2">
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
              <img 
                src={product.images[0]} 
                alt={product.title} 
                className="w-full h-full object-contain"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-2 p-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <img key={i} src={img} className="w-20 h-20 object-cover rounded-lg border hover:border-orange-500 cursor-pointer" alt="" />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
            <p className="text-2xl font-black text-red-600 mb-6">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
            </p>
            
            <div className="flex items-center gap-4 mb-6 py-4 border-y border-gray-50">
              <span className="text-gray-500 text-sm">Tình trạng:</span>
              <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-bold">
                {conditionLabels[product.condition]}
              </span>
              <span className="text-gray-500 text-sm ml-auto">
                Đăng lúc: {new Date(product.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>

            <div className="prose max-w-none text-gray-700">
              <h3 className="text-lg font-bold mb-2">Mô tả chi tiết</h3>
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>
          </div>
        </div>

        {/* Cột phải: Thông tin người bán & Chat */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={product.seller?.avatar_url || `https://ui-avatars.com/api/?name=${product.seller?.name}`} 
                className="w-14 h-14 rounded-full object-cover shadow-inner"
                alt=""
              />
              <div>
                <h3 className="font-bold text-gray-900">{product.seller?.name || 'Người dùng MarketX'}</h3>
                <p className="text-green-500 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Đang hoạt động
                </p>
              </div>
            </div>
            
            <ChatBox productId={product.id} sellerId={product.seller_id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
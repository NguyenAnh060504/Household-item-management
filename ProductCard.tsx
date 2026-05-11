import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  images: string[];
  seller: {
    name: string | null;
    avatar_url: string | null;
  };
  condition: 'new' | 'like_new' | 'good' | 'fair';
  created_at: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  price,
  images,
  seller,
  condition,
  created_at,
}) => {
  const navigate = useNavigate();

  // Định nghĩa màu sắc và nhãn cho từng tình trạng sản phẩm
  const conditionMap = {
    new: { label: 'Mới', classes: 'bg-green-100 text-green-700' },
    like_new: { label: 'Như mới', classes: 'bg-teal-100 text-teal-700' },
    good: { label: 'Tốt', classes: 'bg-yellow-100 text-yellow-700' },
    fair: { label: 'Khá', classes: 'bg-gray-100 text-gray-700' },
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount).replace(/\s/g, ''); // Xóa khoảng trắng để khớp "150.000₫"
  };

  return (
    <div 
      onClick={() => navigate(`/product/${id}`)}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Ảnh sản phẩm với tỉ lệ 1:1 */}
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <img
          src={images[0] || 'https://via.placeholder.com/400'}
          alt={title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        {/* Badge tình trạng */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${conditionMap[condition].classes}`}>
          {conditionMap[condition].label}
        </div>
      </div>

      {/* Thông tin sản phẩm */}
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-sm text-gray-800 line-clamp-2 mb-1 font-medium group-hover:text-orange-600 transition-colors">
          {title}
        </h3>
        <p className="text-base font-bold text-red-600">
          {formatPrice(price)}
        </p>
        
        {/* Thông tin người bán & Thời gian ở dưới cùng */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
          <div className="flex items-center gap-1.5 min-w-0">
            <img src={seller.avatar_url || `https://ui-avatars.com/api/?name=${seller.name}`} alt={seller.name || 'User'} className="w-5 h-5 rounded-full object-cover shrink-0" />
            <span className="text-[11px] text-gray-500 truncate">{seller.name || 'Người dùng'}</span>
          </div>
          <span className="text-[10px] text-gray-400 shrink-0">{new Date(created_at).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
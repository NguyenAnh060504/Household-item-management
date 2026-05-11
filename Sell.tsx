import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { useAuthStore } from './useAuthStore';
import { Product } from './database'; 

// --- Constants ---
const CATEGORIES = ['Điện tử', 'Thời trang', 'Nhà bếp', 'Sách', 'Khác'];
const CONDITIONS = [
  { label: 'Mới', value: 'new' },
  { label: 'Như mới', value: 'used_like_new' },
  { label: 'Tốt', value: 'used' },
  { label: 'Khá', value: 'fair' },
];
const MAX_IMAGES = 5;
const MAX_DESCRIPTION_LENGTH = 500;

// --- Type cho ảnh hiển thị (preview) ---
interface ImagePreview {
  file: File;
  url: string;
}

const SellPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // Lấy thông tin user từ Auth Store
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Form State ---
  const [title, setTitle] = useState<string>('');
  const [price, setPrice] = useState<string>(''); // Dùng string để dễ dàng format input
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [condition, setCondition] = useState<Product['condition']>(CONDITIONS[0].value as Product['condition']);
  const [description, setDescription] = useState<string>('');
  const [images, setImages] = useState<ImagePreview[]>([]);

  // --- UI State ---
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // --- Handlers ---

  // Xử lý chọn ảnh
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const currentImageCount = images.length;

      if (currentImageCount + newFiles.length > MAX_IMAGES) {
        setError(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh.`);
        return;
      }

      const newImagePreviews: ImagePreview[] = newFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file), // Tạo URL tạm thời để preview
      }));

      setImages((prev) => [...prev, ...newImagePreviews]);
      setError(null); // Clear previous image-related error
    }
  };

  // Xóa ảnh khỏi danh sách preview
  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].url); // Giải phóng URL preview
      newImages.splice(index, 1);
      return newImages;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input file để có thể chọn lại ảnh đã xóa
    }
    setFormErrors(prev => ({ ...prev, images: '' })); // Clear image error if any
  };

  // Xử lý khi submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormErrors({});

    if (!user) {
      setError('Bạn cần đăng nhập để đăng bán sản phẩm.');
      return;
    }

    // Client-side Validation
    const errors: { [key: string]: string } = {};
    if (!title.trim()) errors.title = 'Tiêu đề không được để trống.';
    if (title.length > 100) errors.title = 'Tiêu đề không quá 100 ký tự.';
    if (!price || parseFloat(price) <= 0) errors.price = 'Giá không hợp lệ.';
    if (!category) errors.category = 'Vui lòng chọn danh mục.';
    if (!condition) errors.condition = 'Vui lòng chọn tình trạng.';
    if (description.length > MAX_DESCRIPTION_LENGTH) errors.description = `Mô tả không quá ${MAX_DESCRIPTION_LENGTH} ký tự.`;
    if (images.length === 0) errors.images = 'Vui lòng tải lên ít nhất 1 ảnh.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // --- 1. Upload Images to Supabase Storage ---
      const imageUrls: string[] = [];
      for (const image of images) {
        const fileExt = image.file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`; // Path: user_id/timestamp.ext

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, image.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Lấy public URL của ảnh
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        
        if (publicUrlData) {
          imageUrls.push(publicUrlData.publicUrl);
        }
      }

      // --- 2. Insert Product Data into Supabase Database ---
      const { data: insertedProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          title,
          price: parseFloat(price),
          category,
          condition,
          description: description || null,
          images: imageUrls,
          seller_id: user.id,
          status: 'available', // Mặc định là 'available' khi mới đăng
        })
        .select('id') // Chỉ select ID của sản phẩm mới để redirect
        .single();

      if (insertError) throw insertError;

      // --- Thành công: Redirect và Toast ---
      alert('Đăng bán thành công!'); // Sử dụng alert tạm thời, nên thay bằng toast UI
      if (insertedProduct) navigate(`/product/${insertedProduct.id}`);
    } catch (err: any) {
      console.error('Lỗi khi đăng bán:', err);
      setError(err.message || 'Đã có lỗi xảy ra khi đăng bán sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  // Format giá khi nhập
  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const rawValue = value.replace(/\D/g, ''); // Chỉ giữ lại số
    setPrice(rawValue);
  };

  // Hiển thị giá đã format
  const displayFormattedPrice = (value: string) => {
    if (!value) return '';
    return new Intl.NumberFormat('vi-VN').format(parseFloat(value));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Đăng tin bán đồ cũ</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Tiêu đề tin đăng *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-orange-500"
            placeholder="Ví dụ: iPhone 13 Pro Max 256GB..."
          />
          {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium mb-1">Giá bán (VNĐ) *</label>
          <input
            type="text"
            value={displayFormattedPrice(price)}
            onChange={handlePriceChange}
            className="w-full border rounded-lg p-2"
            placeholder="Nhập giá bán"
          />
          {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Danh mục</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium mb-1">Tình trạng</label>
            <select 
              value={condition} 
              onChange={(e) => setCondition(e.target.value as any)}
              className="w-full border rounded-lg p-2"
            >
              {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium mb-1">Hình ảnh (Tối đa 5) *</label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, index) => (
              <div key={index} className="relative w-20 h-20">
                <img src={img.url} className="w-full h-full object-cover rounded-lg" alt="" />
                <button 
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                >✕</button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 hover:border-orange-500"
              >
                +
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={handleImageChange} />
          {formErrors.images && <p className="text-red-500 text-xs mt-1">{formErrors.images}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả chi tiết</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border rounded-lg p-2"
            placeholder="Mô tả kỹ về tình trạng, phụ kiện kèm theo..."
          />
          <p className="text-right text-xs text-gray-400">
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </p>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Đang xử lý...' : 'ĐĂNG TIN NGAY'}
        </button>
      </form>
    </div>
  );
};

export default SellPage;
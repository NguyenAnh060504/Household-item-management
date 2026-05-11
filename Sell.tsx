import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Product } from '../types/database'; // Import Product type if needed, or just define inline

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
      const { data, error: insertError } = await supabase
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
      navigate(`/product/${data.id}`);
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
    <div className="container mx-auto px-4 py-
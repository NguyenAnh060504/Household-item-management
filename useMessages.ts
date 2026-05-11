import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuthStore } from './useAuthStore';
import { Message } from './database';

export const useMessages = (productId: string, otherUserId: string) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch lịch sử chat
  const fetchMessages = useCallback(async () => {
    if (!user || !productId || !otherUserId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Lấy các tin nhắn mà (mình gửi cho họ) HOẶC (họ gửi cho mình) thuộc sản phẩm này
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('product_id', productId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Lỗi khi tải tin nhắn:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, otherUserId, user]);

  useEffect(() => {
    fetchMessages();

    if (!user || !productId) {
      return;
    }

    // Subscribe Realtime: Lắng nghe mọi tin nhắn mới của sản phẩm này
    const channel = supabase
      .channel(`chat:${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Chỉ thêm vào state nếu tin nhắn đó thuộc về cuộc hội thoại này
          const isRelevant = 
            (newMessage.sender_id === user.id && newMessage.receiver_id === otherUserId) ||
            (newMessage.sender_id === otherUserId && newMessage.receiver_id === user.id);
          
          if (isRelevant) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, otherUserId, user, fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error: sendError } = await supabase.from('messages').insert({
        product_id: productId,
        sender_id: user.id,
        receiver_id: otherUserId,
        content: content.trim(),
      });
      if (sendError) throw sendError;
    } catch (err) {
      console.error('Lỗi khi gửi tin nhắn:', err);
      throw err; // Ném lỗi để ChatBox xử lý (alert hoặc set lại input)
    }
  };

  return { messages, sendMessage, loading };
};
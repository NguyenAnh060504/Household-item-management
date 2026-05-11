import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from './useAuthStore';
import { useMessages } from './useMessages';

interface ChatBoxProps {
  productId: string;
  sellerId: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ productId, sellerId }) => {
  const { user } = useAuthStore();
  const { messages, sendMessage, loading } = useMessages(productId, sellerId);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const text = input;
    setInput(''); // Clear input ngay để UX mượt
    try {
      await sendMessage(text);
    } catch (err) {
      alert('Không thể gửi tin nhắn');
      setInput(text);
    }
  };

  // Helper format thời gian theo yêu cầu
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSecs < 60) return 'Vừa xong';
    if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)} phút trước`;
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    
    return date.toLocaleDateString('vi-VN');
  };

  if (!user) {
    return (
      <div className="border rounded-xl p-8 text-center bg-gray-50">
        <p className="text-gray-600 mb-4">Bạn cần đăng nhập để trao đổi với người bán</p>
        <button className="bg-orange-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors">
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">
        Chat với người bán
      </div>

      {/* Tin nhắn */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {loading ? (
          <div className="text-center text-gray-400 text-sm mt-10">Đang tải lịch sử...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-10">Hãy gửi tin nhắn để bắt đầu trao đổi</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  isMe ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 uppercase">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-orange-500 text-sm"
        />
        <button type="submit" className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
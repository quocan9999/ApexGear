import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 mins
  
  // Fetch QR Data
  useEffect(() => {
    fetch(`/api/payments/qr/${orderId}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setQrData(res.data);
          const expires = new Date(res.data.expiresAt).getTime();
          const now = new Date().getTime();
          setTimeLeft(Math.max(0, Math.floor((expires - now) / 1000)));
        }
      });
  }, [orderId]);

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // SSE Connection
  useEffect(() => {
    const eventSource = new EventSource(`/api/payments/stream/${orderId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.success) {
        eventSource.close();
        // Redirect to success page or orders depending on the app flow.
        // We will match the existing route: /checkout/success/:orderId
        navigate(`/checkout/success/${orderId}`);
      }
    };

    return () => eventSource.close();
  }, [orderId, navigate]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!qrData) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 mt-10 border rounded shadow-sm bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Thanh toán Đơn hàng</h2>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Order Info */}
        <div className="flex-1 border-r pr-8">
          <h3 className="text-xl font-semibold mb-4">Chi tiết thanh toán</h3>
          <p>Mã đơn hàng: <span className="font-bold">{qrData.orderNumber}</span></p>
          <p className="mt-2">Số tiền: <span className="text-red-500 font-bold text-lg">{qrData.amount.toLocaleString()}đ</span></p>
          <p className="mt-2">Số tài khoản: <strong>{qrData.bankAccount}</strong></p>
          <p className="mt-2">Nội dung chuyển khoản: <strong>{qrData.content}</strong></p>
        </div>
        
        {/* Right: QR Code & Timer */}
        <div className="flex-1 text-center flex flex-col items-center">
          <div className="p-4 bg-gray-50 border rounded-lg mb-4">
             {/* Note: We use VietQR api to generate image for simplicity */}
             <img src={`https://img.vietqr.io/image/970422-${qrData.bankAccount}-compact2.png?amount=${qrData.amount}&addInfo=${qrData.content}`} alt="QR Code" className="w-48 h-48" />
          </div>
          <p className="text-gray-600 mb-2">Vui lòng quét mã QR qua ứng dụng ngân hàng.</p>
          
          {timeLeft > 0 ? (
            <div className="text-red-500 font-bold text-xl">
              Chờ thanh toán ({formatTime(timeLeft)})
            </div>
          ) : (
            <div className="text-red-500 font-bold text-xl">
              Đơn hàng đã hết hạn thanh toán
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

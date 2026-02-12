interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string; [key: string]: unknown }) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface Window {
  Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
}

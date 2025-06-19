import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Mail, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ReceiptProps {
  order: any;
  onClose: () => void;
}

export function Receipt({ order, onClose }: ReceiptProps) {
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    // In a real application, this would open an email dialog or send the receipt
    alert("Email functionality would be implemented here");
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle>Receipt</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Receipt Content */}
        <div className="overflow-y-auto flex-1 py-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {settings?.storeName || "Sweet Dreams Bakery"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {settings?.address || "123 Baker Street, New York, NY 10001"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {settings?.phone || "(555) 123-4567"}
            </p>
          </div>
          
          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 my-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Order #:</span>
              <span className="font-mono">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Date:</span>
              <span>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Customer:</span>
              <span>{order.customerName || order.customer?.name || "Walk-in Customer"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Payment:</span>
              <span className="capitalize">{order.paymentMethod || "Cash"}</span>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            {order.items?.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <div>
                  <span>{item.productName}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">x {item.quantity}</span>
                </div>
                <span>{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax ({((parseFloat(order.taxAmount) / parseFloat(order.subtotal)) * 100).toFixed(1)}%):</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
              <span>Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
          
          <div className="text-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Thank you for your visit!</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Visit us again soon</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex space-x-3">
          <Button onClick={handlePrint} className="flex-1 bakery-gradient hover:opacity-90">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleEmail} className="flex-1">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

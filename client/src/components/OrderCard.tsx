import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, CheckCircle, Printer, MoreVertical } from "lucide-react";
import { useState } from "react";

interface OrderCardProps {
  order: any;
  onStatusUpdate?: (orderId: number, status: string) => void;
  onView?: (order: any) => void;
  userRole?: string;
}

export function OrderCard({ order, onStatusUpdate, onView, userRole }: OrderCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'processing':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 'placed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  const hasAccess = (roles: string[]) => {
    return userRole && roles.includes(userRole);
  };

  const handlePrint = async () => {
    // QZ Tray printing implementation
    try {
      if (typeof window !== 'undefined' && (window as any).qz) {
        const qz = (window as any).qz;
        
        if (!qz.websocket.isActive()) {
          await qz.websocket.connect();
        }

        const printers = await qz.printers.find();
        const defaultPrinter = printers.length > 0 ? printers[0] : null;

        if (defaultPrinter) {
          const config = qz.configs.create(defaultPrinter);
          
          const receiptData = [
            '^XA',
            '^FO50,50^A0N,50,50^FDBakery Receipt^FS',
            `^FO50,120^A0N,30,30^FDOrder: ${order.orderNumber || order.id}^FS`,
            `^FO50,160^A0N,25,25^FDDate: ${new Date(order.createdAt).toLocaleDateString()}^FS`,
            `^FO50,200^A0N,25,25^FDCustomer: ${order.customerName || 'Walk-in'}^FS`,
            '^FO50,250^GB400,3,3^FS',
            ...order.items?.map((item: any, index: number) => 
              `^FO50,${290 + (index * 30)}^A0N,20,20^FD${item.productName} x${item.quantity} - ${formatCurrency(item.totalPrice)}^FS`
            ) || [],
            '^FO50,400^GB400,3,3^FS',
            `^FO50,430^A0N,30,30^FDTotal: ${formatCurrency(order.total)}^FS`,
            '^XZ'
          ];

          await qz.print(config, receiptData);
        }
      } else {
        // Fallback to browser print
        window.print();
      }
    } catch (error) {
      console.error('Print error:', error);
      // Fallback to browser print
      window.print();
    }
  };

  const handleBrowserPrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order ${order.orderNumber} - Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .order-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .totals { text-align: right; margin-top: 20px; }
            .total-line { margin: 5px 0; }
            .final-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sweet Dreams Artisan Bakery</h1>
            <p>123 Baker Street, Artisan Quarter, Bakerville, CA 90210</p>
            <p>Phone: (555) 123-CAKE</p>
          </div>
          
          <div class="order-info">
            <h2>Order Details</h2>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Customer:</strong> ${order.customerName || 'Walk-in Customer'}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map((item: any) => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.unitPrice)}</td>
                  <td>${formatCurrency(item.totalPrice)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-line"><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</div>
            <div class="total-line"><strong>Tax (8.5%):</strong> ${formatCurrency(order.taxAmount)}</div>
            <div class="total-line final-total"><strong>Total:</strong> ${formatCurrency(order.total)}</div>
          </div>

          <div style="text-align: center; margin-top: 40px; font-size: 0.9em; color: #666;">
            <p>Thank you for your business!</p>
            <p>Visit us again soon at Sweet Dreams Artisan Bakery</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {order.orderNumber}
              </span>
              <Badge className={getStatusColor(order.status)} variant="secondary">
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Customer:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {order.customerName || order.customer?.name || "Walk-in Customer"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Items:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {order.items?.length || 0}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total:</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                    <p className="font-semibold">{order.customerName || "Walk-in Customer"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <Badge className={getStatusColor(order.status)} variant="secondary">
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                    <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                    <p className="font-semibold">{order.paymentMethod || "N/A"}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {(order.items || []).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(item.unitPrice)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(item.totalPrice)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2 text-right">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(order.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
          
          {order.status === "processing" && hasAccess(["admin", "staff"]) && (
            <Button 
              size="sm" 
              className="flex-1 bakery-gradient hover:opacity-90"
              onClick={() => onStatusUpdate?.(order.id, "completed")}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Complete
            </Button>
          )}
          
          {order.status === "placed" && hasAccess(["admin", "staff"]) && (
            <Button 
              size="sm" 
              className="flex-1 bakery-gradient hover:opacity-90"
              onClick={() => onStatusUpdate?.(order.id, "processing")}
            >
              Accept
            </Button>
          )}
          
          {order.status === "completed" && (
            <Button variant="outline" size="sm" className="flex-1 text-green-600 border-green-200 hover:bg-green-50">
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

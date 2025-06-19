import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ProductCard } from "@/components/ProductCard";
import { Receipt } from "@/components/Receipt";
import { 
  Search, 
  Minus, 
  Plus,
  CreditCard,
  DollarSign,
  Pause,
  CheckCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  total: number;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: async (response) => {
      const order = await response.json();
      setLastOrder(order);
      setPaymentDetails({
        method: order.paymentMethod,
        total: order.total,
        orderNumber: order.orderNumber,
        customer: order.customerName || 'Walk-in Customer'
      });
      setShowPaymentSuccess(true);
      
      // Show success for 3 seconds, then show receipt
      setTimeout(() => {
        setShowPaymentSuccess(false);
        setShowReceipt(true);
      }, 3000);
      
      setCart([]);
      setCustomerInfo("");
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const taxRate = 0.085; // 8.5%

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const filteredProducts = (products && Array.isArray(products) ? products : []).filter((product: any) => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      product.categoryId === parseInt(selectedCategory);
    
    return matchesSearch && matchesCategory && product.isActive && product.stock > 0;
  });

  const addToCart = (product: any) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { 
                ...item, 
                quantity: item.quantity + 1, 
                total: (item.quantity + 1) * parseFloat(item.price) 
              }
            : item
        );
      } else {
        return [...prev, {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          total: parseFloat(product.price),
        }];
      }
    });
  };

  const updateQuantity = (id: number, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + change);
          if (newQuantity === 0) {
            return null;
          }
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * parseFloat(item.price),
          };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const processPayment = async (paymentMethod: "cash" | "card") => {
    if (cart.length === 0) return;

    const orderItems = cart.map(item => ({
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.total.toString(),
    }));

    const orderData = {
      customerName: customerInfo || null,
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      total: total.toString(),
      paymentMethod,
      paymentStatus: "paid",
      status: "completed",
      items: orderItems,
    };

    createOrderMutation.mutate(orderData, {
      onSuccess: (data) => {
        // Clear cart and show success feedback
        setCart([]);
        setCustomerInfo("");
        setPaymentMethod("cash");
        
        // Show success toast with order details
        toast({
          title: "Payment Successful!",
          description: `Order completed successfully. Total: ${formatCurrency(total)}`,
          duration: 5000,
        });
      },
      onError: (error) => {
        toast({
          title: "Payment Failed",
          description: "There was an error processing the payment. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Point of Sale</h1>
              <p className="text-gray-600 dark:text-gray-400">Select products to add to cart</p>
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
          
          {/* Categories */}
          <div className="flex space-x-2 overflow-x-auto">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? "bakery-gradient text-white" : ""}
            >
              All
            </Button>
            {(categories && Array.isArray(categories) ? categories : []).map((category: any) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id.toString())}
                className={`whitespace-nowrap ${
                  selectedCategory === category.id.toString() ? "bakery-gradient text-white" : ""
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {productsLoading ? (
              [...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-300 dark:bg-gray-600" />
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded" />
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16" />
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              filteredProducts.map((product: any) => (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
                  onClick={() => addToCart(product)}
                >
                  {product.imageUrl && (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-t-lg"
                    />
                  )}
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(parseFloat(product.price))}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {product.stock} in stock
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        
        {/* Cart & Checkout */}
        <Card className="h-fit">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle>Current Order</CardTitle>
          </CardHeader>
          
          {/* Cart Items */}
          <CardContent className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(parseFloat(item.price))} each
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white w-16 text-right">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
          
          {cart.length > 0 && (
            <>
              {/* Order Summary */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax (8.5%):</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-orange-600 dark:text-orange-400">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Customer Info */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <Label htmlFor="customer" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer (Optional)
                </Label>
                <Input
                  id="customer"
                  placeholder="Customer name or phone..."
                  value={customerInfo}
                  onChange={(e) => setCustomerInfo(e.target.value)}
                />
              </div>
              
              {/* Payment Buttons */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <Button 
                  onClick={() => processPayment("cash")}
                  disabled={createOrderMutation.isPending}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Cash Payment
                </Button>
                <Button 
                  onClick={() => processPayment("card")}
                  disabled={createOrderMutation.isPending}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Card Payment
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  disabled={createOrderMutation.isPending}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Hold Order
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
      
      {/* Payment Success Modal */}
      <Dialog open={showPaymentSuccess} onOpenChange={setShowPaymentSuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Payment Successful!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            {paymentDetails && (
              <div className="space-y-2">
                <p className="text-lg font-semibold">Order {paymentDetails.orderNumber}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Customer: {paymentDetails.customer}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment: {paymentDetails.method?.charAt(0).toUpperCase() + paymentDetails.method?.slice(1)}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(paymentDetails.total)}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">Receipt will appear shortly...</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <Receipt 
          order={lastOrder}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}

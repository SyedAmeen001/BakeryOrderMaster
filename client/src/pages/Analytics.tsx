import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  ShoppingCart,
  Calendar,
  Download
} from "lucide-react";

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getOrdersByStatus = () => {
    if (!orders || !Array.isArray(orders)) return {};
    
    return orders.reduce((acc: any, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
  };

  const getRevenueByDate = () => {
    if (!orders || !Array.isArray(orders)) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    }).reverse();
    
    return last7Days.map(date => {
      const dayOrders = orders.filter((order: any) => 
        new Date(order.createdAt).toDateString() === date && order.status === 'completed'
      );
      const revenue = dayOrders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.total), 0
      );
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue,
        orders: dayOrders.length,
      };
    });
  };

  const getTopProducts = () => {
    if (!orders || !Array.isArray(orders)) return [];
    
    const productCounts: { [key: string]: { name: string; count: number; revenue: number } } = {};
    
    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (!productCounts[item.productName]) {
            productCounts[item.productName] = {
              name: item.productName,
              count: 0,
              revenue: 0,
            };
          }
          productCounts[item.productName].count += item.quantity;
          productCounts[item.productName].revenue += parseFloat(item.totalPrice || '0');
        });
      }
    });
    
    return Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getSalesByCategory = () => {
    if (!orders || !Array.isArray(orders)) return [];
    
    const categorySales: { [key: string]: { name: string; revenue: number; orders: number } } = {};
    
    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const category = item.category || 'Uncategorized';
          if (!categorySales[category]) {
            categorySales[category] = {
              name: category,
              revenue: 0,
              orders: 0,
            };
          }
          categorySales[category].revenue += parseFloat(item.totalPrice || '0');
        });
      }
    });

    return Object.values(categorySales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  };

  const ordersByStatus = getOrdersByStatus();
  const revenueData = getRevenueByDate();
  const topProducts = getTopProducts();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your bakery's performance and insights</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Last 7 Days
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? "..." : formatCurrency(stats?.revenue || 0)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +12% from last week
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {orders?.length || 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +8% from last week
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Order</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {orders?.length ? formatCurrency(
                    orders.reduce((sum: number, order: any) => sum + parseFloat(order.total), 0) / orders.length
                  ) : "$0.00"}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +5% from last week
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {ordersByStatus.completed || 0}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +15% from last week
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {revenueData.map((day, index) => {
                const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {formatCurrency(day.revenue)}
                    </div>
                    <div 
                      className="w-full bg-orange-500 rounded-t-sm min-h-[4px]"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {day.date}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(ordersByStatus).map(([status, count]) => {
                const total = Object.values(ordersByStatus).reduce((sum: number, val: any) => sum + val, 0);
                const percentage = total > 0 ? (count as number / total) * 100 : 0;
                
                const statusColors: { [key: string]: string } = {
                  completed: 'bg-green-500',
                  processing: 'bg-orange-500',
                  placed: 'bg-blue-500',
                  cancelled: 'bg-red-500',
                };
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {status}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${statusColors[status] || 'bg-gray-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.count} units sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(product.revenue)}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    Revenue
                  </Badge>
                </div>
              </div>
            ))}
            
            {topProducts.length === 0 && (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No sales data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

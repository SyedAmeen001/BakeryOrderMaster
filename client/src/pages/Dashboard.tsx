import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";
import { 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  Package,
  CreditCard,
  Plus,
  BarChart3,
  ArrowUp,
  RefreshCw,
  Link as LinkIcon
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { isConnected } = useSocket();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentOrders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["/api/dashboard/recent-orders"],
  });

  const handleRefresh = () => {
    refetchStats();
    refetchOrders();
  };

  const hasAccess = (roles: string[]) => {
    return user && roles.includes(user.role);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'processing':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 'placed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening at your bakery today.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Real-time status indicator */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
            isConnected 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={statsLoading || ordersLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(statsLoading || ordersLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? "..." : stats?.todayOrders || 0}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  <ArrowUp className="w-3 h-3 inline mr-1" />
                  +12% from yesterday
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? "..." : formatCurrency(stats?.revenue || 0)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  <ArrowUp className="w-3 h-3 inline mr-1" />
                  +8% from yesterday
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? "..." : stats?.pendingOrders || 0}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Needs attention
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? "..." : stats?.activeProducts || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <Package className="w-3 h-3 inline mr-1" />
                  In inventory
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-4">
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg" />
                        <div>
                          <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
                          <div className="w-24 h-3 bg-gray-300 dark:bg-gray-600 rounded" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
                        <div className="w-20 h-5 bg-gray-300 dark:bg-gray-600 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              recentOrders?.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.customerName || order.customer?.name || "Walk-in Customer"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(parseFloat(order.total))}
                    </p>
                    <Badge className={getStatusColor(order.status)} variant="secondary">
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
            
            {!ordersLoading && (!recentOrders || recentOrders.length === 0) && (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No recent orders</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <CardTitle className="flex items-center">
              <div className="w-8 h-8 bakery-gradient rounded-lg flex items-center justify-center mr-3">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Primary Action - POS */}
              <Link href="/pos" className="col-span-2">
                <Card className="group cursor-pointer overflow-hidden border-2 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200 hover:shadow-lg">
                  <CardContent className="p-6 bakery-gradient text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Open POS Terminal</h3>
                          <p className="text-sm opacity-90">Process sales and payments</p>
                        </div>
                      </div>
                      <ArrowUp className="w-5 h-5 rotate-45 group-hover:rotate-90 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Secondary Actions */}
              {hasAccess(["admin", "staff"]) && (
                <Link href="/orders">
                  <Card className="group cursor-pointer border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 hover:shadow-md">
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-1">New Order</h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Manual entry</p>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {hasAccess(["admin", "staff"]) && (
                <Link href="/products">
                  <Card className="group cursor-pointer border-2 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-all duration-200 hover:shadow-md">
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="font-semibold text-green-700 dark:text-green-300 mb-1">Add Product</h4>
                      <p className="text-xs text-green-600 dark:text-green-400">Manage inventory</p>
                    </CardContent>
                  </Card>
                </Link>
              )}

              <Link href="/analytics">
                <Card className="group cursor-pointer border-2 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 hover:shadow-md">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-1">Analytics</h4>
                    <p className="text-xs text-purple-600 dark:text-purple-400">View reports</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/customers">
                <Card className="group cursor-pointer border-2 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 hover:shadow-md">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <ArrowUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-1">Customers</h4>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Manage accounts</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { OrderCard } from "@/components/OrderCard";
import { 
  Search, 
  Plus,
  Eye,
  CheckCircle,
  Printer
} from "lucide-react";

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { user } = useAuth();
  const { socket } = useSocket();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
    },
  });

  const hasAccess = (roles: string[]) => {
    return user && roles.includes(user.role);
  };

  const filteredOrders = (orders && Array.isArray(orders) ? orders : []).filter((order: any) => {
    const matchesSearch = !searchQuery || 
      (order.orderNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    if (!orders || !Array.isArray(orders)) return { all: 0, placed: 0, processing: 0, completed: 0, cancelled: 0 };
    
    return orders.reduce((acc: any, order: any) => {
      acc.all++;
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, { all: 0, placed: 0, processing: 0, completed: 0, cancelled: 0 });
  };

  const statusCounts = getStatusCounts();

  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    updateOrderMutation.mutate({ id: orderId, status: newStatus });
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track all customer orders</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          {hasAccess(["admin", "staff"]) && (
            <Button className="bakery-gradient hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          )}
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-fit">
        {[
          { key: "all", label: "All Orders", count: statusCounts.all },
          { key: "placed", label: "Placed", count: statusCounts.placed },
          { key: "processing", label: "Processing", count: statusCounts.processing },
          { key: "completed", label: "Completed", count: statusCounts.completed },
          { key: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              statusFilter === filter.key
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>
      
      {/* Orders Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20" />
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32" />
                    </div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded flex-1" />
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded flex-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order: any) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
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
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  
                  {order.status === "processing" && hasAccess(["admin", "staff"]) && (
                    <Button 
                      size="sm" 
                      className="flex-1 bakery-gradient hover:opacity-90"
                      onClick={() => handleStatusUpdate(order.id, "completed")}
                      disabled={updateOrderMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  
                  {order.status === "placed" && hasAccess(["admin", "staff"]) && (
                    <Button 
                      size="sm" 
                      className="flex-1 bakery-gradient hover:opacity-90"
                      onClick={() => handleStatusUpdate(order.id, "processing")}
                      disabled={updateOrderMutation.isPending}
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
          ))}
        </div>
      )}
      
      {!isLoading && filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Eye className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? "Try adjusting your search terms." : "No orders match the current filter."}
          </p>
        </div>
      )}
    </div>
  );
}

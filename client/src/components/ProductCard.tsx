import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";

interface ProductCardProps {
  product: any;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" };
    if (stock < 10) return { label: "Low Stock", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300" };
    return { label: "In Stock", color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" };
  };

  const stockStatus = getStockStatus(product.stock);

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
      onClick={onClick}
    >
      <div className="relative">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-32 object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-t-lg flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        <Badge className={`absolute top-2 right-2 ${stockStatus.color}`} variant="secondary">
          {stockStatus.label}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
          {product.name}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {product.description || "No description"}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(product.price)}
          </span>
          <Badge variant="outline" className="text-xs">
            {product.stock} in stock
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

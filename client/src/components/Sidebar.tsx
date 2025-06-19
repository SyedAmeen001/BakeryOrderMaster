import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useSocket } from "@/hooks/useSocket";
import { 
  LayoutDashboard, 
  ClipboardList, 
  CreditCard, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Moon,
  Sun,
  Wifi,
  WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "staff", "viewer"] },
  { name: "Orders", href: "/orders", icon: ClipboardList, roles: ["admin", "staff", "viewer"], badge: 12 },
  { name: "Point of Sale", href: "/pos", icon: CreditCard, roles: ["admin", "staff", "viewer"] },
  { name: "Products", href: "/products", icon: Package, roles: ["admin", "staff"] },
  { name: "Customers", href: "/customers", icon: Users, roles: ["admin", "staff", "viewer"] },
  { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["admin", "staff", "viewer"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useSocket();

  const hasAccess = (roles: string[]) => {
    return user && roles.includes(user.role);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bakery-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🥖</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">BakeryOS</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Order Management</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          if (!hasAccess(item.roles)) return null;
          
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <a className={`
                flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800" 
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }
              `}>
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Link>
          );
        })}
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {user && (
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bakery-gradient rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {getInitials(user.firstName, user.lastName)}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user.role}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                <Wifi className="w-4 h-4" />
                <span className="text-xs">Live</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs">Offline</span>
              </div>
            )}
          </div>
          
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          
          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

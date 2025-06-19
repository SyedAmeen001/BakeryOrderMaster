import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Save,
  Building,
  Clock,
  DollarSign,
  Users,
  Plus,
  Edit,
  Trash2,
  Printer,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function Settings() {
  const [storeData, setStoreData] = useState({
    storeName: "",
    address: "",
    phone: "",
    email: "",
    taxRate: "",
    currency: "USD",
  });
  
  const [operatingHours, setOperatingHours] = useState({
    monday: { open: "07:00", close: "18:00", isOpen: true },
    tuesday: { open: "07:00", close: "18:00", isOpen: true },
    wednesday: { open: "07:00", close: "18:00", isOpen: true },
    thursday: { open: "07:00", close: "18:00", isOpen: true },
    friday: { open: "07:00", close: "19:00", isOpen: true },
    saturday: { open: "08:00", close: "19:00", isOpen: true },
    sunday: { open: "08:00", close: "17:00", isOpen: true },
  });
  
  const [paymentMethods, setPaymentMethods] = useState({
    cash: true,
    card: true,
    digital: false,
  });

  const [printerSettings, setPrinterSettings] = useState({
    qzTrayConnected: false,
    selectedPrinter: '',
    availablePrinters: [] as string[],
    autoConnect: true,
  });

  const { user } = useAuth();
  const { toast } = useToast();

  // QZ Tray printer functions
  const checkQZTrayConnection = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).qz) {
        const qz = (window as any).qz;
        if (!qz.websocket.isActive()) {
          await qz.websocket.connect();
        }
        const printers = await qz.printers.find();
        setPrinterSettings(prev => ({
          ...prev,
          qzTrayConnected: true,
          availablePrinters: printers
        }));
        toast({
          title: "QZ Tray Connected",
          description: `Found ${printers.length} printer(s)`,
        });
      } else {
        setPrinterSettings(prev => ({ ...prev, qzTrayConnected: false }));
        toast({
          title: "QZ Tray Not Found",
          description: "Please install and start QZ Tray for printing functionality",
          variant: "destructive",
        });
      }
    } catch (error) {
      setPrinterSettings(prev => ({ ...prev, qzTrayConnected: false }));
      toast({
        title: "Connection Failed",
        description: "Could not connect to QZ Tray",
        variant: "destructive",
      });
    }
  };

  const testPrint = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).qz && printerSettings.selectedPrinter) {
        const qz = (window as any).qz;
        const config = qz.configs.create(printerSettings.selectedPrinter);
        const testData = [
          '^XA',
          '^FO50,50^A0N,50,50^FDTest Print^FS',
          '^FO50,120^A0N,30,30^FDBakery Management System^FS',
          '^FO50,160^A0N,25,25^FDPrinter Configuration Test^FS',
          `^FO50,200^A0N,25,25^FDDate: ${new Date().toLocaleDateString()}^FS`,
          '^XZ'
        ];
        await qz.print(config, testData);
        toast({
          title: "Test Print Sent",
          description: "Check your printer for the test receipt",
        });
      }
    } catch (error) {
      toast({
        title: "Print Failed",
        description: "Could not send test print",
        variant: "destructive",
      });
    }
  };

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    onSuccess: (data) => {
      if (data) {
        setStoreData({
          storeName: data.storeName || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          taxRate: data.taxRate || "",
          currency: data.currency || "USD",
        });
        
        if (data.operatingHours) {
          try {
            const hours = JSON.parse(data.operatingHours);
            setOperatingHours(prev => ({ ...prev, ...hours }));
          } catch (e) {
            console.error("Failed to parse operating hours:", e);
          }
        }
        
        if (data.paymentMethods) {
          try {
            const methods = JSON.parse(data.paymentMethods);
            setPaymentMethods(prev => {
              const newMethods = { ...prev };
              methods.forEach((method: string) => {
                if (method in newMethods) {
                  newMethods[method as keyof typeof newMethods] = true;
                }
              });
              return newMethods;
            });
          } catch (e) {
            console.error("Failed to parse payment methods:", e);
          }
        }
      }
    },
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      return apiRequest("PATCH", "/api/settings", settingsData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    const enabledPaymentMethods = Object.entries(paymentMethods)
      .filter(([_, enabled]) => enabled)
      .map(([method, _]) => method);

    const settingsData = {
      ...storeData,
      operatingHours: JSON.stringify(operatingHours),
      paymentMethods: JSON.stringify(enabledPaymentMethods),
    };

    updateSettingsMutation.mutate(settingsData);
  };

  const updateOperatingHours = (day: string, field: string, value: string | boolean) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const weekDays = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'staff':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'viewer':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-300 dark:bg-gray-600 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your bakery's configuration and preferences</p>
        </div>
        
        <Button 
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
          className="bakery-gradient hover:opacity-90"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      
      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Information */}
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Store Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={storeData.storeName}
                onChange={(e) => setStoreData(prev => ({ ...prev, storeName: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={storeData.address}
                onChange={(e) => setStoreData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={storeData.phone}
                  onChange={(e) => setStoreData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={storeData.email}
                  onChange={(e) => setStoreData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Operating Hours */}
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Operating Hours</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {weekDays.map((day) => {
              const dayData = operatingHours[day.key as keyof typeof operatingHours];
              return (
                <div key={day.key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={dayData.isOpen}
                      onCheckedChange={(checked) => updateOperatingHours(day.key, 'isOpen', checked)}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                      {day.label}
                    </span>
                  </div>
                  
                  {dayData.isOpen ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={dayData.open}
                        onChange={(e) => updateOperatingHours(day.key, 'open', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-gray-500 dark:text-gray-400 text-sm">to</span>
                      <Input
                        type="time"
                        value={dayData.close}
                        onChange={(e) => updateOperatingHours(day.key, 'close', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">Closed</span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
        
        {/* Tax & Payment Settings */}
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Tax & Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.1"
                value={storeData.taxRate}
                onChange={(e) => setStoreData(prev => ({ ...prev, taxRate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={storeData.currency} onValueChange={(value) => setStoreData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Payment Methods
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Cash</span>
                  <Switch
                    checked={paymentMethods.cash}
                    onCheckedChange={(checked) => setPaymentMethods(prev => ({ ...prev, cash: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Credit/Debit Cards</span>
                  <Switch
                    checked={paymentMethods.card}
                    onCheckedChange={(checked) => setPaymentMethods(prev => ({ ...prev, card: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Digital Wallets</span>
                  <Switch
                    checked={paymentMethods.digital}
                    onCheckedChange={(checked) => setPaymentMethods(prev => ({ ...prev, digital: checked }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Printer Configuration */}
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center space-x-2">
              <Printer className="w-5 h-5" />
              <span>Printer Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${printerSettings.qzTrayConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">QZ Tray Status</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {printerSettings.qzTrayConnected ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkQZTrayConnection}
                className="flex items-center space-x-2"
              >
                {printerSettings.qzTrayConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span>{printerSettings.qzTrayConnected ? 'Refresh' : 'Connect'}</span>
              </Button>
            </div>

            {printerSettings.qzTrayConnected && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="printer-select">Select Default Printer</Label>
                  <Select 
                    value={printerSettings.selectedPrinter} 
                    onValueChange={(value) => setPrinterSettings(prev => ({ ...prev, selectedPrinter: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a printer" />
                    </SelectTrigger>
                    <SelectContent>
                      {printerSettings.availablePrinters.map((printer) => (
                        <SelectItem key={printer} value={printer}>
                          {printer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Auto-connect on startup</Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Automatically connect to QZ Tray when the app starts
                    </p>
                  </div>
                  <Switch
                    checked={printerSettings.autoConnect}
                    onCheckedChange={(checked) => setPrinterSettings(prev => ({ ...prev, autoConnect: checked }))}
                  />
                </div>

                {printerSettings.selectedPrinter && (
                  <Button 
                    variant="outline" 
                    onClick={testPrint}
                    className="w-full flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Send Test Print</span>
                  </Button>
                )}
              </div>
            )}

            {!printerSettings.qzTrayConnected && (
              <div className="flex items-start space-x-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300">QZ Tray Required</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    QZ Tray is required for direct printer connectivity. Please download and install it from qz.io, then restart the application.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* User Management */}
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>User Management</span>
              </CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {users?.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bakery-gradient rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">
                        {getInitials(user.firstName, user.lastName)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor(user.role)} variant="secondary">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        {!user.isActive && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {!users || users.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

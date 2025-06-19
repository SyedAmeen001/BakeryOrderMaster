import bcrypt from "bcrypt";
import {
  users,
  categories,
  products,
  customers,
  orders,
  orderItems,
  storeSettings,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Customer,
  type InsertCustomer,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type StoreSettings,
  type InsertStoreSettings,
  type OrderWithItems,
  type ProductWithCategory,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getAllCategories(): Promise<Category[]>;

  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getAllProducts(): Promise<ProductWithCategory[]>;
  getProductsByCategory(categoryId: number): Promise<ProductWithCategory[]>;
  updateProductStock(id: number, stock: number): Promise<boolean>;

  // Customer methods
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  getAllCustomers(): Promise<Customer[]>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;

  // Order methods
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  getOrderByNumber(orderNumber: string): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  getAllOrders(): Promise<OrderWithItems[]>;
  getOrdersByStatus(status: string): Promise<OrderWithItems[]>;
  getOrdersByDateRange(startDate: Date, endDate: Date): Promise<OrderWithItems[]>;

  // Store settings methods
  getStoreSettings(): Promise<StoreSettings | undefined>;
  updateStoreSettings(settings: Partial<InsertStoreSettings>): Promise<StoreSettings>;

  // Analytics methods
  getDashboardStats(): Promise<{
    todayOrders: number;
    revenue: number;
    pendingOrders: number;
    activeProducts: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private customers: Map<number, Customer>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem[]>;
  private storeSettings: StoreSettings | undefined;
  private currentId: { [table: string]: number };

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.customers = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.currentId = {
      users: 1,
      categories: 1,
      products: 1,
      customers: 1,
      orders: 1,
      orderItems: 1,
    };
    this.seedData();
  }

  private async seedData() {
    // Create default users with hashed passwords
    const adminUser = await this.createUser({
      username: "admin",
      email: "admin@bakery.com",
      password: "admin123",
      role: "admin",
      firstName: "John",
      lastName: "Doe",
      isActive: true,
    });

    await this.createUser({
      username: "staff",
      email: "staff@bakery.com",
      password: "staff123",
      role: "staff",
      firstName: "Jane",
      lastName: "Smith",
      isActive: true,
    });

    await this.createUser({
      username: "viewer",
      email: "viewer@bakery.com",
      password: "viewer123",
      role: "viewer",
      firstName: "Mike",
      lastName: "Johnson",
      isActive: true,
    });

    // Create comprehensive bakery categories
    const breadCategory = await this.createCategory({
      name: "Artisan Breads",
      description: "Fresh baked artisan breads and specialty loaves",
      isActive: true,
    });

    const cakeCategory = await this.createCategory({
      name: "Cakes & Layer Cakes",
      description: "Custom celebration cakes and ready-made desserts",
      isActive: true,
    });

    const pastryCategory = await this.createCategory({
      name: "Pastries & Danish",
      description: "Flaky pastries, croissants, and morning treats",
      isActive: true,
    });

    const muffinCategory = await this.createCategory({
      name: "Muffins & Cupcakes",
      description: "Individual sized treats and breakfast muffins",
      isActive: true,
    });

    const cookieCategory = await this.createCategory({
      name: "Cookies & Bars",
      description: "Fresh baked cookies, brownies, and dessert bars",
      isActive: true,
    });

    const pieCategory = await this.createCategory({
      name: "Pies & Tarts",
      description: "Seasonal fruit pies and savory quiches",
      isActive: true,
    });

    // Create comprehensive product catalog
    const products = [
      // Artisan Breads
      { name: "Sourdough Artisan Loaf", description: "24-hour fermented sourdough with crispy crust", price: "8.99", categoryId: breadCategory.id, stock: 12, imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Whole Wheat Honey Bread", description: "Nutritious whole grain with local honey", price: "6.99", categoryId: breadCategory.id, stock: 8, imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "French Baguette", description: "Traditional crusty French baguette", price: "4.99", categoryId: breadCategory.id, stock: 15, imageUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Cinnamon Raisin Bread", description: "Sweet breakfast bread with plump raisins", price: "7.99", categoryId: breadCategory.id, stock: 6, imageUrl: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Rosemary Olive Focaccia", description: "Italian-style flatbread with herbs", price: "9.99", categoryId: breadCategory.id, stock: 4, imageUrl: "https://images.unsplash.com/photo-1563379091339-03246963d7d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },

      // Cakes & Layer Cakes
      { name: "Chocolate Fudge Layer Cake", description: "Rich triple-layer chocolate with fudge frosting", price: "45.99", categoryId: cakeCategory.id, stock: 3, imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Red Velvet Cake", description: "Classic red velvet with cream cheese frosting", price: "42.99", categoryId: cakeCategory.id, stock: 2, imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Lemon Pound Cake", description: "Moist lemon cake with glaze", price: "28.99", categoryId: cakeCategory.id, stock: 4, imageUrl: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Carrot Cake", description: "Spiced carrot cake with walnuts and cream cheese", price: "38.99", categoryId: cakeCategory.id, stock: 2, imageUrl: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Vanilla Birthday Cake", description: "Classic vanilla with buttercream - ready to personalize", price: "35.99", categoryId: cakeCategory.id, stock: 5, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },

      // Pastries & Danish
      { name: "Butter Croissants", description: "Flaky French pastry - pack of 4", price: "12.99", categoryId: pastryCategory.id, stock: 20, imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Pain au Chocolat", description: "Chocolate-filled croissant pastry", price: "4.99", categoryId: pastryCategory.id, stock: 15, imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Apple Turnovers", description: "Puff pastry with spiced apple filling", price: "5.99", categoryId: pastryCategory.id, stock: 12, imageUrl: "https://images.unsplash.com/photo-1549903072-7e6e0bedb7fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Cheese Danish", description: "Sweet cream cheese filled pastry", price: "4.49", categoryId: pastryCategory.id, stock: 18, imageUrl: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Cinnamon Rolls", description: "Warm cinnamon rolls with icing - pack of 6", price: "18.99", categoryId: pastryCategory.id, stock: 8, imageUrl: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },

      // Muffins & Cupcakes  
      { name: "Blueberry Muffins", description: "Fresh blueberries in vanilla muffin - pack of 6", price: "15.99", categoryId: muffinCategory.id, stock: 10, imageUrl: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Chocolate Chip Muffins", description: "Double chocolate chip breakfast treats", price: "14.99", categoryId: muffinCategory.id, stock: 12, imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Vanilla Cupcakes", description: "Light vanilla cupcakes with buttercream - pack of 12", price: "24.99", categoryId: muffinCategory.id, stock: 6, imageUrl: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Red Velvet Cupcakes", description: "Mini red velvet with cream cheese frosting", price: "27.99", categoryId: muffinCategory.id, stock: 4, imageUrl: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Lemon Poppy Seed Muffins", description: "Bright citrus muffins with poppy seeds", price: "16.99", categoryId: muffinCategory.id, stock: 8, imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },

      // Cookies & Bars
      { name: "Chocolate Chip Cookies", description: "Classic soft-baked cookies - dozen", price: "18.99", categoryId: cookieCategory.id, stock: 15, imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Oatmeal Raisin Cookies", description: "Chewy oats with plump raisins - dozen", price: "17.99", categoryId: cookieCategory.id, stock: 12, imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Double Fudge Brownies", description: "Rich chocolate brownies - pack of 9", price: "22.99", categoryId: cookieCategory.id, stock: 8, imageUrl: "https://images.unsplash.com/photo-1541599468348-e96984315921?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Lemon Bars", description: "Tangy lemon curd on shortbread - pack of 9", price: "19.99", categoryId: cookieCategory.id, stock: 6, imageUrl: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Snickerdoodles", description: "Cinnamon sugar rolled cookies - dozen", price: "16.99", categoryId: cookieCategory.id, stock: 10, imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },

      // Pies & Tarts
      { name: "Apple Pie", description: "Classic apple pie with lattice crust", price: "24.99", categoryId: pieCategory.id, stock: 4, imageUrl: "https://images.unsplash.com/photo-1535920527002-b35e96722a22?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Pumpkin Pie", description: "Smooth spiced pumpkin custard", price: "22.99", categoryId: pieCategory.id, stock: 3, imageUrl: "https://images.unsplash.com/photo-1571741140707-f33a083c3de2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Berry Tart", description: "Mixed seasonal berries on pastry cream", price: "28.99", categoryId: pieCategory.id, stock: 2, imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Quiche Lorraine", description: "Savory egg custard with bacon and cheese", price: "26.99", categoryId: pieCategory.id, stock: 3, imageUrl: "https://images.unsplash.com/photo-1573821663912-6df460f9c684?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Pecan Pie", description: "Rich pecan filling in buttery crust", price: "27.99", categoryId: pieCategory.id, stock: 2, imageUrl: "https://images.unsplash.com/photo-1535920527002-b35e96722a22?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
    ];

    for (const product of products) {
      await this.createProduct({
        ...product,
        isActive: true,
      });
    }

    // Create diverse customer base
    const customers = [
      { name: "Sarah Williams", email: "sarah.w@email.com", phone: "555-0123", address: "123 Maple Avenue, Downtown" },
      { name: "Michael Chen", email: "m.chen@email.com", phone: "555-0124", address: "456 Oak Street, Midtown" },
      { name: "Jennifer Martinez", email: "j.martinez@email.com", phone: "555-0125", address: "789 Pine Road, Uptown" },
      { name: "Robert Johnson", email: "rob.johnson@email.com", phone: "555-0126", address: "321 Elm Drive, Westside" },
      { name: "Emily Davis", email: "emily.d@email.com", phone: "555-0127", address: "654 Cedar Lane, Eastside" },
      { name: "David Brown", email: "d.brown@email.com", phone: "555-0128", address: "987 Birch Circle, Southside" },
      { name: "Lisa Anderson", email: "lisa.and@email.com", phone: "555-0129", address: "147 Willow Way, Northside" },
      { name: "James Wilson", email: "j.wilson@email.com", phone: "555-0130", address: "258 Spruce Street, Central" },
      { name: "Ashley Taylor", email: "a.taylor@email.com", phone: "555-0131", address: "369 Poplar Place, Riverside" },
      { name: "Christopher Lee", email: "chris.lee@email.com", phone: "555-0132", address: "741 Ash Avenue, Hillside" },
      { name: "Amanda White", email: "amanda.w@email.com", phone: "555-0133", address: "852 Hickory Heights, Valley View" },
      { name: "Daniel Garcia", email: "d.garcia@email.com", phone: "555-0134", address: "963 Walnut Way, Garden District" },
    ];

    for (const customer of customers) {
      await this.createCustomer(customer);
    }

    // Create realistic orders with varied items and statuses
    const orderData = [
      {
        customerId: 1, customerName: "Sarah Williams", status: "completed" as const, 
        items: [
          { productId: 1, productName: "Sourdough Artisan Loaf", quantity: 2, unitPrice: "8.99", totalPrice: "17.98" },
          { productId: 16, productName: "Blueberry Muffins", quantity: 1, unitPrice: "15.99", totalPrice: "15.99" }
        ],
        paymentMethod: "card" as const, paymentStatus: "paid" as const,
        subtotal: "33.97", taxAmount: "2.89", total: "36.86"
      },
      {
        customerId: 2, customerName: "Michael Chen", status: "processing" as const,
        items: [
          { productId: 6, productName: "Chocolate Fudge Layer Cake", quantity: 1, unitPrice: "45.99", totalPrice: "45.99" }
        ],
        paymentMethod: "card" as const, paymentStatus: "paid" as const,
        subtotal: "45.99", taxAmount: "3.91", total: "49.90"
      },
      {
        customerId: 3, customerName: "Jennifer Martinez", status: "placed" as const,
        items: [
          { productId: 11, productName: "Butter Croissants", quantity: 2, unitPrice: "12.99", totalPrice: "25.98" },
          { productId: 12, productName: "Pain au Chocolat", quantity: 3, unitPrice: "4.99", totalPrice: "14.97" }
        ],
        paymentMethod: "cash" as const, paymentStatus: "pending" as const,
        subtotal: "40.95", taxAmount: "3.48", total: "44.43"
      },
      {
        customerId: 4, customerName: "Robert Johnson", status: "completed" as const,
        items: [
          { productId: 21, productName: "Chocolate Chip Cookies", quantity: 1, unitPrice: "18.99", totalPrice: "18.99" },
          { productId: 23, productName: "Double Fudge Brownies", quantity: 1, unitPrice: "22.99", totalPrice: "22.99" }
        ],
        paymentMethod: "digital" as const, paymentStatus: "paid" as const,
        subtotal: "41.98", taxAmount: "3.57", total: "45.55"
      },
      {
        customerId: 5, customerName: "Emily Davis", status: "completed" as const,
        items: [
          { productId: 26, productName: "Apple Pie", quantity: 1, unitPrice: "24.99", totalPrice: "24.99" },
          { productId: 18, productName: "Vanilla Cupcakes", quantity: 1, unitPrice: "24.99", totalPrice: "24.99" }
        ],
        paymentMethod: "card" as const, paymentStatus: "paid" as const,
        subtotal: "49.98", taxAmount: "4.25", total: "54.23"
      },
      {
        customerId: 6, customerName: "David Brown", status: "processing" as const,
        items: [
          { productId: 15, productName: "Cinnamon Rolls", quantity: 2, unitPrice: "18.99", totalPrice: "37.98" }
        ],
        paymentMethod: "card" as const, paymentStatus: "paid" as const,
        subtotal: "37.98", taxAmount: "3.23", total: "41.21"
      },
      {
        customerId: 7, customerName: "Lisa Anderson", status: "completed" as const,
        items: [
          { productId: 3, productName: "French Baguette", quantity: 3, unitPrice: "4.99", totalPrice: "14.97" },
          { productId: 14, productName: "Cheese Danish", quantity: 2, unitPrice: "4.49", totalPrice: "8.98" }
        ],
        paymentMethod: "cash" as const, paymentStatus: "paid" as const,
        subtotal: "23.95", taxAmount: "2.04", total: "25.99"
      },
      {
        customerId: 8, customerName: "James Wilson", status: "placed" as const,
        items: [
          { productId: 29, productName: "Quiche Lorraine", quantity: 1, unitPrice: "26.99", totalPrice: "26.99" },
          { productId: 2, productName: "Whole Wheat Honey Bread", quantity: 1, unitPrice: "6.99", totalPrice: "6.99" }
        ],
        paymentMethod: "card" as const, paymentStatus: "pending" as const,
        subtotal: "33.98", taxAmount: "2.89", total: "36.87"
      }
    ];

    for (const orderInfo of orderData) {
      const order = {
        customerId: orderInfo.customerId,
        customerName: orderInfo.customerName,
        status: orderInfo.status,
        subtotal: orderInfo.subtotal,
        taxAmount: orderInfo.taxAmount,
        total: orderInfo.total,
        paymentMethod: orderInfo.paymentMethod,
        paymentStatus: orderInfo.paymentStatus,
        createdBy: adminUser.id,
      };

      await this.createOrder(order, orderInfo.items);
    }

    // Store settings
    this.storeSettings = {
      id: 1,
      storeName: "Sweet Dreams Bakery",
      address: "123 Baker Street, New York, NY 10001",
      phone: "(555) 123-4567",
      email: "info@sweetdreams.com",
      taxRate: "8.5",
      currency: "USD",
      operatingHours: JSON.stringify({
        monday: { open: "07:00", close: "18:00" },
        tuesday: { open: "07:00", close: "18:00" },
        wednesday: { open: "07:00", close: "18:00" },
        thursday: { open: "07:00", close: "18:00" },
        friday: { open: "07:00", close: "19:00" },
        saturday: { open: "08:00", close: "19:00" },
        sunday: { open: "08:00", close: "17:00" },
      }),
      paymentMethods: JSON.stringify(["cash", "card"]),
    };
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const id = this.currentId.users++;
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
      isActive: insertUser.isActive ?? true,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    if (userData.password) {
      updatedUser.password = await bcrypt.hash(userData.password, 10);
    }
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentId.categories++;
    const category: Category = { 
      ...insertCategory, 
      id,
      isActive: insertCategory.isActive ?? true,
      description: insertCategory.description ?? null
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentId.products++;
    const product: Product = {
      ...insertProduct,
      id,
      createdAt: new Date(),
      isActive: insertProduct.isActive ?? true,
      description: insertProduct.description ?? null,
      categoryId: insertProduct.categoryId ?? null,
      imageUrl: insertProduct.imageUrl ?? null,
      stock: insertProduct.stock ?? 0,
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async getAllProducts(): Promise<ProductWithCategory[]> {
    const products = Array.from(this.products.values());
    return products.map(product => ({
      ...product,
      category: product.categoryId ? this.categories.get(product.categoryId) : undefined,
    }));
  }

  async getProductsByCategory(categoryId: number): Promise<ProductWithCategory[]> {
    const products = Array.from(this.products.values()).filter(p => p.categoryId === categoryId);
    return products.map(product => ({
      ...product,
      category: this.categories.get(categoryId),
    }));
  }

  async updateProductStock(id: number, stock: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;

    this.products.set(id, { ...product, stock });
    return true;
  }

  // Customer methods
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentId.customers++;
    const customer: Customer = {
      ...insertCustomer,
      id,
      createdAt: new Date(),
      email: insertCustomer.email ?? null,
      phone: insertCustomer.phone ?? null,
      address: insertCustomer.address ?? null,
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updatedCustomer = { ...customer, ...customerData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(customer => customer.phone === phone);
  }

  // Order methods
  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const items = this.orderItems.get(id) || [];
    const customer = order.customerId ? this.customers.get(order.customerId) : undefined;

    return { ...order, items, customer };
  }

  async getOrderByNumber(orderNumber: string): Promise<OrderWithItems | undefined> {
    const order = Array.from(this.orders.values()).find(o => o.orderNumber === orderNumber);
    if (!order) return undefined;

    const items = this.orderItems.get(order.id) || [];
    const customer = order.customerId ? this.customers.get(order.customerId) : undefined;

    return { ...order, items, customer };
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const id = this.currentId.orders++;
    const orderNumber = `#${3000 + id}`;
    
    const order: Order = {
      ...insertOrder,
      id,
      orderNumber,
      createdAt: new Date(),
      completedAt: null,
      status: insertOrder.status ?? "placed",
      customerId: insertOrder.customerId ?? null,
      customerName: insertOrder.customerName ?? null,
      paymentMethod: insertOrder.paymentMethod ?? null,
      paymentStatus: insertOrder.paymentStatus ?? "pending",
      notes: insertOrder.notes ?? null,
    };

    const orderItemsWithIds = items.map(item => ({
      ...item,
      id: this.currentId.orderItems++,
      orderId: id,
    }));

    this.orders.set(id, order);
    this.orderItems.set(id, orderItemsWithIds);

    const customer = order.customerId ? this.customers.get(order.customerId) : undefined;
    return { ...order, items: orderItemsWithIds, customer };
  }

  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = { 
      ...order, 
      ...orderData,
      completedAt: orderData.status === "completed" ? new Date() : order.completedAt,
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    this.orderItems.delete(id);
    return this.orders.delete(id);
  }

  async getAllOrders(): Promise<OrderWithItems[]> {
    const orders = Array.from(this.orders.values());
    return orders.map(order => {
      const items = this.orderItems.get(order.id) || [];
      const customer = order.customerId ? this.customers.get(order.customerId) : undefined;
      return { ...order, items, customer };
    });
  }

  async getOrdersByStatus(status: string): Promise<OrderWithItems[]> {
    const orders = Array.from(this.orders.values()).filter(order => order.status === status);
    return orders.map(order => {
      const items = this.orderItems.get(order.id) || [];
      const customer = order.customerId ? this.customers.get(order.customerId) : undefined;
      return { ...order, items, customer };
    });
  }

  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<OrderWithItems[]> {
    const orders = Array.from(this.orders.values()).filter(order => 
      order.createdAt >= startDate && order.createdAt <= endDate
    );
    return orders.map(order => {
      const items = this.orderItems.get(order.id) || [];
      const customer = order.customerId ? this.customers.get(order.customerId) : undefined;
      return { ...order, items, customer };
    });
  }

  // Store settings methods
  async getStoreSettings(): Promise<StoreSettings | undefined> {
    return this.storeSettings;
  }

  async updateStoreSettings(settings: Partial<InsertStoreSettings>): Promise<StoreSettings> {
    this.storeSettings = { ...this.storeSettings!, ...settings };
    return this.storeSettings;
  }

  // Analytics methods
  async getDashboardStats(): Promise<{
    todayOrders: number;
    revenue: number;
    pendingOrders: number;
    activeProducts: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = Array.from(this.orders.values()).filter(
      order => order.createdAt >= today && order.createdAt < tomorrow
    );

    const revenue = todayOrders
      .filter(order => order.status === "completed")
      .reduce((sum, order) => sum + parseFloat(order.total), 0);

    const pendingOrders = Array.from(this.orders.values()).filter(
      order => order.status === "placed" || order.status === "processing"
    ).length;

    const activeProducts = Array.from(this.products.values()).filter(
      product => product.isActive && product.stock > 0
    ).length;

    return {
      todayOrders: todayOrders.length,
      revenue,
      pendingOrders,
      activeProducts,
    };
  }
}

export const storage = new MemStorage();

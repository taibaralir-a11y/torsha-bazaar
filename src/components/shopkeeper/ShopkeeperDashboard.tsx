import React, { useState } from 'react';
import { ShopkeeperHeader } from './ShopkeeperHeader';
import { ShopStatsOverview } from './ShopStatsOverview';
import { ShopOrdersTab } from './ShopOrdersTab';
import { ShopProductsTab } from './ShopProductsTab';
import { ShopProfileTab } from './ShopProfileTab';
import { ShopHistoryTab } from './ShopHistoryTab';
import { AddEditProductModal } from './AddEditProductModal';
import { Shop, Order, Product, OrderStatus, ShopApprovalStatus, LocalityInfo, PublicRiderCard } from '../../types';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Store, 
  History, 
  Plus
} from 'lucide-react';

interface ShopkeeperDashboardProps {
  shop: Shop;
  isAdmin?: boolean;
  orders: Order[];
  products: Product[];
  approvedRiders?: PublicRiderCard[];
  localities?: LocalityInfo[];
  onSwitchToCustomer: () => void;
  onUpdateShop: (updatedData: Partial<Shop>) => void;
  onAdminChangeStatus: (status: ShopApprovalStatus) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, extra?: { rejectionReason?: string; riderId?: string; riderName?: string }) => void;
  onAddProduct: (productData: Partial<Product>) => void;
  onUpdateProduct: (productId: string, updatedData: Partial<Product>) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleAvailability: (productId: string) => void;
}

export const ShopkeeperDashboard: React.FC<ShopkeeperDashboardProps> = ({
  shop,
  isAdmin = false,
  orders,
  products,
  approvedRiders = [],
  onSwitchToCustomer,
  onUpdateShop,
  onAdminChangeStatus,
  onUpdateOrderStatus,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToggleAvailability,
  localities
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'profile' | 'history'>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const shopOrders = orders.filter((o) => !o.shopId || o.shopId === shop.id);
  const pendingOrdersCount = shopOrders.filter((o) => o.status === 'pending').length;

  const handleSaveProduct = (productData: Partial<Product>) => {
    if (productToEdit) {
      onUpdateProduct(productToEdit.id, productData);
      setProductToEdit(null);
    } else {
      onAddProduct(productData);
    }
  };

  const navTabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { 
      id: 'orders' as const, 
      label: 'Live Orders', 
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined
    },
    { id: 'products' as const, label: 'Products', icon: Package },
    { id: 'profile' as const, label: 'Shop Info', icon: Store },
    { id: 'history' as const, label: 'History', icon: History }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center text-gray-900 pb-20">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col border-x border-gray-200">
        {/* Header */}
        <ShopkeeperHeader
          shop={shop}
          isAdmin={isAdmin}
          onSwitchToCustomer={onSwitchToCustomer}
          onAdminChangeStatus={onAdminChangeStatus}
        />

        {/* Tab Selector Strip */}
        <div className="bg-white border-b border-gray-200 sticky top-28 z-20 px-2 py-1.5 flex items-center justify-between overflow-x-auto no-scrollbar shadow-xs">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0E7438] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-yellow-400 text-black' : 'bg-red-500 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Tab Content */}
        <main className="flex-1 p-4 overflow-x-hidden">
          {activeTab === 'overview' && (
            <ShopStatsOverview
              shop={shop}
              orders={orders}
              products={products}
              onNavigateToTab={(tab) => {
                if (tab === 'orders') setActiveTab('orders');
                else if (tab === 'products') setActiveTab('products');
                else if (tab === 'profile') setActiveTab('profile');
                else if (tab === 'history') setActiveTab('history');
              }}
            />
          )}

          {activeTab === 'orders' && (
            <ShopOrdersTab
              shop={shop}
              orders={orders}
              isAdmin={isAdmin}
              approvedRiders={approvedRiders}
              onUpdateOrderStatus={onUpdateOrderStatus}
            />
          )}

          {activeTab === 'products' && (
            <ShopProductsTab
              shop={shop}
              products={products}
              onOpenAddModal={() => {
                setProductToEdit(null);
                setIsAddModalOpen(true);
              }}
              onOpenEditModal={(product) => {
                setProductToEdit(product);
                setIsAddModalOpen(true);
              }}
              onDeleteProduct={onDeleteProduct}
              onToggleAvailability={onToggleAvailability}
            />
          )}

          {activeTab === 'profile' && (
            <ShopProfileTab
              shop={shop}
              isAdmin={isAdmin}
              onUpdateShop={onUpdateShop}
              onAdminChangeStatus={onAdminChangeStatus}
              localities={localities}
            />
          )}

          {activeTab === 'history' && (
            <ShopHistoryTab
              shop={shop}
              orders={orders}
            />
          )}
        </main>

        {/* Add/Edit Product Modal */}
        <AddEditProductModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setProductToEdit(null);
          }}
          onSave={handleSaveProduct}
          productToEdit={productToEdit}
        />
      </div>
    </div>
  );
};

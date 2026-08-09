import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore } from '../stores/cart.store';
import { useAuth } from '../hooks/useAuth';
import CartLineItem from '../components/cart/CartLineItem';
import CartSummary from '../components/cart/CartSummary';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import Toast from '../components/ui/Toast';
import type { BackendCartItem, Cart } from '../types';

function unitPrice(item: BackendCartItem): number {
  const { variant } = item;
  if (variant.price != null) return variant.price;
  return variant.product.salePrice ?? variant.product.basePrice ?? 0;
}

export default function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const cart = useCartStore((s) => s.cart) as Cart | null;
  const guestItems = useCartStore((s) => s.items) ?? [];
  const isSyncing = useCartStore((s) => s.isSyncing);
  const loadServerCart = useCartStore((s) => s.loadServerCart);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const [maxStockError, setMaxStockError] = useState<{ show: boolean; max: number }>({
    show: false,
    max: 0,
  });

  const handleMaxStockError = (max: number) => {
    setMaxStockError({ show: true, max });
    window.setTimeout(() => setMaxStockError({ show: false, max: 0 }), 3000);
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      loadServerCart();
    }
  }, [authLoading, isAuthenticated, loadServerCart]);

  const items = cart?.items ?? [];

  useEffect(() => {
    if (items.length > 0 && !isInitialized) {
      setSelectedItemIds(items.map((i) => i.id));
      setIsInitialized(true);
    }
  }, [items, isInitialized]);

  const hasItems = isAuthenticated ? items.length > 0 : guestItems.length > 0;

  const subtotal = useMemo(
    () =>
      items
        .filter((item) => selectedItemIds.includes(item.id))
        .reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0),
    [items, selectedItemIds],
  );

  const handleQuantityChange = (id: string, qty: number) => {
    updateItem(id, qty);
  };

  const handleRemove = (id: string) => {
    removeItem(id);
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { selectedItemIds } });
  };

  if (isAuthenticated && isSyncing && items.length === 0) {
    return <CartSkeleton />;
  }

  if (!hasItems) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-md px-md py-xxl text-center sm:px-lg"
      >
        <h1 className="headline-lg text-on-surface">{t('cart.empty')}</h1>
        <Link to="/products">
          <Button variant="primary" size="md">
            {t('cart.emptyCta')}
          </Button>
        </Link>
      </motion.div>
    );
  }

  // Guest with items: storage holds only {variantId, quantity}; without a batch
  // variant lookup we cannot render full line items, so nudge to log in.
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-md px-md py-xxl text-center sm:px-lg"
      >
        <h1 className="headline-lg text-on-surface">{t('cart.title')}</h1>
        <p className="body-md text-on-surface-variant">{t('cart.guestNotice')}</p>
        <div className="flex flex-wrap items-center justify-center gap-sm">
          <Link to="/login">
            <Button variant="primary" size="md">
              {t('nav.login')}
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" size="md">
              {t('cart.continueShopping')}
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto w-full max-w-[1280px] px-md py-lg sm:px-lg"
    >
      <h1 className="headline-lg text-on-surface">{t('cart.title')}</h1>

      <div className="mt-lg grid grid-cols-1 gap-lg lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl bg-surface-container-lowest px-lg">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-sm">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                checked={selectedItemIds.includes(item.id)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectedItemIds((prev) =>
                    checked ? [...prev, item.id] : prev.filter((id) => id !== item.id),
                  );
                }}
              />
              <div className="flex-1">
                <CartLineItem
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                  disabled={isSyncing}
                  onMaxStockError={handleMaxStockError}
                />
              </div>
            </div>
          ))}
        </section>

        <aside className="flex flex-col gap-md">
          <CartSummary
            subtotal={subtotal}
            discount={0}
            total={subtotal}
            onCheckout={handleCheckout}
            checkoutDisabled={isSyncing || items.length === 0 || selectedItemIds.length === 0}
          />
        </aside>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {maxStockError.show && (
          <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2">
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
            >
              <Toast variant="error">
                {t('cart.maxStockError', { count: maxStockError.max })}
              </Toast>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CartSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-md py-lg sm:px-lg">
      <Skeleton className="h-8 w-48" />
      <div className="mt-lg grid grid-cols-1 gap-lg lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-md">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

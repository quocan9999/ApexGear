import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useCartStore } from '../stores/cart.store';
import { useAuth } from '../hooks/useAuth';
import CartLineItem from '../components/cart/CartLineItem';
import CartSummary from '../components/cart/CartSummary';
import CouponInput from '../components/cart/CouponInput';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import type { BackendCartItem, Cart, CouponValidation } from '../types';

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

  const [coupon, setCoupon] = useState<CouponValidation | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      loadServerCart();
    }
  }, [authLoading, isAuthenticated, loadServerCart]);

  const items = cart?.items ?? [];
  const hasItems = isAuthenticated ? items.length > 0 : guestItems.length > 0;

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0),
    [items],
  );

  const discount = coupon?.valid ? coupon.discount ?? 0 : 0;
  const total = Math.max(0, subtotal - discount);

  // A cart mutation changes the subtotal, so any applied coupon is no longer
  // authoritative. Clear it and let the user re-apply against the new subtotal
  // (checkout re-validates regardless).
  const handleQuantityChange = (id: string, qty: number) => {
    setCoupon(null);
    updateItem(id, qty);
  };

  const handleRemove = (id: string) => {
    setCoupon(null);
    removeItem(id);
  };

  const handleCheckout = () => {
    navigate('/checkout', {
      state: coupon?.valid ? { couponCode: coupon.code, discount } : undefined,
    });
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
            <CartLineItem
              key={item.id}
              item={item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
              disabled={isSyncing}
            />
          ))}
        </section>

        <aside className="flex flex-col gap-md">
          <div className="rounded-xl bg-surface-container-lowest p-lg">
            <CouponInput
              subtotal={subtotal}
              onApplied={setCoupon}
              onCleared={() => setCoupon(null)}
            />
          </div>
          <CartSummary
            subtotal={subtotal}
            discount={discount}
            total={total}
            onCheckout={handleCheckout}
            checkoutDisabled={isSyncing || items.length === 0}
          />
        </aside>
      </div>
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

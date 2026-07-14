import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useCartStore } from '../stores/cart.store';
import { addressesService } from '../services/addresses.service';
import { ordersService } from '../services/orders.service';
import { couponsService } from '../services/coupons.service';
import CheckoutStepper from '../components/checkout/CheckoutStepper';
import AddressPicker from '../components/checkout/AddressPicker';
import AddressForm from '../components/checkout/AddressForm';
import PaymentMethodPicker from '../components/checkout/PaymentMethodPicker';
import OrderReview from '../components/checkout/OrderReview';
import Button from '../components/ui/Button';
import { formatPrice } from '../utils/format';
import type {
  Address,
  BackendCartItem,
  Cart,
  CreateAddressPayload,
  CreateOrderPayload,
  PaymentMethod,
} from '../types';

interface CheckoutLocationState {
  couponCode?: string;
  discount?: number;
}

function unitPrice(item: BackendCartItem): number {
  const { variant } = item;
  if (variant.price != null) return variant.price;
  return variant.product.salePrice ?? variant.product.basePrice ?? 0;
}

export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const carried = (location.state as CheckoutLocationState | null) ?? {};

  const cart = useCartStore((s) => s.cart) as Cart | null;
  const loadServerCart = useCartStore((s) => s.loadServerCart);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [note, setNote] = useState('');
  const [couponCode, setCouponCode] = useState<string | undefined>(carried.couponCode);
  const [discount, setDiscount] = useState<number>(carried.discount ?? 0);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(() => cart?.items ?? [], [cart]);
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0),
    [items],
  );
  const estimatedTotal = Math.max(0, subtotal - discount);

  // Load cart + saved addresses on mount.
  useEffect(() => {
    loadServerCart();
    addressesService.getAll().then((list) => {
      setAddresses(list);
      const preferred = list.find((a) => a.isDefault) ?? list[0];
      setSelectedAddressId(preferred?.id ?? null);
      setShowAddressForm(list.length === 0);
    });
  }, [loadServerCart]);

  // Re-validate any coupon carried from the cart against the server subtotal.
  useEffect(() => {
    if (!couponCode || subtotal <= 0) return;
    let cancelled = false;
    couponsService.validate(couponCode, subtotal).then((res) => {
      if (cancelled) return;
      if (res.valid) {
        setDiscount(res.discount ?? 0);
      } else {
        setCouponCode(undefined);
        setDiscount(0);
      }
    });
    return () => {
      cancelled = true;
    };
    // Only re-run when the coupon or subtotal changes.
  }, [couponCode, subtotal]);

  // Guard: empty cart → back to cart.
  useEffect(() => {
    if (cart && items.length === 0) {
      navigate('/cart');
    }
  }, [cart, items.length, navigate]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;

  const handleSaveAddress = async (payload: CreateAddressPayload) => {
    setSavingAddress(true);
    setError(null);
    try {
      const created = await addressesService.create(payload);
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
      setShowAddressForm(false);
    } catch (err) {
      setError((err as { message?: string }).message ?? t('common.error'));
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return;
    setPlacing(true);
    setError(null);
    const payload: CreateOrderPayload = {
      paymentMethod,
      addressId: selectedAddress.id,
      ...(couponCode ? { couponCode } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    try {
      const order = await ordersService.create(payload);
      // Both COD and SEPAY land on the success page; it renders the SePay QR
      // panel when the order is SEPAY + unpaid, and the thank-you copy otherwise.
      navigate(`/checkout/success/${order.id}`);
    } catch (err) {
      setError((err as { message?: string }).message ?? t('common.error'));
      setPlacing(false);
    }
  };

  const canContinueAddress = !!selectedAddress && !showAddressForm;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto w-full max-w-[1280px] px-md py-lg sm:px-lg"
    >
      <h1 className="headline-lg text-on-surface">{t('checkout.title')}</h1>

      <div className="mt-lg">
        <CheckoutStepper current={step} />
      </div>

      {error && <p className="mt-md body-sm text-error">{error}</p>}

      <div className="mt-lg grid grid-cols-1 gap-lg lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl bg-surface-container-lowest p-lg">
          {step === 1 && (
            <div className="flex flex-col gap-lg">
              <h2 className="headline-md text-on-surface">{t('checkout.steps.address')}</h2>
              {addresses.length > 0 && !showAddressForm && (
                <AddressPicker
                  addresses={addresses}
                  selectedId={selectedAddressId}
                  onSelect={setSelectedAddressId}
                  onAddNew={() => setShowAddressForm(true)}
                />
              )}
              {showAddressForm && (
                <div className="flex flex-col gap-md">
                  <AddressForm onSubmit={handleSaveAddress} submitting={savingAddress} />
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="self-start label-md text-on-surface-variant hover:underline"
                    >
                      {t('checkout.back')}
                    </button>
                  )}
                </div>
              )}
              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={!canContinueAddress}
                onClick={() => setStep(2)}
                className="self-start"
              >
                {t('checkout.continue')}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-lg">
              <h2 className="headline-md text-on-surface">{t('checkout.steps.payment')}</h2>
              <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="order-note" className="label-md text-on-surface-variant">
                  {t('checkout.note.label')}
                </label>
                <textarea
                  id="order-note"
                  value={note}
                  maxLength={500}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('checkout.note.placeholder')}
                  className="min-h-[80px] w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-wrap gap-sm">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>
                  {t('checkout.back')}
                </Button>
                <Button type="button" variant="primary" size="lg" onClick={() => setStep(3)}>
                  {t('checkout.continue')}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && selectedAddress && (
            <div className="flex flex-col gap-lg">
              <h2 className="headline-md text-on-surface">{t('checkout.steps.review')}</h2>
              <OrderReview
                items={items}
                address={selectedAddress}
                paymentMethod={paymentMethod}
                subtotal={subtotal}
                discount={discount}
                total={estimatedTotal}
                couponCode={couponCode}
              />
              <div className="flex flex-wrap gap-sm">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)}>
                  {t('checkout.back')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  isLoading={placing}
                  onClick={handlePlaceOrder}
                >
                  {t('checkout.placeOrder')}
                </Button>
              </div>
            </div>
          )}
        </section>

        <aside className="flex h-fit flex-col gap-md rounded-xl bg-surface-container-lowest p-lg">
          <h2 className="headline-md text-on-surface">{t('checkout.summary.title')}</h2>
          <dl className="flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <dt className="body-md text-on-surface-variant">{t('checkout.review.subtotal')}</dt>
              <dd className="body-md text-on-surface">{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between">
                <dt className="body-md text-on-surface-variant">{t('checkout.review.discount')}</dt>
                <dd className="body-md text-primary">-{formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="body-md text-on-surface-variant">{t('checkout.review.shipping')}</dt>
              <dd className="body-sm text-on-surface-variant">
                {t('checkout.review.shippingComputed')}
              </dd>
            </div>
          </dl>
          <div className="flex items-center justify-between border-t border-outline-variant pt-md">
            <span className="body-md font-semibold text-on-surface">
              {t('checkout.review.total')}
            </span>
            <span className="headline-md text-primary">{formatPrice(estimatedTotal)}</span>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

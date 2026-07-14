import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';
import { useProvinces } from '../../hooks/useProvinces';
import type { Address, CreateAddressPayload } from '../../types';

interface AddressFormProps {
  initial?: Address;
  onSubmit: (payload: CreateAddressPayload) => void;
  submitting?: boolean;
}

const PHONE_PATTERN = /^[0-9+\-\s]+$/;
const NAME_MAX = 100;
const PHONE_MAX = 15;
const DETAIL_MAX = 500;

interface FieldErrors {
  name?: string;
  phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  detail?: string;
}

const selectClass = cn(
  'h-12 w-full rounded-lg border bg-surface-container-lowest px-4 body-md',
  'border-outline-variant text-on-surface',
  'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
  'transition-colors duration-200 disabled:opacity-50',
);

export default function AddressForm({ initial, onSubmit, submitting }: AddressFormProps) {
  const { t } = useTranslation();
  const {
    provinces,
    districts,
    wards,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    selectProvince,
    selectDistrict,
    selectWard,
    loading,
  } = useProvinces();

  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [detail, setDetail] = useState(initial?.detail ?? '');
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Prime the cascade from an existing address so its province is selected.
  useEffect(() => {
    if (initial?.provinceCode) selectProvince(initial.provinceCode);
    // Only on mount for the provided address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = t('checkout.addressForm.required');
    else if (name.length > NAME_MAX) next.name = t('checkout.addressForm.tooLong');

    if (!phone.trim()) next.phone = t('checkout.addressForm.required');
    else if (!PHONE_PATTERN.test(phone) || phone.length > PHONE_MAX)
      next.phone = t('checkout.addressForm.invalidPhone');

    if (!selectedProvince) next.province = t('checkout.addressForm.required');
    if (!selectedDistrict) next.district = t('checkout.addressForm.required');
    if (!selectedWard) next.ward = t('checkout.addressForm.required');

    if (!detail.trim()) next.detail = t('checkout.addressForm.required');
    else if (detail.length > DETAIL_MAX) next.detail = t('checkout.addressForm.tooLong');

    return next;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    if (!selectedProvince || !selectedDistrict || !selectedWard) return;

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      provinceCode: selectedProvince.code,
      provinceName: selectedProvince.name,
      districtCode: selectedDistrict.code,
      districtName: selectedDistrict.name,
      wardCode: selectedWard.code,
      wardName: selectedWard.name,
      detail: detail.trim(),
      isDefault,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-md">
      <Input
        id="address-name"
        label={t('checkout.addressForm.name')}
        value={name}
        maxLength={NAME_MAX}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />
      <Input
        id="address-phone"
        label={t('checkout.addressForm.phone')}
        value={phone}
        maxLength={PHONE_MAX}
        inputMode="tel"
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
      />

      <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="address-province" className="label-md text-on-surface-variant">
            {t('checkout.addressForm.province')}
          </label>
          <select
            id="address-province"
            className={selectClass}
            value={selectedProvince?.code ?? ''}
            disabled={loading}
            onChange={(e) => selectProvince(e.target.value)}
          >
            <option value="">{t('checkout.addressForm.selectProvince')}</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.province && <p className="body-sm text-error">{errors.province}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="address-district" className="label-md text-on-surface-variant">
            {t('checkout.addressForm.district')}
          </label>
          <select
            id="address-district"
            className={selectClass}
            value={selectedDistrict?.code ?? ''}
            disabled={loading || !selectedProvince}
            onChange={(e) => selectDistrict(e.target.value)}
          >
            <option value="">{t('checkout.addressForm.selectDistrict')}</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.district && <p className="body-sm text-error">{errors.district}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="address-ward" className="label-md text-on-surface-variant">
            {t('checkout.addressForm.ward')}
          </label>
          <select
            id="address-ward"
            className={selectClass}
            value={selectedWard?.code ?? ''}
            disabled={loading || !selectedDistrict}
            onChange={(e) => selectWard(e.target.value)}
          >
            <option value="">{t('checkout.addressForm.selectWard')}</option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </select>
          {errors.ward && <p className="body-sm text-error">{errors.ward}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="address-detail" className="label-md text-on-surface-variant">
          {t('checkout.addressForm.detail')}
        </label>
        <textarea
          id="address-detail"
          className={cn(selectClass, 'h-auto min-h-[80px] py-3')}
          value={detail}
          maxLength={DETAIL_MAX}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={t('checkout.addressForm.detailPlaceholder')}
        />
        {errors.detail && <p className="body-sm text-error">{errors.detail}</p>}
      </div>

      <label className="flex items-center gap-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
        />
        <span className="body-sm text-on-surface-variant">
          {t('checkout.addressForm.setDefault')}
        </span>
      </label>

      <Button type="submit" variant="primary" size="md" isLoading={submitting} className="self-start">
        {t('checkout.addressForm.save')}
      </Button>
    </form>
  );
}

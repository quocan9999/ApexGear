import { useTranslation } from 'react-i18next';
import Badge from '../ui/Badge';
import { cn } from '../../utils/cn';
import type { Address } from '../../types';

interface AddressPickerProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

export default function AddressPicker({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
}: AddressPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-sm">
      {addresses.map((address) => {
        const active = address.id === selectedId;
        return (
          <label
            key={address.id}
            className={cn(
              'flex cursor-pointer items-start gap-sm rounded-xl border p-md transition-colors',
              active
                ? 'border-primary bg-surface-container-low'
                : 'border-outline-variant hover:bg-surface-container-lowest',
            )}
          >
            <input
              type="radio"
              name="address"
              className="mt-1 h-4 w-4 accent-primary"
              checked={active}
              onChange={() => onSelect(address.id)}
            />
            <span className="flex flex-1 flex-col gap-xs">
              <span className="flex flex-wrap items-center gap-sm">
                <span className="body-md font-semibold text-on-surface">{address.name}</span>
                <span className="body-sm text-on-surface-variant">{address.phone}</span>
                {address.isDefault && <Badge variant="success">{t('checkout.defaultBadge')}</Badge>}
              </span>
              <span className="body-sm text-on-surface-variant">
                {address.detail}, {address.wardName}, {address.districtName}, {address.provinceName}
              </span>
            </span>
          </label>
        );
      })}

      <button
        type="button"
        onClick={onAddNew}
        className="self-start label-md text-primary transition-colors hover:underline"
      >
        {t('checkout.addNewAddress')}
      </button>
    </div>
  );
}

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RichTextEditor } from '../../components/editor/RichTextEditor';
import { Button, Input, Select, Spinner } from '../../components/ui';
import { brandsService } from '../../services/brands.service';
import { categoriesService } from '../../services/categories.service';
import { productsService } from '../../services/products.service';
import type { Brand, Category, Product } from '../../types';
import { slugify } from '../../utils/slugify';

interface SpecRow {
  key: string;
  group: string;
  name: string;
  value: string;
}

function newSpecRow(): SpecRow {
  return {
    key: `spec-${Math.random().toString(36).slice(2, 10)}`,
    group: '',
    name: '',
    value: '',
  };
}

function flattenCategories(tree: Category[]): Category[] {
  const rows: Category[] = [];
  for (const parent of tree) {
    rows.push(parent);
    if (parent.children?.length) {
      for (const child of parent.children) rows.push(child);
    }
  }
  return rows;
}

function specsFromProduct(product: Product): SpecRow[] {
  if (!product.specs?.length) return [newSpecRow()];
  return product.specs.map((spec) => ({
    key: spec.id,
    group: spec.group ?? '',
    name: spec.name,
    value: spec.value,
  }));
}

export function ProductFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug: editSlug } = useParams<{ slug?: string }>();
  const isEdit = Boolean(editSlug);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [serverSlug, setServerSlug] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [specs, setSpecs] = useState<SpecRow[]>([newSpecRow()]);
  const [variantsNote, setVariantsNote] = useState<string[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const slugPreview = useMemo(
    () => (isEdit ? serverSlug : slugify(name) || '—'),
    [isEdit, name, serverSlug],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      categoriesService.list().catch(() => [] as Category[]),
      brandsService.list({ page: 1, limit: 100 }).catch(() => ({
        data: [] as Brand[],
      })),
    ]).then(([categoryTree, brandPage]) => {
      if (cancelled) return;
      setCategories(flattenCategories(categoryTree));
      setBrands(brandPage.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editSlug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    productsService
      .getBySlug(editSlug)
      .then((product) => {
        if (cancelled) return;
        setProductId(product.id);
        setServerSlug(product.slug);
        setName(product.name);
        setDescription(product.description ?? '');
        setBasePrice(String(product.basePrice ?? ''));
        setSalePrice(product.salePrice != null ? String(product.salePrice) : '');
        setCategoryId(product.categoryId);
        setBrandId(product.brandId);
        setMetaTitle(product.metaTitle ?? '');
        setMetaDescription(product.metaDescription ?? '');
        setIsFeatured(product.isFeatured);
        setIsActive(product.isActive);
        setSpecs(specsFromProduct(product));
        setVariantsNote(
          (product.variants ?? []).map(
            (variant) =>
              `${variant.name ?? variant.sku} · SKU ${variant.sku} · stock ${variant.stockAvailable}`,
          ),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message?: string }).message)
            : t('common.genericError');
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editSlug, t]);

  const updateSpec = (key: string, field: keyof SpecRow, value: string) => {
    setSpecs((rows) =>
      rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  };

  const addSpec = () => setSpecs((rows) => [...rows, newSpecRow()]);
  const removeSpec = (key: string) =>
    setSpecs((rows) => (rows.length <= 1 ? rows : rows.filter((row) => row.key !== key)));

  const buildPayload = () => {
    const base = Number(basePrice);
    const sale = salePrice.trim() === '' ? undefined : Number(salePrice);
    const cleanedSpecs = specs
      .filter((row) => row.name.trim() && row.value.trim())
      .map((row, index) => ({
        group: row.group.trim() || undefined,
        name: row.name.trim(),
        value: row.value.trim(),
        sortOrder: index,
      }));

    return {
      name: name.trim(),
      description: description || undefined,
      basePrice: base,
      salePrice: sale,
      categoryId,
      brandId,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      isFeatured,
      ...(isEdit ? { isActive } : {}),
      specs: cleanedSpecs.length ? cleanedSpecs : undefined,
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !categoryId || !brandId || basePrice === '') {
      setError(t('products.form.validationRequired'));
      return;
    }
    const base = Number(basePrice);
    if (!Number.isFinite(base) || base < 0) {
      setError(t('products.form.validationPrice'));
      return;
    }
    if (salePrice.trim() !== '') {
      const sale = Number(salePrice);
      if (!Number.isFinite(sale) || sale < 0) {
        setError(t('products.form.validationPrice'));
        return;
      }
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit && productId) {
        await productsService.update(productId, payload);
        navigate('/products');
      } else {
        await productsService.create(payload);
        navigate('/products');
      }
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : t('common.genericError');
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-xl" role="status">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-lg" onSubmit={(event) => void handleSubmit(event)}>
      <div className="flex flex-col gap-sm border-b border-outline-variant pb-md md:flex-row md:items-center md:justify-between">
        <h2 className="headline-lg text-on-surface">
          {isEdit ? t('products.form.editTitle') : t('products.form.createTitle')}
        </h2>
        <Link to="/products" className="label-sm text-primary hover:underline">
          {t('products.form.backToList')}
        </Link>
      </div>

      {error && (
        <p className="body-md text-error" role="alert">
          {error}
        </p>
      )}

      <section className="grid grid-cols-1 gap-md md:grid-cols-2">
        <Input
          label={t('products.form.name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Input
          label={t('products.form.slug')}
          value={slugPreview}
          readOnly
          disabled
        />
        <Select
          label={t('products.form.category')}
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          required
        >
          <option value="">{t('products.form.selectCategory')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentId ? `— ${category.name}` : category.name}
            </option>
          ))}
        </Select>
        <Select
          label={t('products.form.brand')}
          value={brandId}
          onChange={(event) => setBrandId(event.target.value)}
          required
        >
          <option value="">{t('products.form.selectBrand')}</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </Select>
        <Input
          label={t('products.form.basePrice')}
          type="number"
          min={0}
          step="1000"
          value={basePrice}
          onChange={(event) => setBasePrice(event.target.value)}
          required
        />
        <Input
          label={t('products.form.salePrice')}
          type="number"
          min={0}
          step="1000"
          value={salePrice}
          onChange={(event) => setSalePrice(event.target.value)}
        />
        <Input
          label={t('products.form.metaTitle')}
          value={metaTitle}
          onChange={(event) => setMetaTitle(event.target.value)}
        />
        <Input
          label={t('products.form.metaDescription')}
          value={metaDescription}
          onChange={(event) => setMetaDescription(event.target.value)}
        />
      </section>

      <section className="flex flex-col gap-sm">
        <label className="label-md text-on-surface">{t('products.form.description')}</label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          aria-label={t('products.form.description')}
          disabled={saving}
        />
      </section>

      <section className="flex flex-wrap gap-lg">
        <label className="inline-flex items-center gap-sm body-md text-on-surface">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
          />
          {t('products.form.isFeatured')}
        </label>
        {isEdit && (
          <label className="inline-flex items-center gap-sm body-md text-on-surface">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            {t('products.form.isActive')}
          </label>
        )}
      </section>

      <section className="flex flex-col gap-md">
        <div className="flex items-center justify-between">
          <h3 className="headline-sm text-on-surface">{t('products.form.specsTitle')}</h3>
          <Button type="button" variant="outline" size="sm" onClick={addSpec}>
            {t('products.form.addSpec')}
          </Button>
        </div>
        {specs.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-1 gap-sm rounded border border-outline-variant p-md md:grid-cols-4"
          >
            <Input
              label={t('products.form.specGroup')}
              value={row.group}
              onChange={(event) => updateSpec(row.key, 'group', event.target.value)}
            />
            <Input
              label={t('products.form.specName')}
              value={row.name}
              onChange={(event) => updateSpec(row.key, 'name', event.target.value)}
            />
            <Input
              label={t('products.form.specValue')}
              value={row.value}
              onChange={(event) => updateSpec(row.key, 'value', event.target.value)}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSpec(row.key)}
                disabled={specs.length <= 1}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        ))}
      </section>

      {isEdit && (
        <section className="flex flex-col gap-sm">
          <h3 className="headline-sm text-on-surface">{t('products.form.variantsTitle')}</h3>
          <p className="body-sm text-on-surface-variant">{t('products.form.variantsHint')}</p>
          {variantsNote.length === 0 ? (
            <p className="body-md text-on-surface-variant">{t('common.empty')}</p>
          ) : (
            <ul className="list-disc pl-lg body-md text-on-surface">
              {variantsNote.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="sticky bottom-0 flex flex-wrap justify-end gap-sm border-t border-outline-variant bg-surface py-md">
        <Button type="button" variant="outline" onClick={() => navigate('/products')} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" isLoading={saving} loadingLabel={t('common.loading')}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}

export default ProductFormPage;

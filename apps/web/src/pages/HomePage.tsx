import { useEffect, useState } from 'react';
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import HeroSection from '../components/home/HeroSection';
import FeaturedCategories from '../components/home/FeaturedCategories';
import FeaturedProducts from '../components/home/FeaturedProducts';
import BrandsBanner from '../components/home/BrandsBanner';
import type { Category, Product } from '../types';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [heroProduct, setHeroProduct] = useState<Product | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    let mounted = true;

    categoriesService
      .getAll()
      .then((data) => {
        if (mounted) setCategories((data ?? []).slice(0, 4));
      })
      .catch(() => {
        if (mounted) setCategories([]);
      })
      .finally(() => {
        if (mounted) setLoadingCategories(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    productsService
      .getAll({ isFeatured: true, limit: 8 })
      .then((res) => {
        const items = res.data ?? [];
        if (mounted) {
          setFeatured(items);
          setHeroProduct(items[0] ?? null);
        }
      })
      .catch(() => {
        if (mounted) {
          setFeatured([]);
          setHeroProduct(null);
        }
      })
      .finally(() => {
        if (mounted) setLoadingProducts(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <HeroSection featured={heroProduct} loading={loadingProducts} />
      <FeaturedCategories categories={categories} loading={loadingCategories} />
      <FeaturedProducts products={featured} loading={loadingProducts} />
      <BrandsBanner />
    </>
  );
}

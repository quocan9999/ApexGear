-- Kích hoạt extension unaccent để hỗ trợ tìm kiếm không dấu tiếng Việt
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- PostgreSQL unaccent() mặc định là STABLE, không thể dùng trực tiếp để tạo GIN functional index.
-- Tạo hàm wrapper IMMUTABLE để cho phép đánh index to_tsvector trên biểu thức unaccent.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT public.unaccent('public.unaccent'::regdictionary, input)
$$;

-- GIN index phục vụ tìm kiếm toàn văn (FTS) trên tên và mô tả sản phẩm (đã loại bỏ dấu tiếng Việt).
-- Sử dụng từ điển 'simple' để giữ nguyên từ ngữ sau khi unaccent mà không bị ảnh hưởng bởi stemming tiếng Anh.
CREATE INDEX "Product_name_description_fts_idx"
ON "Product"
USING GIN (
  to_tsvector(
    'simple',
    public.immutable_unaccent(
      coalesce("name", '') || ' ' || coalesce("description", '')
    )
  )
);

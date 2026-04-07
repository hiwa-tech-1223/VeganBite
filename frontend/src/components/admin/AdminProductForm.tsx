'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiCategory } from '@/api/customer/productTypes';
import { productApi } from '@/api/customer/productApi';
import { adminApi } from '@/api/admin/productApi';
import { ProductFormData, ParsedKantanLink, OperationMessage } from '@/api/admin/productTypes';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface AdminProductFormProps {
  productId?: number;
}

// かんたんリンクHTMLからURLを抽出する関数
function parseKantanLinkHtml(html: string): ParsedKantanLink {
  const result: ParsedKantanLink = {};

  try {
    // msmaflink JSON形式を抽出（もしもアフィリエイト）
    const msmaflinkMatch = html.match(/msmaflink\((\{[\s\S]*?\})\);/);
    if (msmaflinkMatch) {
      const jsonStr = msmaflinkMatch[1];
      const data = JSON.parse(jsonStr);

      // 画像URLを構築: d + c_p + p[0]
      if (data.d && data.c_p != null && data.p && data.p.length > 0) {
        result.imageUrl = data.d + data.c_p + data.p[0];
      }

      // b_l配列からアフィリエイトリンクを抽出
      if (data.b_l && Array.isArray(data.b_l)) {
        data.b_l.forEach((link: { u_url?: string; s_n?: string }) => {
          if (!link.u_url) return;

          const serviceName = link.s_n || '';
          if (serviceName === 'amazon' || link.u_url.includes('amazon') || link.u_url.includes('amzn')) {
            result.amazonUrl = link.u_url;
          } else if (serviceName === 'rakuten' || link.u_url.includes('rakuten')) {
            result.rakutenUrl = link.u_url;
          } else if (serviceName === 'yahoo' || link.u_url.includes('yahoo')) {
            result.yahooUrl = link.u_url;
          }
        });
      }

      return result;
    }

    // 従来のHTML形式にフォールバック（img/aタグ）
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 画像URLを抽出
    const img = doc.querySelector('img');
    if (img) {
      const src = img.getAttribute('src');
      if (src) {
        result.imageUrl = src;
      }
    }

    // アフィリエイトリンクを抽出
    const links = doc.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent || '';

      // Amazon判定
      if (href.includes('amazon') || href.includes('amzn') || text.includes('Amazon')) {
        result.amazonUrl = href;
      }
      // 楽天判定
      else if (href.includes('rakuten') || text.includes('楽天')) {
        result.rakutenUrl = href;
      }
      // Yahoo判定
      else if (href.includes('yahoo') || text.includes('Yahoo')) {
        result.yahooUrl = href;
      }
    });
  } catch (e) {
    console.error('Failed to parse HTML:', e);
  }

  return result;
}

export function AdminProductForm({ productId }: AdminProductFormProps) {
  const router = useRouter();
  const { admin, token } = useAuth();
  const isEditMode = productId !== undefined;

  // --- State ---
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [kantanLinkHtml, setKantanLinkHtml] = useState('');
  const [extractMessage, setExtractMessage] = useState<OperationMessage | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    nameJa: '',
    name: '',
    categoryIds: [],
    descriptionJa: '',
    description: '',
    imageUrl: '',
    amazonUrl: '',
    rakutenUrl: '',
    yahooUrl: ''
  });

  // --- useEffect ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // カテゴリ一覧を取得
        const categoriesData = await productApi.getCategories();
        setCategories(categoriesData);

        // 編集モードの場合、商品データを取得
        if (isEditMode && productId !== undefined) {
          const product = await productApi.getProduct(productId);
          setFormData({
            nameJa: product.nameJa,
            name: product.name,
            categoryIds: product.categories.map(c => c.id),
            descriptionJa: product.descriptionJa,
            description: product.description,
            imageUrl: product.imageUrl,
            amazonUrl: product.amazonUrl || '',
            rakutenUrl: product.rakutenUrl || '',
            yahooUrl: product.yahooUrl || ''
          });
        }

        setError(null);
      } catch (err) {
        setError('データの取得に失敗しました');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [productId, isEditMode]);

  // --- ハンドラー ---

  // フィールド変更時にエラーをクリアしつつ値を更新
  const handleFieldChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
    if (validationErrors.categoryIds) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next.categoryIds;
        return next;
      });
    }
  };

  // かんたんリンクHTMLからURLを抽出
  const handleExtractUrls = () => {
    if (!kantanLinkHtml.trim()) {
      setExtractMessage({ type: 'error', text: 'HTMLを入力してください' });
      return;
    }

    const extracted = parseKantanLinkHtml(kantanLinkHtml);

    const updates: Partial<typeof formData> = {};
    let extractedCount = 0;

    if (extracted.imageUrl) {
      updates.imageUrl = extracted.imageUrl;
      extractedCount++;
    }
    if (extracted.amazonUrl) {
      updates.amazonUrl = extracted.amazonUrl;
      extractedCount++;
    }
    if (extracted.rakutenUrl) {
      updates.rakutenUrl = extracted.rakutenUrl;
      extractedCount++;
    }
    if (extracted.yahooUrl) {
      updates.yahooUrl = extracted.yahooUrl;
      extractedCount++;
    }

    if (extractedCount > 0) {
      setFormData({ ...formData, ...updates });
      setExtractMessage({
        type: 'success',
        text: `${extractedCount}件のURLを抽出しました`
      });
    } else {
      setExtractMessage({
        type: 'error',
        text: 'URLを抽出できませんでした。HTMLを確認してください'
      });
    }
  };

  // --- バリデーション ---

  // 単一フィールドのバリデーション（onBlur用）
  const validateField = useCallback((field: string): string | null => {
    const urlPattern = /^https?:\/\/.+/;
    switch (field) {
      case 'nameJa': {
        const v = formData.nameJa.trim();
        if (!v) return '製品名（日本語）を入力してください';
        if (v.length > 255) return `255文字以内にしてください（現在${v.length}文字）`;
        if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(v)) return '日本語を1文字以上含めてください';
        return null;
      }
      case 'name': {
        const v = formData.name.trim();
        if (!v) return '製品名（英語）を入力してください';
        if (v.length > 255) return `255文字以内にしてください（現在${v.length}文字）`;
        if (!/[a-zA-Z]/.test(v)) return '英語を1文字以上含めてください';
        return null;
      }
      case 'descriptionJa': {
        const v = formData.descriptionJa.trim();
        if (!v) return '説明（日本語）を入力してください';
        if (v.length > 5000) return `5000文字以内にしてください（現在${v.length}文字）`;
        if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(v)) return '日本語を1文字以上含めてください';
        return null;
      }
      case 'description': {
        const v = formData.description.trim();
        if (!v) return '説明（英語）を入力してください';
        if (v.length > 5000) return `5000文字以内にしてください（現在${v.length}文字）`;
        if (!/[a-zA-Z]/.test(v)) return '英語を1文字以上含めてください';
        return null;
      }
      case 'imageUrl': {
        const v = formData.imageUrl.trim();
        if (!v) return '画像URLを入力してください';
        if (!urlPattern.test(v)) return 'URLの形式が正しくありません';
        return null;
      }
      case 'amazonUrl': {
        const v = formData.amazonUrl;
        if (v && !urlPattern.test(v)) return 'URLの形式が正しくありません';
        return null;
      }
      case 'rakutenUrl': {
        const v = formData.rakutenUrl;
        if (v && !urlPattern.test(v)) return 'URLの形式が正しくありません';
        return null;
      }
      case 'yahooUrl': {
        const v = formData.yahooUrl;
        if (v && !urlPattern.test(v)) return 'URLの形式が正しくありません';
        return null;
      }
      default:
        return null;
    }
  }, [formData]);

  // onBlur ハンドラー
  const handleBlur = (field: string) => {
    const fieldError = validateField(field);
    if (fieldError) {
      setValidationErrors(prev => ({ ...prev, [field]: fieldError }));
    } else {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // 全フィールドのバリデーション（submit用）
  const validateProduct = (): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};
    const name = formData.name.trim();
    const nameJa = formData.nameJa.trim();
    const description = formData.description.trim();
    const descriptionJa = formData.descriptionJa.trim();
    const imageUrl = formData.imageUrl.trim();
    const urlPattern = /^https?:\/\/.+/;

    if (!nameJa) {
      fieldErrors.nameJa = '製品名（日本語）を入力してください';
    } else if (nameJa.length > 255) {
      fieldErrors.nameJa = `255文字以内にしてください（現在${nameJa.length}文字）`;
    } else if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(nameJa)) {
      fieldErrors.nameJa = '日本語を1文字以上含めてください';
    }
    if (!name) {
      fieldErrors.name = '製品名（英語）を入力してください';
    } else if (name.length > 255) {
      fieldErrors.name = `255文字以内にしてください（現在${name.length}文字）`;
    } else if (!/[a-zA-Z]/.test(name)) {
      fieldErrors.name = '英語を1文字以上含めてください';
    }
    if (formData.categoryIds.length === 0) {
      fieldErrors.categoryIds = '少なくとも1つのカテゴリーを選択してください';
    }
    if (!descriptionJa) {
      fieldErrors.descriptionJa = '説明（日本語）を入力してください';
    } else if (descriptionJa.length > 5000) {
      fieldErrors.descriptionJa = `5000文字以内にしてください（現在${descriptionJa.length}文字）`;
    } else if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(descriptionJa)) {
      fieldErrors.descriptionJa = '日本語を1文字以上含めてください';
    }
    if (!description) {
      fieldErrors.description = '説明（英語）を入力してください';
    } else if (description.length > 5000) {
      fieldErrors.description = `5000文字以内にしてください（現在${description.length}文字）`;
    } else if (!/[a-zA-Z]/.test(description)) {
      fieldErrors.description = '英語を1文字以上含めてください';
    }
    if (!imageUrl) {
      fieldErrors.imageUrl = '画像URLを入力してください';
    } else if (!urlPattern.test(imageUrl)) {
      fieldErrors.imageUrl = 'URLの形式が正しくありません';
    }
    if (formData.amazonUrl && !urlPattern.test(formData.amazonUrl)) {
      fieldErrors.amazonUrl = 'URLの形式が正しくありません';
    }
    if (formData.rakutenUrl && !urlPattern.test(formData.rakutenUrl)) {
      fieldErrors.rakutenUrl = 'URLの形式が正しくありません';
    }
    if (formData.yahooUrl && !urlPattern.test(formData.yahooUrl)) {
      fieldErrors.yahooUrl = 'URLの形式が正しくありません';
    }

    return fieldErrors;
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setError(null);

    if (!token) {
      setError('認証エラー: 再ログインしてください');
      return;
    }

    const fieldErrors = validateProduct();
    if (Object.keys(fieldErrors).length > 0) {
      setValidationErrors(fieldErrors);
      // 最初のエラーフィールドまでスクロール
      const firstErrorField = Object.keys(fieldErrors)[0];
      const el = document.getElementById(`field-${firstErrorField}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setIsSaving(true);

      const productData = {
        name: formData.name,
        nameJa: formData.nameJa,
        description: formData.description,
        descriptionJa: formData.descriptionJa,
        categoryIds: formData.categoryIds,
        imageUrl: formData.imageUrl,
        amazonUrl: formData.amazonUrl || undefined,
        rakutenUrl: formData.rakutenUrl || undefined,
        yahooUrl: formData.yahooUrl || undefined
      };

      if (isEditMode && productId !== undefined) {
        await adminApi.updateProduct(String(productId), productData, token);
      } else {
        await adminApi.createProduct(productData, token);
      }

      router.push('/admin/products');
    } catch (err) {
      setError(isEditMode ? '更新に失敗しました' : '作成に失敗しました');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!admin) return null;

  // --- JSX ---

  // ローディング表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <AdminHeader admin={admin} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <AdminHeader admin={admin} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl text-gray-900 mb-6">
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* 基本情報セクション */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-lg font-medium text-gray-900 mb-6">製品情報 / Product Information</h2>
            <div className="space-y-6">
              {/* Product Name (JA) */}
              <div id="field-nameJa">
                <label className="block text-sm text-gray-700 mb-2">
                  Product Name (Japanese) / 製品名（日本語）
                </label>
                <input
                  type="text"
                  value={formData.nameJa}
                  onChange={(e) => handleFieldChange('nameJa', e.target.value)}
                  onBlur={() => handleBlur('nameJa')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4A7C59] ${validationErrors.nameJa ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="ビヨンドバーガー"
                />
                <div className="flex justify-between mt-1">
                  {validationErrors.nameJa ? <p className="text-sm text-red-600">{validationErrors.nameJa}</p> : <span />}
                  <span className={`text-xs ${formData.nameJa.length > 255 ? 'text-red-600' : 'text-gray-400'}`}>{formData.nameJa.length}/255</span>
                </div>
              </div>

              {/* Product Name (EN) */}
              <div id="field-name">
                <label className="block text-sm text-gray-700 mb-2">
                  Product Name (English) / 製品名（英語）
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4A7C59] ${validationErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Beyond Burger"
                />
                <div className="flex justify-between mt-1">
                  {validationErrors.name ? <p className="text-sm text-red-600">{validationErrors.name}</p> : <span />}
                  <span className={`text-xs ${formData.name.length > 255 ? 'text-red-600' : 'text-gray-400'}`}>{formData.name.length}/255</span>
                </div>
              </div>

              {/* Category */}
              <div id="field-categoryIds">
                <label className="block text-sm text-gray-700 mb-2">
                  Categories / カテゴリー（複数選択可）
                </label>
                <div className={`border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto ${validationErrors.categoryIds ? 'border-red-300' : 'border-gray-300'}`}>
                  {categories.map(category => (
                    <label key={category.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.categoryIds.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="w-4 h-4 text-[#4A7C59] rounded focus:ring-[#4A7C59]"
                      />
                      <span className="text-sm text-gray-700">
                        {category.name} / {category.nameJa}
                      </span>
                    </label>
                  ))}
                </div>
                {validationErrors.categoryIds && <p className="text-sm text-red-600 mt-1">{validationErrors.categoryIds}</p>}
              </div>

              {/* Description (JA) */}
              <div id="field-descriptionJa">
                <label className="block text-sm text-gray-700 mb-2">
                  Description (Japanese) / 説明（日本語）
                </label>
                <textarea
                  value={formData.descriptionJa}
                  onChange={(e) => handleFieldChange('descriptionJa', e.target.value)}
                  onBlur={() => handleBlur('descriptionJa')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4A7C59] ${validationErrors.descriptionJa ? 'border-red-300' : 'border-gray-300'}`}
                  rows={4}
                  placeholder="製品の説明を日本語で入力してください..."
                />
                <div className="flex justify-between mt-1">
                  {validationErrors.descriptionJa ? <p className="text-sm text-red-600">{validationErrors.descriptionJa}</p> : <span />}
                  <span className={`text-xs ${formData.descriptionJa.length > 5000 ? 'text-red-600' : 'text-gray-400'}`}>{formData.descriptionJa.length}/5000</span>
                </div>
              </div>

              {/* Description (EN) */}
              <div id="field-description">
                <label className="block text-sm text-gray-700 mb-2">
                  Description (English) / 説明（英語）
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleBlur('description')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4A7C59] ${validationErrors.description ? 'border-red-300' : 'border-gray-300'}`}
                  rows={4}
                  placeholder="Enter product description in English..."
                />
                <div className="flex justify-between mt-1">
                  {validationErrors.description ? <p className="text-sm text-red-600">{validationErrors.description}</p> : <span />}
                  <span className={`text-xs ${formData.description.length > 5000 ? 'text-red-600' : 'text-gray-400'}`}>{formData.description.length}/5000</span>
                </div>
              </div>
            </div>
          </div>

          {/* もしもアフィリエイト連携セクション */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              📋 もしもアフィリエイト連携
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              「かんたんリンク」のHTMLを貼り付けると、画像URLとアフィリエイトリンクを自動抽出します
            </p>

            {/* かんたんリンクHTML入力 */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">
                かんたんリンク HTML
              </label>
              <textarea
                value={kantanLinkHtml}
                onChange={(e) => setKantanLinkHtml(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#4A7C59] font-mono text-sm"
                rows={5}
                placeholder='<div class="easyLink-box">...</div>'
              />
            </div>

            <button
              type="button"
              onClick={handleExtractUrls}
              className="px-4 py-2 rounded-lg transition-all mb-4 border border-gray-300 hover:bg-gray-100"
              style={{ backgroundColor: 'white', color: 'var(--text)' }}
            >
              🔍 URLを自動抽出
            </button>

            {extractMessage && (
              <div className={`p-3 rounded-lg mb-4 ${
                extractMessage.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {extractMessage.text}
              </div>
            )}

            {/* 使い方ガイド */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">💡 使い方</p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>もしもアフィリエイトで「かんたんリンク」を作成</li>
                <li>「HTMLソースを1行にする」にチェック</li>
                <li>HTMLコードをコピーして上に貼り付け</li>
                <li>「URLを自動抽出」をクリック</li>
              </ol>
            </div>

            <hr className="my-6" />

            {/* 画像URL */}
            <div id="field-imageUrl" className="mb-6">
              <label className="block text-sm text-gray-700 mb-2">
                Image URL / 画像URL
              </label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => handleFieldChange('imageUrl', e.target.value)}
                onBlur={() => handleBlur('imageUrl')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4A7C59] ${validationErrors.imageUrl ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="https://example.com/image.jpg"
              />
              {validationErrors.imageUrl && <p className="text-sm text-red-600 mt-1">{validationErrors.imageUrl}</p>}
              {formData.imageUrl && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 mb-2">Preview:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-48 h-36 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                    }}
                  />
                </div>
              )}
            </div>

            {/* アフィリエイトリンク */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">アフィリエイトリンク</h3>

              {/* Amazon */}
              <div id="field-amazonUrl">
                <label className="block text-sm text-gray-600 mb-1">
                  <span className="inline-block w-4 h-4 rounded mr-2" style={{ backgroundColor: '#FF9900' }}></span>
                  Amazon URL
                </label>
                <input
                  type="text"
                  value={formData.amazonUrl}
                  onChange={(e) => handleFieldChange('amazonUrl', e.target.value)}
                  onBlur={() => handleBlur('amazonUrl')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4A7C59] ${validationErrors.amazonUrl ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="https://af.moshimo.com/..."
                />
                {validationErrors.amazonUrl && <p className="text-sm text-red-600 mt-1">{validationErrors.amazonUrl}</p>}
              </div>

              {/* 楽天 */}
              <div id="field-rakutenUrl">
                <label className="block text-sm text-gray-600 mb-1">
                  <span className="inline-block w-4 h-4 rounded mr-2" style={{ backgroundColor: '#BF0000' }}></span>
                  楽天市場 URL
                </label>
                <input
                  type="text"
                  value={formData.rakutenUrl}
                  onChange={(e) => handleFieldChange('rakutenUrl', e.target.value)}
                  onBlur={() => handleBlur('rakutenUrl')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4A7C59] ${validationErrors.rakutenUrl ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="https://af.moshimo.com/..."
                />
                {validationErrors.rakutenUrl && <p className="text-sm text-red-600 mt-1">{validationErrors.rakutenUrl}</p>}
              </div>

              {/* Yahoo */}
              <div id="field-yahooUrl">
                <label className="block text-sm text-gray-600 mb-1">
                  <span className="inline-block w-4 h-4 rounded mr-2" style={{ backgroundColor: '#FF0033' }}></span>
                  Yahoo!ショッピング URL
                </label>
                <input
                  type="text"
                  value={formData.yahooUrl}
                  onChange={(e) => handleFieldChange('yahooUrl', e.target.value)}
                  onBlur={() => handleBlur('yahooUrl')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#4A7C59] ${validationErrors.yahooUrl ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="https://af.moshimo.com/..."
                />
                {validationErrors.yahooUrl && <p className="text-sm text-red-600 mt-1">{validationErrors.yahooUrl}</p>}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-lg transition-all text-white disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

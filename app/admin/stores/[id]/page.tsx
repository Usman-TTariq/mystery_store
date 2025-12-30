'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getStoreById,
  updateStore,
  deleteStore,
  Store,
  isSlugUnique,
} from '@/lib/services/storeService';
import { getCategories, Category } from '@/lib/services/categoryService';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';

export default function EditStorePage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<Store>>({});
  const [logoUrl, setLogoUrl] = useState('');
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string>('');
  const [autoGenerateSlug, setAutoGenerateSlug] = useState<boolean>(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploadMethod, setLogoUploadMethod] = useState<'file' | 'url'>('url');
  const [uploadingToCloudinary, setUploadingToCloudinary] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isSupabaseStore, setIsSupabaseStore] = useState(false);
  console.log("storeId: ", storeId);
  console.log("store: ", store);

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Validate slug uniqueness
  const validateSlug = async (slug: string): Promise<boolean> => {
    if (!slug || slug.trim() === '') {
      setSlugError('Slug is required');
      return false;
    }

    // Check slug format (only lowercase letters, numbers, and hyphens)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens');
      return false;
    }

    // Skip Firebase uniqueness check if it's a Supabase store (for now)
    // Ideally, we should check uniqueness against both DBs
    if (isSupabaseStore) {
      setSlugError('');
      return true;
    }

    const isUnique = await isSlugUnique(slug, storeId);
    if (!isUnique) {
      setSlugError('This slug is already taken. Please use a different one.');
      return false;
    }

    setSlugError('');
    return true;
  };

  useEffect(() => {
    const fetchData = async () => {
      const [firebaseStoreData, categoriesData] = await Promise.all([
        getStoreById(storeId),
        getCategories()
      ]);

      let storeData: Store | null = firebaseStoreData;
      let isSupabase = false;

      // If not found in Firebase, try Supabase list API and match by slug or id
      if (!storeData) {
        try {
          const res = await fetch('/api/stores/supabase');
          if (res.ok) {
            const data = await res.json();
            const supabaseList: Store[] = Array.isArray(data?.stores)
              ? (data.stores as Store[])
              : [];

            const matched = supabaseList.find(
              (s) => s.slug === storeId || s.id === storeId
            );

            if (matched) {
              storeData = matched;
              isSupabase = true;
            }
          }
        } catch (supabaseError) {
          console.error('Error fetching store from Supabase for admin edit:', supabaseError);
        }
      }

      if (storeData) {
        setStore(storeData);
        setFormData(storeData);
        setIsSupabaseStore(isSupabase);
        // Check if slug matches auto-generated slug from name
        const autoSlug = generateSlug(storeData.name || '');
        setAutoGenerateSlug(storeData.slug === autoSlug);
        if (storeData.logoUrl) {
          setLogoUrl(storeData.logoUrl);
          setLogoUploadMethod('url'); // Set to URL method if logo exists
          if (isCloudinaryUrl(storeData.logoUrl)) {
            setExtractedLogoUrl(extractOriginalCloudinaryUrl(storeData.logoUrl));
          }
        } else {
          setLogoUploadMethod('file'); // Default to file method if no logo
        }
      }
      setCategories(categoriesData);
      setLoading(false);
    };
    fetchData();
  }, [storeId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Validate slug
    if (!formData.slug || formData.slug.trim() === '') {
      alert('Please enter a slug for the store');
      setSaving(false);
      return;
    }

    const slugValid = await validateSlug(formData.slug);
    if (!slugValid) {
      setSaving(false);
      return;
    }

    // Use Cloudinary URL directly if it's valid, only extract if malformed
    let logoUrlToSave: string | undefined = undefined;
    if (logoUrl && logoUrl.trim() !== '') {
      if (isCloudinaryUrl(logoUrl)) {
        // Check if URL is malformed (has /image/image/upload/)
        if (logoUrl.includes('/image/image/upload/') || logoUrl.match(/res\.cloudinary\.com\/image\//)) {
          // Extract to fix malformed URL
          logoUrlToSave = extractOriginalCloudinaryUrl(logoUrl);
          console.log('🔧 Fixed malformed Cloudinary URL:', { original: logoUrl, fixed: logoUrlToSave });
        } else {
          // Use Cloudinary URL directly (it's already correct)
          logoUrlToSave = logoUrl;
          console.log('✅ Using Cloudinary URL directly:', logoUrlToSave);
        }
      } else {
        // For non-Cloudinary URLs, use as-is
        logoUrlToSave = logoUrl;
      }
    }
    const updates = {
      ...formData,
      ...(logoUrlToSave ? { logoUrl: logoUrlToSave } : {}),
    };

    if (isSupabaseStore) {
      // Update via Supabase PATCH API
      try {
        const payload = {
          store_name: updates.name,
          description: updates.description,
          store_logo_url: updates.logoUrl,
          subStoreName: updates.subStoreName,
          slug: updates.slug,
          seoTitle: updates.seoTitle,
          seoDescription: updates.seoDescription,
          isTrending: updates.isTrending,
          merchant_id: updates.merchantId,
          network_id: updates.networkId,
          tracking_link: updates.trackingLink,
        };

        const res = await fetch(`/api/stores/supabase/by-id/${encodeURIComponent(storeId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          router.push('/admin/stores');
        } else {
          alert(`Failed to update store in Supabase: ${data.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Error updating Supabase store:', err);
        alert('Failed to update store. Check console for details.');
      }
    } else {
      // Update via Firebase
      const result = await updateStore(storeId, updates);
      if (result.success) {
        router.push('/admin/stores');
      }
    }
    setSaving(false);
  };

  // const handleDelete = async () => {
  //   if (!window.confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
  //     return;
  //   }

  //   setDeleting(true);

  //   if (isSupabaseStore) {
  //     try {
  //       const res = await fetch(`/api/stores/supabase/by-id/${encodeURIComponent(storeId)}`, {
  //         method: 'DELETE',
  //       });
  //       const data = await res.json();

  //       if (res.ok && data.success) {
  //         router.push('/admin/stores');
  //       } else {
  //         alert(`Failed to delete store from Supabase: ${data.error || 'Unknown error'}`);
  //       }
  //     } catch (err) {
  //       console.error('Error deleting Supabase store:', err);
  //       alert('Failed to delete store. Check console for details.');
  //     }
  //   } else { 
  //     // Delete via Firebase
  //     const result = await deleteStore(storeId);
  //     if (result.success) {
  //       router.push('/admin/stores');
  //     } else {
  //       alert('Failed to delete store from Firebase.');
  //     }
  //   }
  //   setDeleting(false);
  // };

  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    if (isCloudinaryUrl(url)) {
      const extracted = extractOriginalCloudinaryUrl(url);
      setExtractedLogoUrl(extracted);
    } else {
      setExtractedLogoUrl(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading store...</div>;
  }

  if (!store) {
    return <div className="text-center py-12">Store not found</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 font-semibold"
        >
          ← Back
        </button>

      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Store</h1>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                Store Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    // Auto-generate slug from name only if auto-generate is enabled
                    slug: autoGenerateSlug ? generateSlug(name) : formData.slug
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="subStoreName" className="block text-sm font-semibold text-gray-700 mb-1">
                Sub Store Name (Displayed on store page)
              </label>
              <input
                id="subStoreName"
                name="subStoreName"
                type="text"
                value={formData.subStoreName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, subStoreName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                This name will be displayed on the store page when visiting the store
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="merchantId" className="block text-sm font-semibold text-gray-700 mb-1">
                Merchant ID
              </label>
              <input
                id="merchantId"
                name="merchantId"
                type="text"
                placeholder="Merchant ID (e.g., 266908)"
                value={formData.merchantId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, merchantId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="networkId" className="block text-sm font-semibold text-gray-700 mb-1">
                Network ID
              </label>
              <input
                id="networkId"
                name="networkId"
                type="text"
                placeholder="Network ID (e.g., 2)"
                value={formData.networkId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, networkId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="trackingLink" className="block text-sm font-semibold text-gray-700 mb-1">
              Tracking Link (Affiliate URL)
            </label>
            <input
              id="trackingLink"
              name="trackingLink"
              type="url"
              placeholder="https://example.com/track?id=123"
              value={formData.trackingLink || ''}
              onChange={(e) =>
                setFormData({ ...formData, trackingLink: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Affiliate tracking URL for this store
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="slug" className="block text-sm font-semibold text-gray-700">
                  Slug (URL-friendly name)
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoGenerateSlug}
                    onChange={(e) => {
                      const isAuto = e.target.checked;
                      setAutoGenerateSlug(isAuto);
                      // If enabling auto-generate, update slug from name
                      if (isAuto && formData.name) {
                        setFormData({ ...formData, slug: generateSlug(formData.name) });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span>Auto-generate from name</span>
                </label>
              </div>
              <input
                id="slug"
                name="slug"
                type="text"
                placeholder={autoGenerateSlug ? "Auto-generated from name" : "Enter custom slug (e.g., nike-store)"}
                value={formData.slug || ''}
                onChange={async (e) => {
                  // If auto-generate is enabled, don't allow manual editing
                  if (autoGenerateSlug) return;

                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setFormData({ ...formData, slug });
                  if (slug) {
                    await validateSlug(slug);
                  } else {
                    setSlugError('');
                  }
                }}
                disabled={autoGenerateSlug}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${slugError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  } ${autoGenerateSlug ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                required
              />
              {slugError && (
                <p className="mt-1 text-xs text-red-600">{slugError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                URL will be: /stores/{formData.slug || 'slug'}
                {autoGenerateSlug && <span className="text-blue-600 ml-2">(Auto-generated)</span>}
              </p>
            </div>
          </div>


          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">SEO Settings (Browser Tab Hover)</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="seoTitle" className="block text-sm font-semibold text-gray-700 mb-1">
                  SEO Title
                </label>
                <input
                  id="seoTitle"
                  name="seoTitle"
                  type="text"
                  placeholder="e.g., Kohl's US - Best Coupons & Deals 2025"
                  value={formData.seoTitle || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, seoTitle: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={60}
                />
                <p className="mt-1 text-xs text-gray-500">
                  This title will appear when hovering over the browser tab. Recommended: 50-60 characters.
                  {formData.seoTitle && <span className="ml-2 text-blue-600">({formData.seoTitle.length} characters)</span>}
                </p>
              </div>
              <div>
                <label htmlFor="seoDescription" className="block text-sm font-semibold text-gray-700 mb-1">
                  SEO Description
                </label>
                <textarea
                  id="seoDescription"
                  name="seoDescription"
                  placeholder="e.g., Get exclusive Kohl's coupons and promo codes. Save up to 50% on fashion, home, and more!"
                  value={formData.seoDescription || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, seoDescription: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={160}
                />
                <p className="mt-1 text-xs text-gray-500">
                  This description will appear when hovering over the browser tab. Recommended: 150-160 characters.
                  {formData.seoDescription && <span className="ml-2 text-blue-600">({formData.seoDescription.length} characters)</span>}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-700 mb-1">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId || ''}
              onChange={(e) => {
                const categoryId = e.target.value || null;
                setFormData({ ...formData, categoryId });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Assign this store to a category
            </p>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Logo Upload Method</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="logoUploadMethod"
                  value="file"
                  checked={logoUploadMethod === 'file'}
                  onChange={(e) => {
                    setLogoUploadMethod('file');
                    setLogoUrl('');
                    setExtractedLogoUrl(null);
                  }}
                  className="mr-2"
                />
                File Upload
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="logoUploadMethod"
                  value="url"
                  checked={logoUploadMethod === 'url'}
                  onChange={(e) => {
                    setLogoUploadMethod('url');
                    setLogoFile(null);
                  }}
                  className="mr-2"
                />
                URL (Cloudinary)
              </label>
            </div>

            {logoUploadMethod === 'file' ? (
              <>
                <label htmlFor="logo" className="sr-only">Logo (PNG / SVG / JPG)</label>
                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/jpg,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] ?? null;
                    setLogoFile(file);

                    if (file) {
                      // Show preview immediately
                      setLogoPreview(URL.createObjectURL(file));

                      // Automatically upload to Cloudinary
                      setUploadingToCloudinary(true);
                      try {
                        // Convert file to base64
                        const base64 = await new Promise<string>((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const result = reader.result as string;
                            const base64 = result.split(',')[1]; // Remove data URL prefix
                            resolve(base64);
                          };
                          reader.onerror = reject;
                          reader.readAsDataURL(file);
                        });

                        // Upload to Cloudinary via API
                        const uploadResponse = await fetch('/api/coupons/upload', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            fileName: file.name,
                            contentType: file.type || 'image/png',
                            base64: base64,
                          }),
                        });

                        const uploadData = await uploadResponse.json();

                        if (uploadData.success && uploadData.logoUrl) {
                          // Set the Cloudinary URL automatically
                          const cloudinaryUrl = uploadData.logoUrl;
                          setLogoUrl(cloudinaryUrl);
                          setExtractedLogoUrl(cloudinaryUrl);

                          // Switch to URL method to show the uploaded URL
                          setLogoUploadMethod('url');

                          console.log('✅ Logo uploaded to Cloudinary:', cloudinaryUrl);
                          alert('✅ Logo uploaded to Cloudinary successfully! URL has been set.');
                        } else {
                          console.error('❌ Upload failed:', uploadData.error);
                          alert(`Upload failed: ${uploadData.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        console.error('❌ Error uploading to Cloudinary:', error);
                        alert(`Error uploading: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      } finally {
                        setUploadingToCloudinary(false);
                      }
                    } else {
                      setLogoPreview(null);
                      setLogoUrl('');
                      setExtractedLogoUrl(null);
                    }
                  }}
                  className="w-full"
                  key={`file-input-${fileInputKey}`}
                  disabled={uploadingToCloudinary}
                />
                {uploadingToCloudinary && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Uploading to Cloudinary...</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <label htmlFor="logoUrl" className="block text-gray-700 text-sm font-semibold mb-2">
                  Logo URL (Cloudinary URL)
                </label>
                <input
                  id="logoUrl"
                  name="logoUrl"
                  type="url"
                  value={logoUrl || ''}
                  onChange={(e) => handleLogoUrlChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://res.cloudinary.com/..."
                />
                {extractedLogoUrl && extractedLogoUrl !== logoUrl && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                    <strong>Extracted Original URL:</strong>
                    <div className="mt-1 break-all text-xs">{extractedLogoUrl}</div>
                  </div>
                )}
              </>
            )}

            {/* Show Cloudinary URL if uploaded */}
            {logoUrl && logoUploadMethod === 'url' && (
              <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                <strong>✅ Uploaded to Cloudinary:</strong>
                <div className="mt-1 break-all text-xs">{logoUrl}</div>
              </div>
            )}

            {/* Logo Preview */}
            {(logoPreview || logoUrl) && (
              <div className="mt-2">
                <img
                  src={logoPreview || (extractedLogoUrl || logoUrl)}
                  alt="Logo preview"
                  className="h-16 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                id="isTrending"
                name="isTrending"
                type="checkbox"
                checked={formData.isTrending || false}
                onChange={(e) => {
                  const isTrending = e.target.checked;
                  setFormData({
                    ...formData,
                    isTrending,
                    // Clear layout position if trending is disabled
                    layoutPosition: isTrending ? formData.layoutPosition : null
                  });
                }}
                className="w-4 h-4 rounded mr-2"
              />
              <label htmlFor="isTrending" className="text-gray-700">
                Mark as Trending
              </label>
            </div>

            <div>
              <label htmlFor="layoutPosition" className="block text-sm font-semibold text-gray-700 mb-1">
                Layout Position (1-8)
              </label>
              <select
                id="layoutPosition"
                name="layoutPosition"
                value={formData.layoutPosition || ''}
                onChange={(e) => {
                  const position = e.target.value ? parseInt(e.target.value) : null;
                  setFormData({
                    ...formData,
                    layoutPosition: position,
                    // Auto-enable trending if layout position is assigned
                    isTrending: position !== null ? true : formData.isTrending
                  });
                }}
                disabled={!formData.isTrending && !formData.layoutPosition}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not Assigned</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                  <option key={pos} value={pos}>
                    Layout {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

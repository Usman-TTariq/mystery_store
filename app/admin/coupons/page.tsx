'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getCoupons,
  createCoupon,
  createCouponFromUrl,
  updateCoupon,
  deleteCoupon,
  Coupon,
} from '@/lib/services/couponService';
import { getCategories, Category } from '@/lib/services/categoryService';
import Link from 'next/link';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';
import { getStores, Store } from '@/lib/services/storeService';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    storeName: '',
    discount: 0,
    discountType: 'percentage',
    description: '',
    isActive: true,
    maxUses: 100,
    currentUses: 0,
    expiryDate: null,
    isPopular: false,
    layoutPosition: null,
    isLatest: false,
    latestLayoutPosition: null,
    categoryId: null,
    couponType: 'code',
    getCodeText: '',
    getDealText: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploadMethod, setLogoUploadMethod] = useState<'file' | 'url'>('file');
  const [logoUrl, setLogoUrl] = useState('');
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);
  const [uploadingToCloudinary, setUploadingToCloudinary] = useState(false);
  const [couponUrl, setCouponUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [storeSearchQuery, setStoreSearchQuery] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 22;
  const storeDropdownRef = useRef<HTMLDivElement>(null);
  // console.log("coupons: ", coupons);

  const [uploadingBulkCoupons, setUploadingBulkCoupons] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPreviewRows, setUploadPreviewRows] = useState<string[][]>([]);
  const [uploadPreviewError, setUploadPreviewError] = useState<string | null>(null);

  const parseCsv = (text: string): string[][] => {
    const rows: string[][] = [];
    const lines = text.split(/\r?\n/);
    let currentLine = '';
    let inQuotes = false;

    const pushLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const cells = line
        // Split on commas that are not inside quotes
        .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map((cell) =>
          cell
            .replace(/^"|"$/g, '') // remove surrounding quotes
            .replace(/""/g, '"') // unescape double quotes
            .trim()
        );
      rows.push(cells);
    };

    for (const line of lines) {
      if (!inQuotes) {
        currentLine = line;
      } else {
        currentLine += `\n${line}`;
      }

      // Walk characters to track quotes, taking into account escaped double quotes ("")
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          const isEscaped = i + 1 < line.length && line[i + 1] === '"';
          if (isEscaped) {
            i++; // skip the escaped quote
          } else {
            inQuotes = !inQuotes;
          }
        }
      }

      if (!inQuotes) {
        pushLine(currentLine);
        currentLine = '';
      }
    }

    // Handle any remaining buffered line
    if (currentLine && !inQuotes) {
      pushLine(currentLine);
    }

    return rows;
  };

  const handleCouponsFileChange = (file: File | null) => {
    if (!file) {
      setUploadPreviewRows([]);
      setUploadPreviewError(null);
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      // Handle CSV files
      file
        .text()
        .then((text) => {
          const rows = parseCsv(text);
          setUploadPreviewRows(rows);
          setUploadPreviewError(null);
        })
        .catch((error) => {
          console.error('Error reading CSV file:', error);
          setUploadPreviewRows([]);
          setUploadPreviewError('Failed to read CSV file. Please try again.');
        });
    } else if (extension === 'xlsx' || extension === 'xls') {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const XLSX = require('xlsx');
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          setUploadPreviewRows(jsonData as string[][]);
          setUploadPreviewError(null);
        } catch (error) {
          console.error('Error reading Excel file:', error);
          setUploadPreviewRows([]);
          setUploadPreviewError('Failed to read Excel file. Please try again.');
        }
      };
      reader.onerror = () => {
        setUploadPreviewRows([]);
        setUploadPreviewError('Failed to read Excel file. Please try again.');
      };
      reader.readAsBinaryString(file);
    } else {
      setUploadPreviewRows([]);
      setUploadPreviewError('Please upload a CSV or Excel (.xlsx, .xls) file.');
    }

    file
      .text()
      .then((text) => {
        const rows = parseCsv(text);
        setUploadPreviewRows(rows);
        setUploadPreviewError(null);
      })
      .catch((error) => {
        console.error('Error reading CSV file:', error);
        setUploadPreviewRows([]);
        setUploadPreviewError('Failed to read CSV file. Please try again.');
      });
  };

  const normalizeBoolean = (value: string | undefined | null): boolean => {
    if (!value) return false;
    const v = value.toString().trim().toLowerCase();
    return ['true', '1', 'yes', 'y', 't'].includes(v);
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadPreviewRows.length) {
      setUploadPreviewError('Please select a CSV file before uploading.');
      return;
    }

    const [headerRow, ...dataRows] = uploadPreviewRows;
    if (!headerRow || !dataRows.length) {
      setUploadPreviewError('The CSV file appears to be empty.');
      return;
    }

    const header = headerRow.map((h) => h.toString().trim().toLowerCase());
    const indexOf = (name: string) => header.indexOf(name.toLowerCase());

    // Support both old CSV format and new Excel format
    const idxStoreName = indexOf('store name');
    const idxTitle = indexOf('title');
    const idxCouponType = indexOf('coupontype') !== -1 ? indexOf('coupontype') : indexOf('type');
    const idxCode = indexOf('code');
    const idxCategoryId = indexOf('categoryid');
    const idxCurrentUses = indexOf('currentuses');
    const idxDescription = indexOf('description');
    const idxDiscount = indexOf('discount');
    const idxDiscountType = indexOf('discounttype');
    const idxExpiryDate = indexOf('expirydate') !== -1 ? indexOf('expirydate') : indexOf('expiry');
    const idxGetCodeText = indexOf('getcodetext');
    const idxGetDealText = indexOf('getdealtext') !== -1 ? indexOf('getdealtext') : indexOf('deal');
    const idxIsActive = indexOf('isactive');
    const idxIsLatest = indexOf('islatest');
    const idxIsPopular = indexOf('ispopular');
    const idxLatestLayoutPosition = indexOf('latestlayoutposition');
    const idxLayoutPosition = indexOf('layoutposition');
    const idxLogoUrl = indexOf('logourl');
    const idxMaxUses = indexOf('maxuses');
    const idxStoreId = indexOf('store_id');
    const idxUrl = indexOf('url') !== -1 ? indexOf('url') : (indexOf('tracking link') !== -1 ? indexOf('tracking link') : indexOf('coupon url'));

    // Either store_id or store name is required
    if (idxStoreId === -1 && idxStoreName === -1) {
      setUploadPreviewError('File must include either "store_id" or "Store Name" column.');
      return;
    }

    const supabaseRows = dataRows
      .map((row) => {
        let store_id = idxStoreId !== -1 ? parseInt(row[idxStoreId] || '0', 10) : 0;

        // If no store_id, try to find store by name
        if (!store_id && idxStoreName !== -1) {
          const storeName = row[idxStoreName]?.toString().trim();
          if (storeName) {
            const foundStore = stores.find(s =>
              s.name?.toLowerCase() === storeName.toLowerCase()
            );
            if (foundStore && foundStore.storeId) {
              store_id = foundStore.storeId;
            }
          }
        }

        if (!store_id) return null;

        // Use Title if available, otherwise use Description
        const description = idxTitle !== -1 && row[idxTitle]
          ? row[idxTitle]
          : (idxDescription !== -1 ? row[idxDescription] : null);

        return {
          store_id,
          couponType: idxCouponType !== -1 ? (row[idxCouponType]?.toString().toLowerCase() === 'deal' ? 'deal' : 'code') : 'code',
          code: idxCode !== -1 ? row[idxCode] || null : null,
          categoryId: idxCategoryId !== -1 ? row[idxCategoryId] || null : null,
          currentUses: idxCurrentUses !== -1 ? parseInt(row[idxCurrentUses] || '0', 10) : 0,
          description,
          discount: idxDiscount !== -1 ? parseFloat(row[idxDiscount] || '0') : 0,
          discountType: idxDiscountType !== -1 ? row[idxDiscountType] || 'percentage' : 'percentage',
          expiryDate: idxExpiryDate !== -1 ? row[idxExpiryDate] || null : null,
          getCodeText: idxGetCodeText !== -1 ? row[idxGetCodeText] || null : null,
          getDealText: idxGetDealText !== -1 ? row[idxGetDealText] || null : null,
          isActive: idxIsActive !== -1 ? normalizeBoolean(row[idxIsActive]) : true,
          isLatest: idxIsLatest !== -1 ? normalizeBoolean(row[idxIsLatest]) : false,
          isPopular: idxIsPopular !== -1 ? normalizeBoolean(row[idxIsPopular]) : false,
          latestLayoutPosition: idxLatestLayoutPosition !== -1 ? (parseInt(row[idxLatestLayoutPosition] || '0', 10) || null) : null,
          layoutPosition: idxLayoutPosition !== -1 ? (parseInt(row[idxLayoutPosition] || '0', 10) || null) : null,
          logoUrl: idxLogoUrl !== -1 ? row[idxLogoUrl] || null : null,
          maxUses: idxMaxUses !== -1 ? parseInt(row[idxMaxUses] || '0', 10) : 100,
          url: idxUrl !== -1 ? row[idxUrl] || null : null,
        };
      })
      .filter((row) => row !== null);

    if (!supabaseRows.length) {
      setUploadPreviewError('No valid data rows found in CSV.');
      return;
    }

    setUploadingBulkCoupons(true);
    setUploadPreviewError(null);

    try {
      const response = await fetch('/api/coupons/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: supabaseRows }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Bulk upload failed.');
      }

      alert(`Successfully uploaded ${supabaseRows.length} coupons.`);
      setShowUploadModal(false);
      setUploadPreviewRows([]);
      setUploadPreviewError(null);
      fetchCoupons();
    } catch (error) {
      console.error('Bulk upload error:', error);
      setUploadPreviewError(
        error instanceof Error ? error.message : 'Failed to upload coupons. Please try again.'
      );
    } finally {
      setUploadingBulkCoupons(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
        setIsStoreDropdownOpen(false);
      }
    };

    if (isStoreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStoreDropdownOpen]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const [firebaseCoupons, supabaseResponse] = await Promise.all([
        getCoupons(),
        fetch('/api/coupons/supabase')
          .then((res) => res.json())
          .catch((err) => {
            console.error('Error fetching Supabase coupons in admin fetchCoupons:', err);
            return { success: false, coupons: [] };
          }),
      ]);

      const supabaseList: Coupon[] = Array.isArray(supabaseResponse?.coupons)
        ? (supabaseResponse.coupons as Coupon[])
        : [];

      setCoupons([...firebaseCoupons, ...supabaseList]);
    } catch (err) {
      console.error('Error fetching coupons in admin fetchCoupons:', err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [firebaseCoupons, categoriesData, storesData, supabaseResponse] = await Promise.all([
          getCoupons(),
          getCategories(),
          getStores(),
          fetch('/api/coupons/supabase')
            .then((res) => res.json())
            .catch((err) => {
              console.error('Error fetching Supabase coupons in admin load:', err);
              return { success: false, coupons: [] };
            }),
        ]);

        const supabaseList: Coupon[] = Array.isArray(supabaseResponse?.coupons)
          ? (supabaseResponse.coupons as Coupon[])
          : [];

        setCoupons([...firebaseCoupons, ...supabaseList]);
        setCategories(categoriesData);
        setStores(storesData);
      } catch (err) {
        console.error('Error loading admin coupons page data:', err);
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isCreating) return; // Prevent double submission

    setIsCreating(true);

    // Validate coupon code only if coupon type is 'code'
    if (formData.couponType === 'code' && (!formData.code || formData.code.trim() === '')) {
      alert('Please enter a coupon code (required for code type coupons)');
      setIsCreating(false);
      return;
    }

    // Validate required fields
    if (!formData.storeName || formData.storeName.trim() === '') {
      alert('Please enter a store name (Coupon Title)');
      setIsCreating(false);
      return;
    }

    // Check if popular layout position is already taken
    if (formData.layoutPosition && formData.isPopular) {
      const couponsAtPosition = coupons.filter(
        c => c.id && c.layoutPosition === formData.layoutPosition && c.isPopular
      );
      if (couponsAtPosition.length > 0) {
        if (!confirm(`Popular Layout ${formData.layoutPosition} is already assigned to "${couponsAtPosition[0].code}". Replace it?`)) {
          return;
        }
        // Clear position from other coupon
        await updateCoupon(couponsAtPosition[0].id!, { layoutPosition: null });
      }
    }

    // Check if latest layout position is already taken
    if (formData.latestLayoutPosition && formData.isLatest) {
      const couponsAtPosition = coupons.filter(
        c => c.id && c.latestLayoutPosition === formData.latestLayoutPosition && c.isLatest
      );
      if (couponsAtPosition.length > 0) {
        if (!confirm(`Latest Layout ${formData.latestLayoutPosition} is already assigned to "${couponsAtPosition[0].code}". Replace it?`)) {
          return;
        }
        // Clear position from other coupon
        await updateCoupon(couponsAtPosition[0].id!, { latestLayoutPosition: null });
      }
    }

    // Only set layoutPosition if coupon is popular
    const layoutPositionToSave = formData.isPopular ? formData.layoutPosition : null;
    // Only set latestLayoutPosition if coupon is latest
    const latestLayoutPositionToSave = formData.isLatest ? formData.latestLayoutPosition : null;

    // Prepare coupon data
    const couponData: any = {
      ...formData,
      discountType: 'percentage', // Always use percentage
      layoutPosition: layoutPositionToSave,
      latestLayoutPosition: latestLayoutPositionToSave,
    };

    // For deal type, don't include code field
    if (formData.couponType === 'deal') {
      delete couponData.code;
    }

    // Always include storeIds (even if empty array) to ensure it's saved
    // Filter out any undefined/null values
    const validStoreIds = selectedStoreIds.filter(id => id && id.trim() !== '');
    couponData.storeIds = validStoreIds.length > 0 ? validStoreIds : [];

    // Debug log
    console.log('📝 Creating coupon with data:', {
      storeName: couponData.storeName,
      storeIds: couponData.storeIds,
      selectedStoreIds: selectedStoreIds,
      validStoreIds: validStoreIds,
      logoUrl: logoUrl,
      logoUploadMethod: logoUploadMethod,
      hasLogoFile: !!logoFile
    });

    try {
      let result;

      // If logoUrl is set (from Cloudinary upload), use URL method
      // Otherwise, if file is selected, try to upload it
      if (logoUrl && logoUrl.trim() !== '') {
        // Use the Cloudinary URL that was automatically uploaded
        console.log('Creating coupon with Cloudinary URL:', logoUrl);
        result = await createCouponFromUrl(couponData as Omit<Coupon, 'id'>, logoUrl);
      } else if (logoUploadMethod === 'file' && logoFile) {
        // File upload method - upload to Cloudinary first, then create coupon
        console.log('Creating coupon with file upload, logoFile:', logoFile);
        result = await createCoupon(couponData as Omit<Coupon, 'id'>, logoFile || undefined);
      } else {
        // URL method - logoUrl is optional
        console.log('Creating coupon with URL, logoUrl:', logoUrl);
        result = await createCouponFromUrl(couponData as Omit<Coupon, 'id'>, logoUrl || undefined);
      }

      if (result.success) {
        alert('Coupon created successfully!');
        fetchCoupons();
        setShowForm(false);
        setFormData({
          code: '',
          storeName: '',
          discount: 0,
          discountType: 'percentage',
          description: '',
          url: '',
          isActive: true,
          maxUses: 100,
          currentUses: 0,
          expiryDate: null,
          isPopular: false,
          layoutPosition: null,
          isLatest: false,
          latestLayoutPosition: null,
          categoryId: null,
          couponType: 'code',
          getCodeText: '',
          getDealText: '',
        });
        setLogoFile(null);
        setLogoPreview(null);
        setLogoUrl('');
        setExtractedLogoUrl(null);
        setCouponUrl('');
        setFileInputKey(prev => prev + 1);
        setSelectedStoreIds([]); // Reset selected stores
        setUploadingToCloudinary(false); // Reset upload state
        setLogoUploadMethod('file'); // Reset to file method
      } else {
        // Show error message
        const errorMessage = result.error instanceof Error
          ? result.error.message
          : typeof result.error === 'string'
            ? result.error
            : 'Failed to create coupon. Please check console for details.';
        alert(`Error: ${errorMessage}`);
        console.error('Coupon creation failed:', result.error);
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert(`Error creating coupon: ${error instanceof Error ? error.message : 'Unknown error. Please check console.'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleExtractFromUrl = async () => {
    if (!couponUrl.trim()) {
      alert('Please enter a URL');
      return;
    }

    setExtracting(true);
    try {
      const response = await fetch('/api/stores/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: couponUrl }),
      });

      const data = await response.json();

      if (data.success) {
        // Auto-populate form fields
        setFormData({
          ...formData,
          storeName: data.name || formData.storeName || '',
          description: data.description || formData.description || '',
          url: data.siteUrl || formData.url || '',
        });

        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          handleLogoUrlChange(data.logoUrl);
          // Switch to URL upload method if logo is extracted
          setLogoUploadMethod('url');
        }

        // Show success message
        alert(`Successfully extracted data from ${data.name || 'the website'}!`);
      } else {
        alert(`Failed to extract metadata: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      alert('Failed to extract metadata. Please check the URL and try again.');
    } finally {
      setExtracting(false);
    }
  };

  const handleLogoUrlChange = (url: string) => {
    let finalUrl = url;

    // Smart detection: If URL looks like a website (not an image), convert to favicon
    if (url && !isCloudinaryUrl(url)) {
      try {
        const urlObj = new URL(url);
        // Check if it's NOT an image URL (no image extension)
        const isImageUrl = /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(urlObj.pathname);

        if (!isImageUrl) {
          // It's a website URL, convert to favicon
          finalUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
          console.log('🔄 Auto-converted website URL to favicon:', url, '→', finalUrl);
        }
      } catch (e) {
        // Invalid URL, use as-is
      }
    }

    setLogoUrl(finalUrl);
    if (isCloudinaryUrl(finalUrl)) {
      const extracted = extractOriginalCloudinaryUrl(finalUrl);
      setExtractedLogoUrl(extracted);
      setLogoPreview(extracted);
    } else {
      setExtractedLogoUrl(null);
      setLogoPreview(finalUrl);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        // Try deleting from Supabase first (no-op for Firebase-only coupons)
        try {
          await fetch(`/api/coupons/supabase/by-id/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          });
        } catch (supabaseErr) {
          console.error('Error deleting Supabase coupon (ignored if not Supabase):', supabaseErr);
        }

        // Always delete from Firebase as well (no-op if not there)
        await deleteCoupon(id);
      } finally {
        fetchCoupons();
      }
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    if (coupon.id) {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      fetchCoupons();
    }
  };

  const handleToggleLatest = async (coupon: Coupon) => {
    if (coupon.id) {
      const newLatestStatus = !coupon.isLatest;
      // If removing from latest, also clear layout position
      const updates: Partial<Coupon> = {
        isLatest: newLatestStatus,
        ...(newLatestStatus ? {} : { latestLayoutPosition: null })
      };
      await updateCoupon(coupon.id, updates);
      fetchCoupons();
    }
  };

  const handleTogglePopular = async (coupon: Coupon) => {
    if (coupon.id) {
      const newPopularStatus = !coupon.isPopular;
      // If removing from popular, also clear layout position
      const updates: Partial<Coupon> = {
        isPopular: newPopularStatus,
        ...(newPopularStatus ? {} : { layoutPosition: null })
      };
      await updateCoupon(coupon.id, updates);
      fetchCoupons();
    }
  };

  const handleAssignLatestLayoutPosition = async (coupon: Coupon, position: number | null) => {
    if (!coupon.id) return;

    // Check if position is already taken by another coupon
    if (position !== null) {
      const couponsAtPosition = coupons.filter(
        c => c.id !== coupon.id && c.latestLayoutPosition === position && c.isLatest
      );
      if (couponsAtPosition.length > 0) {
        if (!confirm(`Latest Layout ${position} is already assigned to "${couponsAtPosition[0].code}". Replace it?`)) {
          return;
        }
        // Clear position from other coupon
        await updateCoupon(couponsAtPosition[0].id!, { latestLayoutPosition: null });
      }
    }

    await updateCoupon(coupon.id, { latestLayoutPosition: position });
    fetchCoupons();
  };

  const handleAssignLayoutPosition = async (coupon: Coupon, position: number | null) => {
    if (!coupon.id) return;

    // Check if position is already taken by another coupon
    if (position !== null) {
      const couponsAtPosition = coupons.filter(
        c => c.id !== coupon.id && c.layoutPosition === position && c.isPopular
      );
      if (couponsAtPosition.length > 0) {
        if (!confirm(`Popular Layout ${position} is already assigned to "${couponsAtPosition[0].code}". Replace it?`)) {
          return;
        }
        // Clear position from other coupon
        await updateCoupon(couponsAtPosition[0].id!, { layoutPosition: null });
      }
    }

    await updateCoupon(coupon.id, { layoutPosition: position });
    fetchCoupons();
  };

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter coupons based on search query
  const filteredCoupons = searchQuery.trim() === ''
    ? coupons
    : coupons.filter(coupon =>
      coupon.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / pageSize));
  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Coupons</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setUploadPreviewRows([]);
              setUploadPreviewError(null);
              setShowUploadModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition whitespace-nowrap"
          >
            Upload Coupons
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            {showForm ? 'Cancel' : 'Create New Coupon'}
          </button>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Upload Coupons</h2>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close upload modal"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleBulkUpload}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="couponsUploadFile"
                  className="block text-gray-700 text-sm font-semibold mb-2"
                >
                  Select file to upload
                </label>
                <input
                  id="couponsUploadFile"
                  name="couponsUploadFile"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    handleCouponsFileChange(file);
                  }}
                  className="cursor-pointer w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supports CSV files containing coupon data.
                </p>
              </div>

              <div>
                <div className="text-gray-700 text-sm font-semibold mb-2">Expected Columns for Coupons:</div>
                <div className="text-gray-500 text-xs">
                  <ul className="list-disc list-inside flex flex-wrap gap-2">
                    <li>store_id</li>
                    <li>couponType</li>
                    <li>code</li>
                    <li>description</li>
                    <li>discount</li>
                    <li>discountType</li>
                    <li>expiryDate</li>
                    <li>isActive</li>
                    <li>isLatest</li>
                    <li>isPopular</li>
                    <li>logoUrl</li>
                    <li>maxUses</li>
                    <li>url</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="text-gray-700 text-sm font-semibold mb-2">
                  Preview (first 50 rows)
                </div>
                {uploadPreviewError && (
                  <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {uploadPreviewError}
                  </div>
                )}
                {uploadPreviewRows.length === 0 ? (
                  <div className="rounded border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-center text-xs text-gray-400">
                    Select a CSV file to see a preview here.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-auto rounded border border-gray-200 bg-white">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          {uploadPreviewRows[0].map((header, index) => (
                            <th
                              key={index}
                              className="whitespace-nowrap px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200"
                            >
                              {header || `Column ${index + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadPreviewRows.slice(1, 51).map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="whitespace-nowrap px-3 py-1 border-b border-gray-100 text-gray-700"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="cursor-pointer px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingBulkCoupons}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingBulkCoupons ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Bar - Always Visible */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <label htmlFor="searchStore" className="block text-sm font-semibold text-gray-700 mb-2">
            Search by Store Name or Coupon Code
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                id="searchStore"
                type="text"
                placeholder="Enter store name or coupon code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredCoupons.length}</span> of{' '}
              <span className="font-semibold">{coupons.length}</span> coupons
            </p>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Create New Coupon
          </h2>

          {/* URL Extraction Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label htmlFor="couponUrl" className="block text-gray-700 text-sm font-semibold mb-2">
              Extract Coupon Info from URL (e.g., nike.com, amazon.com)
            </label>
            <div className="flex gap-2">
              <input
                id="couponUrl"
                name="couponUrl"
                type="text"
                value={couponUrl || ''}
                onChange={(e) => setCouponUrl(e.target.value)}
                placeholder="Enter website URL (e.g., nike.com or https://nike.com)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={extracting || !couponUrl.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extracting ? 'Extracting...' : 'Extract Info'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              This will automatically extract description and logo from the website.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Store Selection - Multi-Select Dropdown */}
            <div>
              <label className="block text-gray-900 text-sm font-bold mb-2">
                Select Stores (Optional)
              </label>
              <div className="relative" ref={storeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
                >
                  <span className="text-gray-700">
                    {selectedStoreIds.length === 0
                      ? 'Select stores...'
                      : `${selectedStoreIds.length} store${selectedStoreIds.length > 1 ? 's' : ''} selected`}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isStoreDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isStoreDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 bg-gray-50">
                      <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={storeSearchQuery}
                        onChange={(e) => setStoreSearchQuery(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Store List */}
                    <div className="overflow-y-auto">
                      {stores.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No stores available</div>
                      ) : (
                        (() => {
                          const filteredStores = stores.filter(store => {
                            if (!storeSearchQuery.trim()) return true;
                            const query = storeSearchQuery.toLowerCase();
                            const matchesName = store.name?.toLowerCase().includes(query);
                            const matchesId = store.storeId?.toString().includes(query);
                            return matchesName || matchesId;
                          });

                          return filteredStores.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500">No stores found for "{storeSearchQuery}"</div>
                          ) : (
                            filteredStores.map((store) => {
                              const isSelected = selectedStoreIds.includes(store.id!);
                              return (
                                <label
                                  key={store.id}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        const newSelectedIds = [...selectedStoreIds, store.id!];
                                        setSelectedStoreIds(newSelectedIds);

                                        // Auto-fetch logo from first selected store
                                        if (newSelectedIds.length === 1) {
                                          let logoToUse = '';

                                          // Priority 1: Use store's logoUrl if available
                                          if (store.logoUrl && store.logoUrl.trim() !== '') {
                                            logoToUse = store.logoUrl;
                                            console.log('✅ Using store logoUrl');
                                          }
                                          // Priority 2: Use favicon from tracking link or website URL
                                          else if (store.trackingLink || store.websiteUrl) {
                                            const siteUrl = store.trackingLink || store.websiteUrl;
                                            try {
                                              // Extract full URL for favicon
                                              const url = new URL(siteUrl!);
                                              // Use simple Google favicon API (most reliable)
                                              logoToUse = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
                                              console.log('✅ Using favicon from:', url.hostname, '→', logoToUse);
                                            } catch (e) {
                                              console.log('⚠️ Invalid URL:', siteUrl);
                                            }
                                          }

                                          if (logoToUse) {
                                            setLogoUrl(logoToUse);
                                            handleLogoUrlChange(logoToUse);
                                            setLogoUploadMethod('url');
                                            console.log('✅ Auto-populated logo:', logoToUse);
                                          }
                                        }
                                      } else {
                                        setSelectedStoreIds(selectedStoreIds.filter(id => id !== store.id));
                                      }
                                    }}
                                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {store.storeId && <span className="font-mono text-blue-600 mr-2">#{store.storeId}</span>}
                                    {store.name}
                                  </span>
                                </label>
                              );
                            })
                          );
                        })()
                      )}
                    </div>
                  </div>
                )}
                {selectedStoreIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedStoreIds.map((storeId) => {
                      const store = stores.find(s => s.id === storeId);
                      if (!store) return null;
                      return (
                        <span
                          key={storeId}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                        >
                          {store.name}
                          <button
                            type="button"
                            onClick={() => setSelectedStoreIds(selectedStoreIds.filter(id => id !== storeId))}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select one or more stores to associate with this coupon. Leave empty if not store-specific.
              </p>
            </div>
            {/* Coupon Type Selection */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Coupon Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="couponType"
                    value="code"
                    checked={formData.couponType === 'code'}
                    onChange={(e) =>
                      setFormData({ ...formData, couponType: 'code' as const, code: formData.code || '' })
                    }
                    className="mr-2"
                  />
                  Code
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="couponType"
                    value="deal"
                    checked={formData.couponType === 'deal'}
                    onChange={(e) =>
                      setFormData({ ...formData, couponType: 'deal' as const, code: '' })
                    }
                    className="mr-2"
                  />
                  Deal
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select whether this is a coupon code or a deal. Frontend will show "Get Code" for codes and "Get Deal" for deals.
              </p>
            </div>

            {/* Custom Button Text Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.couponType === 'code' && (
                <div>
                  <label htmlFor="getCodeText" className="block text-gray-700 text-sm font-semibold mb-2">
                    Custom "Get Code" Button Text (Optional)
                  </label>
                  <input
                    id="getCodeText"
                    name="getCodeText"
                    type="text"
                    placeholder='e.g., "Obtenir le code", "Obtener código", "कोड प्राप्त करें"'
                    value={formData.getCodeText || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, getCodeText: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to use default "Get Code". Set custom text for any language.
                  </p>
                </div>
              )}
              {formData.couponType === 'deal' && (
                <div>
                  <label htmlFor="getDealText" className="block text-gray-700 text-sm font-semibold mb-2">
                    Custom "Get Deal" Button Text (Optional)
                  </label>
                  <input
                    id="getDealText"
                    name="getDealText"
                    type="text"
                    placeholder="e.g., Obtenir l'offre, Obtener oferta, ऑफर प्राप्त करें"
                    value={formData.getDealText || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, getDealText: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to use default "Get Deal". Set custom text for any language.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.couponType === 'code' && (
                <div>
                  <label htmlFor="code" className="block text-gray-700 text-sm font-semibold mb-2">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="Coupon Code (e.g., SAVE20)"
                    value={formData.code || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Required for code type coupons
                  </p>
                </div>
              )}
              <div>
                <label htmlFor="storeName" className="block text-gray-700 text-sm font-semibold mb-2">
                  Coupon Title
                </label>
                <input
                  id="storeName"
                  name="storeName"
                  type="text"
                  placeholder="Store/Brand Name (e.g., Nike)"
                  value={formData.storeName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, storeName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This name will be displayed on the coupon card instead of the coupon code
                </p>
              </div>
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
                  <label htmlFor="logo" className="sr-only">Logo (PNG / SVG)</label>
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
                            console.log('📋 Cloudinary URL saved to state:', cloudinaryUrl);
                            alert('✅ Logo uploaded to Cloudinary successfully! URL has been copied.');
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
              {(logoPreview || logoUrl || extractedLogoUrl) && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Logo preview:</p>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 inline-block">
                    <img
                      src={logoPreview || extractedLogoUrl || logoUrl}
                      alt="Logo preview"
                      className="h-20 w-auto object-contain max-w-xs"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.error-text')) {
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'error-text text-sm text-red-600';
                          errorDiv.textContent = 'Failed to load image';
                          parent.appendChild(errorDiv);
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxUses" className="sr-only">Max Uses</label>
                <input
                  id="maxUses"
                  name="maxUses"
                  type="number"
                  placeholder="Max Uses"
                  value={formData.maxUses || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxUses: parseInt(e.target.value),
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="sr-only">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-gray-700 text-sm font-semibold mb-2">
                Coupon URL (Where user should be redirected when clicking "Get Deal")
              </label>
              <input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com/coupon-page"
                value={formData.url || ''}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                When user clicks "Get Deal", they will be redirected to this URL and the coupon code will be revealed.
              </p>
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-gray-700 text-sm font-semibold mb-2">
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
                Assign this coupon to a category
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive || false}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-gray-700">Active</label>
              </div>

              <div className="flex items-center">
                <input
                  id="isLatest"
                  name="isLatest"
                  type="checkbox"
                  checked={formData.isLatest || false}
                  onChange={(e) => {
                    const isLatest = e.target.checked;
                    setFormData({
                      ...formData,
                      isLatest,
                      // Clear layout position if latest is disabled
                      latestLayoutPosition: isLatest ? formData.latestLayoutPosition : null
                    });
                  }}
                  className="mr-2"
                />
                <label htmlFor="isLatest" className="text-gray-700">Mark as Latest</label>
              </div>

              <div className="flex items-center">
                <input
                  id="isPopular"
                  name="isPopular"
                  type="checkbox"
                  checked={formData.isPopular || false}
                  onChange={(e) => {
                    const isPopular = e.target.checked;
                    setFormData({
                      ...formData,
                      isPopular,
                      // Clear layout position if popular is disabled
                      layoutPosition: isPopular ? formData.layoutPosition : null
                    });
                  }}
                  className="mr-2"
                />
                <label htmlFor="isPopular" className="text-gray-700">Mark as Popular</label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="latestLayoutPosition" className="block text-gray-700 text-sm font-semibold mb-2">
                  Assign to Latest Coupons Layout Position (1-8)
                </label>
                <select
                  id="latestLayoutPosition"
                  name="latestLayoutPosition"
                  value={formData.latestLayoutPosition || ''}
                  onChange={(e) => {
                    const position = e.target.value ? parseInt(e.target.value) : null;
                    setFormData({
                      ...formData,
                      latestLayoutPosition: position,
                      // Auto-enable latest if layout position is assigned
                      isLatest: position !== null ? true : formData.isLatest
                    });
                  }}
                  disabled={!formData.isLatest && !formData.latestLayoutPosition}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not Assigned</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => {
                    const isTaken = coupons.some(
                      c => c.latestLayoutPosition === pos && c.isLatest && c.id
                    );
                    const takenBy = coupons.find(
                      c => c.latestLayoutPosition === pos && c.isLatest && c.id
                    );
                    return (
                      <option key={pos} value={pos}>
                        Layout {pos} {isTaken ? `(Currently: ${takenBy?.code})` : ''}
                      </option>
                    );
                  })}
                </select>
                {!formData.isLatest && !formData.latestLayoutPosition && (
                  <p className="mt-1 text-xs text-gray-400">Enable "Mark as Latest" or select a layout position</p>
                )}
                {formData.latestLayoutPosition && (
                  <p className="mt-1 text-xs text-blue-600">
                    Coupon will be placed at Layout {formData.latestLayoutPosition} in Latest Coupons section
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="layoutPosition" className="block text-gray-700 text-sm font-semibold mb-2">
                  Assign to Popular Coupons Layout Position (1-8)
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
                      // Auto-enable popular if layout position is assigned
                      isPopular: position !== null ? true : formData.isPopular
                    });
                  }}
                  disabled={!formData.isPopular && !formData.layoutPosition}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not Assigned</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => {
                    const isTaken = coupons.some(
                      c => c.layoutPosition === pos && c.isPopular && c.id
                    );
                    const takenBy = coupons.find(
                      c => c.layoutPosition === pos && c.isPopular && c.id
                    );
                    return (
                      <option key={pos} value={pos}>
                        Layout {pos} {isTaken ? `(Currently: ${takenBy?.code})` : ''}
                      </option>
                    );
                  })}
                </select>
                {!formData.isPopular && !formData.layoutPosition && (
                  <p className="mt-1 text-xs text-gray-400">Enable "Mark as Popular" or select a layout position</p>
                )}
                {formData.layoutPosition && (
                  <p className="mt-1 text-xs text-blue-600">
                    Coupon will be placed at Layout {formData.layoutPosition} in Popular Coupons section
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Coupon'
              )}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No coupons created yet</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No coupons found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-blue-600 hover:text-blue-800 underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">
                    Store Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">
                    Code
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">
                    Description
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">
                    Uses
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">
                    Latest
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">
                    Latest Layout
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">
                    Popular
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">
                    Popular Layout
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCoupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900">
                      {coupon.storeName || 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-mono font-semibold text-xs sm:text-sm">
                      {coupon.code || 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 max-w-xs truncate" title={coupon.description}>
                      {coupon.description || 'No description'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm">
                      {coupon.currentUses} / {coupon.maxUses}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${coupon.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={() => handleToggleLatest(coupon)}
                        className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${coupon.isLatest
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {coupon.isLatest ? 'Latest' : 'Not Latest'}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <select
                        value={coupon.latestLayoutPosition || ''}
                        onChange={(e) => {
                          const position = e.target.value ? parseInt(e.target.value) : null;
                          handleAssignLatestLayoutPosition(coupon, position);
                        }}
                        className="px-2 sm:px-3 py-1.5 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!coupon.isLatest}
                      >
                        <option value="">Not Assigned</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                          <option key={pos} value={pos}>
                            Layout {pos}
                          </option>
                        ))}
                      </select>
                      {!coupon.isLatest && (
                        <p className="text-xs text-gray-400 mt-1">Enable Latest first</p>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={() => handleTogglePopular(coupon)}
                        className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${coupon.isPopular
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {coupon.isPopular ? 'Popular' : 'Not Popular'}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <select
                        value={coupon.layoutPosition || ''}
                        onChange={(e) => {
                          const position = e.target.value ? parseInt(e.target.value) : null;
                          handleAssignLayoutPosition(coupon, position);
                        }}
                        className="px-2 sm:px-3 py-1.5 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!coupon.isPopular}
                      >
                        <option value="">Not Assigned</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                          <option key={pos} value={pos}>
                            Layout {pos}
                          </option>
                        ))}
                      </select>
                      {!coupon.isPopular && (
                        <p className="text-xs text-gray-400 mt-1">Enable Popular first</p>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <Link
                          href={`/admin/coupons/${coupon.id}`}
                          className="inline-block bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-blue-200 text-center"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredCoupons.length > pageSize && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t bg-gray-50 text-xs sm:text-sm text-gray-700">
              <div>
                Showing{' '}
                <span className="font-semibold">
                  {(currentPage - 1) * pageSize + 1}
                </span>
                {' '}–{' '}
                <span className="font-semibold">
                  {Math.min(currentPage * pageSize, filteredCoupons.length)}
                </span>
                {' '}of{' '}
                <span className="font-semibold">
                  {filteredCoupons.length}
                </span>{' '}
                coupons
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2 sm:px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span>
                  Page <span className="font-semibold">{currentPage}</span> of{' '}
                  <span className="font-semibold">{totalPages}</span>
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 sm:px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

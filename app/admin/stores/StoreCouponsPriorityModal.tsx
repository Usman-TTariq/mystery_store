'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { GripVertical, X } from 'lucide-react';
import type { Store } from '@/lib/services/storeService';

interface StoreCouponRow {
  id: string;
  title: string;
  code: string;
  isActive: boolean;
  expiryDate: string | null;
}

interface StoreCouponsPriorityModalProps {
  store: Store;
  onClose: () => void;
}

function formatExpiry(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function StoreCouponsPriorityModal({ store, onClose }: StoreCouponsPriorityModalProps) {
  const [coupons, setCoupons] = useState<StoreCouponRow[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const modalTitle =
    store.seoTitle?.trim() ||
    `${store.name} Gutscheincode und Rabattcodes ${new Date().getFullYear()}`;

  const loadCoupons = useCallback(async () => {
    if (!store.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${store.id}/coupons`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load coupons');
      }
      setCoupons(data.coupons || []);
      setStats(data.stats || { total: 0, active: 0, inactive: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [store.id]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const saveOrder = async (ordered: StoreCouponRow[]) => {
    if (!store.id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${store.id}/coupons`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponOrder: ordered.map((c) => c.id) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save order');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order');
      await loadCoupons();
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverIndex.current = index;
  };

  const handleDragEnd = async () => {
    const from = dragIndex.current;
    const to = dragOverIndex.current;
    dragIndex.current = null;
    dragOverIndex.current = null;

    if (from === null || to === null || from === to) return;

    const next = [...coupons];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setCoupons(next);
    await saveOrder(next);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900 pr-8">{`Coupons — ${modalTitle}`}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {stats.total} coupons · {stats.active} active · {stats.inactive} inactive
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Drag and drop to reorder. Top item shows first on the store page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading coupons…</p>
          ) : error ? (
            <p className="text-center text-red-600 py-8">{error}</p>
          ) : coupons.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No coupons for this store.</p>
          ) : (
            <ul className="space-y-2">
              {coupons.map((coupon, index) => (
                <li
                  key={coupon.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 hover:bg-gray-50 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-5 h-5 shrink-0 text-gray-400" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{coupon.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {coupon.code ? `Code: ${coupon.code}` : 'No code'}
                      {' · '}
                      Expires: {formatExpiry(coupon.expiryDate)}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        coupon.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Link
                      href={`/admin/coupons/${coupon.id}`}
                      className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          {saving && <span className="text-sm text-gray-500 mr-auto">Saving order…</span>}
          <Link
            href="/admin/coupons"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm font-semibold hover:bg-gray-50"
          >
            Open Coupons admin
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#1e293b] text-white text-sm font-semibold hover:bg-[#0f172a]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

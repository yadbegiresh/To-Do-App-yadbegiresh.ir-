/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimelineItem } from "./types";

const LOCAL_STORAGE_KEY = "timeline_items";

export function getLocalItems(): TimelineItem[] {
  const itemsStr = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!itemsStr) {
    // Seed with a couple of lovely modern Persian starter items if empty
    const defaultItems: TimelineItem[] = [
      {
        id: "1718220000000",
        text: "راه‌اندازی موفقیت‌آمیز پروژه تایم‌لاین انجام کارها با ظاهر شیشه‌ای و مدرن! 🚀",
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
      },
      {
        id: "1718223600000",
        text: "افزودن قابلیت سرچ زنده و فیلترینگ کارهای ثبت شده به همراه شمارشگر کاراکتر متون.",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      },
      {
        id: "1718227200000",
        text: "پیاده‌سازی تم دارک و لایت هوشمند با فونت زیبای وزیرمتن برای خوانایی عالی.",
        createdAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultItems));
    return defaultItems;
  }
  try {
    return JSON.parse(itemsStr);
  } catch (e) {
    return [];
  }
}

export function saveLocalItems(items: TimelineItem[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}

export function addLocalItem(text: string): TimelineItem {
  const items = getLocalItems();
  const newItem: TimelineItem = {
    id: Date.now().toString(),
    text,
    createdAt: new Date().toISOString()
  };
  const updated = [newItem, ...items];
  saveLocalItems(updated);
  return newItem;
}

export function deleteLocalItem(id: string): void {
  const items = getLocalItems();
  const updated = items.filter(item => item.id !== id);
  saveLocalItems(updated);
}

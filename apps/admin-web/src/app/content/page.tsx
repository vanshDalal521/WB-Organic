"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  FileText,
  Image as ImageIcon,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Pencil,
  X,
  GripVertical,
} from "lucide-react";

type Tab = "banners" | "stories";

interface Banner {
  id: string;
  title: string;
  imageUrl?: string;
  image?: string;
  priority: number;
  isActive: boolean;
  active?: boolean;
  link?: string;
  linkUrl?: string;
  startDate?: string;
  endDate?: string;
  start_date?: string;
  end_date?: string;
  createdAt: string;
}

interface FarmStory {
  id: string;
  title: string;
  content?: string;
  author?: string;
  imageUrl?: string;
  image?: string;
  isActive: boolean;
  active?: boolean;
  sortOrder?: number;
  sort_order?: number;
  createdAt: string;
}

interface BannerForm {
  title: string;
  imageUrl: string;
  link: string;
  priority: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface StoryForm {
  title: string;
  author: string;
  content: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY_BANNER_FORM: BannerForm = {
  title: "",
  imageUrl: "",
  link: "",
  priority: 1,
  isActive: true,
  startDate: "",
  endDate: "",
};

const EMPTY_STORY_FORM: StoryForm = {
  title: "",
  author: "",
  content: "",
  imageUrl: "",
  sortOrder: 1,
  isActive: true,
};

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ContentPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("banners");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stories, setStories] = useState<FarmStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    type: Tab;
    title: string;
  } | null>(null);

  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingStory, setEditingStory] = useState<FarmStory | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerForm>(EMPTY_BANNER_FORM);
  const [storyForm, setStoryForm] = useState<StoryForm>(EMPTY_STORY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBanners();
      const payload = (res.data as any) || {};
      setBanners(
        Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : []
      );
    } catch (err: any) {
      setError(err.message || "Failed to load banners");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getFarmStories();
      const payload = (res.data as any) || {};
      setStories(
        Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : []
      );
    } catch (err: any) {
      setError(err.message || "Failed to load farm stories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "banners") fetchBanners();
    else fetchStories();
  }, [activeTab, fetchBanners, fetchStories]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setDeletingId(confirmDelete.id);
      setError(null);
      if (confirmDelete.type === "banners") {
        await api.deleteBanner(confirmDelete.id);
        setBanners((prev) =>
          prev.filter((b) => (b.id || b.id) !== confirmDelete.id)
        );
      } else {
        await api.deleteFarmStory(confirmDelete.id);
        setStories((prev) =>
          prev.filter((s) => (s.id || s.id) !== confirmDelete.id)
        );
      }
      addToast("success", `Deleted ${confirmDelete.type === "banners" ? "banner" : "story"} successfully`);
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const openAddBanner = () => {
    setEditingBanner(null);
    setBannerForm(EMPTY_BANNER_FORM);
    setShowBannerModal(true);
  };

  const openEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title || "",
      imageUrl: banner.imageUrl || banner.image || "",
      link: banner.link || banner.linkUrl || "",
      priority: banner.priority || 1,
      isActive: banner.isActive ?? banner.active ?? true,
      startDate: banner.startDate
        ? banner.startDate.split("T")[0]
        : banner.start_date
        ? banner.start_date.split("T")[0]
        : "",
      endDate: banner.endDate
        ? banner.endDate.split("T")[0]
        : banner.end_date
        ? banner.end_date.split("T")[0]
        : "",
    });
    setShowBannerModal(true);
  };

  const openAddStory = () => {
    setEditingStory(null);
    setStoryForm(EMPTY_STORY_FORM);
    setShowStoryModal(true);
  };

  const openEditStory = (story: FarmStory) => {
    setEditingStory(story);
    setStoryForm({
      title: story.title || "",
      author: story.author || "",
      content: story.content || "",
      imageUrl: story.imageUrl || story.image || "",
      sortOrder: story.sortOrder || story.sort_order || 1,
      isActive: story.isActive ?? story.active ?? true,
    });
    setShowStoryModal(true);
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.title.trim()) {
      addToast("error", "Title is required");
      return;
    }
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        title: bannerForm.title,
        imageUrl: bannerForm.imageUrl,
        link: bannerForm.link,
        priority: bannerForm.priority,
        isActive: bannerForm.isActive,
      };
      if (bannerForm.startDate) data.startDate = bannerForm.startDate;
      if (bannerForm.endDate) data.endDate = bannerForm.endDate;

      if (editingBanner) {
        await api.updateBanner(editingBanner.id || editingBanner.id || "", data);
        addToast("success", "Banner updated successfully");
      } else {
        await api.createBanner(data);
        addToast("success", "Banner created successfully");
      }
      setShowBannerModal(false);
      fetchBanners();
    } catch (err: any) {
      addToast("error", err.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStory = async () => {
    if (!storyForm.title.trim()) {
      addToast("error", "Title is required");
      return;
    }
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        title: storyForm.title,
        author: storyForm.author,
        content: storyForm.content,
        imageUrl: storyForm.imageUrl,
        sortOrder: storyForm.sortOrder,
        isActive: storyForm.isActive,
      };

      if (editingStory) {
        await api.updateFarmStory(editingStory.id || editingStory.id || "", data);
        addToast("success", "Story updated successfully");
      } else {
        await api.createFarmStory(data);
        addToast("success", "Story created successfully");
      }
      setShowStoryModal(false);
      fetchStories();
    } catch (err: any) {
      addToast("error", err.message || "Failed to save story");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-500">Manage banners and farm stories.</p>
        </div>
        <button
          onClick={activeTab === "banners" ? openAddBanner : openAddStory}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {activeTab === "banners" ? "Add Banner" : "Add Story"}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("banners")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "banners"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Banners
            <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
              {banners.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("stories")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "stories"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            Farm Stories
            <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
              {stories.length}
            </span>
          </button>
        </div>

        {error && (
          <div className="m-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700 text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading content...</p>
          </div>
        ) : activeTab === "banners" ? (
          banners.length === 0 ? (
            <div className="p-12 text-center">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No banners found.</p>
              <p className="text-sm text-gray-400 mt-1">
                Create your first banner to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Banner
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {banners.map((banner) => {
                    const active = banner.isActive ?? banner.active ?? false;
                    return (
                      <tr
                        key={banner.id || banner.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                              {banner.imageUrl || banner.image ? (
                                <img
                                  src={banner.imageUrl || banner.image}
                                  alt={banner.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {banner.title}
                              </p>
                              {(banner.link || banner.linkUrl) && (
                                <p className="text-xs text-primary truncate max-w-[200px]">
                                  {banner.link || banner.linkUrl}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">
                            {banner.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {active ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                            {active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {formatDate(
                              banner.startDate || banner.start_date || ""
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {formatDate(
                              banner.endDate || banner.end_date || ""
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditBanner(banner)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Edit banner"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmDelete({
                                  id: banner.id || banner.id || "",
                                  type: "banners",
                                  title: banner.title,
                                })
                              }
                              disabled={deletingId === (banner.id || banner.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete banner"
                            >
                              {deletingId === (banner.id || banner.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : stories.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No farm stories found.</p>
            <p className="text-sm text-gray-400 mt-1">
              Share your farm&apos;s story with customers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Story
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sort Order
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stories.map((story) => {
                  const active = story.isActive ?? story.active ?? false;
                  return (
                    <tr
                      key={story.id || story.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                            {story.imageUrl || story.image ? (
                              <img
                                src={story.imageUrl || story.image}
                                alt={story.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {story.title}
                            </p>
                            {story.content && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-lg">
                                {story.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {story.author || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {active ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {story.sortOrder ?? story.sort_order ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditStory(story)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit story"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDelete({
                                id: story.id || story.id || "",
                                type: "stories",
                                title: story.title,
                              })
                            }
                            disabled={deletingId === (story.id || story.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete story"
                          >
                            {deletingId === (story.id || story.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Banner Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingBanner ? "Edit Banner" : "Add Banner"}
              </h3>
              <button
                onClick={() => setShowBannerModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={bannerForm.title}
                  onChange={(e) =>
                    setBannerForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Banner title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={bannerForm.imageUrl}
                  onChange={(e) =>
                    setBannerForm((p) => ({ ...p, imageUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link URL
                </label>
                <input
                  type="url"
                  value={bannerForm.link}
                  onChange={(e) =>
                    setBannerForm((p) => ({ ...p, link: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={bannerForm.priority}
                    onChange={(e) =>
                      setBannerForm((p) => ({
                        ...p,
                        priority: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Active
                  </label>
                  <div className="flex items-center h-[42px]">
                    <button
                      type="button"
                      onClick={() =>
                        setBannerForm((p) => ({ ...p, isActive: !p.isActive }))
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 ${
                        bannerForm.isActive ? "bg-primary" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          bannerForm.isActive
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="ml-3 text-sm text-gray-700">
                      {bannerForm.isActive ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={bannerForm.startDate}
                    onChange={(e) =>
                      setBannerForm((p) => ({
                        ...p,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={bannerForm.endDate}
                    onChange={(e) =>
                      setBannerForm((p) => ({ ...p, endDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowBannerModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBanner}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingBanner ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Modal */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStory ? "Edit Story" : "Add Story"}
              </h3>
              <button
                onClick={() => setShowStoryModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={storyForm.title}
                  onChange={(e) =>
                    setStoryForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Story title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={storyForm.author}
                  onChange={(e) =>
                    setStoryForm((p) => ({ ...p, author: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Author name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={storyForm.content}
                  onChange={(e) =>
                    setStoryForm((p) => ({ ...p, content: e.target.value }))
                  }
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Story content..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={storyForm.imageUrl}
                  onChange={(e) =>
                    setStoryForm((p) => ({ ...p, imageUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={storyForm.sortOrder}
                    onChange={(e) =>
                      setStoryForm((p) => ({
                        ...p,
                        sortOrder: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Active
                  </label>
                  <div className="flex items-center h-[42px]">
                    <button
                      type="button"
                      onClick={() =>
                        setStoryForm((p) => ({ ...p, isActive: !p.isActive }))
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 ${
                        storyForm.isActive ? "bg-primary" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          storyForm.isActive
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="ml-3 text-sm text-gray-700">
                      {storyForm.isActive ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowStoryModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStory}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingStory ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6 mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete {confirmDelete.type === "banners" ? "Banner" : "Story"}
                </h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium">&ldquo;{confirmDelete.title}&rdquo;</span>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId === confirmDelete.id}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deletingId === confirmDelete.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

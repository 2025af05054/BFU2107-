import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Upload, FolderTree, Image as ImageIcon } from 'lucide-react';
import { useCategories, useAllCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useUploadCategoryIcon, Category } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export default function AdminCategoriesPage() {
  const { data: allCategories, isLoading } = useAllCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const uploadIconMutation = useUploadCategoryIcon();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
    display_order: 0,
    level: 1,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size should be less than 2MB');
        return;
      }
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parent_id: '',
      display_order: 0,
      level: 1,
    });
    setIconFile(null);
    setIconPreview(null);
    setEditingCategory(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || '',
      display_order: category.display_order,
      level: category.level,
    });
    setIconPreview(category.icon_url);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let iconUrl = editingCategory?.icon_url || null;

      if (iconFile) {
        const tempId = editingCategory?.id || crypto.randomUUID();
        iconUrl = await uploadIconMutation.mutateAsync({
          categoryId: tempId,
          file: iconFile,
        });
      }

      const categoryData = {
        ...formData,
        parent_id: formData.parent_id || null,
        icon_url: iconUrl,
      };

      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          ...categoryData,
        });
      } else {
        await createMutation.mutateAsync(categoryData);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async () => {
    if (deleteCategory) {
      await deleteMutation.mutateAsync(deleteCategory.id);
      setDeleteCategory(null);
    }
  };

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map((category) => (
      <div key={category.id} className="mb-2">
        <Card className={level > 0 ? 'ml-8' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {category.icon_url ? (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  <img src={category.icon_url} alt={category.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{category.name}</h3>
                  <Badge variant="outline">Level {category.level}</Badge>
                  {!category.is_active && <Badge variant="destructive">Inactive</Badge>}
                </div>
                {category.description && (
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteCategory(category)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {category.children && category.children.length > 0 && (
          <div className="mt-2">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const buildTree = (cats: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    cats.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    cats.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  };

  const categoryTree = allCategories ? buildTree(allCategories) : [];

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FolderTree className="w-8 h-8" />
              Category Management
            </h1>
            <p className="text-muted-foreground">Manage product categories hierarchy</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) {
              resetForm();
            }
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </DialogTitle>
                <DialogDescription>
                  Create or update a category with an icon for better visual identification
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Category Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="parent">Parent Category</Label>
                    <Select
                      value={formData.parent_id || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setFormData({
                            ...formData,
                            parent_id: '',
                            level: 1,
                          });
                        } else {
                          const parent = allCategories?.find(c => c.id === value);
                          setFormData({
                            ...formData,
                            parent_id: value,
                            level: parent ? parent.level + 1 : 1,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None (Top Level)" />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        <SelectItem value="none">None (Top Level)</SelectItem>
                        {allCategories?.filter(c => c.id !== editingCategory?.id).map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {'  '.repeat(cat.level - 1) + cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="icon">Category Icon (Circular)</Label>
                    <div className="flex items-center gap-4">
                      {iconPreview && (
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                          <img src={iconPreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <Input
                        id="icon"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 2MB. Square images work best for circular display.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingCategory ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : categoryTree.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FolderTree className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first product category
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {renderCategoryTree(categoryTree)}
          </div>
        )}

        <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteCategory?.name}"? This will also delete all subcategories.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}

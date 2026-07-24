import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategoryTree, Category } from '@/hooks/useCategories';
import { Loader2 } from 'lucide-react';

interface CategoryCascadeSelectProps {
  value: string;
  onChange: (categoryId: string) => void;
  label?: string;
  required?: boolean;
  showIcons?: boolean;
}

export const CategoryCascadeSelect = ({
  value,
  onChange,
  label = 'Category',
  required = false,
  showIcons = true,
}: CategoryCascadeSelectProps) => {
  const { data: categoryTree, isLoading } = useCategoryTree();
  const [level1, setLevel1] = useState('');
  const [level2, setLevel2] = useState('');
  const [level3, setLevel3] = useState('');

  // Get all categories as flat list for finding selected category
  const getAllCategories = (tree: Category[]): Category[] => {
    const result: Category[] = [];
    const traverse = (cats: Category[]) => {
      cats.forEach(cat => {
        result.push(cat);
        if (cat.children) traverse(cat.children);
      });
    };
    traverse(tree);
    return result;
  };

  // Initialize cascade when value changes externally
  useEffect(() => {
    if (value && categoryTree.length > 0) {
      const allCategories = getAllCategories(categoryTree);
      const selected = allCategories.find(c => c.id === value);
      
      if (selected) {
        if (selected.level === 1) {
          setLevel1(selected.id);
          setLevel2('');
          setLevel3('');
        } else if (selected.level === 2 && selected.parent_id) {
          setLevel1(selected.parent_id);
          setLevel2(selected.id);
          setLevel3('');
        } else if (selected.level === 3 && selected.parent_id) {
          const parent = allCategories.find(c => c.id === selected.parent_id);
          if (parent && parent.parent_id) {
            setLevel1(parent.parent_id);
            setLevel2(parent.id);
            setLevel3(selected.id);
          }
        }
      }
    }
  }, [value, categoryTree]);

  const selectedLevel1 = categoryTree.find(c => c.id === level1);
  const level2Options = selectedLevel1?.children || [];
  const selectedLevel2 = level2Options.find(c => c.id === level2);
  const level3Options = selectedLevel2?.children || [];

  const handleLevel1Change = (val: string) => {
    setLevel1(val);
    setLevel2('');
    setLevel3('');
    onChange(val);
  };

  const handleLevel2Change = (val: string) => {
    setLevel2(val);
    setLevel3('');
    onChange(val);
  };

  const handleLevel3Change = (val: string) => {
    setLevel3(val);
    onChange(val);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading categories...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label && <Label>{label} {required && <span className="text-destructive">*</span>}</Label>}
      
      {/* Level 1 - Main Category */}
      <div>
        <Label className="text-sm text-muted-foreground">Main Category</Label>
        <Select value={level1} onValueChange={handleLevel1Change} required={required}>
          <SelectTrigger>
            <SelectValue placeholder="Select main category" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            {categoryTree.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Level 2 - Sub Category */}
      {level1 && level2Options.length > 0 && (
        <div>
          <Label className="text-sm text-muted-foreground">Sub Category</Label>
          <Select value={level2} onValueChange={handleLevel2Change}>
            <SelectTrigger>
              <SelectValue placeholder="Select sub category (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {level2Options.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Level 3 - Tertiary Category */}
      {level2 && level3Options.length > 0 && (
        <div>
          <Label className="text-sm text-muted-foreground">Detailed Category</Label>
          <Select value={level3} onValueChange={handleLevel3Change}>
            <SelectTrigger>
              <SelectValue placeholder="Select detailed category (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {level3Options.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

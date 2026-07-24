import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories, Category } from '@/hooks/useCategories';
import { Loader2 } from 'lucide-react';

interface CategorySelectProps {
  value: string;
  onChange: (categoryId: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  showIcons?: boolean;
}

export const CategorySelect = ({
  value,
  onChange,
  label = 'Category',
  placeholder = 'Select a category',
  required = false,
  showIcons = true,
}: CategorySelectProps) => {
  const { data: categories, isLoading } = useCategories();

  const renderCategoryOptions = (cats: Category[] | undefined, level = 0): React.ReactNode => {
    if (!cats) return null;

    return cats.map((cat) => (
      <SelectItem key={cat.id} value={cat.id}>
        {'  '.repeat(level)}{cat.name}
      </SelectItem>
    ));
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
    <div className="space-y-2">
      {label && <Label>{label} {required && <span className="text-destructive">*</span>}</Label>}
      <Select value={value} onValueChange={onChange} required={required}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background">
          {renderCategoryOptions(categories)}
        </SelectContent>
      </Select>
    </div>
  );
};

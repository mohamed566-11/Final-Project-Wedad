import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    maxTags?: number;
    suggestions?: string[];
    placeholder?: string;
}

const TagInput = ({
    tags,
    onChange,
    maxTags = 10,
    suggestions = [],
    placeholder = 'أضف وسم...',
}: TagInputProps) => {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredSuggestions = suggestions.filter(
        (s) =>
            s.toLowerCase().includes(inputValue.toLowerCase()) &&
            !tags.includes(s)
    );

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
            onChange([...tags, trimmedTag]);
            setInputValue('');
            setShowSuggestions(false);
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    return (
        <div className="space-y-2">
            {/* Tags Display */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors pr-1"
                        >
                            #{tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="mr-1 hover:text-pink-900 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="relative">
                <Input
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={tags.length >= maxTags ? 'الحد الأقصى للوسوم' : placeholder}
                    disabled={tags.length >= maxTags}
                    className="text-right"
                    dir="rtl"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && inputValue && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredSuggestions.slice(0, 5).map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => addTag(suggestion)}
                                className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors"
                            >
                                #{suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-500">
                {tags.length}/{maxTags} وسوم • اضغط Enter أو فاصلة لإضافة وسم
            </p>
        </div>
    );
};

export default TagInput;

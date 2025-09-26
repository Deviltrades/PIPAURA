interface SignedImageDisplayProps {
  imageUrl: string;
  alt?: string;
  className?: string;
  "data-testid"?: string;
}

export function SignedImageDisplay({ imageUrl, alt, className, "data-testid": testId }: SignedImageDisplayProps) {
  // Since we're using Supabase storage with public URLs, no need for signed URLs
  if (!imageUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500`}>
        <span className="text-xs">No image</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      data-testid={testId}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = '<span class="text-gray-500 text-xs">Failed to load</span>';
        }
      }}
    />
  );
}
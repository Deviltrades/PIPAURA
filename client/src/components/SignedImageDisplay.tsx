import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface SignedImageDisplayProps {
  imageUrl: string;
  alt?: string;
  className?: string;
  "data-testid"?: string;
}

export function SignedImageDisplay({ imageUrl, alt, className, "data-testid": testId }: SignedImageDisplayProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const response = await apiRequest("GET", `/api/images/signed-url?imageUrl=${encodeURIComponent(imageUrl)}`);
        if (!response.ok) {
          throw new Error('Failed to get signed URL');
        }
        
        const { signedUrl } = await response.json();
        setSignedUrl(signedUrl);
      } catch (err) {
        console.error('Error fetching signed URL:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (imageUrl) {
      fetchSignedUrl();
    }
  }, [imageUrl]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500`}>
        <span className="text-xs">Failed to load</span>
      </div>
    );
  }

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
      data-testid={testId}
      onError={() => setError(true)}
    />
  );
}
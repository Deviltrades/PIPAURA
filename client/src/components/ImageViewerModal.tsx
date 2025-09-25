import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { SignedImageDisplay } from "./SignedImageDisplay";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export function ImageViewerModal({ isOpen, onClose, imageUrl }: ImageViewerModalProps) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = async () => {
    try {
      // Create a temporary link to download the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trade-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black/90 border-0">
        <div className="relative w-full h-full flex flex-col">
          {/* Header with controls */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  data-testid="button-zoom-out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-white text-sm px-3 py-1 bg-black/50 rounded">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  data-testid="button-zoom-in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  data-testid="button-download-image"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  data-testid="button-close-image-viewer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Image container */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <div 
              className="transition-transform duration-200 max-w-full max-h-full"
              style={{ transform: `scale(${zoom})` }}
            >
              <SignedImageDisplay
                imageUrl={imageUrl}
                alt="Enlarged trade attachment"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                data-testid="image-viewer-main"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
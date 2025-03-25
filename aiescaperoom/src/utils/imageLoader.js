/**
 * Utility for loading and handling images with fallbacks
 */

// Preload images to check if they're available
export const preloadImages = async (imageUrls) => {
  const results = await Promise.allSettled(
    imageUrls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ url, success: true });
        img.onerror = () => resolve({ url, success: false });
        img.src = url;
      });
    })
  );
  
  return results.map(result => result.value);
};

// Get a fallback image URL
export const getFallbackImageUrl = (imageId) => {
  // Convert the image ID to a number that can be used for a consistent fallback
  const idNum = parseInt(imageId.replace(/\D/g, '')) || 0;
  
  // List of reliable fallback image sources
  const fallbacks = [
    `https://picsum.photos/seed/fallback${idNum}/500/500`,
    `https://place-hold.it/500x500/1a1a1a/ffffff?text=Image%20${idNum}`,
    `https://dummyimage.com/500x500/1a1a1a/ffffff&text=Image%20${idNum}`
  ];
  
  // Use the ID to consistently select a fallback
  return fallbacks[idNum % fallbacks.length];
};

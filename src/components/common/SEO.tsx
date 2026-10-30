import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title = "JADMAA Varmakalai | Varmakalai Training & Self Defence", 
  description = "Learn traditional Varmakalai and self-defence training at JADMAA. Join structured programs for kids, students, women and adults in Thanjavur, Kumbakonam and Ariyalur.",
  image,
  url
}) => {
  useEffect(() => {
    document.title = title;
    
    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Meta og:image
    if (image) {
      let metaImage = document.querySelector('meta[property="og:image"]');
      if (!metaImage) {
        metaImage = document.createElement('meta');
        metaImage.setAttribute('property', 'og:image');
        document.head.appendChild(metaImage);
      }
      metaImage.setAttribute('content', image);
    }

    // Meta og:url
    if (url) {
      let metaUrl = document.querySelector('meta[property="og:url"]');
      if (!metaUrl) {
        metaUrl = document.createElement('meta');
        metaUrl.setAttribute('property', 'og:url');
        document.head.appendChild(metaUrl);
      }
      metaUrl.setAttribute('content', url);
    }
  }, [title, description, image, url]);

  return null;
};

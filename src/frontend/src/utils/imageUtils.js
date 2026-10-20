export const blurImage = (imageFile, blurAmount = 10) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        ctx.filter = `blur(${blurAmount}px)`;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], imageFile.name, { type: imageFile.type }));
        }, imageFile.type);
      };
      
      img.onerror = reject;
      img.src = e.target.result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};

export const extractGPSFromImage = (imageFile) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      
      // Use EXIF library to extract GPS data
      // This is a placeholder - actual implementation would use exif-js
      resolve({ latitude: null, longitude: null });
    };
    
    reader.readAsDataURL(imageFile);
  });
};

export default function BahiaLogo({ size = 32 }) {
  return (
    <div style={{ 
      width: `${size}px`, 
      height: `${size}px`, 
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center' 
    }}>
      {/* لما الصورة تكون في الـ public، بنكتب اسمها علطول بتبدأ بـ / */}
      <img 
        src="/logo.png" 
        alt="Cancer Guide Logo" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain' 
        }} 
      />
    </div>
  );
}
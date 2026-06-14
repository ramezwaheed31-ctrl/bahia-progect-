/**
 * BahiaLogo Component - Renders the official brand icon for MammoGuide,
 * using the PNG asset stored in the public directory.
 *
 * مكون شعار بهية - يعرض أيقونة الهوية الرسمية لبرنامج MammoGuide،
 * باستخدام ملف الصورة المتاح في المجلد العام (public).
 */
export default function BahiaLogo({ size = 32 }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Arabic/English note: Loads the logo asset from public path */}
      {/* ملاحظة: يتم تحميل الصورة من المسار العام مباشرة */}
      <img
        src="/logoBC.png"
        alt="MammoGuide Logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

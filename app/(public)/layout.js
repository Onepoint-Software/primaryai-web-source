import FooterLinks from "@/components/marketing/FooterLinks";

export default function PublicLayout({ children }) {
  return (
    <div className="public-layout">
      {children}
      <FooterLinks landing />
    </div>
  );
}

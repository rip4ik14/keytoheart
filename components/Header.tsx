// components/Header.tsx
import AuthStatus from "./AuthStatus";
import ClientHeaderContent from "./ClientHeaderContent";

export default function Header() {
  return (
    <>
      <ClientHeaderContent />
      <div className="container mx-auto px-4 py-2 flex justify-end items-center">
        <AuthStatus />
      </div>
    </>
  );
}

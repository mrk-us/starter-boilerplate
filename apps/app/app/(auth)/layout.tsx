import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex size-screen h-svh flex-row items-center bg-surface p-5 *:w-full *:flex-1">
      <div className="">{children}</div>

      <div className="corner-superellipse/1.2 hidden self-stretch rounded-3xl bg-page lg:block" />
    </div>
  );
}

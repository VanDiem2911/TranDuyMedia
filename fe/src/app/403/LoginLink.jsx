"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons";
import { safeNext } from "@/lib/safe-next";

/** Nút "Đăng nhập" — giữ trang định vào (?from=) để đăng nhập xong quay lại. */
function Inner({ next }) {
  return (
    <Link
      href={`/login?next=${encodeURIComponent(next)}`}
      className="group inline-flex items-center gap-3 rounded-full bg-white py-1.5 pr-1.5 pl-6 text-sm font-semibold text-ink transition hover:bg-paper-100"
    >
      <Icon name="lock" className="size-4" />
      Đăng nhập
      <span className="flex size-9 items-center justify-center rounded-full bg-orange-500 text-white transition-transform group-hover:translate-x-0.5">
        <Icon name="arrowRight" className="size-4" />
      </span>
    </Link>
  );
}

function WithNext() {
  const from = useSearchParams().get("from");
  const pathname = usePathname();
  // Trang 403 do proxy trả giữ nguyên URL /admin/… trên thanh địa chỉ (không còn ?from=) → dùng chính đường dẫn đó,
  // để link giống hệt bản server render và đăng nhập xong quay lại đúng trang đang định vào.
  return <Inner next={safeNext(from ?? (pathname.startsWith("/admin") ? pathname : null))} />;
}

export function LoginLink({ withNext = false }) {
  return withNext ? <WithNext /> : <Inner next="/admin" />;
}

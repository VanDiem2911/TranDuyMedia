/**
 * Quyết định BỎ QUA màn chào trước khung hình đầu (xem IntroSplash): gắn data-intro="skip" lên <html> khi
 * khách đi từ chính website sang (referrer cùng tên miền) hoặc bấm Quay lại / Tiến tới.
 * Chèn bằng <script> trong <head> của layout gốc (server component) — không đặt <script> trong component React
 * (React báo lỗi "Encountered a script tag while rendering" khi component đó render lại phía trình duyệt).
 */
export const INTRO_SKIP_SCRIPT =
  'try{var n=performance.getEntriesByType("navigation")[0],t=n&&n.type,r=document.referrer,s=t==="back_forward";if(!s&&t!=="reload"&&r){s=new URL(r).origin===location.origin}if(s)document.documentElement.dataset.intro="skip"}catch(e){}';

/**
 * Lưu tạm việc tải sản phẩm đang dở vào IndexedDB của trình duyệt (kể cả tệp ảnh / video) → trang bị tải
 * lại, gõ địa chỉ khác hay đóng tab giữa chừng thì lần mở website kế tiếp tự TẢI TIẾP từ phần đang dở
 * (xem UploadResumer + jobs.js). Chỉ trình duyệt của quản trị viên có dữ liệu này.
 * Mọi lỗi IndexedDB (chế độ ẩn danh, hết dung lượng…) đều bỏ qua: việc tải vẫn chạy như bình thường.
 */
const DB = "tdm-uploads";
const STORE = "jobs";
// Cờ nhẹ trong localStorage → khách xem website không phải mở IndexedDB khi chẳng có gì để tải tiếp
const FLAG = "tdm-uploads-pending";

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req?.result);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

const setFlag = (on) => {
  try {
    if (on) localStorage.setItem(FLAG, "1");
    else localStorage.removeItem(FLAG);
  } catch {}
};

/** Bản nháp + tệp: ghi MỘT lần lúc bắt đầu (tệp lớn không bị chép lại sau mỗi phần đã tải). */
export async function putJob(record) {
  try {
    await run("readwrite", (s) => s.put(record));
    setFlag(true);
  } catch {}
}

/** Tiến độ (tệp đã xong + phần video đang dở): bản ghi nhỏ riêng, cập nhật sau mỗi phần. */
export async function saveState(id, state) {
  try {
    await run("readwrite", (s) => s.put({ id: `${id}:state`, state }));
  } catch {}
}

export async function deleteJob(id) {
  try {
    await run("readwrite", (s) => {
      s.delete(`${id}:state`);
      return s.delete(id);
    });
    const left = await run("readonly", (s) => s.count());
    if (!left) setFlag(false);
  } catch {}
}

export async function listJobs() {
  try {
    if (!localStorage.getItem(FLAG)) return [];
    const all = (await run("readonly", (s) => s.getAll())) ?? [];
    if (!all.length) setFlag(false);
    const states = new Map(all.filter((r) => r.id.endsWith(":state")).map((r) => [r.id, r.state]));
    return all
      .filter((r) => !r.id.endsWith(":state"))
      .map((r) => ({ ...r, ...(states.get(`${r.id}:state`) ?? {}) }));
  } catch {
    return [];
  }
}

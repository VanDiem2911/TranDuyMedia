import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

// Test chạy trên MongoDB tạm trong bộ nhớ (không đụng DB thật), Cloudinary để trống.
// Phải đặt env TRƯỚC khi import app.
process.env.NODE_ENV = "test";
process.env.CLOUDINARY_CLOUD_NAME = "";
const ADMIN = { username: "tranduy", password: "Matkhau-Rat-Manh-2026" };
process.env.ADMIN_ID = ADMIN.username;
process.env.ADMIN_PASSWORD = ADMIN.password;
const mongo = await MongoMemoryServer.create();
const { createApp } = await import("#app");
// Mọi request ghi phải mang header chống CSRF (frontend lib/api.js tự gửi)
const withCsrf = (agent) =>
  new Proxy(agent, {
    get: (t, m) =>
      ["post", "patch", "put", "delete"].includes(m)
        ? (...a) => t[m](...a).set("X-Requested-With", "fetch")
        : typeof t[m] === "function"
          ? t[m].bind(t)
          : t[m],
  });
const { connectDatabase, disconnectDatabase } = await import("#config/database.js");

describe("API v1", () => {
  let app;
  let admin; // agent giữ cookie đăng nhập
  before(async () => {
    await connectDatabase(mongo.getUri(), { retries: 1 });
    app = createApp();
    admin = withCsrf(request.agent(app));
  });
  after(async () => {
    await disconnectDatabase();
    await mongo.stop();
  });

  it("GET /health → 200, báo trạng thái DB & Cloudinary", async () => {
    const res = await withCsrf(request(app)).get("/api/v1/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.data.database, "connected");
    assert.equal(res.body.data.cloudinary, "not_configured");
  });

  it("route không tồn tại → 404 JSON", async () => {
    const res = await withCsrf(request(app)).get("/api/v1/khong-co");
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  describe("auth", () => {
    it("sai mật khẩu → 401, thông báo chung chung", async () => {
      const res = await withCsrf(request(app))
        .post("/api/v1/auth/login")
        .send({ username: ADMIN.username, password: "sai" });
      assert.equal(res.status, 401);
      assert.equal(res.body.error.code, "INVALID_CREDENTIALS");
    });

    it("ID không tồn tại → cùng thông báo 401", async () => {
      const res = await withCsrf(request(app))
        .post("/api/v1/auth/login")
        .send({ username: "ai-do", password: ADMIN.password });
      assert.equal(res.status, 401);
      assert.equal(res.body.error.code, "INVALID_CREDENTIALS");
    });

    it("đăng nhập đúng → cookie HttpOnly + SameSite=Strict, không trả token trong body", async () => {
      const res = await admin.post("/api/v1/auth/login").send({ ...ADMIN, remember: true });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.user.username, ADMIN.username);
      assert.equal(res.body.data.user.passwordHash, undefined);
      assert.equal(JSON.stringify(res.body).includes("eyJ"), false);
      const cookies = res.headers["set-cookie"].join("; ");
      assert.match(cookies, /tdm_at=.*HttpOnly/);
      assert.match(cookies, /tdm_rt=[^;]+; Max-Age=\d+; Path=\/api\/v1\/auth/);
      assert.match(cookies, /SameSite=Strict/);
      assert.equal(res.headers["cache-control"], "no-store");
      // Cookie access phải sống bằng refresh token: nếu tự mất sau 15 phút, request kế tiếp không
      // mang token → backend báo "chưa đăng nhập" thay vì "hết hạn" → frontend báo hết phiên oan
      const maxAge = (name) =>
        Number(
          res.headers["set-cookie"].find((c) => c.startsWith(`${name}=`)).match(/Max-Age=(\d+)/)[1],
        );
      assert.equal(maxAge("tdm_at"), maxAge("tdm_rt"));
    });

    it("không chọn “Ghi nhớ đăng nhập” → cookie phiên (đóng trình duyệt là đăng xuất), làm mới vẫn giữ lựa chọn", async () => {
      const agent = withCsrf(request.agent(app));
      const res = await agent.post("/api/v1/auth/login").send(ADMIN);
      assert.equal(res.status, 200);
      for (const c of res.headers["set-cookie"].filter((c) => !/Expires=Thu, 01 Jan 1970/.test(c)))
        assert.doesNotMatch(c, /Max-Age|Expires/, c);
      const again = await agent.post("/api/v1/auth/refresh").send({});
      assert.equal(again.status, 200);
      for (const c of again.headers["set-cookie"].filter(
        (c) => !/Expires=Thu, 01 Jan 1970/.test(c),
      ))
        assert.doesNotMatch(c, /Max-Age|Expires/, c);
      // Phía máy chủ phiên cũng ngắn (SESSION_TTL ≤ 12h), không 7 ngày
      const { Session } = await import("#models/session.model.js");
      const s = await Session.findOne({ revokedAt: null }).sort({ createdAt: -1 }).lean();
      assert.equal(s.remember, false);
      assert.ok(s.expiresAt - Date.now() <= 12 * 3600e3 + 5000);
      await agent.post("/api/v1/auth/logout").send({});
    });

    it("access token hết hạn → 401 TOKEN_EXPIRED (frontend dựa vào mã này để tự làm mới phiên)", async () => {
      const { default: jwt } = await import("jsonwebtoken");
      const { env } = await import("#config/env.js");
      const expired = jwt.sign({ typ: "access", role: "admin" }, env.JWT_ACCESS_SECRET, {
        subject: ADMIN.username,
        issuer: "tranduymedia-api",
        audience: "tranduymedia-web",
        expiresIn: -10,
      });
      const res = await withCsrf(request(app))
        .get("/api/v1/auth/me")
        .set("Cookie", `tdm_at=${expired}`);
      assert.equal(res.status, 401);
      assert.equal(res.body.error.code, "TOKEN_EXPIRED");
    });

    it("GET /auth/me khi có cookie → 200, không có → 401", async () => {
      assert.equal((await admin.get("/api/v1/auth/me")).body.data.user.username, ADMIN.username);
      assert.equal((await withCsrf(request(app)).get("/api/v1/auth/me")).status, 401);
    });

    it("refresh xoay vòng token; dùng lại token cũ TRONG cửa sổ ân hạn → cấp phiên mới, không huỷ phiên đang dùng", async () => {
      const login = await withCsrf(request(app)).post("/api/v1/auth/login").send(ADMIN);
      const oldRt = login.headers["set-cookie"].find((c) => c.startsWith("tdm_rt=")).split(";")[0];

      const r1 = await withCsrf(request(app)).post("/api/v1/auth/refresh").set("Cookie", oldRt);
      assert.equal(r1.status, 200);
      const newRt = r1.headers["set-cookie"].find((c) => c.startsWith("tdm_rt=")).split(";")[0];
      assert.notEqual(newRt, oldRt);

      // Ngay sau khi xoay vòng, một request khác (tab khác / proxy / tải tệp nền) cầm token cũ
      // gọi refresh → race hợp lệ trong cửa sổ ân hạn: vẫn thành công…
      const reuse = await withCsrf(request(app)).post("/api/v1/auth/refresh").set("Cookie", oldRt);
      assert.equal(reuse.status, 200, JSON.stringify(reuse.body));
      // …và phiên thay thế KHÔNG bị huỷ oan
      const after = await withCsrf(request(app)).post("/api/v1/auth/refresh").set("Cookie", newRt);
      assert.equal(after.status, 200, JSON.stringify(after.body));
    });

    it("hai request refresh ĐỒNG THỜI bằng cùng một token → cả hai thành công", async () => {
      const login = await withCsrf(request(app)).post("/api/v1/auth/login").send(ADMIN);
      const rt = login.headers["set-cookie"].find((c) => c.startsWith("tdm_rt=")).split(";")[0];
      const call = () => withCsrf(request(app)).post("/api/v1/auth/refresh").set("Cookie", rt);
      const [a, b] = await Promise.all([call(), call()]);
      assert.equal(a.status, 200, JSON.stringify(a.body));
      assert.equal(b.status, 200, JSON.stringify(b.body));
      const rtA = a.headers["set-cookie"].find((c) => c.startsWith("tdm_rt=")).split(";")[0];
      const next = await withCsrf(request(app)).post("/api/v1/auth/refresh").set("Cookie", rtA);
      assert.equal(next.status, 200, JSON.stringify(next.body));
    });

    it("dùng lại refresh token SAU cửa sổ ân hạn → thu hồi toàn bộ phiên", async () => {
      const login = await withCsrf(request(app)).post("/api/v1/auth/login").send(ADMIN);
      const oldRt = login.headers["set-cookie"].find((c) => c.startsWith("tdm_rt=")).split(";")[0];

      const r1 = await withCsrf(request(app)).post("/api/v1/auth/refresh").set("Cookie", oldRt);
      assert.equal(r1.status, 200);
      const newRt = r1.headers["set-cookie"].find((c) => c.startsWith("tdm_rt=")).split(";")[0];

      // Đẩy thời điểm xoay vòng về quá khứ (ngoài 30s ân hạn) — như cách test hoàn tác xoá vẫn
      // làm với deletedAt: token cũ bị dùng lại lúc này mới bị coi là đánh cắp.
      const { Session } = await import("#models/session.model.js");
      const { createHash } = await import("node:crypto");
      const raw = oldRt.split(";")[0].split("=").slice(1).join("=");
      const tokenHash = createHash("sha256").update(raw).digest("hex");
      await Session.updateOne(
        { tokenHash },
        { $set: { revokedAt: new Date(Date.now() - 120_000) } },
      );

      const reuse = await withCsrf(request(app)).post("/api/v1/auth/refresh").set("Cookie", oldRt);
      assert.equal(reuse.status, 401);
      // phiên mới cũng bị huỷ vì phát hiện token cũ bị dùng lại ngoài cửa sổ ân hạn
      const after = await withCsrf(request(app)).post("/api/v1/auth/refresh").set("Cookie", newRt);
      assert.equal(after.status, 401);
    });

    it("giới hạn 5 thiết bị: đăng nhập lần thứ 6 đăng xuất thiết bị cũ nhất", async () => {
      const rts = [];
      for (let i = 0; i < 6; i++) {
        const r = await withCsrf(request(app))
          .post("/api/v1/auth/login")
          .set("X-Forwarded-For", `10.0.0.${i + 1}`)
          .send(ADMIN);
        rts.push(r.headers["set-cookie"].find((c) => c.startsWith("tdm_rt=")).split(";")[0]);
      }
      const oldest = await withCsrf(request(app))
        .post("/api/v1/auth/refresh")
        .set("Cookie", rts[0]);
      assert.equal(oldest.status, 401);
      const newest = await withCsrf(request(app))
        .post("/api/v1/auth/refresh")
        .set("Cookie", rts[5]);
      assert.equal(newest.status, 200, JSON.stringify(newest.body));
    });

    it("dò mật khẩu từ nhiều IP → khoá theo ID sau 10 lần sai", async () => {
      let last;
      for (let i = 0; i < 11; i++) {
        last = await withCsrf(request(app))
          .post("/api/v1/auth/login")
          .set("X-Forwarded-For", `203.0.113.${i + 1}`) // mỗi lần một IP khác
          .send({ username: "nan-nhan", password: "sai-" + i });
      }
      assert.equal(last.status, 429);
      assert.equal(last.body.error.code, "TOO_MANY_REQUESTS");
      assert.match(last.body.error.message, /thử lại/);
    });

    it("/auth/resume bị giới hạn → chuyển sang trang /429 thân thiện (không hiện chữ trơn)", async () => {
      let last;
      for (let i = 0; i < 61; i++) {
        last = await request(app)
          .get("/api/v1/auth/resume?next=%2Fadmin%2Fproducts%3Fresumed%3D1")
          .set("X-Forwarded-For", "198.51.100.7");
      }
      assert.equal(last.status, 303);
      assert.match(last.headers.location, /^\/429\?next=%2Fadmin%2Fproducts&retry=\d+$/);
    });

    it("request ghi từ Origin lạ → 403", async () => {
      const res = await withCsrf(request(app))
        .post("/api/v1/auth/login")
        .set("Origin", "https://evil.example")
        .send(ADMIN);
      assert.equal(res.status, 403);
    });
  });

  describe("bookings", () => {
    it("thiếu dữ liệu → 400 kèm chi tiết lỗi", async () => {
      const res = await withCsrf(request(app)).post("/api/v1/bookings").send({ name: "A" });
      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, "VALIDATION_ERROR");
      assert.ok(res.body.error.details.some((d) => d.field === "phone"));
    });

    let id;
    it("hợp lệ → 201, chuẩn hoá SĐT", async () => {
      const res = await withCsrf(request(app)).post("/api/v1/bookings").send({
        name: "Nguyễn Văn A",
        phone: "+84 971 542 026",
        service: "san-xuat-video-short",
        date: "",
        budget: "20 – 50 triệu",
        note: "TVC 30s ra mắt sản phẩm",
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.data.status, "pending");
      id = res.body.data.id;
    });

    it("gửi trùng SĐT trong 10 phút → 409", async () => {
      const res = await withCsrf(request(app))
        .post("/api/v1/bookings")
        .send({ name: "Nguyễn Văn A", phone: "0971542026" });
      assert.equal(res.status, 409);
    });

    it("route quản trị khi chưa đăng nhập → 401", async () => {
      assert.equal((await withCsrf(request(app)).get("/api/v1/bookings")).status, 401);
    });

    it("GET /:id và PATCH status (admin)", async () => {
      const got = await admin.get(`/api/v1/bookings/${id}`);
      assert.equal(got.body.data.phone, "0971542026");
      const upd = await admin.patch(`/api/v1/bookings/${id}/status`).send({ status: "contacting" });
      assert.equal(upd.body.data.status, "contacting");
    });

    it("id sai định dạng → 400", async () => {
      const res = await admin.get("/api/v1/bookings/abc");
      assert.equal(res.status, 400);
    });

    it("danh sách có phân trang, đếm theo trạng thái, tìm kiếm", async () => {
      const res = await admin.get("/api/v1/bookings?limit=10");
      assert.equal(res.status, 200);
      assert.equal(res.body.meta.total, 1);
      assert.deepEqual(res.body.meta.counts, { pending: 0, contacting: 1, resolved: 0, all: 1 });
      assert.equal(res.headers["cache-control"], "no-store");
      const byPhone = await admin.get("/api/v1/bookings?q=542026");
      assert.equal(byPhone.body.meta.total, 1);
      const injected = await admin.get("/api/v1/bookings?q=" + encodeURIComponent(".*"));
      assert.equal(injected.body.meta.total, 0);
    });

    it("tìm kiếm linh hoạt: SĐT từng phần (kể cả 1 số), tên không dấu / từng phần / khác hoa thường", async () => {
      // SĐT đã lưu: 0971542026 — từng đoạn 2 số ở đầu / giữa / cuối đều phải ra
      for (const q of ["7", "09", "71", "2026", "0971 542", "0971.542.026", "+84 971 542 026"]) {
        const res = await admin.get(`/api/v1/bookings?q=${encodeURIComponent(q)}`);
        assert.equal(res.body.meta.total, 1, `q=${q}`);
      }
      // Tên đã lưu: "Nguyễn Văn A" — không dấu, từng phần, hoa thường đều phải ra
      for (const q of ["nguyen van", "Văn", "NGUYỄN", "van a"]) {
        const res = await admin.get(`/api/v1/bookings?q=${encodeURIComponent(q)}`);
        assert.equal(res.body.meta.total, 1, `q=${q}`);
      }
      const none = await admin.get("/api/v1/bookings?q=xyz123");
      assert.equal(none.body.meta.total, 0);
    });

    it("họ tên / SĐT không hợp lệ → 400 với thông báo rõ ràng", async () => {
      const res = await withCsrf(request(app))
        .post("/api/v1/bookings")
        .send({ name: "<script>", phone: "0123" });
      assert.equal(res.status, 400);
      const fields = Object.fromEntries(res.body.error.details.map((d) => [d.field, d.message]));
      assert.match(fields.name, /chữ cái/);
      assert.match(fields.phone, /chưa đúng/);
    });

    it("honeypot bị điền → báo thành công nhưng không lưu", async () => {
      const res = await withCsrf(request(app))
        .post("/api/v1/bookings")
        .send({ name: "Bot Spam", phone: "0901234567", website: "http://spam" });
      assert.equal(res.status, 201);
      const list = await admin.get("/api/v1/bookings");
      assert.equal(list.body.meta.total, 1);
    });

    it("thiếu header chống CSRF → 403", async () => {
      const res = await request(app)
        .post("/api/v1/bookings")
        .send({ name: "Ai đó", phone: "0911111111" });
      assert.equal(res.status, 403);
      assert.equal(res.body.error.code, "CSRF_REJECTED");
    });

    it("xoá: chưa giải quyết → 409; đã giải quyết → 204 và biến mất khỏi danh sách", async () => {
      const notYet = await admin.delete(`/api/v1/bookings/${id}`);
      assert.equal(notYet.status, 409);
      assert.equal(notYet.body.error.code, "BOOKING_NOT_RESOLVED");
      assert.equal(
        (await request(app).delete(`/api/v1/bookings/${id}`).set("X-Requested-With", "fetch"))
          .status,
        401,
      );

      await admin.patch(`/api/v1/bookings/${id}/status`).send({ status: "resolved" });
      assert.equal((await admin.delete(`/api/v1/bookings/${id}`)).status, 204);
      assert.equal((await admin.get(`/api/v1/bookings/${id}`)).status, 404);
      assert.equal((await admin.delete(`/api/v1/bookings/${id}`)).status, 404);
      assert.equal((await admin.get("/api/v1/bookings")).body.meta.total, 0);
      // vẫn còn trong DB (xoá mềm)
      const { Booking } = await import("#models/booking.model.js");
      assert.ok((await Booking.findById(id).lean()).deletedAt);
    });

    it("hoàn tác xoá → yêu cầu quay lại danh sách; khôi phục lần 2 → 404", async () => {
      const res = await admin.post(`/api/v1/bookings/${id}/restore`);
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal(res.body.data.deletedAt, null);
      assert.equal((await admin.get(`/api/v1/bookings/${id}`)).status, 200);
      assert.equal((await admin.post(`/api/v1/bookings/${id}/restore`)).status, 404);
      // dọn lại như cũ cho các test sau
      assert.equal((await admin.delete(`/api/v1/bookings/${id}`)).status, 204);
    });

    it("quá thời gian hoàn tác (toast đã tắt) → không khôi phục được nữa", async () => {
      const { Booking } = await import("#models/booking.model.js");
      await Booking.updateOne({ _id: id }, { $set: { deletedAt: new Date(Date.now() - 60_000) } });
      assert.equal((await admin.post(`/api/v1/bookings/${id}/restore`)).status, 404);
    });

    it("trạng thái không hợp lệ → 400", async () => {
      const res = await admin.patch(`/api/v1/bookings/${id}/status`).send({ status: "done" });
      assert.equal(res.status, 400);
    });
  });

  describe("products", () => {
    const sample = {
      title: "Bộ ảnh Giáng sinh",
      category: "Concept mùa lễ",
      summary: "Tuyết trắng, lò sưởi và áo len đỏ.",
      media: [
        { type: "image", url: "https://res.cloudinary.com/x/image/upload/a.jpg" },
        { type: "embed", url: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" },
      ],
    };
    let pid;

    it("tạo sản phẩm cần đăng nhập", async () => {
      assert.equal(
        (await withCsrf(request(app)).post("/api/v1/products").send(sample)).status,
        401,
      );
    });

    it("thiếu dữ liệu → 400 kèm lỗi từng trường", async () => {
      const res = await admin.post("/api/v1/products").send({ title: "A", media: [] });
      assert.equal(res.status, 400);
      const f = res.body.error.details.map((d) => d.field);
      assert.ok(f.includes("category") && f.includes("media"));
    });

    it("tạo → tự sinh slug không dấu; trùng đường dẫn → 409 báo rõ, KHÔNG tự thêm hậu tố", async () => {
      const a = await admin.post("/api/v1/products").send(sample);
      assert.equal(a.status, 201);
      assert.equal(a.body.data.slug, "bo-anh-giang-sinh");
      pid = a.body.data.id;
      const b = await admin.post("/api/v1/products").send(sample);
      assert.equal(b.status, 409);
      assert.equal(b.body.error.code, "SLUG_TAKEN");
      assert.equal(b.body.error.details[0].field, "slug");
      assert.match(b.body.error.message, /Bộ ảnh Giáng sinh/);
      const c = await admin.post("/api/v1/products").send({ ...sample, slug: "giang-sinh-2025" });
      assert.equal(c.status, 201);
      assert.equal(c.body.data.slug, "giang-sinh-2025");
      // Sửa đường dẫn sang đường dẫn đã có → 409; kiểm tra trước khi lưu
      const d = await admin
        .patch(`/api/v1/products/${c.body.data.id}`)
        .send({ slug: "bo-anh-giang-sinh" });
      assert.equal(d.status, 409);
      const chk = await admin.get("/api/v1/products/manage/slug-check?slug=bo-anh-giang-sinh");
      assert.equal(chk.body.data.available, false);
      const own = await admin.get(
        `/api/v1/products/manage/slug-check?slug=bo-anh-giang-sinh&exceptId=${pid}`,
      );
      assert.equal(own.body.data.available, true);
    });

    it("công khai: danh sách & chi tiết theo slug; ẩn bản nháp", async () => {
      assert.equal((await request(app).get("/api/v1/products")).body.data.length, 2);
      assert.equal((await request(app).get("/api/v1/products/bo-anh-giang-sinh")).status, 200);
      await admin.patch(`/api/v1/products/${pid}`).send({ published: false });
      assert.equal((await request(app).get("/api/v1/products/bo-anh-giang-sinh")).status, 404);
      assert.equal((await admin.get("/api/v1/products/manage")).body.data.length, 2);
    });

    it("link không phải https bị từ chối", async () => {
      const res = await admin
        .patch(`/api/v1/products/${pid}`)
        .send({ media: [{ type: "image", url: "javascript:alert(1)" }] });
      assert.equal(res.status, 400);
    });

    it("xoá → biến mất ở cả công khai lẫn quản trị", async () => {
      assert.equal((await admin.delete(`/api/v1/products/${pid}`)).status, 204);
      assert.equal((await admin.get("/api/v1/products/manage")).body.data.length, 1);
      assert.equal((await admin.delete(`/api/v1/products/${pid}`)).status, 404);
      const { Product } = await import("#models/product.model.js");
      const doc = await Product.findById(pid).lean();
      assert.ok(doc.deletedAt && doc.deletedBy, "xoá mềm phải lưu thời điểm + người xoá");
    });

    it("hoàn tác xoá sản phẩm → hiện lại, không lộ trường xoá mềm", async () => {
      const res = await admin.post(`/api/v1/products/${pid}/restore`);
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal(res.body.data.deletedAt, undefined);
      assert.equal((await admin.get(`/api/v1/products/manage/${pid}`)).status, 200);
      assert.equal((await admin.post(`/api/v1/products/${pid}/restore`)).status, 404);
      assert.equal((await admin.delete(`/api/v1/products/${pid}`)).status, 204);
    });

    it("ghim nổi bật: tối đa 5, sản phẩm ghim đứng đầu, ghim thứ 6 → 409 thân thiện", async () => {
      const ids = [];
      for (let i = 1; i <= 6; i++) {
        const r = await admin
          .post("/api/v1/products")
          .send({ ...sample, title: `Ghim ${i}`, slug: `ghim-${i}` });
        assert.equal(r.status, 201);
        ids.push(r.body.data.id);
      }
      for (const id of ids.slice(0, 5))
        assert.equal(
          (await admin.post(`/api/v1/products/${id}/pin`).send({ pinned: true })).status,
          200,
        );
      const sixth = await admin.post(`/api/v1/products/${ids[5]}/pin`).send({ pinned: true });
      assert.equal(sixth.status, 409);
      assert.equal(sixth.body.error.code, "PIN_LIMIT");
      assert.match(sixth.body.error.message, /tối đa 5/);
      const list = (await request(app).get("/api/v1/products")).body.data;
      assert.equal(list[0].slug, "ghim-5", "ghim sau cùng đứng đầu");
      assert.ok(list.slice(0, 5).every((p) => p.pinnedAt));
      // Bỏ ghim 1 cái → ghim được cái thứ 6
      assert.equal(
        (await admin.post(`/api/v1/products/${ids[0]}/pin`).send({ pinned: false })).status,
        200,
      );
      assert.equal(
        (await admin.post(`/api/v1/products/${ids[5]}/pin`).send({ pinned: true })).status,
        200,
      );
      for (const id of ids) await admin.delete(`/api/v1/products/${id}`);
    });

    it("nhập link YouTube → dạng nhúng (không cần Cloudinary)", async () => {
      const res = await admin
        .post("/api/v1/media/import")
        .send({ url: "https://youtu.be/dQw4w9WgXcQ" });
      assert.equal(res.status, 201);
      assert.equal(res.body.data.type, "embed");
    });
  });

  describe("overview", () => {
    it("chưa đăng nhập → 401", async () => {
      assert.equal((await withCsrf(request(app)).get("/api/v1/overview")).status, 401);
    });

    it("admin → đủ số liệu đặt lịch (30 ngày liên tục) + sản phẩm", async () => {
      const res = await admin.get("/api/v1/overview");
      assert.equal(res.status, 200, JSON.stringify(res.body));
      const { bookings, products, system } = res.body.data;
      assert.equal(bookings.series.length, 30);
      assert.ok(bookings.series.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date)));
      assert.equal(bookings.series.reduce((a, d) => a + d.n, 0) >= bookings.today, true);
      assert.equal(typeof bookings.counts.all, "number");
      assert.ok(Array.isArray(bookings.open) && bookings.open.length <= 5);
      assert.equal(products.total, products.published + products.hidden);
      assert.equal(system.storage, "not_configured");
      assert.equal(res.headers["cache-control"], "no-store");
    });
  });

  describe("media", () => {
    it("upload khi chưa đăng nhập → 401", async () => {
      const res = await withCsrf(request(app))
        .post("/api/v1/media")
        .attach("file", Buffer.from([0xff, 0xd8, 0xff]), {
          filename: "a.jpg",
          contentType: "image/jpeg",
        });
      assert.equal(res.status, 401);
    });

    it("chưa cấu hình Cloudinary → upload trả 503", async () => {
      const res = await admin
        .post("/api/v1/media")
        .attach("file", Buffer.from([0xff, 0xd8, 0xff]), {
          filename: "a.jpg",
          contentType: "image/jpeg",
        });
      assert.equal(res.status, 503);
    });

    it("định dạng không hỗ trợ → 400", async () => {
      const res = await admin
        .post("/api/v1/media")
        .attach("file", Buffer.from("x"), { filename: "a.txt", contentType: "text/plain" });
      assert.equal(res.status, 400);
    });

    it("đăng xuất khi chưa đăng nhập → 401", async () => {
      assert.equal((await withCsrf(request(app)).post("/api/v1/auth/logout")).status, 401);
    });

    it("đăng xuất → xoá cookie, /me trả 401", async () => {
      const res = await admin.post("/api/v1/auth/logout");
      assert.equal(res.status, 204);
      assert.equal((await admin.get("/api/v1/auth/me")).status, 401);
    });

    it("danh sách media rỗng (công khai)", async () => {
      const res = await withCsrf(request(app)).get("/api/v1/media");
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.data, []);
    });
  });

  describe("nội dung trang Về chúng tôi", () => {
    const img = (src) => ({ src, pos: "50% 30%" });
    const payload = () => ({
      header: {
        eyebrow: "Hồ sơ",
        description: "Mô tả đầu trang",
        columns: Array.from({ length: 6 }, (_, c) =>
          Array.from({ length: 3 }, (_, r) => ({ src: `/images/h${c}${r}.webp` })),
        ),
        banner: { mode: "images", video: { src: "", poster: "" } },
      },
      story: {
        eyebrow: "Câu chuyện",
        titleLead: "Đối tác gia công",
        titleAccent: "toàn diện.",
        taglines: ["Một", "Hai"],
        paragraphs: ["Đoạn 1", "Đoạn 2"],
        facts: Array.from({ length: 4 }, (_, i) => ({ label: `Mục ${i}`, value: `Giá trị ${i}` })),
        image: { ...img("/images/a.webp"), alt: "Ảnh" },
      },
      core: {
        eyebrow: "TDM",
        title: "Giá trị",
        vision: { text: "Tầm nhìn", image: img("/images/b.webp") },
        mission: { text: "Sứ mệnh", image: img("https://res.cloudinary.com/x/image/upload/c.jpg") },
      },
      standards: {
        eyebrow: "Chuẩn mực",
        titleLead: "Cam kết",
        titleAccent: "chuẩn mực.",
        intro: "Giới thiệu",
        items: Array.from({ length: 5 }, (_, i) => ({ title: `T${i}`, desc: `D${i}` })),
      },
      values: {
        eyebrow: "Khách hàng",
        titleLead: "Uy tín.",
        titleAccent: "Tận tâm.",
        description: "Ba giá trị",
        items: Array.from({ length: 3 }, (_, i) => ({
          title: `Giá trị ${i}`,
          desc: `Mô tả ${i}`,
          image: img(`/images/v${i}.webp`),
        })),
      },
      ecosystem: {
        eyebrow: "Hệ sinh thái",
        tagline: "6 dịch vụ",
        items: Array.from({ length: 6 }, (_, i) => ({
          name: `Dịch vụ ${i}`,
          desc: `Mô tả ${i}`,
          image: img(`/images/s${i}.webp`),
        })),
      },
    });

    before(async () => {
      assert.equal((await admin.post("/api/v1/auth/login").send(ADMIN)).status, 200);
    });

    it("chưa chỉnh gì → công khai nhận null (website dùng nội dung mặc định)", async () => {
      const res = await withCsrf(request(app)).get("/api/v1/content/about");
      assert.equal(res.status, 200);
      assert.equal(res.body.data, null);
    });

    it("lưu khi chưa đăng nhập → 401", async () => {
      const res = await withCsrf(request(app)).patch("/api/v1/content/about").send(payload());
      assert.equal(res.status, 401);
    });

    it("thiếu / sai dữ liệu → 400, báo đúng ô lỗi", async () => {
      const bad = payload();
      bad.story.paragraphs[1] = "   ";
      bad.story.image.pos = "tuỳ ý";
      bad.values.items = []; // tối thiểu 1 thẻ
      const res = await admin.patch("/api/v1/content/about").send(bad);
      assert.equal(res.status, 400);
      const fields = res.body.error.details.map((d) => d.field);
      assert.ok(fields.includes("story.paragraphs.1"), fields.join());
      assert.ok(fields.includes("story.image.pos"), fields.join());
      assert.ok(fields.includes("values.items"), fields.join());
    });

    it("admin lưu → công khai đọc lại đúng nội dung, ảnh trong /images vẫn dùng được", async () => {
      const res = await admin.patch("/api/v1/content/about").send(payload());
      assert.equal(res.status, 200);
      const pub = await withCsrf(request(app)).get("/api/v1/content/about");
      assert.equal(pub.body.data.data.story.titleLead, "Đối tác gia công");
      assert.equal(pub.body.data.data.ecosystem.items.length, 6);
      assert.ok(pub.body.data.updatedAt);
      assert.equal(pub.headers["cache-control"], "no-store");
    });

    it("lưu lần nữa → ghi đè, vẫn chỉ 1 bản ghi", async () => {
      const next = payload();
      next.header.description = "Mô tả mới";
      assert.equal((await admin.patch("/api/v1/content/about").send(next)).status, 200);
      const { SiteContent } = await import("#models/site-content.model.js");
      assert.equal(await SiteContent.countDocuments({ key: "about" }), 1);
      const pub = await withCsrf(request(app)).get("/api/v1/content/about");
      assert.equal(pub.body.data.data.header.description, "Mô tả mới");
    });

    it("thêm / xoá thẻ: số thẻ thay đổi được trong giới hạn, ngoài giới hạn → 400", async () => {
      const ok = payload();
      ok.values.items.push({ title: "Thẻ mới", desc: "Mô tả", image: img("/images/n.webp") }); // 4 thẻ
      ok.ecosystem.items.pop(); // 5 thẻ
      ok.standards.items.splice(1, 2); // 3 nguyên tắc
      ok.ecosystem.items[0].href = "https://example.com/dich-vu";
      assert.equal((await admin.patch("/api/v1/content/about").send(ok)).status, 200);
      const pub = await withCsrf(request(app)).get("/api/v1/content/about");
      assert.equal(pub.body.data.data.values.items.length, 4);
      assert.equal(pub.body.data.data.ecosystem.items.length, 5);
      assert.equal(pub.body.data.data.standards.items.length, 3);
      assert.equal(pub.body.data.data.ecosystem.items[1].href, "/dich-vu"); // mặc định khi không gửi

      const none = payload();
      none.values.items = []; // tối thiểu 1 thẻ
      const bad = payload();
      bad.ecosystem.items[0].href = "javascript:alert(1)";
      for (const body of [none, bad]) {
        const r = await admin.patch("/api/v1/content/about").send(body);
        assert.equal(r.status, 400);
      }
    });

    it("banner: chọn video mà chưa có video → 400; có video https → lưu được", async () => {
      const none = payload();
      none.header.banner.mode = "video";
      const r1 = await admin.patch("/api/v1/content/about").send(none);
      assert.equal(r1.status, 400);
      assert.ok(r1.body.error.details.some((d) => d.field === "header.banner.video.src"));

      const bad = payload();
      bad.header.banner = { mode: "video", video: { src: "http://x.test/a.mp4", poster: "" } };
      assert.equal((await admin.patch("/api/v1/content/about").send(bad)).status, 400);

      const ok = payload();
      ok.header.banner = {
        mode: "video",
        video: { src: "https://res.cloudinary.com/x/video/upload/v1/about/a.mp4", poster: "" },
      };
      assert.equal((await admin.patch("/api/v1/content/about").send(ok)).status, 200);
      const pub = await withCsrf(request(app)).get("/api/v1/content/about");
      assert.equal(pub.body.data.data.header.banner.mode, "video");
    });

    it("các trang khác (home, services, site, products): lưu cây nội dung có giới hạn", async () => {
      const tree = {
        hero: { title: "Tiêu đề", slides: [{ src: "/images/a.webp", pos: "50% 50%", alt: "A" }] },
        steps: [{ title: "Một", desc: "Mô tả" }],
      };
      for (const key of ["home", "services", "site", "products"]) {
        assert.equal((await admin.patch(`/api/v1/content/${key}`).send(tree)).status, 200, key);
        const pub = await withCsrf(request(app)).get(`/api/v1/content/${key}`);
        assert.equal(pub.body.data.data.hero.title, "Tiêu đề");
      }
      // chưa đăng nhập → 401; trang không tồn tại → 400; địa chỉ không an toàn → 400
      assert.equal(
        (await withCsrf(request(app)).patch("/api/v1/content/home").send(tree)).status,
        401,
      );
      assert.equal((await admin.patch("/api/v1/content/khong-co").send(tree)).status, 400);
      const bad = { hero: { slides: [{ src: "javascript:alert(1)" }] } };
      const r = await admin.patch("/api/v1/content/home").send(bad);
      assert.equal(r.status, 400);
      assert.ok(r.body.error.details.some((d) => d.field === "hero.slides.0.src"));
      const deep = { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: 1 } } } } } } } } } };
      assert.equal((await admin.patch("/api/v1/content/home").send(deep)).status, 400);
      for (const key of ["home", "services", "site", "products"])
        assert.equal((await admin.delete(`/api/v1/content/${key}`)).status, 204);
    });

    it("khôi phục mặc định → xoá bản đã chỉnh", async () => {
      assert.equal((await admin.delete("/api/v1/content/about")).status, 204);
      const pub = await withCsrf(request(app)).get("/api/v1/content/about");
      assert.equal(pub.body.data, null);
    });
  });
});

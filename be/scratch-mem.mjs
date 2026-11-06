// TẠM THỜI (xoá sau khi kiểm thử): backend chạy bằng MongoDB tạm trong bộ nhớ, không đụng DB thật.
process.env.NODE_ENV = "development";
process.env.PORT = "4000";
process.env.CLOUDINARY_CLOUD_NAME = "";
process.env.ADMIN_ID = "tranduy";
process.env.ADMIN_PASSWORD = "Matkhau-Rat-Manh-2026";
process.env.CORS_ORIGINS = "http://localhost:8787";
const { MongoMemoryServer } = await import("mongodb-memory-server");
const mongo = await MongoMemoryServer.create();
const { connectDatabase } = await import("#config/database.js");
const { createApp } = await import("#app");
await connectDatabase(mongo.getUri(), { retries: 1 });
createApp().listen(4000, () => console.log("mem backend on 4000"));

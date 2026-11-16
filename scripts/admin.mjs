#!/usr/bin/env node
// إدارة حسابات المشرفين من سطر الأوامر.
//
//   npm run admin -- add   <email> <password>   إضافة مشرف
//   npm run admin -- passwd <email> <password>  تغيير كلمة المرور (ويخرجه من كل الأجهزة)
//   npm run admin -- remove <email>             حذف مشرف
//   npm run admin -- list                       عرض المشرفين
//
// يقرأ DATA_DIR من البيئة (نفس قيمة الموقع)، والافتراضي ./data

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";

const dataDir = path.resolve(process.env.DATA_DIR || "data");
fs.mkdirSync(path.join(dataDir, "uploads"), { recursive: true });
const db = new Database(path.join(dataDir, "alsafa.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);`);

const hash = (pw) => {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(pw, salt, 64).toString("hex")}`;
};

const [cmd, email, password] = process.argv.slice(2);
const fail = (msg) => {
  console.error("✗ " + msg);
  process.exit(1);
};

switch (cmd) {
  case "add": {
    if (!email || !password) fail("الاستخدام: npm run admin -- add <email> <password>");
    if (password.length < 10) fail("كلمة المرور يجب أن تكون 10 أحرف على الأقل.");
    try {
      db.prepare("INSERT INTO admins (email, password_hash) VALUES (?, ?)").run(email.trim(), hash(password));
    } catch (e) {
      fail(String(e.message).includes("UNIQUE") ? "هذا البريد مضاف مسبقاً. استخدم passwd لتغيير كلمة المرور." : e.message);
    }
    console.log(`✓ تمت إضافة المشرف ${email}`);
    break;
  }
  case "passwd": {
    if (!email || !password) fail("الاستخدام: npm run admin -- passwd <email> <password>");
    if (password.length < 10) fail("كلمة المرور يجب أن تكون 10 أحرف على الأقل.");
    const row = db.prepare("SELECT id FROM admins WHERE email = ?").get(email.trim());
    if (!row) fail("لا يوجد مشرف بهذا البريد.");
    db.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").run(hash(password), row.id);
    db.prepare("DELETE FROM sessions WHERE admin_id = ?").run(row.id);
    console.log(`✓ تم تغيير كلمة المرور لـ ${email}`);
    break;
  }
  case "remove": {
    if (!email) fail("الاستخدام: npm run admin -- remove <email>");
    const r = db.prepare("DELETE FROM admins WHERE email = ?").run(email.trim());
    console.log(r.changes ? `✓ تم حذف ${email}` : "لا يوجد مشرف بهذا البريد.");
    break;
  }
  case "list": {
    const rows = db.prepare("SELECT email, created_at FROM admins ORDER BY id").all();
    if (!rows.length) console.log("لا يوجد مشرفون بعد.");
    for (const r of rows) console.log(`- ${r.email}  (${r.created_at})`);
    break;
  }
  default:
    fail("أوامر متاحة: add | passwd | remove | list");
}

import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import crypto from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import jwt from "jsonwebtoken";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DB_NAME = "wad-01";
const COLLECTION = "user";
const JWT_SECRET = process.env.JWT_SECRET || "mydefaultjwtsecret";
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

async function getAuthenticatedUser(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return { error: "Unauthorized (no token)", status: 401 };
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return { error: "Unauthorized (invalid token)", status: 401 };
  }

  const client = await getClientPromise();
  const db = client.db(DB_NAME);
  const user = await db.collection(COLLECTION).findOne({ email: payload.email });

  if (!user) {
    return { error: "Unauthorized (user not found)", status: 401 };
  }

  return { db, user };
}

export async function GET(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (auth.error) return json({ message: auth.error }, auth.status);

    return json({
      success: true,
      profileImage: auth.user.profileImage || null,
    });
  } catch {
    return json({ message: "Failed to load profile image" }, 500);
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (auth.error) return json({ message: auth.error }, auth.status);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return json({ message: "Missing image file" }, 400);
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return json({ message: "Only image file types are allowed" }, 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length === 0) {
      return json({ message: "Empty file is not allowed" }, 400);
    }

    const ext = MIME_EXT[file.type] || ".img";
    const fileName = `${crypto.randomBytes(32).toString("hex")}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profile-images");
    const savePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(savePath, buffer);

    const publicUrl = `/uploads/profile-images/${fileName}`;

    await auth.db.collection(COLLECTION).updateOne(
      { _id: auth.user._id },
      {
        $set: {
          profileImage: publicUrl,
          updatedAt: new Date(),
        },
      }
    );

    return json(
      {
        success: true,
        profileImage: publicUrl,
      },
      200
    );
  } catch {
    return json({ message: "Upload failed" }, 500);
  }
}

export async function DELETE(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (auth.error) return json({ message: auth.error }, auth.status);

    const currentImage = auth.user.profileImage;
    if (currentImage) {
      const safeRelativePath = String(currentImage).replace(/^\/+/, "");
      const filePath = path.join(process.cwd(), "public", safeRelativePath);

      try {
        await rm(filePath);
      } catch {
        // Ignore if file does not exist.
      }
    }

    await auth.db.collection(COLLECTION).updateOne(
      { _id: auth.user._id },
      { $set: { profileImage: null, updatedAt: new Date() } }
    );

    return json({ success: true, message: "Profile image removed" }, 200);
  } catch {
    return json({ message: "Delete failed" }, 500);
  }
}

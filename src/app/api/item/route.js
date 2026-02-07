import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "wad-01";     // <-- your database name
const COLLECTION = "item";         // <-- your collection name

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

/**
 * GET /api/item?page=1&limit=10
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));
    const skip = (page - 1) * limit;

    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const total = await db.collection(COLLECTION).countDocuments({});
    const data = await db
      .collection(COLLECTION)
      .find({})
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json(
      {
        data,
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      { headers: corsHeaders }
    );
  } catch (e) {
    return NextResponse.json(
      { message: e?.toString?.() ?? "Unknown error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/item
 */
export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400, headers: corsHeaders }
    );
  }
  try {

    const itemName = (body.itemName ?? "").trim();
    const itemCategory = (body.itemCategory ?? "").trim();
    const itemPrice = Number(body.itemPrice);
    const status = String(body.status ?? "ACTIVE").trim().toUpperCase();

    if (!itemName || !itemCategory || Number.isNaN(itemPrice)) {
      return NextResponse.json(
        { message: "Missing/invalid fields: itemName, itemCategory, itemPrice" },
        { status: 400, headers: corsHeaders }
      );
    }

    const allowedStatus = new Set(["ACTIVE", "INACTIVE"]);
    const safeStatus = allowedStatus.has(status) ? status : "ACTIVE";

    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const result = await db.collection(COLLECTION).insertOne({
      itemName,
      itemCategory,
      itemPrice,
      status: safeStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { id: result.insertedId },
      { status: 201, headers: corsHeaders }
    );
  } catch (e) {
    return NextResponse.json(
      { message: e?.toString?.() ?? "Unknown error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

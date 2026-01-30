import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "wad-01";
const COLLECTION_NAME = "item";

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const result = await db.collection(COLLECTION_NAME).find({}).toArray();

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (e) {
    return NextResponse.json(
      { message: e?.toString?.() ?? "Unknown error" },
      { status: 400, headers: corsHeaders }
    );
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { name, price, category } = data;

    if (!name || !category || price === undefined || price === null) {
      return NextResponse.json(
        { message: "Missing required fields: name, price, category" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Optional: ensure price is numeric
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice)) {
      return NextResponse.json(
        { message: "price must be a number" },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const result = await db.collection(COLLECTION_NAME).insertOne({
      itemName: name,
      itemCategory: category,
      itemPrice: numericPrice,
      status: "ACTIVE",
    });

    return NextResponse.json(
      { id: result.insertedId },
      { status: 201, headers: corsHeaders }
    );
  } catch (e) {
    return NextResponse.json(
      { message: e?.toString?.() ?? "Unknown error" },
      { status: 400, headers: corsHeaders }
    );
  }
}

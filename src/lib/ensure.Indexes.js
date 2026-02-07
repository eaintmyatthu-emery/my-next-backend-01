import { getClientPromise } from "@/lib/mongodb";
export async function ensureIndexes() {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const collection = db.collection("user");
    await collection.createIndex({ username: 1 }, { unique: true });
    await collection.createIndex({ email: 1 }, { unique: true });
}

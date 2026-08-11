import { z } from 'zod';

const POST_TYPES = ['normal', 'achievement', 'recruitment', 'event'];

const postSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  type: z.enum(POST_TYPES).catch('normal'),
  author: z.string().default('Ẩn danh'),
  role: z.string().default(''),
  avatar: z.string().default(''),
  verified: z.boolean().default(false),
  time: z.string().default(''),
  text: z.string().default(''),
  image: z.string().nullable().default(null),
  likes: z.number().default(0),
  comments: z.number().default(0),
  reposts: z.number().default(0),
  liked: z.boolean().default(false),
});

async function main() {
  try {
    const res = await fetch('http://localhost:8080/api/v1/posts?page=0&size=5&sort=recent');
    const body = await res.json();
    console.log("Raw response data:", JSON.stringify(body, null, 2));

    let items = [];
    if (body.data && body.data.content) {
      items = body.data.content;
    } else if (Array.isArray(body)) {
      items = body;
    } else {
      console.log("Cannot find items in response");
      return;
    }

    console.log(`Found ${items.length} items`);
    for (const item of items) {
      const parsed = postSchema.safeParse(item);
      if (!parsed.success) {
        console.error("Parse failed for item:", item);
        console.error(parsed.error);
      } else {
        console.log("Parsed successfully:", parsed.data.id);
      }
    }
  } catch (err) {
    console.error("Fetch failed", err);
  }
}
main();

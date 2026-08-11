import { z } from 'zod';

const POST_TYPES = ['normal', 'achievement', 'recruitment', 'event'];
const POST_CONTENT_MAX = 5000;

const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Nội dung bài viết không được để trống')
    .max(POST_CONTENT_MAX, `Nội dung bài viết không được vượt quá ${POST_CONTENT_MAX} ký tự`),
  type: z.enum(POST_TYPES).default('normal'),
  imageUrl: z.string().max(500).optional(),
  
  job: z.object({
    title: z.string().trim().optional(),
    company: z.string().trim().optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT']).default('FULL_TIME').optional(),
    location: z.string().optional(),
    salaryMin: z.number().or(z.nan().transform(() => undefined)).optional(),
    salaryMax: z.number().or(z.nan().transform(() => undefined)).optional(),
    applyUrl: z.string().optional(),
    contactEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  }).optional(),

  event: z.object({
    title: z.string().trim().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    location: z.string().optional(),
    capacity: z.number().or(z.nan().transform(() => undefined)).optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'recruitment') {
    if (!data.job?.title) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc nhập chức danh', path: ['job', 'title'] });
    if (!data.job?.company) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc nhập công ty', path: ['job', 'company'] });
  }
  if (data.type === 'event') {
    if (!data.event?.title) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc nhập tên sự kiện', path: ['event', 'title'] });
    if (!data.event?.startTime) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc nhập thời gian bắt đầu', path: ['event', 'startTime'] });
  }
});

const data = {
  content: "",
  type: "recruitment",
  imageUrl: "https://pub-....jpg",
  job: {
    title: "Software Engineer",
    company: "Acme Corp",
    employmentType: "FULL_TIME",
    location: "",
    salaryMin: 1000,
    salaryMax: 12000,
    contactEmail: "nhuutriet163@gmail.com",
    applyUrl: "https://www.facebook.com/"
  }
};

const res = createPostSchema.safeParse(data);
if (!res.success) {
  console.error(JSON.stringify(res.error.format(), null, 2));
} else {
  console.log("Success!");
}

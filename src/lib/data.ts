import z from "zod"
import data from "./data.json"

const videoSchema = z.object({
    title: z.string(),
    mediaUrl: z.string(),
    mediaType: z.enum(["YOUTUBE", "MP4"]),
    thumbnailUrl: z.string(),
    slug: z.string(),
    duration: z.string().optional(),
})

export type Video = z.infer<typeof videoSchema>

const videoWithCategorySchema = videoSchema.extend({
    category: z.string(),
    categorySlug: z.string(),
})

export type VideoWithCategory = z.infer<typeof videoWithCategorySchema>

const categorySchema = z.object({
    slug: z.string(),
    name: z.string(),
    iconUrl: z.string(),
})

export type Category = z.infer<typeof categorySchema>

const categoryDataSchema = z.object({
    category: categorySchema,
    contents: z.array(videoSchema),
})

export type CategoryData = z.infer<typeof categoryDataSchema>

const datasetSchema = z.object({
    categories: z.array(categoryDataSchema),
})
const dataset = datasetSchema.safeParse(data);

if (!dataset.success) {
    console.log(dataset.error)
    throw new Error(dataset.error.message)
}

export const DATASET = dataset.data.categories



/** Return all videos enriched with their parent category name */
export const getAllVideos = (): VideoWithCategory[] =>
    DATASET.flatMap((cat) =>
        cat.contents.map((v) => ({
            ...v,
            category: cat.category.name,
            categorySlug: cat.category.slug,
        }))
    );

/** Return videos belonging to a specific category */
export const getVideosByCategory = (category: string): VideoWithCategory[] =>
    getAllVideos().filter((v) => v.category === category);

/** Return list of unique categories */
export const getCategories = (): Category[] =>
    DATASET.map((cat) => cat.category);

/** Find a single video by its slug */
export const getVideoBySlug = (slug: string): VideoWithCategory | undefined =>
    getAllVideos().find((v) => v.slug === slug);

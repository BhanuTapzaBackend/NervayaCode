import mongoose, { Schema, Document, Model } from 'mongoose';
import { UNPRIORITIZED } from '../constants/priority.constants';

export interface IBlog extends Document {
  title: string;
  slug: string;
  description: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  recommendedBlogs: mongoose.Types.ObjectId[];
  metaTitle: string;
  metaDescription: string;
  metaImage: string;
  readTime: number;
  ctaText: string;
  ctaLink: string;
  isPublished: boolean;
  /** Admin display order — 1 shows first; UNPRIORITIZED means "not numbered". */
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    recommendedBlogs: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Blog' }],
      default: [],
    },
    metaTitle: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'Meta title must not exceed 120 characters'],
    },
    metaDescription: {
      type: String,
      default: '',
      trim: true,
      maxlength: [320, 'Meta description must not exceed 320 characters'],
    },
    metaImage: {
      type: String,
      default: '',
    },
    readTime: {
      type: Number,
      default: 1,
      min: [1, 'Read time must be at least 1 minute'],
    },
    ctaText: {
      type: String,
      default: '',
      trim: true,
    },
    ctaLink: {
      type: String,
      default: '',
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: Number,
      default: UNPRIORITIZED,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

blogSchema.index({ isPublished: 1, priority: 1, createdAt: -1 });
blogSchema.index(
  { title: 'text', author: 'text', description: 'text', content: 'text' },
  {
    weights: { title: 10, author: 5, description: 3, content: 1 },
    name: 'blog_text_search',
  },
);

// Force Mongoose to use the updated schema in development. Without this the
// model compiled before a schema change survives hot-reload, and `strict: true`
// silently drops the new field on write — the update succeeds but nothing saves.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Blog;
}

const Blog: Model<IBlog> = mongoose.models.Blog || mongoose.model<IBlog>('Blog', blogSchema);

export default Blog;

import { Post } from "@/components/home/PostCard";

export interface ExtendedPost extends Post {
  content: string;
  author: string;
  authorImage?: string;
  tags: string[];
}

export const posts: ExtendedPost[] = [];

export const getPostsByCategory = (categorySlug: string): ExtendedPost[] => {
  return posts.filter((post) => post.categorySlug === categorySlug);
};

export const getFeaturedPosts = (count: number = 6): ExtendedPost[] => {
  return posts.slice(0, count);
};

export const getPostById = (categorySlug: string, id: string): ExtendedPost | undefined => {
  return posts.find((post) => post.categorySlug === categorySlug && post.id === id);
};

export const getRelatedPosts = (currentPost: ExtendedPost, count: number = 3): ExtendedPost[] => {
  return posts
    .filter((post) => post.categorySlug === currentPost.categorySlug && post.id !== currentPost.id)
    .slice(0, count);
};

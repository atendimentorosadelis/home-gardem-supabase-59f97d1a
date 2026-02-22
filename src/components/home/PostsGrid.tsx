import { PostCard, type Post } from './PostCard';

interface PostsGridProps {
  posts: Post[];
  useTranslatedTitles?: boolean;
}

export function PostsGrid({ posts }: PostsGridProps) {
  if (posts.length === 0) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

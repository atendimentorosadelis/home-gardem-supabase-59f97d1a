export interface Post {
  id: string;
  uuid?: string;
  title: string;
  excerpt?: string;
  image?: string;
  image_url?: string;
  category?: string;
  categorySlug?: string;
  slug?: string;
  date?: string;
  readTime?: string;
  created_at?: string;
  content?: string;
  tags?: string[];
  likesCount?: number;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const image = post.image || post.image_url;
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      {image && (
        <img src={image} alt={post.title} className="w-full h-48 object-cover" />
      )}
      <div className="p-4 space-y-2">
        {post.category && (
          <span className="text-xs font-medium text-primary uppercase">{post.category}</span>
        )}
        <h3 className="text-lg font-bold text-foreground line-clamp-2">{post.title}</h3>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
        )}
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PageHero from '@/components/layout/PageHero';
import CTABanner from '@/components/sections/CTABanner';
import { Badge } from '@/components/ui/badge';
import { getAllPosts } from '@/data/blog';
import { Calendar, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Landscaping tips, lawn care guides, and hardscape ideas for Michigan homeowners. Expert advice from Mike\'s Clean Cut Landscaping in Rochester Hills.',
  openGraph: {
    title: "Blog | Mike's Clean Cut Landscaping",
    description:
      'Landscaping tips, lawn care guides, and hardscape ideas for Michigan homeowners.',
  },
};

export default function BlogListing() {
  const posts = getAllPosts();

  return (
    <>
      <PageHero
        title="Blog"
        subtitle="Tips and guides for Michigan homeowners"
        backgroundImage="/images/site/paver-entryway.jpg"
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Blog' }]}
      />

      {/* Blog Grid */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          {/* Section Header */}
          <div className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-3">
              <span className="w-12 h-px bg-brand" />
              Latest Articles
            </p>
            <h2 className="font-display text-3xl lg:text-4xl tracking-tight">
              Expert advice for your{' '}
              <span className="text-brand italic">landscape</span>
            </h2>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300"
              >
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] uppercase tracking-wider"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-lg tracking-tight mb-2 group-hover:text-brand transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                    {post.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    </div>
                    <span className="text-xs font-semibold text-brand flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read More <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}

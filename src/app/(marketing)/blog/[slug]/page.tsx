import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import PageHero from '@/components/layout/PageHero';
import CTABanner from '@/components/sections/CTABanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAllSlugs, getPostBySlug } from '@/data/blog';
import { Calendar, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { companyInfo } from '@/data/navigation';
import ReactMarkdown from 'react-markdown';

/* ── Static params ─────────────────────────────────────────────── */

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

/* ── Metadata ──────────────────────────────────────────────────── */

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: post.image }],
    },
  };
}

/* ── Page ──────────────────────────────────────────────────────── */

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: `${companyInfo.url}${post.image}`,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: companyInfo.name,
      url: companyInfo.url,
    },
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        title="Blog"
        subtitle={post.title}
        backgroundImage={post.image}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Blog', to: '/blog' },
          { label: post.title },
        ]}
      />

      {/* Article */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-6">
          {/* Meta bar */}
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-border">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar size={14} />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User size={14} />
              {post.author}
            </div>
            <div className="flex flex-wrap gap-2 ml-auto">
              {post.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] uppercase tracking-wider"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl lg:text-4xl tracking-tight mb-10 leading-tight">
            {post.title}
          </h1>

          {/* Content */}
          <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-a:text-brand prose-a:no-underline hover:prose-a:underline prose-li:text-muted-foreground prose-ul:my-4 prose-ol:my-4">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => {
                  const isInternal = href?.startsWith('/');
                  if (isInternal) {
                    return (
                      <Link href={href!} className="text-brand hover:underline">
                        {children}
                      </Link>
                    );
                  }
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {children}
                    </a>
                  );
                },
                img: ({ src, alt }) => {
                  const imgSrc = typeof src === 'string' ? src : '';
                  return (
                    <span className="block my-8 rounded-2xl overflow-hidden">
                      <Image
                        src={imgSrc}
                        alt={alt || ''}
                        width={800}
                        height={450}
                        className="w-full h-auto"
                      />
                    </span>
                  );
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Back to Blog */}
          <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
            <Button asChild variant="outline">
              <Link href="/blog">
                <ArrowLeft size={14} />
                All Articles
              </Link>
            </Button>
            <Button asChild>
              <Link href="/quote">
                Get a Free Estimate
                <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HeaderBar from '../../../components/HeaderBar';
import { User } from 'firebase/auth';
import { Database } from 'firebase/database';

interface BlogPostProps {
  user: User | null;
  db: Database;
}

interface BlogPostData {
  title: string;
  date: string;
  author?: string;
  content: string;
}

const BlogPost: React.FC<BlogPostProps> = ({ user, db }) => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) {
        setError('Invalid blog post');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/blogs/${slug}.md`);
        if (!response.ok) {
          throw new Error('Blog post not found');
        }
        const markdown = await response.text();
        
        // Parse frontmatter if present (simple version)
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = markdown.match(frontmatterRegex);
        
        let title = slug;
        let date = new Date().toISOString();
        let author = '';
        let content = markdown;

        if (match) {
          const frontmatter = match[1];
          content = match[2];
          
          // Parse frontmatter fields
          const titleMatch = frontmatter.match(/title:\s*(.+)/);
          const dateMatch = frontmatter.match(/date:\s*(.+)/);
          const authorMatch = frontmatter.match(/author:\s*(.+)/);
          
          if (titleMatch) title = titleMatch[1].trim();
          if (dateMatch) date = dateMatch[1].trim();
          if (authorMatch) author = authorMatch[1].trim();
        }

        setPost({ title, date, author, content });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <>
        <HeaderBar user={user} db={db} />
        <div style={{ marginTop: '80px', padding: '2rem', textAlign: 'center' }}>
          <p>Loading blog post...</p>
        </div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <HeaderBar user={user} db={db} />
        <div style={{ marginTop: '80px', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#d32f2f' }}>{error || 'Blog post not found'}</p>
          <Link to="/blog" style={{ color: '#0066cc', marginTop: '1rem', display: 'inline-block' }}>
            ← Back to Blog
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderBar user={user} db={db} />
      <article style={{ marginTop: '80px', padding: '2rem', maxWidth: '800px', margin: '80px auto 0', minHeight: 'calc(100vh - 80px)' }}>
        <Link 
          to="/blog" 
          style={{ 
            color: '#0066cc', 
            textDecoration: 'none', 
            display: 'inline-block', 
            marginBottom: '2rem',
            fontWeight: '500'
          }}
        >
          ← Back to Blog
        </Link>
        
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1a1a1a', lineHeight: '1.2' }}>
            {post.title}
          </h1>
          <div style={{ color: '#666', fontSize: '0.95rem' }}>
            <time dateTime={post.date}>
              {(() => {
                // Parse date as local date to avoid timezone issues
                const [year, month, day] = post.date.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                return date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              })()}
            </time>
            {post.author && (
              <span style={{ marginLeft: '1rem' }}>by {post.author}</span>
            )}
          </div>
        </header>

        <div
          style={{
            lineHeight: '1.8',
            color: '#333',
            fontSize: '1.1rem',
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => (
                <h1 style={{ fontSize: '2rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a1a1a' }} {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 style={{ fontSize: '1.75rem', marginTop: '1.75rem', marginBottom: '0.75rem', color: '#1a1a1a' }} {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 style={{ fontSize: '1.5rem', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#1a1a1a' }} {...props} />
              ),
              p: ({ node, ...props }) => (
                <p style={{ marginBottom: '1rem' }} {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul style={{ marginBottom: '1rem', paddingLeft: '2rem' }} {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol style={{ marginBottom: '1rem', paddingLeft: '2rem' }} {...props} />
              ),
              li: ({ node, ...props }) => (
                <li style={{ marginBottom: '0.5rem' }} {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  style={{
                    borderLeft: '4px solid #0066cc',
                    paddingLeft: '1rem',
                    marginLeft: 0,
                    marginBottom: '1rem',
                    color: '#555',
                    fontStyle: 'italic',
                  }}
                  {...props}
                />
              ),
              pre: ({ node, ...props }: any) => (
                <pre
                  style={{
                    backgroundColor: '#f4f4f4',
                    padding: '1rem',
                    borderRadius: '5px',
                    overflow: 'auto',
                    fontSize: '0.9em',
                    fontFamily: 'monospace',
                    marginBottom: '1rem',
                  }}
                  {...props}
                />
              ),
              code: ({ node, className, ...props }: any) => {
                const isInline = !className || !className.startsWith('language-');
                if (isInline) {
                  return (
                    <code
                      style={{
                        backgroundColor: '#f4f4f4',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '3px',
                        fontSize: '0.9em',
                        fontFamily: 'monospace',
                      }}
                      {...props}
                    />
                  );
                }
                // For code blocks, return unstyled code (pre handles the block styling)
                return <code {...props} />;
              },
              a: ({ node, ...props }) => (
                <a style={{ color: '#0066cc', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer" {...props} />
              ),
              img: ({ node, ...props }: any) => {
                // Fix relative image paths - they should be relative to /blogs/ directory
                let src = props.src || '';
                if (src && !src.startsWith('http') && !src.startsWith('/')) {
                  // Relative path - make it relative to /blogs/
                  src = `/blogs/${src}`;
                } else if (src && src.startsWith('./')) {
                  // Remove leading ./ and make it relative to /blogs/
                  src = `/blogs/${src.substring(2)}`;
                }
                return (
                  <img
                    src={src}
                    alt={props.alt || ''}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '5px',
                      marginBottom: '1rem',
                      marginTop: '1rem',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                );
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </>
  );
};

export { BlogPost };


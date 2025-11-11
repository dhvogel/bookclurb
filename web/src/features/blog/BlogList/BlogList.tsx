import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeaderBar from '../../../components/HeaderBar';
import { User } from 'firebase/auth';
import { Database } from 'firebase/database';

interface BlogMetadata {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
}

interface BlogListProps {
  user: User | null;
  db: Database;
}

const BlogList: React.FC<BlogListProps> = ({ user, db }) => {
  const [blogs, setBlogs] = useState<BlogMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        // Fetch the blog index which contains metadata about all blogs
        const response = await fetch('/blogs/blog-index.json');
        if (response.ok) {
          const blogList: BlogMetadata[] = await response.json();
          // Sort by date, newest first
          // Parse dates as local dates to avoid timezone issues
          blogList.sort((a, b) => {
            const parseLocalDate = (dateStr: string) => {
              const [year, month, day] = dateStr.split('-').map(Number);
              return new Date(year, month - 1, day).getTime();
            };
            return parseLocalDate(b.date) - parseLocalDate(a.date);
          });
          setBlogs(blogList);
        } else {
          console.error('Failed to load blog index');
        }
      } catch (error) {
        console.error('Error loading blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, []);

  if (loading) {
    return (
      <>
        <HeaderBar user={user} db={db} />
        <div style={{ marginTop: '80px', padding: '2rem', textAlign: 'center' }}>
          <p>Loading blogs...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderBar user={user} db={db} />
      <div style={{ marginTop: '80px', padding: '2rem', maxWidth: '900px', margin: '80px auto 0', minHeight: 'calc(100vh - 80px)' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#333' }}>Blog</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {blogs.length === 0 ? (
            <p style={{ color: '#666', fontSize: '1.1rem' }}>No blog posts yet. Check back soon!</p>
          ) : (
            blogs.map((blog) => (
              <article
                key={blog.slug}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Link
                  to={`/blog/${blog.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#1a1a1a' }}>
                    {blog.title}
                  </h2>
                  <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    <span>{(() => {
                      // Parse date as local date to avoid timezone issues
                      const [year, month, day] = blog.date.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      });
                    })()}</span>
                    {blog.author && (
                      <span style={{ marginLeft: '1rem' }}>by {blog.author}</span>
                    )}
                  </div>
                  {blog.excerpt && (
                    <p style={{ color: '#555', lineHeight: '1.6', fontSize: '1rem' }}>
                      {blog.excerpt}
                    </p>
                  )}
                  <div style={{ marginTop: '1rem', color: '#0066cc', fontWeight: '500' }}>
                    Read more →
                  </div>
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export { BlogList };


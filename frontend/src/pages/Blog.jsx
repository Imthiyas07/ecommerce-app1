import { useState, useEffect } from 'react'
import { FaCalendarAlt, FaUser, FaTag, FaSearch, FaArrowRight } from 'react-icons/fa'

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Sample blog posts - In production, fetch from API
  const blogPosts = [
    {
      id: 1,
      title: "2025 Fashion Trends: What's Hot This Season",
      excerpt: "Discover the latest fashion trends for 2025 including sustainable fashion, bold colors, and innovative designs that are shaping the industry.",
      content: "Full article content here...",
      author: "Fashion Editor",
      date: "2025-01-07",
      category: "Fashion Trends",
      tags: ["trends", "2025", "fashion"],
      image: "/blog/trends-2025.jpg",
      readTime: "5 min read",
      featured: true
    },
    {
      id: 2,
      title: "Sustainable Fashion: Building a Greener Wardrobe",
      excerpt: "Learn how to build an eco-friendly wardrobe with sustainable fashion choices that don't compromise on style or quality.",
      content: "Full article content here...",
      author: "Sustainability Expert",
      date: "2025-01-06",
      category: "Sustainability",
      tags: ["sustainable", "eco-friendly", "green"],
      image: "/blog/sustainable-fashion.jpg",
      readTime: "7 min read",
      featured: true
    },
    {
      id: 3,
      title: "Size Guide: Finding Your Perfect Fit",
      excerpt: "Complete guide to understanding sizes, measurements, and finding the perfect fit for all body types.",
      content: "Full article content here...",
      author: "Styling Expert",
      date: "2025-01-05",
      category: "Size Guide",
      tags: ["size", "fit", "measurements"],
      image: "/blog/size-guide.jpg",
      readTime: "4 min read",
      featured: false
    },
    {
      id: 4,
      title: "Fashion Photography Tips for E-commerce",
      excerpt: "Professional tips for taking stunning product photos that boost sales and customer engagement.",
      content: "Full article content here...",
      author: "Photography Expert",
      date: "2025-01-04",
      category: "Photography",
      tags: ["photography", "e-commerce", "product"],
      image: "/blog/fashion-photography.jpg",
      readTime: "6 min read",
      featured: false
    },
    {
      id: 5,
      title: "Winter Fashion Essentials for Indian Climate",
      excerpt: "Must-have winter fashion items perfect for Indian weather conditions and cultural preferences.",
      content: "Full article content here...",
      author: "Fashion Stylist",
      date: "2025-01-03",
      category: "Seasonal",
      tags: ["winter", "india", "essentials"],
      image: "/blog/winter-fashion.jpg",
      readTime: "5 min read",
      featured: false
    },
    {
      id: 6,
      title: "How to Care for Your Designer Clothes",
      excerpt: "Expert tips on maintaining and caring for your premium fashion pieces to ensure longevity.",
      content: "Full article content here...",
      author: "Care Specialist",
      date: "2025-01-02",
      category: "Care Guide",
      tags: ["care", "maintenance", "designer"],
      image: "/blog/clothing-care.jpg",
      readTime: "4 min read",
      featured: false
    }
  ]

  const categories = ['All', 'Fashion Trends', 'Sustainability', 'Size Guide', 'Photography', 'Seasonal', 'Care Guide']

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const featuredPosts = blogPosts.filter(post => post.featured)
  const regularPosts = filteredPosts.filter(post => !post.featured)

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Hero Section */}
      <div className='bg-gradient-to-r from-black to-gray-800 text-white py-20'>
        <div className='max-w-6xl mx-auto px-4 text-center'>
          <h1 className='text-4xl md:text-6xl font-bold mb-6'>
            Fashion <span className='text-blue-400'>Blog</span>
          </h1>
          <p className='text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto'>
            Stay updated with the latest fashion trends, styling tips, and industry insights
          </p>

          {/* Search Bar */}
          <div className='max-w-md mx-auto relative'>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full px-6 py-3 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <FaSearch className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400' />
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto px-4 py-12'>
        {/* Category Filter */}
        <div className='flex flex-wrap gap-4 mb-12 justify-center'>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className='mb-16'>
            <h2 className='text-3xl font-bold mb-8 text-center'>Featured Articles</h2>
            <div className='grid md:grid-cols-2 gap-8'>
              {featuredPosts.map(post => (
                <article key={post.id} className='bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow'>
                  <div className='h-64 bg-gray-200 flex items-center justify-center'>
                    <span className='text-gray-500'>Featured Image</span>
                  </div>
                  <div className='p-6'>
                    <div className='flex items-center gap-4 text-sm text-gray-500 mb-3'>
                      <span className='flex items-center gap-1'>
                        <FaCalendarAlt />
                        {new Date(post.date).toLocaleDateString()}
                      </span>
                      <span className='flex items-center gap-1'>
                        <FaUser />
                        {post.author}
                      </span>
                      <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs'>
                        {post.category}
                      </span>
                    </div>
                    <h3 className='text-xl font-bold mb-3 hover:text-blue-600 transition-colors cursor-pointer'>
                      {post.title}
                    </h3>
                    <p className='text-gray-600 mb-4'>{post.excerpt}</p>
                    <div className='flex items-center justify-between'>
                      <div className='flex flex-wrap gap-2'>
                        {post.tags.slice(0, 3).map(tag => (
                          <span key={tag} className='flex items-center gap-1 text-xs text-gray-500'>
                            <FaTag />
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className='flex items-center gap-2 text-blue-600 hover:text-blue-800 cursor-pointer'>
                        <span className='text-sm font-medium'>Read More</span>
                        <FaArrowRight className='text-xs' />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Regular Posts */}
        <section>
          <h2 className='text-3xl font-bold mb-8 text-center'>Latest Articles</h2>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {regularPosts.map(post => (
              <article key={post.id} className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'>
                <div className='h-48 bg-gray-200 flex items-center justify-center'>
                  <span className='text-gray-500'>Article Image</span>
                </div>
                <div className='p-5'>
                  <div className='flex items-center gap-3 text-xs text-gray-500 mb-3'>
                    <span className='flex items-center gap-1'>
                      <FaCalendarAlt />
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                    <span className='bg-gray-100 text-gray-700 px-2 py-1 rounded-full'>
                      {post.category}
                    </span>
                  </div>
                  <h3 className='text-lg font-bold mb-2 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2'>
                    {post.title}
                  </h3>
                  <p className='text-gray-600 text-sm mb-3 line-clamp-3'>{post.excerpt}</p>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-gray-500'>{post.readTime}</span>
                    <span className='text-blue-600 hover:text-blue-800 cursor-pointer font-medium'>Read More →</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className='mt-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 text-center'>
          <h3 className='text-2xl font-bold mb-4'>Stay Updated with Fashion Trends</h3>
          <p className='text-blue-100 mb-6 max-w-2xl mx-auto'>
            Subscribe to our newsletter and get exclusive access to fashion tips, styling guides, and early access to new collections.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 max-w-md mx-auto'>
            <input
              type="email"
              placeholder="Enter your email"
              className='flex-1 px-4 py-3 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-white'
            />
            <button className='bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors'>
              Subscribe
            </button>
          </div>
        </section>
      </div>

      {/* Structured Data for Blog */}
      <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Shop from Home Fashion Blog",
        "description": "Latest fashion trends, styling tips, and fashion industry insights",
        "url": "https://ecommerce-frontend-v2-delta.vercel.app/blog",
        "publisher": {
          "@type": "Organization",
          "name": "Shop from Home",
          "logo": {
            "@type": "ImageObject",
            "url": "https://ecommerce-frontend-v2-delta.vercel.app/logo.png"
          }
        },
        "blogPost": blogPosts.map(post => ({
          "@type": "BlogPosting",
          "headline": post.title,
          "description": post.excerpt,
          "author": {
            "@type": "Person",
            "name": post.author
          },
          "datePublished": post.date,
          "url": `https://ecommerce-frontend-v2-delta.vercel.app/blog/${post.id}`,
          "image": `https://ecommerce-frontend-v2-delta.vercel.app${post.image}`,
          "keywords": post.tags.join(", ")
        }))
      })}
      </script>
    </div>
  )
}

export default Blog

"use client";
import { useState } from 'react';
import { UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  content: string;
  createdAt: string;
  isBotanist?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isUser: boolean;
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  content: string;
  image?: string;
  likes: number;
  comments: Comment[];
  createdAt: string;
  isBotanist?: boolean;
  likedBy: string[]; // Array of user IDs who liked the post
}

interface Botanist {
  id: string;
  name: string;
  image: string;
  specialization: string;
  experience: string;
  rating: number;
  available: boolean;
}

const mockPosts: Post[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Dr. Varma',
    userImage: '/botanists/varma.webp',
    content: 'Just identified a rare fungal infection in tomato plants. If you notice dark spots with yellow halos on your tomato leaves, it might be Septoria leaf spot. Early detection is crucial!',
    image: '/posts/tomato-disease.jpg',
    likes: 24,
    likedBy: [],
    comments: [
      {
        id: 'c1',
        userId: 'user2',
        userName: 'Rahul Kumar',
        userImage: '/user/rahul.jpg',
        content: 'Thank you for sharing! I noticed similar spots on my plants. What treatment would you recommend?',
        createdAt: '1 hour ago'
      }
    ],
    createdAt: '2 hours ago',
    isBotanist: true
  },
  // Add more mock posts as needed
];

const mockBotanists: Botanist[] = [
    {
        id: '1',
        name: 'Dr. Priya Patel',
        image: '/botanists/riya.jpg',
        specialization: 'Tropical Plants',
        experience: '15+ years',
        rating: 4.9,
        available: true
    },
    {
        id: '2',
        name: 'Dr. Varma ',
        image: '/botanists/varma.webp',
        specialization: 'Tropical Plants',
        experience: '15+ years',
        rating: 4.9,
        available: true
    },
  // Add more mock botanists as needed
];

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: 'user1',
    content: 'Hi Dr. Patel, I have some questions about my tomato plants.',
    timestamp: '2 min ago',
    isUser: true
  },
  {
    id: '2',
    senderId: 'botanist1',
    content: 'Hello! Of course, I\'d be happy to help. What seems to be the issue with your tomato plants?',
    timestamp: '1 min ago',
    isUser: false
  }
];

export default function Community() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState<'discussions' | 'botanists'>('discussions');
  const [newPost, setNewPost] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [selectedBotanist, setSelectedBotanist] = useState<Botanist | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setSelectedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setSelectedImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }
    setSelectedImagePreview(null);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && !selectedImage) return;
    
    setIsPosting(true);
    try {
      let imageUrl = '';
      if (selectedImage) {
        // In a real application, you would upload the image to your server or cloud storage
        // For now, we'll create a temporary object URL
        imageUrl = URL.createObjectURL(selectedImage);
      }

      const newPostObj: Post = {
        id: Date.now().toString(),
        userId: user?.id || 'user',
        userName: user?.firstName || user?.username || 'Anonymous',
        userImage: user?.imageUrl || user?.profileImageUrl || '/default-avatar.png',
        content: newPost,
        image: imageUrl || undefined,
        likes: 0,
        likedBy: [],
        comments: [],
        createdAt: 'Just now',
        isBotanist: false // You might want to check if the user is a botanist
      };

      setPosts(currentPosts => [newPostObj, ...currentPosts]);
      setNewPost('');
      handleRemoveImage();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: user?.id || 'user',
      content: newMessage,
      timestamp: 'Just now',
      isUser: true
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const openMessageDialog = (botanist: Botanist) => {
    setSelectedBotanist(botanist);
    setIsMessageOpen(true);
  };

  const handleLike = (postId: string) => {
    setPosts(currentPosts => 
      currentPosts.map(post => {
        if (post.id === postId) {
          const isLiked = post.likedBy.includes(user?.id || '');
          return {
            ...post,
            likes: isLiked ? post.likes - 1 : post.likes + 1,
            likedBy: isLiked 
              ? post.likedBy.filter(id => id !== user?.id)
              : [...post.likedBy, user?.id || '']
          };
        }
        return post;
      })
    );
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newCommentObj: Comment = {
      id: Date.now().toString(),
      userId: user?.id || 'user',
      userName: user?.firstName || user?.username || 'Anonymous',
      userImage: user?.imageUrl || user?.profileImageUrl || '/default-avatar.png',
      content: newComment,
      createdAt: 'Just now'
    };

    setPosts(currentPosts =>
      currentPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newCommentObj]
          };
        }
        return post;
      })
    );

    setNewComment('');
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-20 px-8">
        <h1 className="text-2xl font-bold mb-4">Please sign in to access the community</h1>
        <Link href="/sign-in" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium">Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plant Care Community</h1>
            </div>
            <UserButton afterSignOutUrl="/"/>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Navigation */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('discussions')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === 'discussions'
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Discussions
                </button>
                <button
                  onClick={() => setActiveTab('botanists')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === 'botanists'
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Botanists
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0"> {/* min-w-0 prevents flex child from overflowing */}
            {activeTab === 'discussions' ? (
              <div className="space-y-6">
                {/* Create Post */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <form onSubmit={handlePostSubmit} className="space-y-4">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Share your plant care experience or ask a question..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white min-h-[100px] resize-none"
                    />
                    
                    {selectedImagePreview && (
                      <div className="relative">
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <Image
                            src={selectedImagePreview}
                            alt="Selected image"
                            fill
                            className="object-contain"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 p-1 bg-gray-900/50 hover:bg-gray-900/75 rounded-full text-white transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          id="image-upload"
                          className="hidden"
                          onChange={handleImageSelect}
                        />
                        <label
                          htmlFor="image-upload"
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full cursor-pointer transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </label>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedImage ? selectedImage.name : 'Add an image'}
                        </span>
                      </div>
                      <button
                        type="submit"
                        disabled={isPosting || (!newPost.trim() && !selectedImage)}
                        className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2
                          ${(!newPost.trim() && !selectedImage) || isPosting
                            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600 text-white hover:shadow-md'
                          }`}
                      >
                        {isPosting ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <span>Post</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Posts Feed */}
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <Image
                            src={post.userImage}
                            alt={post.userName}
                            width={40}
                            height={40}
                            className="object-fill"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {post.userName}
                            </h3>
                            {post.isBotanist && (
                              <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                                Verified Botanist
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{post.createdAt}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
                      {post.image && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <Image
                            src={post.image}
                            alt="Post image"
                            width={600}
                            height={400}
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-6 text-gray-500 dark:text-gray-400 mb-4">
                        <button 
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-2 transition-colors ${
                            post.likedBy.includes(user?.id || '')
                              ? 'text-green-500 hover:text-green-600'
                              : 'hover:text-green-500'
                          }`}
                        >
                          <svg 
                            className="w-5 h-5" 
                            fill={post.likedBy.includes(user?.id || '') ? "currentColor" : "none"} 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {post.likes}
                        </button>
                        <button 
                          onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                          className="flex items-center gap-2 hover:text-green-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {post.comments.length}
                        </button>
                      </div>

                      {/* Comments Section */}
                      {activeCommentPost === post.id && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                            {post.comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                                  <Image
                                    src={comment.userImage}
                                    alt={comment.userName}
                                    width={32}
                                    height={32}
                                    className="object-cover"
                                    onError={(e) => {
                                      // Fallback to default avatar if image fails to load
                                      const target = e.target as HTMLImageElement;
                                      target.src = '/default-avatar.png';
                                    }}
                                  />
                                </div>
                                <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {comment.userName}
                                    </span>
                                    {comment.isBotanist && (
                                      <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                                        Botanist
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {comment.createdAt}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex gap-2">
                            <input
                              type="text"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                            >
                              Post
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 ">
                {mockBotanists.map((botanist) => (
                  <div key={botanist.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-800">
                        <Image
                          src={botanist.image}
                          alt={botanist.name}
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0"> {/* Prevent text overflow */}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{botanist.name}</h3>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">{botanist.specialization}</p>
                      </div>
                    </div>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Experience:</span>
                        <span className="text-gray-700 dark:text-gray-300">{botanist.experience}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="font-medium text-sm text-gray-600 dark:text-gray-400">Rating:</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(botanist.rating)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {botanist.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        botanist.available
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 ring-1 ring-green-500/20'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {botanist.available ? 'Available Now' : 'Unavailable'}
                      </span>
                      <button 
                        onClick={() => openMessageDialog(botanist)}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
                      >
                        Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar - Trending Topics */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Trending Topics</h2>
              <div className="space-y-3">
                {['Monsoon Plant Care', 'Organic Pesticides', 'Indoor Gardens', 'Plant Disease Prevention'].map((topic) => (
                  <button
                    key={topic}
                    className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    #{topic.replace(/\s+/g, '')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Message Dialog */}
      {isMessageOpen && selectedBotanist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-800">
                  <Image
                    src={selectedBotanist.image}
                    alt={selectedBotanist.name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedBotanist.name}</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">{selectedBotanist.specialization}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMessageOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isUser
                        ? 'bg-green-500 text-white ml-4'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white mr-4'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className={`text-xs mt-1 block ${
                      message.isUser
                        ? 'text-green-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={handleMessageSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <span>Send</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
"use client";
import { useState, useEffect, useRef } from 'react';
import { UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  content: string;
  image?: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  createdAt: string;
  isBotanist?: boolean;
}

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
  type: 'text' | 'image' | 'voice';
  mediaUrl?: string;
  duration?: number; // for voice messages
  audioBlob?: Blob; // Add this for voice messages
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

interface CommunityMember {
  id: string;
  name: string;
  image: string;
  bio: string;
  joinedDate: string;
  postsCount: number;
  plantsCount: number;
}

// Add response templates for different message types
const getBotResponse = (message: string, botanistName: string) => {
  // Check if message contains only emojis
  const emojiRegex = /^[\p{Emoji}\s]+$/u;
  if (emojiRegex.test(message)) {
    const responses = [
      "I see you're expressing yourself with emojis! How can I help you with your plants today?",
      "Thanks for the emoji! Now, tell me more about your plant concerns.",
      "I appreciate your cheerful message! What plant-related questions do you have?",
      `${message} Right back at you! How can I assist you with your plants today?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Check for specific keywords in the message
  const keywords = {
    water: [
      "Regarding watering, it's important to consider the specific needs of your plant. Could you tell me which plant you're caring for?",
      "Water management is crucial for plant health. Let me help you establish a proper watering schedule.",
    ],
    leaf: [
      "I notice you're mentioning leaves. Are you seeing any specific discoloration or patterns?",
      "Leaf health is a great indicator of overall plant wellness. Could you describe what you're observing?",
    ],
    soil: [
      "Soil quality is fundamental for plant health. What type of soil are you currently using?",
      "Let's discuss your soil situation. Have you noticed any issues with drainage?",
    ],
    sunlight: [
      "Light exposure is crucial. Could you describe where your plant is positioned?",
      "Let's talk about your plant's lighting conditions. How many hours of light does it receive?",
    ],
    disease: [
      "I understand you're concerned about plant disease. Could you share some photos of the affected areas?",
      "To help diagnose any disease, could you describe the symptoms you're seeing?",
    ],
    grow: [
      "Growth patterns can tell us a lot about plant health. What changes have you noticed?",
      "Let's discuss your plant's growth. When did you first notice these changes?",
    ]
  };

  // Check message for keywords and get appropriate response
  for (const [keyword, responses] of Object.entries(keywords)) {
    if (message.toLowerCase().includes(keyword)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  // Default responses for general messages
  const defaultResponses = [
    `Hello! I'm ${botanistName}. How can I assist you with your plant care today?`,
    "Thank you for reaching out! Could you provide more details about your plant care concerns?",
    "I'm here to help with your plant care questions. What specific issues are you experiencing?",
    "I'd be happy to help you with your plants. Could you tell me more about what you're observing?"
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

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
  {
    id: '2',
    userId: 'user2',
    userName: 'Dr. Priya Patel',
    userImage: '/botanists/riya.jpg',
    content: 'Exciting news! Our research on sustainable organic pesticides has shown promising results. Here are 5 natural ingredients that can protect your plants:\n\n1. Neem oil\n2. Garlic spray\n3. Eucalyptus oil\n4. Chili pepper solution\n5. Apple cider vinegar\n\nWould you like to know more about any of these?',
    likes: 45,
    likedBy: [],
    comments: [
      {
        id: 'c2',
        userId: 'user3',
        userName: 'Riya Sharma',
        userImage: '/user/priya.jpg',
        content: 'Great list! I\'ve had amazing results with neem oil. It\'s especially effective against aphids.',
        createdAt: '30 minutes ago'
      }
    ],
    createdAt: '3 hours ago',
    isBotanist: true
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Rahul Kumar',
    userImage: '/user/rahul.jpg',
    content: 'My urban garden is thriving! Started with just a few herbs, and now look at this beautiful harvest. Growing your own food is so rewarding. 🌱🍅',
    image: '/posts/tomato-disease.jpg',
    likes: 18,
    likedBy: [],
    comments: [
      {
        id: 'c3',
        userId: 'user4',
        userName: 'Dr. Varma',
        userImage: '/botanists/varma.webp',
        content: 'Impressive harvest! Your tomatoes look very healthy. Keep up the great work!',
        createdAt: '15 minutes ago',
        isBotanist: true
      }
    ],
    createdAt: '4 hours ago'
  },
  {
    id: '4',
    userId: 'user4',
    userName: 'Dr. Varma',
    userImage: '/botanists/varma.webp',
    content: 'Monthly Plant Care Tip: As we enter the monsoon season, watch out for root rot! Here are some prevention tips:\n\n1. Ensure good drainage\n2. Don\'t overwater\n3. Check soil moisture before watering\n4. Use well-draining potting mix\n5. Elevate pots slightly\n\nStay tuned for more seasonal tips! 🌿',
    likes: 56,
    likedBy: [],
    comments: [
      {
        id: 'c4',
        userId: 'user5',
        userName: 'Priya Singh',
        userImage: '/user/priya.jpg',
        content: 'This is so helpful! I lost a few plants to root rot last monsoon. Will definitely follow these tips.',
        createdAt: '45 minutes ago'
      }
    ],
    createdAt: '5 hours ago',
    isBotanist: true
  },
  {
    id: '5',
    userId: 'user5',
    userName: 'Priya Singh',
    userImage: '/user/priya.jpg',
    content: 'Question for the experts: My peace lily\'s leaves are turning yellow despite regular care. I water it weekly and it gets indirect light. Any ideas what might be wrong? 🤔',
    likes: 12,
    likedBy: [],
    comments: [
      {
        id: 'c5',
        userId: 'user2',
        userName: 'Dr. Priya Patel',
        userImage: '/botanists/riya.jpg',
        content: 'Yellow leaves often indicate overwatering. Peace lilies prefer to dry out slightly between waterings. Try checking the soil moisture with your finger - only water when the top inch feels dry.',
        createdAt: '10 minutes ago',
        isBotanist: true
      }
    ],
    createdAt: '6 hours ago'
  }
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
    name: 'Dr. Varma',
    image: '/botanists/varma.webp',
    specialization: 'Tropical Plants',
    experience: '15+ years',
    rating: 4.9,
    available: true
  }
];

const mockMembers: CommunityMember[] = [
  {
    id: 'user1',
    name: 'Rahul Kumar',
    image: '/user/rahul.jpg',
    bio: 'Passionate home gardener with a love for tropical plants. Growing vegetables and herbs in my urban garden.',
    joinedDate: 'Member since Jan 2024',
    postsCount: 45,
    plantsCount: 23
  },
  {
    id: 'user2',
    name: 'Priya Singh',
    image: '/user/priya.jpg',
    bio: 'Indoor plant enthusiast. Specializing in succulents and air purifying plants. Love sharing plant care tips!',
    joinedDate: 'Member since Dec 2023',
    postsCount: 32,
    plantsCount: 15
  }
];

export default function Community() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeTab, setActiveTab] = useState<'discussions' | 'botanists' | 'members'>('discussions');
  const [newPost, setNewPost] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [selectedBotanist, setSelectedBotanist] = useState<Botanist | null>(null);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedChatImage, setSelectedChatImage] = useState<File | null>(null);
  const [selectedChatImagePreview, setSelectedChatImagePreview] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]); // Change to useRef for better state management
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [enlargedImage, setEnlargedImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedBotanist) {
      scrollToBottom();
    }
  }, [messages, selectedBotanist]);

  // Initialize audio recording
  useEffect(() => {
    const initializeRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          if (audioChunksRef.current.length > 0 && selectedBotanist) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);

            const voiceMessage: Message = {
              id: Date.now().toString(),
              senderId: user?.id || 'user',
              content: 'Voice message',
              timestamp: new Date().toLocaleTimeString(),
              isUser: true,
              type: 'voice',
              mediaUrl: audioUrl,
              duration: recordingDuration,
              audioBlob
            };

            setMessages(prev => ({
              ...prev,
              [selectedBotanist.id]: [
                ...(prev[selectedBotanist.id] || []),
                voiceMessage
              ]
            }));

            // Clear the chunks after sending
            audioChunksRef.current = [];
          }
        };

        setMediaRecorder(recorder);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Unable to access microphone. Please check your browser permissions.');
      }
    };

    initializeRecording();

    // Cleanup
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [selectedBotanist]);

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
        isBotanist: false
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

  const handleChatImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedChatImage(file);
    const previewUrl = URL.createObjectURL(file);
    setSelectedChatImagePreview(previewUrl);
  };

  const handleRemoveChatImage = () => {
    setSelectedChatImage(null);
    if (selectedChatImagePreview) {
      URL.revokeObjectURL(selectedChatImagePreview);
    }
    setSelectedChatImagePreview(null);
  };

  const startRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      // Clear any existing chunks before starting new recording
      audioChunksRef.current = [];
      mediaRecorder.start(100); // Record in 100ms chunks for better real-time handling
      setIsRecording(true);
      setRecordingDuration(0);
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    if (recordingInterval) {
      clearInterval(recordingInterval);
    }
    setIsRecording(false);
    setRecordingDuration(0);
    setRecordingInterval(null);
  };

  const handlePlayVoice = (messageId: string, audioUrl: string) => {
    // Stop any currently playing audio
    if (isPlaying) {
      const currentAudio = audioRefs.current[isPlaying];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    // Play the selected audio
    if (isPlaying !== messageId) {
      let audio = audioRefs.current[messageId];
      if (!audio) {
        audio = new Audio(audioUrl);
        audioRefs.current[messageId] = audio;
        
        audio.addEventListener('ended', () => {
          setIsPlaying(null);
        });
      }

      audio.play();
      setIsPlaying(messageId);
    } else {
      setIsPlaying(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotanist || (!newMessage.trim() && !selectedChatImage)) return;

    if (selectedChatImage) {
      const imageMessage: Message = {
        id: Date.now().toString(),
        senderId: user?.id || 'user',
        content: '',
        timestamp: new Date().toLocaleTimeString(),
        isUser: true,
        type: 'image',
        mediaUrl: URL.createObjectURL(selectedChatImage)
      };

      setMessages(prev => ({
        ...prev,
        [selectedBotanist.id]: [
          ...(prev[selectedBotanist.id] || []),
          imageMessage
        ]
      }));

      // Bot response to image
      setTimeout(() => {
        const imageResponse: Message = {
          id: (Date.now() + 1).toString(),
          senderId: selectedBotanist.id,
          content: "I've received your image. This will help me better understand your plant's condition. Could you also describe what specific concerns you have?",
          timestamp: new Date().toLocaleTimeString(),
          isUser: false,
          type: 'text'
        };

        setMessages(prev => ({
          ...prev,
          [selectedBotanist.id]: [
            ...(prev[selectedBotanist.id] || []),
            imageResponse
          ]
        }));
      }, 1000);

      handleRemoveChatImage();
    }

    if (newMessage.trim()) {
      const textMessage: Message = {
        id: Date.now().toString(),
        senderId: user?.id || 'user',
        content: newMessage,
        timestamp: new Date().toLocaleTimeString(),
        isUser: true,
        type: 'text'
      };

      setMessages(prev => ({
        ...prev,
        [selectedBotanist.id]: [
          ...(prev[selectedBotanist.id] || []),
          textMessage
        ]
      }));

      // Get contextual bot response
      setTimeout(() => {
        const botanistMessage: Message = {
          id: (Date.now() + 1).toString(),
          senderId: selectedBotanist.id,
          content: getBotResponse(newMessage, selectedBotanist.name),
          timestamp: new Date().toLocaleTimeString(),
          isUser: false,
          type: 'text'
        };

        setMessages(prev => ({
          ...prev,
          [selectedBotanist.id]: [
            ...(prev[selectedBotanist.id] || []),
            botanistMessage
          ]
        }));
      }, 1000);
    }

    setNewMessage('');
  };

  // Handle clicking outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    const cursor = (document.querySelector('input[type="text"]') as HTMLInputElement)?.selectionStart || newMessage.length;
    const newMessageWithEmoji = newMessage.slice(0, cursor) + emojiData.emoji + newMessage.slice(cursor);
    setNewMessage(newMessageWithEmoji);
    setShowEmojiPicker(false);
  };

  // Cleanup audio resources when component unmounts
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current = {};
    };
  }, []);

  // Function to handle clicking outside the enlarged image
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (enlargedImage && !(event.target as Element).closest('.enlarged-image-container')) {
        setEnlargedImage(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [enlargedImage]);

  const handleBackToHome = () => {
    setIsNavigating(true);
    router.push('/');
  };

  if (!isLoaded || !isSignedIn || isNavigating) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 animate-spin-slow">
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-400 border-r-green-500 border-b-blue-600 border-l-purple-500"></div>
            </div>
            <div className="absolute inset-0 animate-reverse-spin">
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 border-r-blue-500 border-b-purple-600 border-l-yellow-500"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/icon/icon.png"
                alt="Logo"
                width={64}
                height={64}
                className="animate-pulse"
              />
            </div>
          </div>
          <p className="text-white text-lg animate-pulse">
            {!isLoaded || !isSignedIn ? 'Loading Plant Care Community...' : 'Returning to Home...'}
          </p>
          {!isSignedIn && !isNavigating && (
            <Link 
              href="/sign-in" 
              className="mt-6 inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Sign In to Continue
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Animated Logo */}
      <div className="fixed top-4 left-4 z-50">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 animate-spin-slow">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-400 border-r-green-500 border-b-blue-600 border-l-purple-500"></div>
          </div>
          <div className="absolute inset-0 animate-reverse-spin">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 border-r-blue-500 border-b-purple-600 border-l-yellow-500"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/icon/icon.png"
              alt="Logo"
              width={32}
              height={32}
              className="animate-pulse"
            />
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBackToHome}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium">Back to Home</span>
              </button>
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
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    <span>Discussions</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('botanists')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === 'botanists'
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span>Expert Botanists</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === 'members'
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Community Members</span>
                  </div>
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
                          <form 
                            onSubmit={(e) => handleAddComment(post.id, e)} 
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                            />
                            <button
                              type="submit"
                              disabled={!newComment.trim()}
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
            ) : activeTab === 'botanists' ? (
              <div className="grid grid-cols-1 gap-8 ">
                {/* Mock Botanists Section */}
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {botanist.name}
                        </h3>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {botanist.specialization}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Experience:</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {botanist.experience}
                        </span>
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
                                i < botanist.rating // Mock rating
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
                            {botanist.rating.toFixed(1)}
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
                        {botanist.available ? 'Available Now' : 'Not Available'}
                      </span>
                      <button 
                        onClick={() => setSelectedBotanist(botanist)}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
                      >
                        Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8">
                {mockMembers.map((member) => (
                  <div key={member.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-green-500/20 ring-offset-2 dark:ring-offset-gray-800">
                        <Image
                          src={member.image}
                          alt={member.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {member.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {member.joinedDate}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      {member.bio}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <span className="block text-lg font-semibold text-green-600 dark:text-green-400">
                            {member.postsCount}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Posts</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-lg font-semibold text-green-600 dark:text-green-400">
                            {member.plantsCount}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Plants</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedBotanist(member as any)} // Type cast for demo
                        className="px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-300"
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
      
      {/* Chat Modal */}
      {selectedBotanist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col mx-4">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-800">
                  <Image
                    src={selectedBotanist.image}
                    alt={selectedBotanist.name}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedBotanist.name}</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">{selectedBotanist.specialization}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBotanist(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages[selectedBotanist.id]?.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!message.isUser && (
                    <div 
                      className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setEnlargedImage({
                        src: selectedBotanist.image,
                        alt: selectedBotanist.name
                      })}
                    >
                      <Image
                        src={selectedBotanist.image}
                        alt={selectedBotanist.name}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.isUser
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {message.type === 'text' && (
                      <p className="text-sm">{message.content}</p>
                    )}
                    {message.type === 'image' && (
                      <div className="relative w-48 h-48 rounded-lg overflow-hidden">
                        <Image
                          src={message.mediaUrl || ''}
                          alt="Shared image"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    {message.type === 'voice' && message.mediaUrl && (
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <button 
                          onClick={() => handlePlayVoice(message.id, message.mediaUrl!)}
                          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          {isPlaying === message.id ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 18M6 6L18 6" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-white rounded-full transition-all duration-200 ${
                              isPlaying === message.id ? 'animate-progress' : 'w-0'
                            }`}
                            style={{
                              animationDuration: `${message.duration}s`,
                              animationPlayState: isPlaying === message.id ? 'running' : 'paused'
                            }}
                          ></div>
                        </div>
                        <span className="text-xs min-w-[40px]">{formatDuration(message.duration || 0)}</span>
                      </div>
                    )}
                    <span className={`text-xs mt-1 block ${
                      message.isUser
                        ? 'text-green-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {message.timestamp}
                    </span>
                  </div>
                  {message.isUser && (
                    <div 
                      className="w-8 h-8 rounded-full overflow-hidden ml-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setEnlargedImage({
                        src: user?.imageUrl || '/default-avatar.png',
                        alt: user?.firstName || 'User'
                      })}
                    >
                      <Image
                        src={user?.imageUrl || '/default-avatar.png'}
                        alt="You"
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Preview selected image */}
            {selectedChatImagePreview && (
              <div className="relative w-48 h-48 mx-auto mb-4">
                <Image
                  src={selectedChatImagePreview}
                  alt="Selected image"
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  onClick={handleRemoveChatImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <div className="flex-1 flex items-end gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white pr-10"
                      disabled={isRecording}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {showEmojiPicker && (
                      <div 
                        ref={emojiPickerRef}
                        className="absolute bottom-full mb-2 right-0 z-50"
                      >
                        <div className="shadow-xl rounded-lg overflow-hidden">
                          <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            autoFocusSearch={false}
                            searchPlaceHolder="Search emoji..."
                            width={300}
                            height={400}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    id="chat-image-upload"
                    className="hidden"
                    onChange={handleChatImageSelect}
                  />
                  <label
                    htmlFor="chat-image-upload"
                    className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </label>
                  <button
                    type="button"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    className={`p-3 rounded-lg transition-colors ${
                      isRecording
                        ? 'bg-red-500 text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    {isRecording && (
                      <span className="absolute -top-2 -right-2 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedChatImage) || isRecording}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    (!newMessage.trim() && !selectedChatImage) || isRecording
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <span>Send</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              {isRecording && (
                <div className="mt-2 text-sm text-red-500 dark:text-red-400 animate-pulse">
                  Recording... {formatDuration(recordingDuration)}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {enlargedImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative enlarged-image-container max-w-3xl max-h-[90vh] w-[90vw] bg-white dark:bg-gray-800 rounded-lg p-2 shadow-xl">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-4 -right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full aspect-square">
              <Image
                src={enlargedImage.src}
                alt={enlargedImage.alt}
                fill
                className="object-contain rounded-lg"
                sizes="(max-width: 768px) 90vw, (max-width: 1200px) 70vw, 800px"
                priority
              />
            </div>
            <div className="mt-2 text-center text-gray-700 dark:text-gray-300 font-medium">
              {enlargedImage.alt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
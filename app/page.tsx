"use client";
import Image from "next/image";
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { UserButton, useUser } from "@clerk/nextjs";
import { useSpeechSynthesis } from 'react-speech-kit';

interface AnalysisResult {
  analysis: string;
  error?: string;
  details?: string;
}

function formatAnalysisText(text: string): string {
  let formattedText = text;

  // Handle section headings with double asterisks
  formattedText = formattedText.replace(
    /\*\*([\d]+\.\s*[^*]+?)\*\*/g,
    '<h3 class="text-xl font-semibold text-green-600 dark:text-green-400 mb-3">$1</h3>'
  );

  // Handle bold text with double asterisks (not part of headings)
  formattedText = formattedText.replace(
    /\*\*([^*]+?)\*\*/g,
    '<strong class="font-bold text-green-700 dark:text-green-400">$1</strong>'
  );

  // Handle italic/emphasized text with single asterisks
  formattedText = formattedText.replace(
    /\*([^*]+?)\*/g,
    '<em class="italic text-blue-600 dark:text-blue-400">$1</em>'
  );

  // Handle line breaks
  formattedText = formattedText.replace(/\n/g, '<br/>');

  return formattedText;
}

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  const { speak, cancel, speaking, voices } = useSpeechSynthesis();
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Find and set the preferred Indian female voice
  useEffect(() => {
    if (voices.length > 0) {
      // Try to find an Indian English female voice
      const indianVoice = voices.find(
        voice => 
          // Check for Indian English voices
          (voice.lang === 'en-IN' || 
           voice.name.toLowerCase().includes('indian') ||
           voice.name.toLowerCase().includes('ravi') ||
           voice.name.toLowerCase().includes('veena') ||
           voice.name.toLowerCase().includes('priya')) &&
          // Prefer female voices
          (voice.name.toLowerCase().includes('female') ||
           !voice.name.toLowerCase().includes('male'))
      );

      // Fallback to any English voice with Indian-sounding names
      const indianNameVoice = voices.find(
        voice =>
          voice.lang.startsWith('en') &&
          (voice.name.toLowerCase().includes('veena') ||
           voice.name.toLowerCase().includes('priya') ||
           voice.name.toLowerCase().includes('deepa') ||
           voice.name.toLowerCase().includes('anjali'))
      );
      
      // Final fallback to any English voice
      const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
      
      const selectedVoice = indianVoice || indianNameVoice || englishVoice || voices[0];
      setSelectedVoice(selectedVoice);

      // Log available voices for debugging
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      console.log('Selected voice:', selectedVoice?.name);
    }
  }, [voices]);
  
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const dropzoneRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const toastRef = useRef<HTMLDivElement | null>(null);

  // Handle animations after mount
  useEffect(() => {
    if (!isPageLoading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPageLoading]);

  useLayoutEffect(() => {
    if (shouldAnimate && imageContainerRef.current && textRefs.current.length > 0) {
      const tl = gsap.timeline();

      // Set initial states
      gsap.set([imageContainerRef.current, ...textRefs.current, dropzoneRef.current], {
        opacity: 0,
        y: 30
      });

      tl.to(imageContainerRef.current, { 
        opacity: 1, 
        y: 0, 
        duration: 1.2, 
        ease: "power3.out" 
      });
      
      tl.to(textRefs.current, { 
        opacity: 1, 
        y: 0, 
        stagger: 0.2, 
        duration: 0.7, 
        ease: "power3.out" 
      }, "-=0.7");
      
      tl.to(dropzoneRef.current, { 
        opacity: 1, 
        y: 0, 
        duration: 0.6 
      }, "-=0.3");

      return () => {
        tl.kill();
      };
    }
  }, [shouldAnimate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Function to clean text for speech
  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '')   // Remove italic markers
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();
  };

  if (isPageLoading) {
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
          <p className="text-white text-lg animate-pulse">Loading Plant Disease Detection...</p>
        </div>
      </div>
    );
  }

  // Function to handle text-to-speech with Indian voice optimization
  const handleSpeak = (text: string, sectionIndex?: number) => {
    if (speaking) {
      cancel();
      setIsPlaying(false);
      setCurrentSection(-1);
      return;
    }

    setIsPlaying(true);
    setCurrentSection(sectionIndex ?? -1);
    
    speak({ 
      text: cleanTextForSpeech(text),
      voice: selectedVoice || undefined,
      rate: 0.85,    // Slightly slower for clearer pronunciation
      pitch: 1.05,   // Slightly higher pitch for female voice
      volume: 1,     // Full volume
      onEnd: () => {
        setIsPlaying(false);
        setCurrentSection(-1);
      }
    });
  };

  const showSuccessMessage = () => {
    setShowSuccess(true);
    const tl = gsap.timeline();
    
    // Animate in
    tl.fromTo(toastRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
    );
    
    // Wait and animate out
    tl.to(toastRef.current, {
      y: 50,
      opacity: 0,
      duration: 0.3,
      delay: 2,
      ease: "power2.in",
      onComplete: () => setShowSuccess(false)
    });
  };

  const analyzePlant = async (imageData: string) => {
    try {
      setError(null);
      const response = await fetch('/api/analyze-plant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      const result: AnalysisResult = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze plant');
      }

      if (result.error) {
        throw new Error(result.error);
      }

      setAnalysisResult(result.analysis);
      
      // Only show success message if we got valid analysis
      if (result.analysis) {
        setShowSuccess(true);
        const tl = gsap.timeline();
        
        // Animate in
        tl.fromTo(toastRef.current,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
        );
        
        // Wait and animate out
        tl.to(toastRef.current, {
          y: 50,
          opacity: 0,
          duration: 0.3,
          delay: 2,
          ease: "power2.in",
          onComplete: () => setShowSuccess(false)
        });
      }

      // Scroll to analysis result
      setTimeout(() => {
        setIsAnalyzing(false);
        if (result.analysis) {
          const resultElement = document.getElementById('analysis-result');
          if (resultElement) {
            resultElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 2500);

    } catch (err: any) {
      console.error('Error:', err);
      // Reset analyzing state
      setIsAnalyzing(false);

      // Check for specific error messages or status codes that indicate server overload
      const isServerOverloaded = 
        err.message?.toLowerCase().includes('overload') ||
        err.message?.toLowerCase().includes('too many requests') ||
        err.message?.toLowerCase().includes('server busy') ||
        err.message?.toLowerCase().includes('googlegeneration') ||
        err.message?.toLowerCase().includes('503') ||
        (err.status === 429) || // Too Many Requests
        (err.status === 503);   // Service Unavailable

      // Create and show toast message
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed bottom-8 right-8 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 z-50';
      
      if (isServerOverloaded) {
        errorToast.className += ' bg-yellow-500 text-white';
        errorToast.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <span class="font-medium">Our servers are currently busy. Please try again in a few moments.</span>
        `;
      } else {
        errorToast.className += ' bg-red-500 text-white';
        errorToast.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span class="font-medium">Analysis failed. Please try again.</span>
        `;
      }

      // Add slide-in animation
      errorToast.style.transform = 'translateX(100%)';
      document.body.appendChild(errorToast);
      
      // Trigger animation after a small delay
      setTimeout(() => {
        errorToast.style.transform = 'translateX(0)';
      }, 100);

      // Remove toast after 5 seconds with slide-out animation
      setTimeout(() => {
        errorToast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          errorToast.remove();
        }, 300);
      }, 5000);

      // Only set error state for non-overload errors
      if (!isServerOverloaded) {
        setError('Failed to analyze the plant. Please try again.');
      }
    }
  };

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image size should be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imageData = e.target?.result as string;
        if (!imageData) {
          throw new Error('Failed to read image file');
        }

        setUploadedImage(imageData);
        setIsAnalyzing(true);
        setError(null);
        
        // Animate progress bar
        gsap.to(progressRef.current, {
          width: "100%",
          duration: 2,
          ease: "power1.inOut",
        });

        // Analyze the plant
        await analyzePlant(imageData);
        
      } catch (err: any) {
        setError(err.message || 'Failed to process image');
        setIsAnalyzing(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read image file');
      setIsAnalyzing(false);
    };

    reader.readAsDataURL(file);
  };

  const renderAnalysisContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => {
      const isPlaying = currentSection === index;
      
      return (
        <div 
          key={index}
          className={`text-gray-700 dark:text-gray-300 leading-relaxed mb-6 relative group ${
            isPlaying ? 'bg-green-50 dark:bg-green-900/20 rounded-lg p-4' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div
              className="flex-grow"
              dangerouslySetInnerHTML={{
                __html: formatAnalysisText(paragraph)
              }}
            />
            <button
              onClick={() => handleSpeak(paragraph, index)}
              className={`flex items-center justify-center p-2 rounded-full transition-all duration-300 ${
                isPlaying 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50' 
                  : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
              } opacity-0 group-hover:opacity-100 focus:opacity-100`}
              aria-label={isPlaying ? "Stop speaking" : "Read this section"}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 18M6 6L18 6" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.788v6.424a.5.5 0 00.757.429l5.5-3.212a.5.5 0 000-.858l-5.5-3.212a.5.5 0 00-.757.43z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-20 px-8 sm:px-20 font-[family-name:var(--font-geist-sans)] bg-white dark:bg-gray-900">
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

      {/* Header with User Info */}
      <div className="fixed top-0 right-0 p-4 flex items-center gap-4">
        {isLoaded && (
          <>
            {isSignedIn ? (
              <>
                <a
                  href="/community"
                  className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-4 py-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  Community
                </a>
                <span className="text-gray-300">
                  Welcome,<strong className="aura-heading">{user.firstName || user.username}!</strong>
                </span>
                <UserButton afterSignOutUrl="/"/>
              </>
            ) : (
              <a
                href="/sign-in"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign In
              </a>
            )}
          </>
        )}
      </div>

      <main className="flex flex-col items-center gap-12 max-w-4xl">
        <div className="text-center opacity-100">
          <h1
            className="aura-heading text-4xl sm:text-5xl md:text-6xl font-bold"
            ref={(el) => {
              textRefs.current[0] = el;
            }}
          >
            Plant Disease Detection
          </h1>
          <span className="block text-green-600 dark:text-green-400 text-2xl sm:text-3xl md:text-4xl font-semibold">
            AI-Powered Analysis
          </span>
        </div>

        {isSignedIn ? (
          <>
            <div 
              className="highlight-section max-w-2xl text-center opacity-100"
              ref={(el) => {
                textRefs.current[1] = el;
              }}
            >
              <p className="description-text text-gray-700 dark:text-gray-300 mb-4">
                Welcome to our advanced plant disease detection system. Using cutting-edge AI technology, 
                we analyze your plant images in real-time to identify potential diseases and health issues.
              </p>
              <p className="description-text text-gray-700 dark:text-gray-300 mb-4">
                Simply upload a clear photo of your plant's leaves, and our system will:
              </p>
              <ul className="description-text text-gray-700 dark:text-gray-300 text-left list-disc list-inside space-y-2">
                <li>Analyze leaf patterns and discoloration</li>
                <li>Identify common plant diseases and infections</li>
                <li>Provide detailed analysis of plant health</li>
                <li>Suggest treatment recommendations</li>
              </ul>
            </div>

            {/* Existing image container and upload components */}
            <div
              ref={imageContainerRef}
              className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden shadow-2xl hover:shadow-green-200/50 dark:hover:shadow-green-700/50 transition-all duration-300"
            >
              {uploadedImage ? (
                <Image
                  src={uploadedImage}
                  alt="Uploaded plant image"
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <Image
                  src="/image/plant.png"
                  alt="Plant with potential disease"
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              )}
            </div>

            {/* Existing drag and drop zone */}
            <div
              ref={dropzoneRef}
              className={`relative w-full min-h-[200px] p-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer ${
                isDragging
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/50 border-4'
                  : 'border-gray-400 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
              }`}
              onClick={() => document.getElementById('fileInput')?.click()}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
            >
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="text-center flex flex-col items-center gap-4">
                <div className={`p-4 rounded-full bg-gray-100 dark:bg-gray-700 transition-transform duration-300 ${
                  isDragging ? 'scale-110 bg-green-100 dark:bg-green-900' : ''
                }`}>
                  <svg
                    className={`h-12 w-12 text-gray-500 dark:text-gray-400 ${
                      isDragging ? 'text-green-600 dark:text-green-400' : ''
                    }`}
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M24 14v20m-10-10h20"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-lg text-gray-700 dark:text-gray-200 font-medium mb-1">
                    Drop your image here or click to upload
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    PNG, JPG up to 10MB
                  </p>
                </div>
                <div className={`mt-2 transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-70'}`}>
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    {isDragging ? 'Release to upload' : 'Click or drag file here'}
                  </p>
                </div>
              </div>
            </div>

            {isAnalyzing && (
              <div className="w-full max-w-md">
                <div className="flex flex-col items-center gap-4 mb-2">
                  <div className="leaf-loader relative w-24 h-24">
                    <Image
                      src="/icon/leaf.svg"
                      alt="Analyzing"
                      width={96}
                      height={96}
                      className="animate-float"
                    />
                    <div className="absolute inset-0 animate-pulse-ring">
                      <div className="absolute inset-0 border-4 border-green-500/20 dark:border-green-400/20 rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg font-medium animate-pulse mt-2">
                    Analyzing your plant...
                  </p>
                </div>
                {/* <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    ref={progressRef}
                    className="h-full w-0 bg-green-500 rounded-full transition-all duration-300"
                  ></div>
                </div> */}
              </div>
            )}

            {error && (
              <div className="w-full max-w-md p-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            {analysisResult && !isAnalyzing && (
              <div 
                id="analysis-result"
                className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      Analysis Results
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSpeak(analysisResult)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                            speaking 
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50' 
                              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          }`}
                        >
                          {speaking ? (
                            <>
                              <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 18M6 6L18 6" />
                              </svg>
                              Stop
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.788v6.424a.5.5 0 00.757.429l5.5-3.212a.5.5 0 000-.858l-5.5-3.212a.5.5 0 00-.757.43z" />
                              </svg>
                              Read All
                            </>
                          )}
                        </button>
                        {selectedVoice && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div>Voice: {selectedVoice.name}</div>
                            <div>Language: {selectedVoice.lang}</div>
                          </div>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full">
                        AI Analysis Complete
                      </span>
                    </div>
                  </div>

                  <div className="prose dark:prose-invert max-w-none space-y-6">
                    {renderAnalysisContent(analysisResult)}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Note: This analysis is powered by AI and should be used as a reference. 
                      For critical plant health issues, consult with a professional botanist or plant pathologist.
                    </p>
                    <div className="flex items-center justify-center">
                      <Image src="/image/india.png" alt="India" width={50} height={50} />
                      <p className="text-sm aura-heading dark:text-gray-400">Made in India</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="description-text text-xl text-gray-700 dark:text-gray-300 mb-8">
              Please sign in to use the Plant Disease Detection system
            </p>
            <a
              href="/sign-in"
              className="inline-block bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              Sign In to Continue
            </a>
          </div>
        )}
      </main>

      {/* Success Message Toast */}
      {showSuccess && (
        <div
          ref={toastRef}
          className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">Analysis complete!</span>
        </div>
      )}
    </div>
  );
}

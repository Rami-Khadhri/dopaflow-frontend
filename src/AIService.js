import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import aiIcon from './images/ai-icon.png'; // Ensure this exists in your project

const AIChat = ({ onClose, initialMessage }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState(null);
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isSendingRef = useRef(false);

  const userName = localStorage.getItem('username') || 'User';

  // Text formatting for bold/italic
  const formatText = (text) => {
    let cleanedText = text.replace(/undefined/g, '').trim();
    let parts = [cleanedText];
    const regexPatterns = [
      { pattern: /(\*\*\*[^\*]+\*\*\*)/g, style: 'font-bold italic', strip: /\*\*\*/g },
      { pattern: /(\*\*[^\*]+\*\*)/g, style: 'font-bold', strip: /\*\*/g },
      { pattern: /(\*[^\*]+\*)/g, style: 'italic', strip: /\*/g },
    ];

    regexPatterns.forEach(({ pattern, style, strip }) => {
      parts = parts.flatMap((part) => {
        if (typeof part !== 'string') return [part];
        return part.split(pattern).map((subPart, index) => {
          if (subPart.match(pattern)) {
            const content = subPart.replace(strip, '');
            return <span key={index} className={`${style} text-teal-700`}>{content}</span>;
          }
          return subPart;
        });
      });
    });

    return parts.map((part, index) =>
      typeof part === 'string' ? <span key={index} className="text-gray-700">{part}</span> : part
    );
  };

  // Enhanced Typewriter effect with adjustable speed
  const Typewriter = ({ text, speed = 15 }) => {
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
      setDisplayText('');
      setIsTyping(true);
      let index = 0;
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayText((prev) => prev + text[index]);
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, speed);
      return () => clearInterval(interval);
    }, [text, speed]);

    return (
      <span className="relative">
        {formatText(displayText)}
        {isTyping && <span className="animate-pulse text-teal-500 ml-1">✦</span>}
      </span>
    );
  };

  // Enhanced Search Animation with smoother animation
  const SearchAnimation = () => (
    <div className="flex justify-start mb-4">
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex items-center space-x-3 transition-all duration-300 hover:shadow-lg">
        <span className="text-2xl animate-bounce ease-in-out">🔍</span>
        <span className="text-gray-700 font-medium animate-pulse">Digging through the web...</span>
      </div>
    </div>
  );

  // Enhanced SourceCard with hover effects
  const SourceCard = ({ text }) => {
    const lines = text.split('\n');
    let results = [];
    let currentResult = {};

    lines.forEach((line) => {
      if (line.match(/^\d+\.\s*\*\*/)) {
        if (Object.keys(currentResult).length > 0) results.push(currentResult);
        currentResult = { title: line.replace(/^\d+\.\s*\*\*(.*)\*\*$/, '$1') };
      } else if (line.startsWith('Link: ')) {
        currentResult.link = line.replace('Link: ', '').trim();
      } else if (line.startsWith('Snippet: ')) {
        currentResult.snippet = line.replace('Snippet: ', '').trim();
      } else if (line.startsWith('Image: ')) {
        currentResult.image = line.replace('Image: ', '').trim();
      }
    });
    if (Object.keys(currentResult).length > 0) results.push(currentResult);

    return (
      <div className="space-y-3">
        {results.length > 0 ? (
          results.map((result, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-200"
            >
              <a
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 font-semibold hover:text-teal-800 hover:underline"
              >
                {result.title}
              </a>
              {result.snippet && <p className="text-gray-600 text-sm mt-1">{result.snippet}</p>}
              {result.image && (
                <img
                  src={result.image}
                  alt={result.title}
                  className="mt-2 w-full h-40 object-cover rounded-md transition-opacity duration-300 hover:opacity-90"
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found')}
                />
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-700">{formatText(text)}</p>
        )}
      </div>
    );
  };

  const sendMessage = useCallback(
    async (messageText, requestType = 'chat') => {
      if (isSendingRef.current) return;
      isSendingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token—log in!');

        const res = await axios.post(
          'http://localhost:8080/api/ai/chat',
          { message: messageText, requestType, username: userName },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let aiResponse = res.data.response || `Hey ${userName}, I’m stumped—more details?`;
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: aiResponse, isNew: true, type: requestType },
        ]);
      } catch (error) {
        console.error('Send error:', error.response?.data || error.message);
        let errorMessage = 'AI crashed, bro!';
        if (error.message.includes('token') || error.response?.status === 401) {
          errorMessage = 'Log in, bro!';
          setTimeout(() => (window.location.href = '/login'), 2000);
        } else if (error.response?.status === 500) {
          errorMessage = 'Server’s down—retry later!';
        }
        setError(errorMessage);
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: `Oops, something broke, ${userName}!`, isNew: true, type: 'error' },
        ]);
      } finally {
        setLoading(false);
        isSendingRef.current = false;
      }
    },
    [userName]
  );

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token—log in!');

        const res = await axios.get('http://localhost:8080/api/ai/chat', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const historyMessages = (res.data || []).map((msg) => ({
          ...msg,
          isNew: false,
          sender: msg.sender || 'unknown',
          text: msg.text || 'No content',
          type: msg.type || 'chat',
        }));
        setMessages(historyMessages);
      } catch (error) {
        console.error('History error:', error.response?.data || error.message);
        let errorMessage = 'History load failed.';
        if (error.message.includes('token') || error.response?.status === 401) {
          errorMessage = 'Log in to see history!';
          setTimeout(() => (window.location.href = '/login'), 2000);
        }
        setError(errorMessage);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (initialMessage && !loadingHistory) {
      const lastUserMsg = [...messages].reverse().find((msg) => msg.sender === 'user');
      if (!lastUserMsg || lastUserMsg.text !== initialMessage.text) {
        setMessages((prev) => [...prev, { ...initialMessage, isNew: false }]);
        sendMessage(initialMessage.text, 'chat');
      }
    }
  }, [initialMessage, loadingHistory, messages, sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setIsClosing(true);
        setTimeout(onClose, 300);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const type = input.toLowerCase().startsWith('search') ? 'suggestion' : 'chat';
    const userMsg = { sender: 'user', text: input, isNew: false, type };
    setMessages((prev) => [...prev, userMsg]);
    sendMessage(input, type);
    setInput('');
  };

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].isNew) {
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg, index) => (index === prev.length - 1 ? { ...msg, isNew: false } : msg))
        );
      }, 2000);
    }
  }, [messages]);

  return (
    <div
      ref={chatRef}
      className={`fixed bottom-20 right-32 w-[450px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 transition-all duration-300 ${
        isClosing ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="flex items-center p-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-t-2xl shadow-md">
        <img src={aiIcon} alt="AI" className="w-8 h-8 mr-3 rounded-full hover:scale-110 transition-transform" />
        <span className="font-bold text-lg">DopaBot</span>
        <button
          onClick={() => {
            setIsClosing(true);
            setTimeout(onClose, 300);
          }}
          className="ml-auto p-1 hover:bg-teal-700 rounded-full transition-colors"
        >
          <span className="material-icons-round">close</span>
        </button>
      </div>

      <div className="p-5 h-[450px] overflow-y-auto bg-gray-50">
        {loadingHistory ? (
          <div className="flex justify-center py-6">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 text-center py-8 hover:text-gray-700 transition-all">
            Hey {userName}, I’m DopaBot—your CRM wingman! What’s up? 🚀
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4 hover:scale-[1.02] transition-all`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-xl shadow-md ${
                  msg.sender === 'user' ? 'bg-teal-100 text-teal-900' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {msg.sender === 'ai' && msg.type === 'search' && !msg.isNew ? (
                  <SourceCard text={msg.text} />
                ) : msg.sender === 'ai' && msg.isNew && !loading ? (
                  <Typewriter text={msg.text} />
                ) : (
                  formatText(msg.text)
                )}
              </div>
            </div>
          ))
        )}
        {loading && (messages[messages.length - 1]?.type === 'search' ? <SearchAnimation /> : (
          <div className="flex justify-start mb-4">
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex space-x-2">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ))}
        {error && <p className="text-red-500 text-center py-2 animate-pulse">{error}</p>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl shadow-inner">
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask whatever you want, ${userName.split(" ")[0]}`}
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none hover:border-teal-400 transition-all"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            className="p-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transform hover:scale-105 transition-all"
            disabled={loading}
          >
            <span className="material-icons-round">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export { AIChat };
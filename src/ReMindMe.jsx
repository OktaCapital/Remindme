import React, { useState, useEffect, useRef } from 'react';
import { Clock, Image, X, Bell, Check, Trash2, User, Bookmark, Plus, LogOut, Search, Sparkles, Edit2, Menu, Settings, HelpCircle, ChevronRight, MapPin, Calendar, Mic, Video, RefreshCw } from 'lucide-react';

export default function ReMindMe() {
  const [activeTab, setActiveTab] = useState('remind');
  const [input, setInput] = useState('');
  const [reminders, setReminders] = useState([]);
  const [saves, setSaves] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📌');
  const [listView, setListView] = useState('list');
  const [saveViewMode, setSaveViewMode] = useState('list');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ text: '', location: '', date: '', time: '', color: '#ffffff' });
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  // New states for improvements
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', undoData: null });
  const [successAnimation, setSuccessAnimation] = useState(false);

  const scrollRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);

  const [categories, setCategories] = useState([
    { id: 'ideas', name: 'Ideas', icon: '💡', color: '#FEF3C7' },
    { id: 'tasks', name: 'Tasks', icon: '✓', color: '#DBEAFE' },
    { id: 'links', name: 'Links', icon: '🔗', color: '#E0E7FF' },
    { id: 'notes', name: 'Notes', icon: '📝', color: '#FCE7F3' },
    { id: 'photos', name: 'Photos', icon: '📷', color: '#D1FAE5' },
    { id: 'place', name: 'Place', icon: '📍', color: '#FED7AA' },
    { id: 'other', name: 'Other', icon: '📌', color: '#E5E7EB' }
  ]);

  // Quick action suggestions
  const reminderSuggestions = [
    { label: 'Besok pagi', value: 'besok jam 8 pagi' },
    { label: 'Nanti sore', value: 'hari ini jam 5 sore' },
    { label: 'Minggu depan', value: 'minggu depan jam 9' },
    { label: '1 jam lagi', value: 'dalam 1 jam' },
  ];

  const saveSuggestions = [
    { label: '💡 Ide', prefix: 'ide: ' },
    { label: '📍 Tempat', prefix: 'lokasi ngedate di ' },
    { label: '🔗 Link', prefix: 'save link ' },
    { label: '📝 Catatan', prefix: 'catatan: ' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(checkReminders, 60000);
    checkReminders();
    return () => clearInterval(interval);
  }, [reminders]);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        setCanScroll(scrollRef.current.scrollHeight > scrollRef.current.clientHeight);
      }
    };
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [activeTab, reminders, saves, selectedCategory]);

  // Auto-hide snackbar
  useEffect(() => {
    if (snackbar.show) {
      const timer = setTimeout(() => {
        setSnackbar({ show: false, message: '', undoData: null });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.show]);

  const getFilteredItems = () => {
    if (!searchQuery.trim()) return { reminders, saves };

    const query = searchQuery.toLowerCase();
    const filteredReminders = reminders.filter(r =>
      r.text?.toLowerCase().includes(query) ||
      r.location?.toLowerCase().includes(query)
    );
    const filteredSaves = saves.filter(s =>
      s.text?.toLowerCase().includes(query) ||
      s.location?.toLowerCase().includes(query)
    );

    return { reminders: filteredReminders, saves: filteredSaves };
  };

  const loadData = async () => {
    try {
      const reminderResult = await window.storage?.get('reminders');
      const saveResult = await window.storage?.get('saves');
      const authResult = await window.storage?.get('userAuth');
      const categoryResult = await window.storage?.get('categories');

      if (reminderResult?.value) setReminders(JSON.parse(reminderResult.value));
      if (saveResult?.value) setSaves(JSON.parse(saveResult.value));
      if (categoryResult?.value) setCategories(JSON.parse(categoryResult.value));
      if (authResult?.value) {
        const auth = JSON.parse(authResult.value);
        setIsLoggedIn(auth.isLoggedIn);
        setUserEmail(auth.email);
      }
    } catch (error) {
      console.log('No existing data');
    }
    setLoading(false);
  };

  const saveData = async (type, data) => {
    try {
      await window.storage?.set(type, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleLogin = (method, email = '') => {
    setIsLoggedIn(true);
    setUserEmail(email || `user@${method}.com`);
    saveData('userAuth', { isLoggedIn: true, email: email || `user@${method}.com` });
    setShowProfile(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    saveData('userAuth', { isLoggedIn: false, email: '' });
  };

  const checkReminders = () => {
    const now = new Date().getTime();
    reminders.forEach(reminder => {
      if (!reminder.notified && reminder.time && reminder.time <= now) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⏰ Re:Mind Me', {
            body: reminder.text,
            icon: '🔔'
          });
        }

        const updated = reminders.map(r =>
          r.id === reminder.id ? { ...r, notified: true } : r
        );
        setReminders(updated);
        saveData('reminders', updated);
      }
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPhoto(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecordingVoice(false);
        showSnackbar('🎤 Voice recorded! (Speech-to-text coming soon)');
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 10000);
    } catch (error) {
      console.error('Voice recording failed:', error);
      showSnackbar('Could not access microphone');
    }
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const videoChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        videoChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const videoBlobData = new Blob(videoChunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setVideoBlob(reader.result);
        };
        reader.readAsDataURL(videoBlobData);
        stream.getTracks().forEach(track => track.stop());
        setIsRecordingVideo(false);
      };

      mediaRecorder.start();
      setIsRecordingVideo(true);

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 30000);
    } catch (error) {
      console.error('Video recording failed:', error);
      showSnackbar('Could not access camera');
    }
  };

  const stopRecording = () => {
    setIsRecordingVoice(false);
    setIsRecordingVideo(false);
  };

  // Snackbar helper
  const showSnackbar = (message, undoData = null) => {
    setSnackbar({ show: true, message, undoData });
  };

  // Undo delete
  const handleUndo = () => {
    if (snackbar.undoData) {
      const { type, item } = snackbar.undoData;
      if (type === 'reminder') {
        const updated = [item, ...reminders];
        setReminders(updated);
        saveData('reminders', updated);
      } else {
        const updated = [item, ...saves];
        setSaves(updated);
        saveData('saves', updated);
      }
      setSnackbar({ show: false, message: '', undoData: null });
    }
  };

  // Show success animation
  const triggerSuccess = () => {
    setSuccessAnimation(true);
    setTimeout(() => setSuccessAnimation(false), 1500);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  // Parse reminder - returns parsed data for confirmation
  const parseReminder = (inputText) => {
    const originalInput = inputText.trim();
    const text = originalInput.toLowerCase();
    const now = new Date();

    let targetDate = new Date(now);
    let dateLabel = 'Hari ini';

    if (text.includes('besok') || text.includes('tomorrow')) {
      targetDate.setDate(targetDate.getDate() + 1);
      dateLabel = 'Besok';
    } else if (text.includes('lusa')) {
      targetDate.setDate(targetDate.getDate() + 2);
      dateLabel = 'Lusa';
    } else if (text.includes('minggu depan') || text.includes('next week')) {
      targetDate.setDate(targetDate.getDate() + 7);
      dateLabel = 'Minggu depan';
    }

    let hour = 9;
    let minute = 0;
    let timeLabel = '09:00';

    const jamMatch = text.match(/jam\s*(\d{1,2})(?:[.:](\d{2}))?/i);
    if (jamMatch) {
      hour = parseInt(jamMatch[1]);
      minute = jamMatch[2] ? parseInt(jamMatch[2]) : 0;
      timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    } else if (text.includes('pagi')) {
      hour = 8; timeLabel = '08:00';
    } else if (text.includes('siang')) {
      hour = 12; timeLabel = '12:00';
    } else if (text.includes('sore')) {
      hour = 17; timeLabel = '17:00';
    } else if (text.includes('malam') || text.includes('malem')) {
      hour = 20; timeLabel = '20:00';
    }

    // Parse "dalam X jam/menit"
    const dalamMatch = text.match(/dalam\s*(\d+)\s*(jam|menit|hour|minute)/i);
    if (dalamMatch) {
      const amount = parseInt(dalamMatch[1]);
      const unit = dalamMatch[2].toLowerCase();
      if (unit === 'jam' || unit === 'hour') {
        targetDate = new Date(now.getTime() + amount * 60 * 60 * 1000);
      } else {
        targetDate = new Date(now.getTime() + amount * 60 * 1000);
      }
      hour = targetDate.getHours();
      minute = targetDate.getMinutes();
      timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      dateLabel = targetDate.toDateString() === now.toDateString() ? 'Hari ini' : 'Besok';
    }

    targetDate.setHours(hour, minute, 0, 0);

    // Parse location
    let location = null;
    const diMatch = text.match(/\bdi\s+([a-z0-9\s]+?)(?:\s+(?:jam|pagi|siang|sore|malam|besok|sama|bareng|dengan|namanya|yang|untuk)|$)/i);
    if (diMatch) {
      location = diMatch[1].trim();
      location = location.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Build clean text
    let cleanText = originalInput;
    const prefixes = ['ingetin aku', 'remind me', 'tolong ingetin', 'ingetin', 'reminder', 'mau', 'pengen', 'want to', 'gonna'];
    for (const prefix of prefixes) {
      const prefixRegex = new RegExp(`^${prefix}\\s+`, 'i');
      if (prefixRegex.test(cleanText)) {
        cleanText = cleanText.replace(prefixRegex, '');
        break;
      }
    }

    cleanText = cleanText
      .replace(/\b(besok|lusa|minggu depan|hari ini|nanti)\b/gi, '')
      .replace(/\bjam\s*\d{1,2}([.:]\d{2})?\b/gi, '')
      .replace(/\bdalam\s*\d+\s*(jam|menit|hour|minute)s?\b/gi, '')
      .replace(/\b(pagi|siang|sore|malam|malem)\b/gi, '');

    if (location) {
      cleanText = cleanText.replace(new RegExp(`\\bdi\\s+${location}\\b`, 'gi'), '');
    }

    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    if (cleanText.length > 0) {
      cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    }

    return {
      text: cleanText,
      time: targetDate.getTime(),
      dateLabel,
      timeLabel,
      location,
      fullTimeLabel: `${dateLabel}, ${timeLabel}`
    };
  };

  // Process AI Reminder - now shows confirmation modal
  const processAIReminder = async () => {
    if (!input.trim() && !photo && !videoBlob) return;

    setIsProcessingAI(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const parsed = parseReminder(input);
    setParsedResult({
      type: 'reminder',
      ...parsed,
      photo: photo || videoBlob
    });

    setIsProcessingAI(false);
    setShowConfirmModal(true);
  };

  // Confirm and save reminder
  const confirmSaveReminder = () => {
    if (!parsedResult) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const targetDate = new Date(parsedResult.time);
    const timeLabel = `${months[targetDate.getMonth()]} ${targetDate.getDate()}, ${targetDate.getFullYear()} at ${parsedResult.timeLabel}`;

    const newReminder = {
      id: Date.now(),
      text: parsedResult.text,
      photo: parsedResult.photo,
      time: parsedResult.time,
      timeLabel: timeLabel,
      location: parsedResult.location,
      notified: false,
      created: Date.now(),
      color: '#ffffff'
    };

    const updated = [newReminder, ...reminders];
    setReminders(updated);
    saveData('reminders', updated);

    setInput('');
    setPhoto(null);
    setVideoBlob(null);
    setShowConfirmModal(false);
    setParsedResult(null);
    triggerSuccess();
    showSnackbar('✅ Reminder created!');

    setTimeout(() => setActiveTab('reminder'), 500);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Parse save content
  const parseSave = (inputText) => {
    const text = inputText.trim().toLowerCase();
    const originalInput = inputText.trim();
    let categoryId = 'other';
    let cleanText = originalInput;
    let location = null;
    let categoryName = 'Other';
    let categoryIcon = '📌';

    const urlMatch = originalInput.match(/(https?:\/\/[^\s]+)/i);
    const hasUrl = !!urlMatch;

    // Context patterns
    const contextPatterns = [
      { pattern: /tempat\s*liburan|destinasi|vacation|holiday|wisata|travel/i, category: 'place', name: 'Travel', icon: '✈️' },
      { pattern: /tempat\s*makan|resto|restaurant|kuliner|food spot/i, category: 'place', name: 'Food', icon: '🍽️' },
      { pattern: /tempat\s*nongkrong|cafe|coffee|ngopi/i, category: 'place', name: 'Cafe', icon: '☕' },
      { pattern: /inspirasi|design|desain|referensi/i, category: 'ideas', name: 'Inspirasi', icon: '🎨' },
      { pattern: /musik|music|song|lagu|playlist/i, category: 'other', name: 'Music', icon: '🎵' },
      { pattern: /film|movie|series|nonton/i, category: 'other', name: 'Watch', icon: '🎬' },
      { pattern: /buku|book|baca|read/i, category: 'other', name: 'Reading', icon: '📚' },
    ];

    for (const { pattern, category, name, icon } of contextPatterns) {
      if (pattern.test(text)) {
        categoryId = category;
        categoryName = name;
        categoryIcon = icon;
        break;
      }
    }

    // Place patterns
    const placePattern = text.match(/(?:lokasi|tempat)\s*(?:ngedate|makan|hangout|ngopi)?\s*(?:di\s+)?([a-z0-9\s]+?)(?:\s+namanya\s+|\s+nama\s+)([a-z0-9\s&']+)/i);
    if (placePattern) {
      location = placePattern[1].trim();
      location = location.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      cleanText = placePattern[2].trim();
      cleanText = cleanText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      categoryId = 'place';
      categoryName = 'Place';
      categoryIcon = '📍';
    } else if (text.match(/di\s+\w+.*namanya\s+/i)) {
      const match = originalInput.match(/di\s+([a-z0-9\s]+?)\s+namanya\s+([a-z0-9\s&']+)/i);
      if (match) {
        location = match[1].trim();
        location = location.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        cleanText = match[2].trim();
        cleanText = cleanText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        categoryId = 'place';
        categoryName = 'Place';
        categoryIcon = '📍';
      }
    } else if (hasUrl) {
      categoryId = 'links';
      categoryName = 'Links';
      categoryIcon = '🔗';
      const beforeUrl = originalInput.slice(0, originalInput.indexOf(urlMatch[0])).trim();
      const description = beforeUrl.replace(/^(save|simpan)\s*/gi, '').replace(/[:\s]+$/g, '').trim();
      cleanText = description ? `${description}\n${urlMatch[0]}` : urlMatch[0];
    } else if (text.includes('ide ') || text.includes('idea')) {
      categoryId = 'ideas';
      categoryName = 'Ideas';
      categoryIcon = '💡';
      cleanText = originalInput.replace(/^(save|simpan|ide|idea)\s*/gi, '').trim();
    } else if (text.includes('catatan') || text.includes('note')) {
      categoryId = 'notes';
      categoryName = 'Notes';
      categoryIcon = '📝';
      cleanText = originalInput.replace(/^(save|simpan|catatan|note)\s*/gi, '').trim();
    } else if (photo || videoBlob) {
      categoryId = 'photos';
      categoryName = 'Photos';
      categoryIcon = '📷';
    } else {
      cleanText = originalInput.replace(/^(save|simpan)\s*/gi, '').trim();
    }

    if (cleanText && cleanText.length > 0 && !cleanText.startsWith('http')) {
      cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    }

    return {
      text: cleanText || originalInput,
      location,
      categoryId,
      categoryName,
      categoryIcon
    };
  };

  // Process AI Save - now shows confirmation modal
  const processAISave = async () => {
    if (!input.trim() && !photo && !videoBlob) return;

    setIsProcessingAI(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const parsed = parseSave(input);
    setParsedResult({
      type: 'save',
      ...parsed,
      photo: photo || videoBlob
    });

    setIsProcessingAI(false);
    setShowConfirmModal(true);
  };

  // Confirm and save item
  const confirmSaveItem = () => {
    if (!parsedResult) return;

    const newSave = {
      id: Date.now(),
      text: parsedResult.text,
      photo: parsedResult.photo,
      location: parsedResult.location,
      category: parsedResult.categoryId,
      created: Date.now(),
      color: '#ffffff'
    };

    const updated = [newSave, ...saves];
    setSaves(updated);
    saveData('saves', updated);

    setInput('');
    setPhoto(null);
    setVideoBlob(null);
    setShowConfirmModal(false);
    setParsedResult(null);
    triggerSuccess();
    showSnackbar(`✅ Saved to ${parsedResult.categoryName}!`);
  };

  const addReminderManual = () => {
    if (!input.trim() && !photo && !videoBlob) return;
    if (!manualDate || !manualTime) {
      showSnackbar('Please set date and time');
      return;
    }

    const dateTime = new Date(`${manualDate}T${manualTime}`);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timeLabel = `${months[dateTime.getMonth()]} ${dateTime.getDate()}, ${dateTime.getFullYear()} at ${manualTime}`;

    const newReminder = {
      id: Date.now(),
      text: input.trim(),
      photo: photo || videoBlob,
      time: dateTime.getTime(),
      timeLabel: timeLabel,
      location: manualLocation.trim() || null,
      notified: false,
      created: new Date().getTime(),
      color: '#ffffff'
    };

    const updated = [newReminder, ...reminders];
    setReminders(updated);
    saveData('reminders', updated);

    setInput('');
    setPhoto(null);
    setVideoBlob(null);
    setShowTimeOptions(false);
    setManualDate('');
    setManualTime('');
    setManualLocation('');
    triggerSuccess();
    showSnackbar('✅ Reminder created!');

    setTimeout(() => setActiveTab('reminder'), 500);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setInput('');
    setPhoto(null);
    setVideoBlob(null);
    setShowTimeOptions(false);
    setIsProcessingAI(false);
    setIsRecordingVoice(false);
    setIsRecordingVideo(false);
    setManualDate('');
    setManualTime('');
    setManualLocation('');
    if (tab === 'save') {
      setSelectedCategory(null);
    }
  };

  const addSave = (category) => {
    if (!input.trim() && !photo && !videoBlob) return;

    const newSave = {
      id: Date.now(),
      text: input.trim(),
      photo: photo || videoBlob,
      category: category.id,
      created: new Date().getTime(),
      color: '#ffffff'
    };

    const updated = [newSave, ...saves];
    setSaves(updated);
    saveData('saves', updated);

    setInput('');
    setPhoto(null);
    setVideoBlob(null);
    setSelectedCategory(null);
    triggerSuccess();
  };

  const addCustomCategory = () => {
    if (!newCategoryName.trim()) return;

    if (editingCategoryId) {
      const updated = categories.map(c =>
        c.id === editingCategoryId
          ? { ...c, name: newCategoryName.trim(), icon: newCategoryIcon }
          : c
      );
      setCategories(updated);
      saveData('categories', updated);
    } else {
      const newCat = {
        id: `custom_${Date.now()}`,
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        custom: true
      };

      const updated = [...categories, newCat];
      setCategories(updated);
      saveData('categories', updated);
    }

    setNewCategoryName('');
    setNewCategoryIcon('📌');
    setEditingCategoryId(null);
    setShowAddCategory(false);
  };

  const deleteCategory = (catId) => {
    if (!categories.find(c => c.id === catId)?.custom) return;

    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    saveData('categories', updated);
  };

  const deleteItem = (id, type) => {
    if (type === 'reminder') {
      const item = reminders.find(r => r.id === id);
      const updated = reminders.filter(r => r.id !== id);
      setReminders(updated);
      saveData('reminders', updated);
      showSnackbar('Reminder deleted', { type: 'reminder', item });
    } else {
      const item = saves.find(s => s.id === id);
      const updated = saves.filter(s => s.id !== id);
      setSaves(updated);
      saveData('saves', updated);
      showSnackbar('Item deleted', { type: 'save', item });
    }
  };

  const markComplete = (id) => {
    const updated = reminders.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    );
    setReminders(updated);
    saveData('reminders', updated);
  };

  const startEdit = (item, type) => {
    setEditingItem({ type, id: item.id });
    if (type === 'reminder') {
      const date = item.time ? new Date(item.time) : new Date();
      setEditForm({
        text: item.text || '',
        location: item.location || '',
        date: date.toISOString().split('T')[0],
        time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
        color: item.color || '#ffffff'
      });
    } else {
      setEditForm({
        text: item.text || '',
        location: item.location || '',
        date: '',
        time: '',
        color: item.color || '#ffffff'
      });
    }
  };

  const saveEdit = () => {
    if (!editingItem) return;

    if (editingItem.type === 'reminder') {
      const dateTime = new Date(`${editForm.date}T${editForm.time}`);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const timeLabel = `${months[dateTime.getMonth()]} ${dateTime.getDate()}, ${dateTime.getFullYear()} at ${editForm.time}`;

      const updated = reminders.map(r =>
        r.id === editingItem.id
          ? { ...r, text: editForm.text, location: editForm.location || null, time: dateTime.getTime(), timeLabel, color: editForm.color }
          : r
      );
      setReminders(updated);
      saveData('reminders', updated);
    } else {
      const updated = saves.map(s =>
        s.id === editingItem.id
          ? { ...s, text: editForm.text, location: editForm.location || null, color: editForm.color }
          : s
      );
      setSaves(updated);
      saveData('saves', updated);
    }

    setEditingItem(null);
    showSnackbar('✅ Changes saved!');
  };

  const cancelEdit = () => {
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  const filteredSaves = selectedCategory && selectedCategory !== 'manual'
    ? saves.filter(s => s.category === selectedCategory)
    : saves;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes successPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes checkmark {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .animate-bounce { animation: bounce 2s ease-in-out infinite; }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        .animate-successPop { animation: successPop 0.4s ease-out forwards; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
        }
      `}</style>

      <div className="max-w-md mx-auto h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">

        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}></div>
        </div>

        {/* Soft Gradient Orbs - More subtle */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

        {/* Success Animation Overlay */}
        {successAnimation && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/10 animate-fadeIn">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-successPop shadow-lg">
              <Check size={40} className="text-white" strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Header */}
        <header className="relative z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setShowMenu(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
            >
              <Menu size={22} className="text-slate-700" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Re:Mind Me
              </span>
            </div>

            <button
              onClick={() => setShowSearch(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
            >
              <Search size={20} className="text-slate-700" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto relative pb-24">

          {/* Remind Tab */}
          {activeTab === 'remind' && (
            <div className="p-5 space-y-5 animate-fadeIn">
              {/* Hero Section */}
              <div className="text-center pt-2 pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25 animate-bounce">
                  <Bell size={28} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Set a Reminder</h1>
                <p className="text-slate-500 text-sm">Tell me what to remind you about</p>
              </div>

              {/* Media Previews */}
              {(photo || videoBlob) && (
                <div className="flex gap-3 flex-wrap animate-scaleIn">
                  {photo && (
                    <div className="relative">
                      <img src={photo} alt="Preview" className="w-20 h-20 object-cover rounded-xl shadow-md" />
                      <button
                        onClick={() => setPhoto(null)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {videoBlob && (
                    <div className="relative">
                      <video src={videoBlob} className="w-20 h-20 object-cover rounded-xl shadow-md" />
                      <button
                        onClick={() => setVideoBlob(null)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-2">
                {reminderSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prev => prev ? `${prev} ${suggestion.value}` : suggestion.value)}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-full transition-colors active:scale-95"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. Ingetin aku besok jam 9 meeting di kantor"
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 text-slate-900 placeholder-slate-400 shadow-sm transition-all resize-none text-[15px]"
                  />
                  {isRecordingVoice && (
                    <div className="absolute right-3 top-3 flex items-center gap-1.5 px-2 py-1 bg-red-500 rounded-lg text-white text-xs animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      Recording...
                    </div>
                  )}
                </div>

                {/* Media Buttons */}
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors active:scale-[0.98]">
                    <Image size={18} className="text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  <button
                    onClick={isRecordingVoice ? stopRecording : startVoiceRecording}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98] ${
                      isRecordingVoice
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Mic size={18} />
                    <span className="text-sm font-medium">Voice</span>
                  </button>

                  <button
                    onClick={isRecordingVideo ? stopRecording : startVideoRecording}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98] ${
                      isRecordingVideo
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Video size={18} />
                    <span className="text-sm font-medium">Video</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              {showTimeOptions ? (
                <div className="space-y-4 animate-slideUp bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Set Date & Time</h3>
                    <button onClick={() => setShowTimeOptions(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">Date</label>
                      <input
                        type="date"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">Time</label>
                      <input
                        type="time"
                        value={manualTime}
                        onChange={(e) => setManualTime(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">Location (optional)</label>
                      <input
                        type="text"
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                        placeholder="e.g. Grand Indonesia"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    onClick={addReminderManual}
                    disabled={!manualDate || !manualTime || (!input.trim() && !photo && !videoBlob)}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed shadow-md shadow-purple-500/25 disabled:shadow-none"
                  >
                    Create Reminder
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={processAIReminder}
                    disabled={(!input.trim() && !photo && !videoBlob) || isProcessingAI}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-purple-500/25 disabled:shadow-none"
                  >
                    {isProcessingAI ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Create with AI</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowTimeOptions(true)}
                    disabled={!input.trim() && !photo && !videoBlob}
                    className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 disabled:text-slate-300 transition-colors flex items-center justify-center gap-1"
                  >
                    <Calendar size={14} />
                    <span>or set time manually</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Save Tab */}
          {activeTab === 'save' && (
            <div className="p-5 animate-fadeIn">
              {selectedCategory === null ? (
                <div className="space-y-5">
                  {/* Hero Section */}
                  <div className="text-center pt-2 pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25 animate-bounce">
                      <Bookmark size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Save Something</h1>
                    <p className="text-slate-500 text-sm">Ideas, links, places - anything!</p>
                  </div>

                  {/* Media Previews */}
                  {(photo || videoBlob) && (
                    <div className="flex gap-3 flex-wrap animate-scaleIn">
                      {photo && (
                        <div className="relative">
                          <img src={photo} alt="Preview" className="w-20 h-20 object-cover rounded-xl shadow-md" />
                          <button
                            onClick={() => setPhoto(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap gap-2">
                    {saveSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(suggestion.prefix)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-full transition-colors active:scale-95"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="space-y-3">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="e.g. Lokasi ngedate di Senayan namanya Sate Khas"
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-slate-900 placeholder-slate-400 shadow-sm transition-all resize-none text-[15px]"
                    />

                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors active:scale-[0.98]">
                      <Image size={18} className="text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">Add photo</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>

                  {/* AI Save Button */}
                  <div className="space-y-2">
                    <button
                      onClick={processAISave}
                      disabled={(!input.trim() && !photo && !videoBlob) || isProcessingAI}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 disabled:shadow-none"
                    >
                      {isProcessingAI ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          <span>Save with AI</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedCategory('manual')}
                      disabled={!input.trim() && !photo && !videoBlob}
                      className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 disabled:text-slate-300 transition-colors"
                    >
                      or choose category manually →
                    </button>
                  </div>

                  {/* Saved Items Preview */}
                  {saves.length > 0 && (
                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-900">Your Collections</h3>
                        <button
                          onClick={() => setShowAddCategory(true)}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                          <Plus size={14} />
                          Add Category
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {categories.map(cat => {
                          const count = saves.filter(s => s.category === cat.id).length;
                          if (count === 0) return null;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => setSelectedCategory(cat.id)}
                              className="p-4 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl transition-all text-left active:scale-[0.98]"
                            >
                              <div className="text-2xl mb-2">{cat.icon}</div>
                              <div className="font-semibold text-slate-900 text-sm">{cat.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{count} item{count > 1 ? 's' : ''}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty State for no saves */}
                  {saves.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Bookmark size={24} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-sm">Your saved items will appear here</p>
                    </div>
                  )}
                </div>
              ) : selectedCategory === 'manual' ? (
                /* Manual Category Selection */
                <div className="space-y-4 animate-slideUp">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
                  >
                    <ChevronRight size={16} className="rotate-180" />
                    Back
                  </button>

                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Choose Category</h2>
                    <p className="text-slate-500 text-sm mt-1">Where should we save this?</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          addSave(cat);
                          setSelectedCategory(null);
                        }}
                        className="p-4 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl transition-all flex flex-col items-center gap-2 active:scale-95"
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs font-medium text-slate-700">{cat.name}</span>
                      </button>
                    ))}

                    <button
                      onClick={() => setShowAddCategory(true)}
                      className="p-4 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl transition-all flex flex-col items-center gap-2 active:scale-95"
                    >
                      <Plus size={24} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-400">New</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Category Detail View */
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
                    >
                      <ChevronRight size={16} className="rotate-180" />
                      Back
                    </button>

                    <div className="flex bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => setSaveViewMode('list')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          saveViewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        List
                      </button>
                      <button
                        onClick={() => setSaveViewMode('card')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          saveViewMode === 'card' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        Card
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{categories.find(c => c.id === selectedCategory)?.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{categories.find(c => c.id === selectedCategory)?.name}</h2>
                      <p className="text-slate-500 text-sm">{filteredSaves.length} item{filteredSaves.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {filteredSaves.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Bookmark size={24} className="text-slate-300" />
                      </div>
                      <p className="text-slate-400 text-sm">No items in this category</p>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Add something →
                      </button>
                    </div>
                  ) : saveViewMode === 'list' ? (
                    <div className="space-y-3">
                      {filteredSaves.map((save, index) => {
                        const timeAgo = getTimeAgo(new Date(save.created));
                        const urlMatch = save.text?.match(/(https?:\/\/[^\s]+)/);

                        return (
                          <div
                            key={save.id}
                            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-slideUp"
                            style={{ animationDelay: `${index * 0.05}s`, backgroundColor: save.color !== '#ffffff' ? save.color : undefined }}
                          >
                            <div className="flex gap-3">
                              {save.photo && (
                                <img src={save.photo} alt="" className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                {urlMatch ? (
                                  <a href={urlMatch[0]} target="_blank" rel="noopener noreferrer" className="block">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                                        <svg className="w-2.5 h-2.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                      </div>
                                      <span className="text-xs text-blue-600 truncate">
                                        {(() => { try { return new URL(urlMatch[0]).hostname.replace('www.', ''); } catch { return 'Link'; } })()}
                                      </span>
                                    </div>
                                    <p className="text-slate-900 text-sm line-clamp-2">{save.text}</p>
                                  </a>
                                ) : (
                                  <p className="text-slate-900 font-medium">{save.text || '📷 Photo'}</p>
                                )}

                                {save.location && (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(save.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2 bg-blue-50 px-2 py-1 rounded-lg"
                                  >
                                    <MapPin size={12} />
                                    <span>{save.location}</span>
                                  </a>
                                )}

                                <p className="text-xs text-slate-400 mt-2">{timeAgo}</p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <button onClick={() => startEdit(save, 'save')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                  <Edit2 size={14} className="text-slate-400" />
                                </button>
                                <button onClick={() => deleteItem(save.id, 'save')} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={14} className="text-slate-400 hover:text-red-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {filteredSaves.map((save, index) => {
                        const timeAgo = getTimeAgo(new Date(save.created));

                        return (
                          <div
                            key={save.id}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-scaleIn"
                            style={{ animationDelay: `${index * 0.05}s`, backgroundColor: save.color !== '#ffffff' ? save.color : undefined }}
                          >
                            {save.photo && (
                              <img src={save.photo} alt="" className="w-full h-24 object-cover" />
                            )}
                            <div className="p-3">
                              <p className="text-slate-900 font-medium text-sm line-clamp-2 mb-2">{save.text || '📷 Photo'}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{timeAgo}</span>
                                <div className="flex gap-1">
                                  <button onClick={() => startEdit(save, 'save')} className="p-1.5 hover:bg-slate-100 rounded-lg">
                                    <Edit2 size={12} className="text-slate-400" />
                                  </button>
                                  <button onClick={() => deleteItem(save.id, 'save')} className="p-1.5 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={12} className="text-slate-400" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reminder List Tab */}
          {activeTab === 'reminder' && (
            <div className="p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">My Reminders</h2>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setListView('list')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      listView === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setListView('card')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      listView === 'card' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Card
                  </button>
                </div>
              </div>

              {reminders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Bell size={32} className="text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No reminders yet</h3>
                  <p className="text-slate-500 text-sm mb-4">Create your first reminder to get started</p>
                  <button
                    onClick={() => setActiveTab('remind')}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-md shadow-purple-500/25 active:scale-95 transition-transform"
                  >
                    Create Reminder
                  </button>
                </div>
              ) : listView === 'list' ? (
                <div className="space-y-3">
                  {reminders.map((reminder, index) => (
                    <div
                      key={reminder.id}
                      className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-slideUp transition-all ${reminder.completed ? 'opacity-60' : ''}`}
                      style={{ animationDelay: `${index * 0.05}s`, backgroundColor: reminder.color !== '#ffffff' ? reminder.color : undefined }}
                    >
                      <div className="flex gap-3">
                        {reminder.photo && (
                          <img src={reminder.photo} alt="" className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-slate-900 font-medium ${reminder.completed ? 'line-through text-slate-500' : ''}`}>
                            {reminder.text || '📷 Photo'}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                              <Clock size={12} />
                              <span>{reminder.timeLabel}</span>
                            </div>
                            {reminder.location && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reminder.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100"
                              >
                                <MapPin size={12} />
                                <span>{reminder.location}</span>
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => markComplete(reminder.id)}
                            className={`p-2 rounded-lg transition-all ${
                              reminder.completed
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-600'
                            }`}
                          >
                            <Check size={16} />
                          </button>
                          <button onClick={() => startEdit(reminder, 'reminder')} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                            <Edit2 size={14} className="text-slate-500" />
                          </button>
                          <button onClick={() => deleteItem(reminder.id, 'reminder')} className="p-2 bg-slate-100 hover:bg-red-100 rounded-lg transition-colors">
                            <Trash2 size={14} className="text-slate-500 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {reminders.map((reminder, index) => (
                    <div
                      key={reminder.id}
                      className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-scaleIn ${reminder.completed ? 'opacity-60' : ''}`}
                      style={{ animationDelay: `${index * 0.05}s`, backgroundColor: reminder.color !== '#ffffff' ? reminder.color : undefined }}
                    >
                      {reminder.photo && (
                        <div className="relative">
                          <img src={reminder.photo} alt="" className="w-full h-24 object-cover" />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              onClick={() => markComplete(reminder.id)}
                              className={`p-1.5 rounded-lg backdrop-blur-sm ${
                                reminder.completed ? 'bg-green-500 text-white' : 'bg-white/80 text-slate-600'
                              }`}
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="p-3">
                        {!reminder.photo && (
                          <div className="flex justify-end mb-2">
                            <button
                              onClick={() => markComplete(reminder.id)}
                              className={`p-1.5 rounded-lg ${
                                reminder.completed ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        )}
                        <p className={`text-slate-900 font-medium text-sm line-clamp-2 mb-2 ${reminder.completed ? 'line-through text-slate-500' : ''}`}>
                          {reminder.text || '📷 Photo'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg mb-2">
                          <Clock size={10} />
                          <span className="truncate">{reminder.timeLabel}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <div className="flex gap-1">
                            <button onClick={() => startEdit(reminder, 'reminder')} className="p-1.5 hover:bg-slate-100 rounded-lg">
                              <Edit2 size={12} className="text-slate-400" />
                            </button>
                            <button onClick={() => deleteItem(reminder.id, 'reminder')} className="p-1.5 hover:bg-red-50 rounded-lg">
                              <Trash2 size={12} className="text-slate-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Smart Confirmation Modal */}
        {showConfirmModal && parsedResult && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50 animate-fadeIn" onClick={() => setShowConfirmModal(false)}>
            <div
              className="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl animate-slideUp"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: 'slideInUp 0.3s ease-out' }}
            >
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>

              <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">
                {parsedResult.type === 'reminder' ? '⏰ Confirm Reminder' : '📌 Confirm Save'}
              </h3>

              <div className="space-y-4 mb-6">
                {/* Preview Card */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                  {parsedResult.photo && (
                    <img src={parsedResult.photo} alt="" className="w-full h-32 object-cover rounded-xl" />
                  )}

                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Content</label>
                    <input
                      type="text"
                      value={parsedResult.text}
                      onChange={(e) => setParsedResult({ ...parsedResult, text: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  {parsedResult.type === 'reminder' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1">Date</label>
                        <div className="px-3 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium">
                          {parsedResult.dateLabel}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1">Time</label>
                        <div className="px-3 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium">
                          {parsedResult.timeLabel}
                        </div>
                      </div>
                    </div>
                  )}

                  {parsedResult.type === 'save' && (
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">Category</label>
                      <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium flex items-center gap-2">
                        <span>{parsedResult.categoryIcon}</span>
                        <span>{parsedResult.categoryName}</span>
                      </div>
                    </div>
                  )}

                  {parsedResult.location && (
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">Location</label>
                      <div className="px-3 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{parsedResult.location}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowConfirmModal(false); setParsedResult(null); }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={parsedResult.type === 'reminder' ? confirmSaveReminder : confirmSaveItem}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-md shadow-purple-500/25"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingItem && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Edit {editingItem.type === 'reminder' ? 'Reminder' : 'Item'}
                </h3>
                <button onClick={cancelEdit} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Content</label>
                  <input
                    type="text"
                    value={editForm.text}
                    onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                {editingItem.type === 'reminder' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">Date</label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">Time</label>
                      <input
                        type="time"
                        value={editForm.time}
                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Color</label>
                  <div className="flex gap-2">
                    {['#ffffff', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#f3e8ff'].map(color => (
                      <button
                        key={color}
                        onClick={() => setEditForm({ ...editForm, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${editForm.color === color ? 'border-purple-500 scale-110' : 'border-slate-200'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={cancelEdit} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveEdit} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold transition-all">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fadeIn" onClick={() => setShowAddCategory(false)}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCategoryId ? 'Edit Category' : 'New Category'}
                </h3>
                <button onClick={() => { setShowAddCategory(false); setEditingCategoryId(null); }} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Name</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Travel, Shopping"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Icon</label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {['💡', '📝', '🔗', '📍', '📷', '💼', '🛒', '✈️', '🎯', '⭐', '❤️', '🎨', '🎵', '📱', '💻', '🏠'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setNewCategoryIcon(emoji)}
                        className={`text-xl p-2 rounded-lg transition-all hover:bg-slate-100 ${newCategoryIcon === emoji ? 'bg-purple-100 ring-2 ring-purple-400' : ''}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {editingCategoryId && (
                    <button
                      onClick={() => { deleteCategory(editingCategoryId); setSelectedCategory(null); setShowAddCategory(false); setEditingCategoryId(null); }}
                      className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={addCustomCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-semibold transition-all"
                  >
                    {editingCategoryId ? 'Save' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Modal */}
        {showSearch && (
          <div className="absolute inset-0 bg-white z-50 animate-fadeIn">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reminders & saves..."
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-purple-600 font-medium">
                  Cancel
                </button>
              </div>

              {searchQuery.trim() ? (
                <div className="space-y-4">
                  {getFilteredItems().reminders.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Reminders</h3>
                      <div className="space-y-2">
                        {getFilteredItems().reminders.map(r => (
                          <div key={r.id} onClick={() => { setShowSearch(false); setSearchQuery(''); setActiveTab('reminder'); }} className="p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
                            <p className="font-medium text-slate-900">{r.text}</p>
                            <p className="text-xs text-slate-500 mt-1">{r.timeLabel}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {getFilteredItems().saves.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Saved Items</h3>
                      <div className="space-y-2">
                        {getFilteredItems().saves.map(s => (
                          <div key={s.id} onClick={() => { setShowSearch(false); setSearchQuery(''); setActiveTab('save'); setSelectedCategory(s.category); }} className="p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
                            <p className="font-medium text-slate-900 line-clamp-2">{s.text}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs">{categories.find(c => c.id === s.category)?.icon}</span>
                              <span className="text-xs text-slate-500">{categories.find(c => c.id === s.category)?.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {getFilteredItems().reminders.length === 0 && getFilteredItems().saves.length === 0 && (
                    <div className="text-center py-12">
                      <Search size={40} className="text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400">No results found</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Search size={48} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400">Search your reminders and saves</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Menu Sidebar */}
        {showMenu && (
          <div className="absolute inset-0 z-50 flex" onClick={() => setShowMenu(false)}>
            <div className="absolute inset-0 bg-black/30 animate-fadeIn" />
            <div className="relative w-72 h-full bg-white shadow-2xl" style={{ animation: 'slideInLeft 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{isLoggedIn ? userEmail : 'Guest'}</p>
                    <p className="text-xs text-slate-500">{isLoggedIn ? 'Signed in' : 'Tap to sign in'}</p>
                  </div>
                </div>
              </div>

              <div className="p-3">
                <button onClick={() => { setShowMenu(false); setShowProfile(true); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <User size={20} className="text-slate-500" />
                  <span className="text-slate-700">Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <Settings size={20} className="text-slate-500" />
                  <span className="text-slate-700">Settings</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <HelpCircle size={20} className="text-slate-500" />
                  <span className="text-slate-700">Help</span>
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{reminders.length}</p>
                    <p className="text-xs text-slate-500">Reminders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{saves.length}</p>
                    <p className="text-xs text-slate-500">Saved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Screen */}
        {showProfile && (
          <div className="absolute inset-0 bg-white z-40 overflow-y-auto pb-28" style={{ animation: 'slideInRight 0.25s ease-out' }}>
            <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-3 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowProfile(false)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                  <ChevronRight size={24} className="text-slate-700 rotate-180" />
                </button>
                <h1 className="text-lg font-semibold text-slate-900">Profile</h1>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center py-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <User size={40} className="text-white" />
                </div>
                {isLoggedIn ? (
                  <>
                    <p className="text-xl font-bold text-slate-900 mb-1">{userEmail}</p>
                    <p className="text-sm text-slate-500">Free Plan</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-slate-900 mb-2">Welcome!</p>
                    <p className="text-sm text-slate-500 mb-4">Sign in to sync your data</p>
                    <button onClick={() => handleLogin('email', 'user@email.com')} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium shadow-lg">
                      Sign In
                    </button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{reminders.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Reminders</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{saves.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Saved</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-pink-600">{categories.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Categories</p>
                </div>
              </div>

              {isLoggedIn && (
                <button onClick={handleLogout} className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-medium flex items-center justify-center gap-2">
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </button>
              )}

              <div className="text-center py-4 text-xs text-slate-400">
                <p>Re:Mind Me v2.0</p>
                <p className="mt-1">Made with 💜</p>
              </div>
            </div>
          </div>
        )}

        {/* Snackbar / Toast */}
        {snackbar.show && (
          <div className="absolute bottom-24 left-4 right-4 z-50 animate-slideUp">
            <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between">
              <span className="text-sm">{snackbar.message}</span>
              {snackbar.undoData && (
                <button onClick={handleUndo} className="text-purple-400 font-semibold text-sm hover:text-purple-300 ml-3">
                  Undo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="absolute bottom-5 left-4 right-4 z-30">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-1.5 flex">
            <button
              onClick={() => switchTab('reminder')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                activeTab === 'reminder' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Bell size={18} fill={activeTab === 'reminder' ? 'currentColor' : 'none'} />
              <span className="text-xs font-semibold">List</span>
            </button>

            <button
              onClick={() => switchTab('remind')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                activeTab === 'remind' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Plus size={18} />
              <span className="text-xs font-semibold">Remind</span>
            </button>

            <button
              onClick={() => switchTab('save')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                activeTab === 'save' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Bookmark size={18} fill={activeTab === 'save' ? 'currentColor' : 'none'} />
              <span className="text-xs font-semibold">Save</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}

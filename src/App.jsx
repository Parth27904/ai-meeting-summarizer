import React, { useState, useEffect } from 'react';
import { Upload, FileText, Mail, Loader2, Edit3, Send, Settings } from 'lucide-react';

const MeetingSummarizer = () => {
  const [transcript, setTranscript] = useState('');
  const [customPrompt, setCustomPrompt] = useState('Summarize the key points, action items, and decisions from this meeting in a structured format.');
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [notification, setNotification] = useState('');
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  
  // Email configuration state
  const [emailConfig, setEmailConfig] = useState({
    serviceId: '',
    templateId: '',
    publicKey: '',
    configured: false
  });

  // Load email config from localStorage on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('emailjs-config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setEmailConfig({...config, configured: !!(config.serviceId && config.templateId && config.publicKey)});
      
      // Initialize EmailJS if config is complete
      if (config.serviceId && config.templateId && config.publicKey && window.emailjs) {
        window.emailjs.init({ publicKey: config.publicKey });
      }
    }
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTranscript(e.target.result);
        setNotification('File uploaded successfully!');
        setTimeout(() => setNotification(''), 3000);
      };
      reader.readAsText(file);
    } else {
      setNotification('Please upload a .txt file');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const generateSummary = async () => {
    if (!transcript.trim()) {
      setNotification('Please provide a transcript first');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          prompt: customPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      setNotification('Summary generated successfully!');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Summary generation error:', error);
      setNotification(`Error: ${error.message}`);
      setTimeout(() => setNotification(''), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveEmailConfig = () => {
    const config = {
      serviceId: emailConfig.serviceId,
      templateId: emailConfig.templateId,
      publicKey: emailConfig.publicKey
    };
    
    localStorage.setItem('emailjs-config', JSON.stringify(config));
    setEmailConfig({...config, configured: !!(config.serviceId && config.templateId && config.publicKey)});
    
    // Initialize EmailJS
    if (config.publicKey && window.emailjs) {
      window.emailjs.init({ publicKey: config.publicKey });
    }
    
    setShowEmailConfig(false);
    setNotification('Email configuration saved successfully!');
    setTimeout(() => setNotification(''), 3000);
  };

  const sendEmail = async () => {
    if (!emailRecipients.trim() || !summary.trim()) {
      setNotification('Please provide email recipients and ensure summary is generated');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    if (!emailConfig.configured) {
      setNotification('Please configure email settings first');
      setShowEmailConfig(true);
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    if (!window.emailjs) {
      setNotification('EmailJS not loaded. Please refresh the page.');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    setIsSending(true);
    try {
      // Split recipients and send to each
      const recipients = emailRecipients.split(',').map(email => email.trim()).filter(email => email);
      
      const emailPromises = recipients.map(async (recipient) => {
        return window.emailjs.send(
          emailConfig.serviceId,
          emailConfig.templateId,
          {
            to_email: recipient,
            subject: `Meeting Summary - ${new Date().toLocaleDateString()}`,
            summary: summary,
            to_name: recipient.split('@')[0], // Use email username as name
            from_name: 'Meeting Summarizer'
          },
          emailConfig.publicKey
        );
      });

      await Promise.all(emailPromises);
      
      setNotification(`Summary sent successfully to ${recipients.length} recipient(s)!`);
      setShowEmailForm(false);
      setEmailRecipients('');
      setTimeout(() => setNotification(''), 3000);
      
    } catch (error) {
      console.error('Email sending error:', error);
      setNotification(`Failed to send email: ${error.text || error.message}`);
      setTimeout(() => setNotification(''), 5000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Meeting Notes Summarizer
          </h1>
          <p className="text-gray-600">
            Upload transcripts, customize prompts, and share AI-generated summaries
          </p>
        </header>

        {/* Notification */}
        {notification && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
            {notification}
          </div>
        )}

        {/* Email Configuration Modal */}
        {showEmailConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Email Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EmailJS Service ID
                  </label>
                  <input
                    type="text"
                    value={emailConfig.serviceId}
                    onChange={(e) => setEmailConfig({...emailConfig, serviceId: e.target.value})}
                    placeholder="service_xxxxxxx"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EmailJS Template ID
                  </label>
                  <input
                    type="text"
                    value={emailConfig.templateId}
                    onChange={(e) => setEmailConfig({...emailConfig, templateId: e.target.value})}
                    placeholder="template_xxxxxxx"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EmailJS Public Key
                  </label>
                  <input
                    type="text"
                    value={emailConfig.publicKey}
                    onChange={(e) => setEmailConfig({...emailConfig, publicKey: e.target.value})}
                    placeholder="xxxxxxxxxxxxxxx"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={saveEmailConfig}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Save Configuration
                  </button>
                  <button
                    onClick={() => setShowEmailConfig(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Upload Transcript */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Upload className="w-5 h-5 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold">Step 1: Upload or Paste Transcript</h2>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Text File (.txt)
            </label>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Paste Transcript Directly
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Step 2: Custom Prompt */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Edit3 className="w-5 h-5 mr-2 text-green-600" />
            <h2 className="text-xl font-semibold">Step 2: Customize AI Prompt</h2>
          </div>
          
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter custom instructions for the AI..."
            className="w-full h-24 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Step 3: Generate Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              <h2 className="text-xl font-semibold">Step 3: Generate Summary</h2>
            </div>
            <button
              onClick={generateSummary}
              disabled={isGenerating || !transcript.trim()}
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Summary'
              )}
            </button>
          </div>

          {summary && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Summary (Editable)
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          )}
        </div>

        {/* Step 4: Share via Email */}
        {summary && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-orange-600" />
                <h2 className="text-xl font-semibold">Step 4: Share Summary</h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowEmailConfig(true)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {emailConfig.configured ? 'Email Settings' : 'Configure Email'}
                </button>
                <button
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  disabled={!emailConfig.configured}
                  className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 disabled:bg-gray-400"
                >
                  {showEmailForm ? 'Hide Email Form' : 'Share via Email'}
                </button>
              </div>
            </div>

            {!emailConfig.configured && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                Please configure your email settings first to send summaries.
              </div>
            )}

            {showEmailForm && emailConfig.configured && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Recipients (comma-separated)
                </label>
                <input
                  type="email"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="john@example.com, jane@example.com"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
                />
                <button
                  onClick={sendEmail}
                  disabled={isSending || !emailRecipients.trim()}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Summary
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>AI-Powered Meeting Notes Summarizer - Built for Internship Assignment</p>
        </footer>
      </div>
    </div>
  );
};

export default MeetingSummarizer;
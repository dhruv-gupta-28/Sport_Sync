document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const TYPING_DELAY = 500; // ms delay to simulate typing
    const MAX_HISTORY_LENGTH = 10; // Maximum number of messages to keep in history
    
    // State variables
    let chatHistory = [];
    let isWaitingForResponse = false;
    
    // DOM Elements
    let chatbot;
    let chatbotToggleButton;
    let chatbotMessages;
    let chatbotInput;
    let chatbotSendButton;
    let chatbotToggle;
    
    // Initialize the chatbot
    function initChatbot() {
        // Create chatbot toggle button (fixed button to open the chat)
        chatbotToggleButton = document.createElement('button');
        chatbotToggleButton.className = 'chatbot-toggle-button';
        chatbotToggleButton.innerHTML = '<i class="fas fa-comment"></i>';
        document.body.appendChild(chatbotToggleButton);
        
        // Create chatbot container
        chatbot = document.createElement('div');
        chatbot.className = 'chatbot collapsed';
        chatbot.style.display = 'none';
        
        // Create chatbot HTML structure
        chatbot.innerHTML = `
            <div class="chatbot-header">
                <h3><i class="fas fa-robot"></i> SportSync Assistant</h3>
                <button class="chatbot-toggle"><i class="fas fa-minus"></i></button>
            </div>
            <div class="chatbot-body">
                <div class="chatbot-messages"></div>
                <div class="chatbot-input">
                    <input type="text" placeholder="Type your message...">
                    <button><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
        
        document.body.appendChild(chatbot);
        
        // Get DOM elements
        chatbotMessages = chatbot.querySelector('.chatbot-messages');
        chatbotInput = chatbot.querySelector('.chatbot-input input');
        chatbotSendButton = chatbot.querySelector('.chatbot-input button');
        chatbotToggle = chatbot.querySelector('.chatbot-toggle');
        
        // Add event listeners
        chatbotToggleButton.addEventListener('click', toggleChatbot);
        chatbotToggle.addEventListener('click', minimizeChatbot);
        chatbotSendButton.addEventListener('click', sendMessage);
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Add welcome message
        setTimeout(() => {
            addMessage('Hello! How can I help you today?', 'bot');
        }, 500);
    }
    
    // Toggle chatbot visibility
    function toggleChatbot() {
        if (chatbot.style.display === 'none') {
            chatbot.style.display = 'flex';
            chatbotToggleButton.classList.add('hidden');
            setTimeout(() => {
                chatbot.classList.remove('collapsed');
            }, 10);
        } else {
            chatbot.classList.add('collapsed');
            setTimeout(() => {
                chatbot.style.display = 'none';
                chatbotToggleButton.classList.remove('hidden');
            }, 300);
        }
    }
    
    // Minimize chatbot
    function minimizeChatbot() {
        chatbot.classList.toggle('collapsed');
        
        // Update toggle icon
        const icon = chatbotToggle.querySelector('i');
        if (chatbot.classList.contains('collapsed')) {
            icon.className = 'fas fa-plus';
        } else {
            icon.className = 'fas fa-minus';
        }
    }
    
    // Add a message to the chat
    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `chatbot-message ${sender}`;
        messageElement.textContent = text;
        
        chatbotMessages.appendChild(messageElement);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        
        // Update chat history for API
        if (sender === 'user' || sender === 'bot') {
            chatHistory.push({
                role: sender === 'user' ? 'user' : 'model',
                parts: [{ text }]
            });
            
            // Limit history length
            if (chatHistory.length > MAX_HISTORY_LENGTH * 2) { // *2 because each exchange has 2 messages
                chatHistory = chatHistory.slice(-MAX_HISTORY_LENGTH * 2);
            }
        }
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        chatbotMessages.appendChild(indicator);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        return indicator;
    }
    
    // Remove typing indicator
    function removeTypingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }
    
    // Send message to API using the API module
    async function sendMessageToAPI(message) {
        try {
            // Check if API module is available
            if (!window.api || !window.api.sendChatMessage) {
                throw new Error('API module not loaded');
            }
            
            const result = await window.api.sendChatMessage(
                message,
                chatHistory.slice(0, -1) // Exclude the last message (user's message)
            );
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to get response from AI');
            }
            
            return result.data;
        } catch (error) {
            console.error('Error sending message to API:', error);
            
            // Provide more specific error messages based on error type
            let errorMessage = 'Sorry, I encountered an error. Please try again later.';
            
            if (error.message.includes('API module not loaded')) {
                errorMessage = 'The chat service is currently unavailable. Please refresh the page and try again.';
            } else if (error.message.includes('rate limit')) {
                errorMessage = 'You've sent too many messages. Please wait a moment before trying again.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            }
            
            return { 
                success: false, 
                response: errorMessage
            };
        }
    }
    
    // Send message
    async function sendMessage() {
        const message = chatbotInput.value.trim();
        
        if (!message || isWaitingForResponse) return;
        
        // Clear input
        chatbotInput.value = '';
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Disable input while waiting for response
        isWaitingForResponse = true;
        chatbotSendButton.disabled = true;
        
        // Show typing indicator
        const typingIndicator = showTypingIndicator();
        
        // Send message to API
        try {
            const response = await sendMessageToAPI(message);
            
            // Remove typing indicator after a delay to make it look more natural
            setTimeout(() => {
                removeTypingIndicator(typingIndicator);
                
                if (response.success) {
                    // Add bot response to chat
                    addMessage(response.response, 'bot');
                    
                    // Update chat history if the API returns a different history
                    if (response.history) {
                        chatHistory = response.history;
                    }
                } else {
                    // Add error message
                    addMessage(response.response, 'bot');
                }
                
                // Re-enable input
                isWaitingForResponse = false;
                chatbotSendButton.disabled = false;
                chatbotInput.focus();
            }, TYPING_DELAY);
        } catch (error) {
            console.error('Error in sendMessage:', error);
            
            // Remove typing indicator
            removeTypingIndicator(typingIndicator);
            
            // Add error message
            addMessage('Sorry, something went wrong. Please try again.', 'bot');
            
            // Re-enable input
            isWaitingForResponse = false;
            chatbotSendButton.disabled = false;
        }
    }
    
    // Initialize chatbot
    initChatbot();
});
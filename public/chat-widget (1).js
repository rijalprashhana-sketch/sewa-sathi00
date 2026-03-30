// Chat Widget JavaScript
class ChatWidget {
    constructor(currentUserId) {
        this.currentUserId = currentUserId;
        this.activeConversation = null;
        this.messages = [];
        this.unreadCount = 0;
        this.websocket = null;
        this.init();
    }

    init() {
        this.createChatButton();
        this.loadConversations();
        this.setupWebSocket();
        this.startPolling();
    }

    createChatButton() {
        // Create chat button
        const chatButton = document.createElement('div');
        chatButton.id = 'chatButton';
        chatButton.innerHTML = `
            <i class="fas fa-comment"></i>
            <span class="chat-badge" id="chatBadge">0</span>
        `;
        document.body.appendChild(chatButton);

        // Create chat window
        const chatWindow = document.createElement('div');
        chatWindow.id = 'chatWindow';
        chatWindow.className = 'chat-window';
        chatWindow.innerHTML = `
            <div class="chat-header">
                <h3><i class="fas fa-comments"></i> Messages</h3>
                <button onclick="chatWidget.toggleChat()" class="close-chat">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="chat-conversations" id="chatConversations"></div>
            <div class="chat-messages" id="chatMessages" style="display: none;">
                <div class="chat-messages-header">
                    <button onclick="chatWidget.backToConversations()" class="back-btn">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h4 id="chatWithName"></h4>
                </div>
                <div class="messages-container" id="messagesContainer"></div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Type a message...">
                    <button onclick="chatWidget.sendMessage()" class="send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(chatWindow);

        // Add event listeners
        chatButton.addEventListener('click', () => this.toggleChat());
        
        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
            if (!chatWindow.contains(e.target) && !chatButton.contains(e.target)) {
                chatWindow.classList.remove('open');
            }
        });

        // Handle enter key in chat input
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    setupWebSocket() {
        // For real-time functionality, you'd set up WebSocket here
        // For now, we'll use polling
    }

    startPolling() {
        // Poll for new messages every 5 seconds
        setInterval(() => {
            this.checkUnreadMessages();
            if (this.activeConversation) {
                this.loadMessages(this.activeConversation);
            }
        }, 5000);
    }

    async checkUnreadMessages() {
        try {
            const response = await fetch(`/api/chat/unread/${this.currentUserId}`);
            const data = await response.json();
            this.unreadCount = data.unreadCount;
            this.updateBadge();
        } catch (error) {
            console.error('Error checking unread messages:', error);
        }
    }

    updateBadge() {
        const badge = document.getElementById('chatBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    toggleChat() {
        const chatWindow = document.getElementById('chatWindow');
        chatWindow.classList.toggle('open');
        
        if (chatWindow.classList.contains('open')) {
            this.loadConversations();
            // Mark messages as read when opening chat
            this.unreadCount = 0;
            this.updateBadge();
        }
    }

    async loadConversations() {
        try {
            const response = await fetch(`/api/chat/conversations/${this.currentUserId}`);
            const conversations = await response.json();
            this.displayConversations(conversations);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    displayConversations(conversations) {
        const container = document.getElementById('chatConversations');
        if (!container) return;

        if (conversations.length === 0) {
            container.innerHTML = `
                <div class="no-conversations">
                    <i class="fas fa-comment-slash"></i>
                    <p>No conversations yet</p>
                    <small>Start chatting with workers from services page</small>
                </div>
            `;
            return;
        }

        container.innerHTML = conversations.map(conv => `
            <div class="conversation-item" onclick="chatWidget.openConversation(${conv.otherUser.id}, '${conv.otherUser.name}')">
                <div class="conversation-avatar">
                    ${conv.otherUser.name.charAt(0)}
                </div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <span class="conversation-name">${conv.otherUser.name}</span>
                        <span class="conversation-time">${this.formatTime(conv.lastMessageTime)}</span>
                    </div>
                    <div class="conversation-last-message">
                        ${conv.lastMessage || 'No messages yet'}
                    </div>
                </div>
                ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
            </div>
        `).join('');
    }

    async openConversation(userId, userName) {
        this.activeConversation = { id: userId, name: userName };
        
        // Switch view to messages
        document.getElementById('chatConversations').style.display = 'none';
        document.getElementById('chatMessages').style.display = 'flex';
        document.getElementById('chatWithName').textContent = userName;
        
        await this.loadMessages(userId);
    }

    async loadMessages(userId) {
        try {
            const response = await fetch(`/api/chat/conversation/${this.currentUserId}/${userId}`);
            const messages = await response.json();
            this.displayMessages(messages);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    displayMessages(messages) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        container.innerHTML = messages.map(msg => `
            <div class="message ${msg.sender_id == this.currentUserId ? 'sent' : 'received'}">
                <div class="message-content">${this.escapeHtml(msg.message)}</div>
                <div class="message-time">${this.formatTime(msg.created_at)}</div>
            </div>
        `).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message || !this.activeConversation) return;

        // Clear input
        input.value = '';

        // Add message to UI immediately
        const container = document.getElementById('messagesContainer');
        container.innerHTML += `
            <div class="message sent">
                <div class="message-content">${this.escapeHtml(message)}</div>
                <div class="message-time">Just now</div>
            </div>
        `;
        container.scrollTop = container.scrollHeight;

        try {
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: this.currentUserId,
                    receiver_id: this.activeConversation.id,
                    message: message
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            // Refresh conversations list
            this.loadConversations();

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    }

    backToConversations() {
        document.getElementById('chatConversations').style.display = 'block';
        document.getElementById('chatMessages').style.display = 'none';
        this.activeConversation = null;
        this.loadConversations();
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chat widget when user is logged in
let chatWidget = null;

function initChat(userId) {
    if (userId && !chatWidget) {
        chatWidget = new ChatWidget(userId);
    }
}
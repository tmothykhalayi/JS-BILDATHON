import { LitElement, html } from 'lit';
import { loadMessages, saveMessages, clearMessages } from '../utils/chatStore.js';
import './chat.css'; // Import the CSS file

export class ChatInterface extends LitElement {
  static get properties() {
    return {
      messages: { type: Array },
      inputMessage: { type: String },
      isLoading: { type: Boolean },
      isRetrieving: { type: Boolean },
      ragEnabled: { type: Boolean },
    };
  }

  constructor() {
    super();
    // Initialize component state
    this.messages = [];
    this.inputMessage = "";
    this.isLoading = false;
    this.isRetrieving = false;
    this.ragEnabled = true;
    // Generate a unique session ID for conversation memory
    this.sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  }

  // Render into light DOM so external CSS applies
  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    // Load chat history from localStorage when component is added to the DOM
    this.messages = loadMessages();
  }

  updated(changedProps) {
    // Save chat history to localStorage whenever messages change
    if (changedProps.has("messages")) {
      saveMessages(this.messages);
    }
  }

  render() {
    // Render the chat UI: header, messages, and input area
    return html`
      <div class="chat-container">
        <div class="chat-header">
          <button class="clear-cache-btn" @click=${this._clearCache}>
            🧹Clear Chat
          </button>
          <label class="rag-toggle">
            <input 
              type="checkbox" 
              .checked=${this.ragEnabled} 
              @change=${this._toggleRag}
            />
            📚 Use Company Knowledge
          </label>
        </div>
        <div class="chat-messages">
          ${this.messages.map(
            (msg, index) => html`
              <div class="message ${msg.role}-message">
                <div class="message-content">
                  <span class="message-sender">
                    ${msg.role === "user" ? "You" : "AI"}
                  </span>
                  <p>${msg.content}</p>
                  ${msg.sources && msg.sources.length > 0
                    ? html`
                        <div class="sources">
                          <details>
                            <summary>📖 Sources (${msg.sources.length})</summary>
                            <div class="sources-content">
                              ${msg.sources.map(
                                (source, idx) => html`
                                  <div class="source-item">
                                    <strong>Source ${idx + 1}:</strong>
                                    <p>${source}</p>
                                  </div>
                                `
                              )}
                            </div>
                          </details>
                        </div>
                      `
                    : ""}
                </div>
              </div>
            `
          )}
          ${this.isLoading
            ? html`
                <div class="message ai-message">
                  <div class="message-content">
                    <span class="message-sender">AI</span>
                    <p>Thinking...</p>
                  </div>
                </div>
              `
            : ""}
        </div>
        <div class="chat-input">
          <input
            type="text"
            placeholder="Ask about company policies, benefits, etc..."
            .value=${this.inputMessage}
            @input=${this._handleInput}
            @keyup=${this._handleKeyUp}
          />
          <button
            @click=${this._sendMessage}
            ?disabled=${this.isLoading || !this.inputMessage.trim()}
          >
            Send
          </button>
        </div>
      </div>
    `;
  }

  // add method to handle the toggle change
  _toggleRag(e) {
    this.ragEnabled = e.target.checked;
  }

  // Clear chat history from localStorage and UI
  _clearCache() {
    clearMessages();
    this.messages = [];
    // Generate new session ID to reset conversation memory
    this.sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  }

  // Update inputMessage state as the user types
  _handleInput(e) {
    this.inputMessage = e.target.value;
  }

  // Send message on Enter key if not loading
  _handleKeyUp(e) {
    if (e.key === "Enter" && this.inputMessage.trim() && !this.isLoading) {
      this._sendMessage();
    }
  }

  // Handle sending a message and receiving a response
  async _sendMessage() {
    if (!this.inputMessage.trim() || this.isLoading) return;

    // Add user's message to the chat
    const userMessage = {
      role: "user",
      content: this.inputMessage,
    };

    this.messages = [...this.messages, userMessage];
    const userQuery = this.inputMessage;
    this.inputMessage = "";
    this.isLoading = true;

    // Show retrieval message if RAG is enabled
    if (this.ragEnabled) {
      this.isRetrieving = true;
    }

    try {
      // Call the API with RAG support and session ID for memory
      const aiResponse = await this._apiCall(userQuery);

      // Add AI's response to the chat
      this.messages = [
        ...this.messages,
        { 
          role: "assistant", 
          content: aiResponse.reply || aiResponse,
          sources: aiResponse.sources || []
        },
      ];
    } catch (error) {
      // Handle errors gracefully
      console.error("Error calling model:", error);
      this.messages = [
        ...this.messages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ];
    } finally {
      this.isLoading = false;
      this.isRetrieving = false;
    }
  }

  // Call the API with RAG support and session ID for conversation memory
  async _apiCall(message) {
    const res = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message,
        useRAG: this.ragEnabled,
        sessionId: this.sessionId
      }),
    });
    const data = await res.json();
    return data;
  }
}

customElements.define('chat-interface', ChatInterface);

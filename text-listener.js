const WebSocket = require("ws");
const { SpeakingQueue } = require("./speaking-queue");

class TextListener {
    /** @type {WebSocket} chatWebSocket */
    chatWebSocket;

    /** @type {SpeakingQueue} */
    speakingQueue;

    /** @type {Object} */
    texts;

    /** @type {String} */
    msg;

    constructor(chatWebSocket) {
        this.texts = {};
        this.msg = '';
        this.chatWebSocket = chatWebSocket;
        this.speakingQueue = new SpeakingQueue();
    }

    forceState(state) {
        this.texts = state.texts;
        this.msg = state.msg;
    }

    onMessage(assemblyMsg) {
        const res = JSON.parse(assemblyMsg.data);
        this.texts[res.audio_start] = res.text;
        const keys = Object.keys(this.texts);
        keys.sort((a, b) => a - b);
        this.msg = '';
        for (const key of keys) {
            if (this.texts[key]) {
                this.msg += ` ${this.texts[key]}`;
            }
        }
        const detectedCommands = this.detectCommand();
        for (const command of detectedCommands) {
            this.handleCommand(command);
        }
        console.log(this.msg);
    }

    detectCommand() {
        const detectedCommands = [];

        if (this.msg.toLocaleLowerCase().includes('command') && this.msg.toLocaleLowerCase().includes('clear')) {
            detectedCommands.push('clear');
        }

        if (this.msg.toLocaleLowerCase().includes('command') && this.msg.toLocaleLowerCase().includes('send')) {
            detectedCommands.push('send-chat');
        }

        return detectedCommands;
    }

    handleCommand(command) {
        switch (command) {
            case 'clear':
                this.texts = {};
                this.msg = 'Cleared';
                break;
            case 'send-chat':
                this.chatWebSocket.send(JSON.stringify({ type: "console", message: JSON.stringify({ texts: this.texts, msg: this.msg }) }));
                this.msg.toLocaleLowerCase().indexOf('command') > -1 && (this.msg = this.msg.replace(/command .*/g, '').trim());
                this.chatWebSocket.send(JSON.stringify({ type: "sendChat", message: this.msg }));
                this.texts = {};
                this.msg = '';
                this.speakingQueue.clear();
                break;
            default:
                break;
        }
    }
}

exports.TextListener = TextListener;